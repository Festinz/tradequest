import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/trade/order
 * - body: { ticker, side: 'buy'|'sell', qty, price, reason, ai_advice_text? }
 * - 매수: cash_balance 차감 + positions upsert (avg_price 가중평균) + trades insert(open)
 * - 매도: positions 차감 + cash_balance 증가 + trades insert(closed) + pnl 계산
 *   매도 시 보유 수량 부족하면 400 반환
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const body = (await req.json()) as {
    ticker: string;
    side: "buy" | "sell";
    qty: number;
    price: number;
    reason: string;
    ai_advice_text?: string | null;
  };

  if (!body?.ticker || !body.qty || !body.price || !body.reason) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  // 종목 마스터 검증 (외래키 위반 사전 체크)
  const { data: stock } = await supabase
    .from("stocks")
    .select("ticker")
    .eq("ticker", body.ticker)
    .maybeSingle();
  if (!stock) {
    // 자동 등록 (간이 — 종목명/시장 추후 보완)
    await supabase.from("stocks").insert({
      ticker: body.ticker,
      name: body.ticker,
      market: "KOSPI",
    });
  }

  const total = body.qty * body.price;

  const { data: char } = await supabase
    .from("characters")
    .select("cash_balance")
    .eq("user_id", user.id)
    .single();

  if (!char) return NextResponse.json({ error: "no_character" }, { status: 400 });

  if (body.side === "buy") {
    if (char.cash_balance < total) {
      return NextResponse.json({ error: "insufficient_cash" }, { status: 400 });
    }

    // positions 가중평균
    const { data: pos } = await supabase
      .from("positions")
      .select("qty, avg_price")
      .eq("user_id", user.id)
      .eq("ticker", body.ticker)
      .maybeSingle();

    const newQty = (pos?.qty ?? 0) + body.qty;
    const newAvg = pos
      ? Math.round((pos.qty * pos.avg_price + body.qty * body.price) / newQty)
      : body.price;

    await supabase.from("positions").upsert(
      {
        user_id: user.id,
        ticker: body.ticker,
        qty: newQty,
        avg_price: newAvg,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,ticker" }
    );

    await supabase
      .from("characters")
      .update({
        cash_balance: char.cash_balance - total,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    const { data: trade } = await supabase
      .from("trades")
      .insert({
        user_id: user.id,
        ticker: body.ticker,
        side: "buy",
        qty: body.qty,
        price: body.price,
        status: "open",
        entry_reason: body.reason,
        ai_advice_used: !!body.ai_advice_text,
        ai_advice_text: body.ai_advice_text ?? null,
      })
      .select("*")
      .single();

    // EXP 부여 (AI 사용 시 +40, 미사용 시 +20)
    const exp = body.ai_advice_text ? 40 : 20;
    await supabase.rpc("add_exp", { p_user_id: user.id, p_amount: exp });

    // 일일 퀘스트 진행
    await markQuestDone(supabase, user.id, "trade_with_reason");

    return NextResponse.json({ ok: true, trade, exp });
  }

  // SELL
  const { data: pos } = await supabase
    .from("positions")
    .select("qty, avg_price")
    .eq("user_id", user.id)
    .eq("ticker", body.ticker)
    .maybeSingle();

  if (!pos || pos.qty < body.qty) {
    return NextResponse.json({ error: "insufficient_position" }, { status: 400 });
  }

  const pnl = (body.price - pos.avg_price) * body.qty;
  const pnlPct = ((body.price - pos.avg_price) / pos.avg_price) * 100;

  if (pos.qty === body.qty) {
    await supabase
      .from("positions")
      .delete()
      .eq("user_id", user.id)
      .eq("ticker", body.ticker);
  } else {
    await supabase
      .from("positions")
      .update({
        qty: pos.qty - body.qty,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("ticker", body.ticker);
  }

  await supabase
    .from("characters")
    .update({
      cash_balance: char.cash_balance + total,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  const { data: trade } = await supabase
    .from("trades")
    .insert({
      user_id: user.id,
      ticker: body.ticker,
      side: "sell",
      qty: body.qty,
      price: body.price,
      status: "closed",
      entry_reason: body.reason,
      exit_reason: body.reason,
      ai_advice_used: !!body.ai_advice_text,
      ai_advice_text: body.ai_advice_text ?? null,
      pnl,
      pnl_pct: pnlPct,
      closed_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  const exp = body.ai_advice_text ? 40 : 20;
  await supabase.rpc("add_exp", { p_user_id: user.id, p_amount: exp });
  await markQuestDone(supabase, user.id, "trade_with_reason");

  return NextResponse.json({ ok: true, trade, pnl, pnlPct, exp });
}

async function markQuestDone(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  code: string
) {
  const today = new Date().toISOString().slice(0, 10);
  await supabase.rpc("ensure_daily_missions", { p_user_id: userId, p_date: today });
  await supabase
    .from("daily_missions")
    .update({ status: "done", done_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("date", today)
    .eq("code", code)
    .eq("status", "todo");
}

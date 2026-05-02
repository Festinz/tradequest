/**
 * 사용자 단일 진실 인사이트 로더 (RSC 에서 호출).
 *
 * 흐름 (Skills.md §5 파이프라인 구현):
 *   1. positions / trades / stocks(meta) 로드
 *   2. 각 종목 캔들 병렬 fetch (60s SWR 캐시)
 *   3. evaluateAll → severity 정렬된 Insight[] 반환
 *
 * 무상태 (D6 결정): 매 호출마다 현재 상태로 재평가. 이력 저장 X.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchCandles } from "@/lib/market/candles";
import { evaluateAll } from "@/lib/skills/registry";
import {
  recentClosedPnl,
  type PortfolioEvalInput,
  type StockEvalInput,
} from "@/lib/skills/insights";
import type { Insight, Trade } from "@/lib/skills/types";

type StockRow = { name: string; market: string; sector: string | null };
type PositionRow = {
  ticker: string;
  qty: number;
  avg_price: number;
  stocks: StockRow | StockRow[] | null;
};
type TradeRow = {
  ticker: string;
  side: "buy" | "sell";
  qty: number;
  price: number;
  status: string;
  pnl_pct: number | null;
  opened_at: string;
  closed_at: string | null;
};

function unwrapStock(s: StockRow | StockRow[] | null): StockRow | null {
  if (!s) return null;
  return Array.isArray(s) ? (s[0] ?? null) : s;
}

export async function loadInsights(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  userId: string,
): Promise<{ insights: Insight[]; positionCount: number }> {
  // 1. 포지션 (보유 종목)
  const { data: positionRows } = await supabase
    .from("positions")
    .select("ticker, qty, avg_price, stocks(name, market, sector)")
    .eq("user_id", userId);
  const positions = (positionRows ?? []) as unknown as PositionRow[];

  // 2. 최근 매매 (INS-011 감정 보호)
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: tradeRows } = await supabase
    .from("trades")
    .select(
      "ticker, side, qty, price, status, pnl_pct, opened_at, closed_at",
    )
    .eq("user_id", userId)
    .gte("opened_at", cutoff)
    .limit(50);
  const trades: Trade[] = (tradeRows ?? []).map((t: TradeRow) => ({
    ticker: t.ticker,
    side: t.side,
    qty: t.qty,
    price: t.price,
    opened_at: t.opened_at,
    closed_at: t.closed_at ?? undefined,
    pnl_pct: t.pnl_pct ?? undefined,
  }));

  if (positions.length === 0) {
    return { insights: [], positionCount: 0 };
  }

  // 3. 캔들 병렬 fetch (실패한 종목은 건너뜀)
  const stockInputs: StockEvalInput[] = [];
  const positionWithCurrent: PortfolioEvalInput["positions"] = [];

  const fetchTasks = positions.map(async (p) => {
    const meta = unwrapStock(p.stocks);
    const market = (meta?.market === "KOSDAQ" ? "KOSDAQ" : "KOSPI") as
      | "KOSPI"
      | "KOSDAQ";
    const result = await fetchCandles(p.ticker, market, 180);
    const last = result.candles.at(-1);
    return {
      ticker: p.ticker,
      qty: p.qty,
      avg_price: p.avg_price,
      sector: meta?.sector ?? undefined,
      name: meta?.name ?? p.ticker,
      candles: result.candles,
      currentPrice: last?.close ?? p.avg_price,
    };
  });
  const fetched = await Promise.all(fetchTasks);

  for (const r of fetched) {
    if (r.candles.length >= 30) {
      stockInputs.push({
        stock: { ticker: r.ticker, name: r.name },
        candles: r.candles,
      });
    }
    positionWithCurrent.push({
      ticker: r.ticker,
      qty: r.qty,
      avg_price: r.avg_price,
      current_price: r.currentPrice,
      name: r.name,
      sector: r.sector,
    });
  }

  // 4. 포트폴리오 단위 입력
  const { sumPct, count } = recentClosedPnl(trades, 5);
  const portfolio: PortfolioEvalInput = {
    positions: positionWithCurrent,
    recentClosedPnlPct: sumPct,
    recentClosedCount: count,
  };

  // 5. 종합 평가
  const insights = evaluateAll({ stocks: stockInputs, portfolio });

  return { insights, positionCount: positions.length };
}

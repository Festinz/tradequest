/**
 * 보유 종목 + 현재가 + 일간 등락률 로더.
 * 포트폴리오 페이지의 섹터 트리맵 + 4-card 요약에서 사용.
 *
 * Skills.md §1 Position 타입 + UI 표시용 추가 필드.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchCandles } from "@/lib/market/candles";

export type Holding = {
  ticker: string;
  name: string;
  market: "KOSPI" | "KOSDAQ";
  sector: string;
  qty: number;
  avg_price: number;
  current_price: number;
  /** 일간 등락률 (%). 캔들 fetch 실패 시 0. */
  daily_change_pct: number;
  /** 평가금액 = qty × current_price */
  market_value: number;
};

type StockMeta = { name: string; market: string; sector: string | null };
type PositionRow = {
  ticker: string;
  qty: number;
  avg_price: number;
  stocks: StockMeta | StockMeta[] | null;
};

function unwrap(s: StockMeta | StockMeta[] | null): StockMeta | null {
  if (!s) return null;
  return Array.isArray(s) ? (s[0] ?? null) : s;
}

export async function loadHoldings(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  userId: string,
): Promise<Holding[]> {
  const { data: rows } = await supabase
    .from("positions")
    .select("ticker, qty, avg_price, stocks(name, market, sector)")
    .eq("user_id", userId);

  const positions = (rows ?? []) as unknown as PositionRow[];
  if (positions.length === 0) return [];

  const tasks = positions.map(async (p): Promise<Holding> => {
    const meta = unwrap(p.stocks);
    const market = (meta?.market === "KOSDAQ" ? "KOSDAQ" : "KOSPI") as
      | "KOSPI"
      | "KOSDAQ";
    const result = await fetchCandles(p.ticker, market, 30);
    const last = result.candles.at(-1);
    const prev = result.candles.at(-2);
    const current_price = last?.close ?? p.avg_price;
    const daily_change_pct =
      last && prev && prev.close > 0
        ? ((last.close - prev.close) / prev.close) * 100
        : 0;
    return {
      ticker: p.ticker,
      name: meta?.name ?? p.ticker,
      market,
      sector: meta?.sector ?? "기타",
      qty: p.qty,
      avg_price: p.avg_price,
      current_price,
      daily_change_pct,
      market_value: p.qty * current_price,
    };
  });

  return Promise.all(tasks);
}

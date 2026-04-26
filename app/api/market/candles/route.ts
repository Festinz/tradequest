import { NextResponse } from "next/server";

/**
 * 무료 일봉 데이터 (Yahoo Finance).
 * - 한국 종목: 005930 → 005930.KS (KOSPI), 코스닥은 005930.KQ
 * - lightweight-charts 가 바로 쓸 수 있는 포맷으로 반환
 *
 * GET /api/market/candles?ticker=005930&market=KOSPI&days=180
 */

type Candle = {
  time: string; // 'YYYY-MM-DD'
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get("ticker");
  const market = (searchParams.get("market") ?? "KOSPI").toUpperCase();
  const days = Math.min(Number(searchParams.get("days") ?? 180), 800);

  if (!ticker) {
    return NextResponse.json({ error: "ticker_required" }, { status: 400 });
  }

  // 한국 종목은 yahoo 형식으로 변환 (005930 → 005930.KS / 005930.KQ)
  const yahooSymbol =
    /^[0-9]{6}$/.test(ticker)
      ? `${ticker}.${market === "KOSDAQ" ? "KQ" : "KS"}`
      : ticker;

  try {
    // dynamic import — 라이브러리가 commonjs 라 ESM 환경에서 문제 없게
    const { default: yahooFinance } = await import("yahoo-finance2");

    const period2 = new Date();
    const period1 = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await yahooFinance.chart(yahooSymbol, {
      period1,
      period2,
      interval: "1d",
    });

    const quotes = result.quotes ?? [];
    const candles: Candle[] = quotes
      .filter(
        (q) =>
          q.open !== null && q.high !== null && q.low !== null && q.close !== null
      )
      .map((q) => ({
        time: new Date(q.date).toISOString().slice(0, 10),
        open: q.open!,
        high: q.high!,
        low: q.low!,
        close: q.close!,
        volume: q.volume ?? 0,
      }));

    const meta = result.meta;
    return NextResponse.json(
      {
        ticker,
        yahooSymbol,
        currency: meta?.currency ?? "KRW",
        candles,
        last: candles.at(-1) ?? null,
      },
      {
        headers: {
          "cache-control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (e) {
    console.error("[/api/market/candles]", e);
    return NextResponse.json(
      {
        error: "data_unavailable",
        message: "시세 데이터를 가져오지 못했어요.",
      },
      { status: 502 }
    );
  }
}

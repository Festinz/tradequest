import { NextResponse } from "next/server";

/**
 * 한국 주식 일봉 — 네이버 금융 직접 호출 + Yahoo Finance 폴백.
 *
 * 1순위: Naver siseJson  (가장 안정적, 한국 KOSPI/KOSDAQ 커버리지 100%)
 * 2순위: Yahoo v8 chart   (백업)
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

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get("ticker");
  const market = (searchParams.get("market") ?? "KOSPI").toUpperCase();
  const days = Math.min(Number(searchParams.get("days") ?? 180), 800);

  if (!ticker) {
    return NextResponse.json({ error: "ticker_required" }, { status: 400 });
  }

  const errors: string[] = [];

  // 1. Naver
  try {
    const candles = await fetchFromNaver(ticker, days);
    if (candles.length > 0) {
      return success(ticker, candles, "naver");
    }
    errors.push("naver: empty result");
  } catch (e) {
    errors.push(`naver: ${(e as Error).message}`);
  }

  // 2. Yahoo
  try {
    const candles = await fetchFromYahoo(ticker, market, days);
    if (candles.length > 0) {
      return success(ticker, candles, "yahoo");
    }
    errors.push("yahoo: empty result");
  } catch (e) {
    errors.push(`yahoo: ${(e as Error).message}`);
  }

  console.error("[candles] all sources failed:", ticker, errors);
  return NextResponse.json(
    {
      error: "data_unavailable",
      message: "시세 데이터를 가져오지 못했어요. 종목 코드를 확인해 주세요.",
      debug: errors,
    },
    { status: 502 }
  );
}

// ============================================
// Naver siseJson API
// 형식: [[제목row], [날짜, 시가, 고가, 저가, 종가, 거래량, 외국인소진율], ...]
// 예: https://api.finance.naver.com/siseJson.naver?symbol=005930&requestType=1&startTime=20240101&endTime=20260426&timeframe=day
// ============================================
async function fetchFromNaver(ticker: string, days: number): Promise<Candle[]> {
  const end = new Date();
  const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;

  const url = `https://api.finance.naver.com/siseJson.naver?symbol=${ticker}&requestType=1&startTime=${fmt(start)}&endTime=${fmt(end)}&timeframe=day`;

  const res = await fetch(url, {
    headers: {
      "user-agent": UA,
      "referer": "https://m.stock.naver.com/",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`naver http ${res.status}`);

  const text = await res.text();
  // 응답이 JS 배열 리터럴이라 쌍따옴표 정규화 후 JSON.parse
  const cleaned = text
    .trim()
    .replace(/'/g, '"')
    .replace(/(\w+):/g, '"$1":'); // key: → "key": (혹시 있을 경우)

  let arr: unknown;
  try {
    arr = JSON.parse(cleaned);
  } catch {
    // 그냥 eval-style 파싱 (서버사이드라 안전)
    arr = Function(`"use strict"; return ${text}`)();
  }

  if (!Array.isArray(arr) || arr.length < 2) return [];

  // 첫 행은 헤더, 이후가 데이터
  const rows = (arr as unknown[][]).slice(1);
  return rows
    .filter(
      (r) => Array.isArray(r) && r.length >= 6 && typeof r[0] === "string"
    )
    .map((r) => ({
      time: `${String(r[0]).slice(0, 4)}-${String(r[0]).slice(4, 6)}-${String(r[0]).slice(6, 8)}`,
      open: Number(r[1]),
      high: Number(r[2]),
      low: Number(r[3]),
      close: Number(r[4]),
      volume: Number(r[5]),
    }))
    .filter((c) => c.open > 0 && c.close > 0);
}

// ============================================
// Yahoo v8 chart endpoint  (fallback)
// ============================================
async function fetchFromYahoo(
  ticker: string,
  market: string,
  days: number
): Promise<Candle[]> {
  const yahooSymbol = /^[0-9]{6}$/.test(ticker)
    ? `${ticker}.${market === "KOSDAQ" ? "KQ" : "KS"}`
    : ticker;

  const range = days <= 90 ? "3mo" : days <= 180 ? "6mo" : "1y";
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=${range}&interval=1d`;

  const res = await fetch(url, {
    headers: { "user-agent": UA },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`yahoo http ${res.status}`);

  const json = (await res.json()) as {
    chart?: {
      result?: Array<{
        timestamp?: number[];
        indicators?: {
          quote?: Array<{
            open: (number | null)[];
            high: (number | null)[];
            low: (number | null)[];
            close: (number | null)[];
            volume: (number | null)[];
          }>;
        };
      }>;
      error?: { description?: string } | null;
    };
  };

  const result = json.chart?.result?.[0];
  if (!result) {
    const desc = json.chart?.error?.description ?? "no result";
    throw new Error(`yahoo: ${desc}`);
  }

  const ts = result.timestamp ?? [];
  const q = result.indicators?.quote?.[0];
  if (!q) return [];

  const candles: Candle[] = [];
  for (let i = 0; i < ts.length; i++) {
    const o = q.open[i];
    const h = q.high[i];
    const l = q.low[i];
    const c = q.close[i];
    if (o == null || h == null || l == null || c == null) continue;
    candles.push({
      time: new Date(ts[i] * 1000).toISOString().slice(0, 10),
      open: o,
      high: h,
      low: l,
      close: c,
      volume: q.volume[i] ?? 0,
    });
  }
  return candles;
}

function success(ticker: string, candles: Candle[], source: string) {
  return NextResponse.json(
    {
      ticker,
      source,
      candles,
      last: candles.at(-1) ?? null,
    },
    {
      headers: {
        "cache-control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}

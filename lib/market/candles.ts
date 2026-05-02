/**
 * 한국 주식 일봉 fetcher — Naver 1순위 → Yahoo 폴백.
 * RSC 와 API route 양쪽에서 import 해서 쓴다.
 *
 * Skills.md §1 표준 Candle 인터페이스 (lib/skills/types.ts) 와 호환.
 */

import type { Candle } from "@/lib/skills/types";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export type CandleSource = "naver" | "yahoo";

export type FetchResult = {
  candles: Candle[];
  source: CandleSource | "none";
  errors?: string[];
};

export async function fetchCandles(
  ticker: string,
  market: "KOSPI" | "KOSDAQ" = "KOSPI",
  days = 180,
): Promise<FetchResult> {
  const errors: string[] = [];
  try {
    const candles = await fromNaver(ticker, days);
    if (candles.length > 0) return { candles, source: "naver" };
    errors.push("naver: empty");
  } catch (e) {
    errors.push(`naver: ${(e as Error).message}`);
  }
  try {
    const candles = await fromYahoo(ticker, market, days);
    if (candles.length > 0) return { candles, source: "yahoo" };
    errors.push("yahoo: empty");
  } catch (e) {
    errors.push(`yahoo: ${(e as Error).message}`);
  }
  return { candles: [], source: "none", errors };
}

async function fromNaver(ticker: string, days: number): Promise<Candle[]> {
  const end = new Date();
  const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;

  const url = `https://api.finance.naver.com/siseJson.naver?symbol=${ticker}&requestType=1&startTime=${fmt(start)}&endTime=${fmt(end)}&timeframe=day`;
  const res = await fetch(url, {
    headers: { "user-agent": UA, referer: "https://m.stock.naver.com/" },
    // Next.js RSC 캐시 — Skills.md 60s SWR 표준
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`naver http ${res.status}`);
  const text = await res.text();
  // 응답이 JS 배열 리터럴 ('단일따옴표' 사용)
  const cleaned = text.trim().replace(/'/g, '"');
  let arr: unknown;
  try {
    arr = JSON.parse(cleaned);
  } catch {
    arr = Function(`"use strict"; return ${text}`)();
  }
  if (!Array.isArray(arr) || arr.length < 2) return [];
  const rows = (arr as unknown[][]).slice(1);
  return rows
    .filter(
      (r): r is unknown[] =>
        Array.isArray(r) && r.length >= 6 && typeof r[0] === "string",
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

async function fromYahoo(
  ticker: string,
  market: string,
  days: number,
): Promise<Candle[]> {
  const yahooSymbol = /^[0-9]{6}$/.test(ticker)
    ? `${ticker}.${market === "KOSDAQ" ? "KQ" : "KS"}`
    : ticker;
  const range = days <= 90 ? "3mo" : days <= 180 ? "6mo" : "1y";
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=${range}&interval=1d`;
  const res = await fetch(url, {
    headers: { "user-agent": UA },
    next: { revalidate: 60 },
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
    throw new Error(`yahoo: ${json.chart?.error?.description ?? "no result"}`);
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

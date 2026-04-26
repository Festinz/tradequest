"use client";

import { useEffect, useRef, useState, memo } from "react";
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from "lightweight-charts";
import { formatKRW } from "@/lib/utils";

/**
 * 자체 캔들 차트 — TradingView 임베드 위젯 대체.
 * - 데이터: /api/market/candles (Yahoo Finance)
 * - 한국 시장 컨벤션: 빨강(상승) / 파랑(하락)
 * - 거래량 히스토그램 하단 동시 표시
 *
 * lightweight-charts v4 API 사용:
 *   chart.addCandlestickSeries(options) / chart.addHistogramSeries(options)
 */
type Props = {
  ticker: string;          // 005930
  market?: "KOSPI" | "KOSDAQ";
  days?: number;
  height?: number;
  name?: string;
};

type LastInfo = {
  close: number;
  prevClose: number;
  changePct: number;
  date: string;
} | null;

function KoreanCandleChartImpl({
  ticker,
  market = "KOSPI",
  days = 180,
  height = 480,
  name,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const [last, setLast] = useState<LastInfo>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 차트 1회 생성
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { color: "transparent" },
        textColor: "#475569",
      },
      grid: {
        vertLines: { color: "rgba(226, 232, 240, 0.3)" },
        horzLines: { color: "rgba(226, 232, 240, 0.3)" },
      },
      rightPriceScale: { borderColor: "transparent" },
      timeScale: { borderColor: "transparent", timeVisible: false },
      crosshair: { mode: 1 },
      localization: {
        priceFormatter: (p: number) => p.toLocaleString("ko-KR"),
      },
    });
    chartRef.current = chart;

    // v4 API
    const candleSeries = chart.addCandlestickSeries({
      upColor: "#ef4444",      // 한국: 상승=빨강
      downColor: "#3b82f6",    // 하락=파랑
      borderUpColor: "#ef4444",
      borderDownColor: "#3b82f6",
      wickUpColor: "#ef4444",
      wickDownColor: "#3b82f6",
    });
    candleSeriesRef.current = candleSeries;

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "vol",
    });
    chart.priceScale("vol").applyOptions({
      scaleMargins: { top: 0.78, bottom: 0 },
    });
    volumeSeriesRef.current = volumeSeries;

    return () => {
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, []);

  // 데이터 fetch
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/market/candles?ticker=${ticker}&market=${market}&days=${days}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.message ?? json.error ?? "fetch_failed");
        return json as {
          candles: Array<{
            time: string;
            open: number;
            high: number;
            low: number;
            close: number;
            volume: number;
          }>;
        };
      })
      .then((json) => {
        if (cancelled) return;
        const cs = json.candles;
        if (!cs || cs.length === 0) {
          setError("이 종목의 시세 데이터가 없어요.");
          return;
        }
        candleSeriesRef.current?.setData(
          cs.map((c) => ({
            time: c.time as Time,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          }))
        );
        volumeSeriesRef.current?.setData(
          cs.map((c) => ({
            time: c.time as Time,
            value: c.volume,
            color:
              c.close >= c.open
                ? "rgba(239, 68, 68, 0.4)"
                : "rgba(59, 130, 246, 0.4)",
          }))
        );
        chartRef.current?.timeScale().fitContent();

        const lastC = cs[cs.length - 1];
        const prev = cs[cs.length - 2];
        if (lastC && prev) {
          setLast({
            close: lastC.close,
            prevClose: prev.close,
            changePct: ((lastC.close - prev.close) / prev.close) * 100,
            date: lastC.time,
          });
        }
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message ?? "시세 가져오기 실패");
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [ticker, market, days]);

  return (
    <div className="rounded-card border border-border bg-surface-0 p-4">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-caption text-text-2">
            {name ?? ticker} · {market} · 일봉
          </p>
          {last && (
            <p className="font-mono text-h2">
              {formatKRW(last.close)}{" "}
              <span
                className={
                  last.changePct >= 0 ? "text-bullish" : "text-bearish"
                }
              >
                {last.changePct >= 0 ? "+" : ""}
                {last.changePct.toFixed(2)}%
              </span>
            </p>
          )}
        </div>
        <a
          href={`https://m.stock.naver.com/domestic/stock/${ticker}/total`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-caption text-text-2 hover:text-brand"
        >
          네이버 증권 →
        </a>
      </header>

      {error && (
        <div className="mb-3 rounded-card border border-bearish/30 bg-bearish/5 p-3 text-caption text-bearish">
          {error}
        </div>
      )}
      {loading && !error && (
        <div className="mb-3 text-caption text-text-3">불러오는 중...</div>
      )}

      <div
        ref={containerRef}
        style={{ height, width: "100%" }}
        className="overflow-hidden"
      />
      <p className="mt-2 text-caption text-text-3">
        ⓘ 시세는 Yahoo Finance · 약 15분 지연 · 한국 컨벤션 (빨강 ↑ / 파랑 ↓)
      </p>
    </div>
  );
}

export default memo(KoreanCandleChartImpl);

"use client";

import { useEffect, useRef } from "react";
import { createChart, type IChartApi } from "lightweight-charts";

/**
 * TradingView Lightweight Charts 캔들 패널.
 * - 한국 시장 컨벤션: 빨강(상승) / 파랑(하락)
 * - SSR 비활성화 후 dynamic import 로 사용
 */
export default function CandlePanel() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { color: "transparent" },
        textColor: getCssVar("--text-2") ?? "#475569",
      },
      grid: {
        vertLines: { color: getCssVar("--border") ?? "#e2e8f0" },
        horzLines: { color: getCssVar("--border") ?? "#e2e8f0" },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
    });
    chartRef.current = chart;

    const series = chart.addCandlestickSeries({
      upColor: "#ef4444", // 한국: 상승 = 빨강
      downColor: "#3b82f6", // 한국: 하락 = 파랑
      borderUpColor: "#ef4444",
      borderDownColor: "#3b82f6",
      wickUpColor: "#ef4444",
      wickDownColor: "#3b82f6",
    });

    // 더미 데이터 (Week 4 부터 KIS 일봉 연동)
    series.setData(buildDummyCandles());

    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="h-72 w-full overflow-hidden rounded-card" />;
}

function getCssVar(name: string) {
  if (typeof window === "undefined") return undefined;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name);
  return v ? v.trim() : undefined;
}

function buildDummyCandles() {
  const arr: { time: string; open: number; high: number; low: number; close: number }[] = [];
  let p = 70000;
  const start = new Date("2026-02-01");
  for (let i = 0; i < 60; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const open = p;
    const change = (Math.random() - 0.5) * 1500;
    const close = Math.round(open + change);
    const high = Math.max(open, close) + Math.round(Math.random() * 500);
    const low = Math.min(open, close) - Math.round(Math.random() * 500);
    arr.push({
      time: d.toISOString().slice(0, 10),
      open,
      high,
      low,
      close,
    });
    p = close;
  }
  return arr;
}

"use client";

import { useEffect, useRef, memo } from "react";

/**
 * TradingView Advanced Chart 위젯 (공식 임베드 구조).
 * - https://www.tradingview.com/widget/advanced-chart/
 * - 한국 종목: KRX:005930 (삼성전자)
 * - 데이터/시세 라이선스는 TradingView 가 보유 → 재배포 OK
 */
type Props = {
  symbol?: string;
  interval?: "1" | "5" | "15" | "60" | "240" | "D" | "W" | "M";
  theme?: "light" | "dark";
  height?: number | string;
};

function TradingViewChartImpl({
  symbol = "KRX:005930",
  interval = "D",
  theme = "light",
  height = 520,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 기존 위젯 제거
    container.innerHTML = `
      <div class="tradingview-widget-container__widget" style="height: 100%; width: 100%;"></div>
      <div class="tradingview-widget-copyright" style="font-size: 11px; color: #94a3b8; padding: 4px 8px; text-align: right;">
        <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank" style="color: #94a3b8;">차트 by TradingView</a>
      </div>
    `;

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval,
      timezone: "Asia/Seoul",
      theme,
      style: "1",
      locale: "kr",
      enable_publishing: false,
      withdateranges: true,
      hide_side_toolbar: false,
      allow_symbol_change: true,
      details: true,
      hotlist: false,
      calendar: false,
      studies: [],
      backgroundColor: "rgba(255, 255, 255, 1)",
      gridColor: "rgba(226, 232, 240, 0.4)",
      support_host: "https://www.tradingview.com",
    });
    container.appendChild(script);

    return () => {
      // 언마운트 시 정리
      if (container) container.innerHTML = "";
    };
  }, [symbol, interval, theme]);

  return (
    <div
      className="tradingview-widget-container overflow-hidden rounded-card border border-border"
      style={{ height, width: "100%" }}
      ref={containerRef}
    />
  );
}

export default memo(TradingViewChartImpl);

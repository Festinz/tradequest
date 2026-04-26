"use client";

import { useEffect, useRef, memo } from "react";

/**
 * TradingView Mini Symbol Overview — 종목명 + 현재가 + 등락률 작은 카드.
 * 홈/포트폴리오에서 보유 종목 빠른 가격 표시용.
 */
type Props = {
  symbol?: string;
  height?: number | string;
  theme?: "light" | "dark";
};

function SymbolMiniImpl({
  symbol = "KRX:005930",
  height = 120,
  theme = "light",
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.async = true;
    script.type = "text/javascript";
    script.innerHTML = JSON.stringify({
      symbol,
      width: "100%",
      height,
      locale: "kr",
      dateRange: "1D",
      colorTheme: theme,
      isTransparent: true,
      autosize: false,
      largeChartUrl: "",
    });
    containerRef.current.appendChild(script);
  }, [symbol, height, theme]);

  return (
    <div
      ref={containerRef}
      className="overflow-hidden rounded-card"
      style={{ height, width: "100%" }}
    />
  );
}

export default memo(SymbolMiniImpl);

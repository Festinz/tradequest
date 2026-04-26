"use client";

import { useEffect, useRef, memo } from "react";

/**
 * TradingView Symbol Search 위젯.
 * - 한국 종목/해외 종목 자유롭게 검색
 */
type Props = {
  defaultSymbol?: string;
  onSymbolChange?: (symbol: string) => void;
};

function SymbolSearchImpl({ defaultSymbol = "KRX:005930", onSymbolChange }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";
    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js";
    script.async = true;
    script.type = "text/javascript";
    script.innerHTML = JSON.stringify({
      symbol: defaultSymbol,
      width: "100%",
      locale: "kr",
      colorTheme: "light",
      isTransparent: true,
    });
    containerRef.current.appendChild(script);
  }, [defaultSymbol]);

  return <div ref={containerRef} className="rounded-card" />;
}

export default memo(SymbolSearchImpl);

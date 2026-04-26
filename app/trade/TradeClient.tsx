"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Sparkles, Search, ExternalLink } from "lucide-react";
import t from "@/locales/ko.json";
import { formatKRW } from "@/lib/utils";

const TradingViewChart = dynamic(
  () => import("@/components/chart/TradingViewChart"),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

type Stock = { ticker: string; name: string; market: string };
type Position = { ticker: string; qty: number; avg_price: number; name: string };

export default function TradeClient({
  cash,
  initialSymbol,
  stocks,
  positions,
}: {
  cash: number;
  initialSymbol: string;
  stocks: Stock[];
  positions: Position[];
}) {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"buy" | "sell">("buy");
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState("");
  const [reason, setReason] = useState("");
  const [advice, setAdvice] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const ticker = symbol.includes(":") ? symbol.split(":")[1] : symbol;
  const currentStock = stocks.find((s) => s.ticker === ticker);
  const currentPosition = positions.find((p) => p.ticker === ticker);

  const filtered = stocks.filter(
    (s) =>
      s.ticker.includes(search) ||
      s.name.toLowerCase().includes(search.toLowerCase())
  );

  async function askCoach() {
    if (!reason.trim()) return alert(t.feedback.trade_no_reason);
    if (!price.trim()) return alert("가격을 입력해 줘.");
    setLoadingAdvice(true);
    try {
      const res = await fetch("/api/coach/trade-entry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ticker, side: tab, price: Number(price), reason }),
      });
      const json = await res.json();
      setAdvice(json.text ?? json.error ?? t.errors.generic);
    } catch (e) {
      console.error(e);
      setAdvice(t.errors.generic);
    } finally {
      setLoadingAdvice(false);
    }
  }

  async function submit() {
    if (!reason.trim()) return alert(t.feedback.trade_no_reason);
    if (!price.trim() || !qty.trim()) return alert("수량과 가격을 입력해 줘.");
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/trade/order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ticker,
          side: tab,
          qty: Number(qty),
          price: Number(price),
          reason,
          ai_advice_text: advice,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setResult({ ok: false, msg: json.error ?? "주문 실패" });
        return;
      }
      const verb = tab === "buy" ? "매수" : "매도";
      const tail =
        json.pnlPct !== undefined
          ? `손익률 ${json.pnlPct.toFixed(1)}%`
          : `+${json.exp} EXP 획득`;
      setResult({ ok: true, msg: `${verb} 완료 · ${tail}` });
      setReason("");
      setAdvice(null);
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      console.error(e);
      setResult({ ok: false, msg: t.errors.generic });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* 좌측: 차트 */}
      <section className="min-w-0">
        <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-h1">{currentStock?.name ?? ticker}</h1>
            <p className="text-caption text-text-2">
              {ticker} · {currentStock?.market ?? "KRX"}
              {currentPosition && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-chip bg-brand/10 px-2 py-0.5 text-caption text-brand">
                  보유 {currentPosition.qty}주 · 평단 {formatKRW(currentPosition.avg_price)}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`https://finance.naver.com/item/main.nhn?code=${ticker}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-card border border-border bg-surface-0 px-3 py-2 text-caption text-text-2 hover:border-brand"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              네이버 증권
            </a>
            <button
              onClick={() => setShowPicker(true)}
              className="inline-flex items-center gap-1 rounded-card border border-border bg-surface-0 px-3 py-2 text-caption text-text-2 hover:border-brand"
            >
              <Search className="h-4 w-4" />
              종목 변경
            </button>
          </div>
        </header>

        <TradingViewChart symbol={symbol} interval="D" height={520} />

        <p className="mt-2 text-caption text-text-3">
          ⓘ 차트가 안 뜨면 TradingView 가 해당 종목을 지원하지 않거나 일시적 오류일 수 있어.
          위의 "네이버 증권" 링크로 우회해서 확인해 봐.
        </p>
      </section>

      {/* 우측: 주문 폼 */}
      <aside className="space-y-4">
        <div className="sticky top-20 rounded-card border border-border bg-surface-0 p-5 shadow-card">
          <div className="mb-4 flex rounded-card bg-surface-2 p-1">
            <button
              onClick={() => setTab("buy")}
              className={`flex-1 rounded-card py-2 text-h3 transition ${
                tab === "buy" ? "bg-bullish text-white shadow" : "text-text-2"
              }`}
            >
              {t.trade.buy}
            </button>
            <button
              onClick={() => setTab("sell")}
              className={`flex-1 rounded-card py-2 text-h3 transition ${
                tab === "sell" ? "bg-bearish text-white shadow" : "text-text-2"
              }`}
            >
              {t.trade.sell}
            </button>
          </div>

          <p className="mb-3 flex justify-between text-caption text-text-2">
            <span>예수금</span>
            <span className="font-mono">{formatKRW(cash)}</span>
          </p>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-caption text-text-2">
              {t.trade.qty}
              <input
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                inputMode="numeric"
                className="mt-1 w-full rounded-card border border-border bg-surface-1 px-3 py-2 text-body"
              />
            </label>
            <label className="text-caption text-text-2">
              {t.trade.price}
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputMode="numeric"
                placeholder="75400"
                className="mt-1 w-full rounded-card border border-border bg-surface-1 px-3 py-2 text-body font-mono"
              />
            </label>
          </div>

          <p className="mt-2 text-caption text-text-3">
            예상 체결가: <span className="font-mono">{formatKRW(Number(qty || 0) * Number(price || 0))}</span>
          </p>

          <label className="mt-4 block text-caption text-text-2">
            {t.trade.reason_label}
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder={t.trade.reason_placeholder}
              className="mt-1 w-full rounded-card border border-border bg-surface-1 px-3 py-2 text-body"
            />
          </label>

          <button
            onClick={askCoach}
            disabled={loadingAdvice}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-card border border-brand py-2.5 text-body text-brand hover:bg-brand/5 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {loadingAdvice ? t.trade.ai_loading : "AI 코치 의견 받기"}
          </button>

          {advice && (
            <div className="animate-in-soft mt-3 whitespace-pre-line rounded-card border border-brand/30 bg-brand/5 p-3 text-caption text-text-1">
              {advice}
            </div>
          )}

          <button
            onClick={submit}
            disabled={submitting}
            className={`mt-4 w-full rounded-card py-3 text-h3 text-white shadow-card transition ${
              tab === "buy" ? "bg-bullish hover:bg-bullish/90" : "bg-bearish hover:bg-bearish/90"
            } disabled:opacity-50`}
          >
            {submitting ? "주문 중..." : tab === "buy" ? t.trade.submit_buy : t.trade.submit_sell}
          </button>

          {result && (
            <p
              className={`mt-3 rounded-card border p-3 text-center text-body ${
                result.ok
                  ? "border-bullish/30 bg-bullish/5 text-bullish"
                  : "border-bearish/30 bg-bearish/5 text-bearish"
              }`}
            >
              {result.ok ? "✅" : "❌"} {result.msg}
            </p>
          )}
        </div>

        {positions.length > 0 && (
          <div className="rounded-card border border-border bg-surface-0 p-5">
            <h3 className="mb-3 text-h3">내 보유</h3>
            <ul className="space-y-2">
              {positions.map((p) => (
                <li key={p.ticker}>
                  <button
                    onClick={() => setSymbol(`KRX:${p.ticker}`)}
                    className="flex w-full items-center justify-between rounded-card border border-border bg-surface-1 px-3 py-2 text-left hover:border-brand"
                  >
                    <div>
                      <p className="text-caption">{p.name}</p>
                      <p className="text-caption text-text-3">{p.qty}주</p>
                    </div>
                    <Link
                      href={`/trade?symbol=KRX:${p.ticker}`}
                      className="text-caption text-brand"
                    >
                      열기
                    </Link>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>

      {/* 종목 변경 모달 */}
      {showPicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowPicker(false)}
        >
          <div
            className="w-full max-w-md rounded-card bg-surface-0 p-5 shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-h3">종목 선택</h2>
              <button onClick={() => setShowPicker(false)} className="text-caption text-text-2">
                닫기
              </button>
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="종목명 / 종목코드"
              autoFocus
              className="mb-3 w-full rounded-card border border-border bg-surface-1 px-3 py-2 text-body"
            />
            <ul className="max-h-96 overflow-y-auto">
              {filtered.map((s) => (
                <li key={s.ticker}>
                  <button
                    onClick={() => {
                      setSymbol(`KRX:${s.ticker}`);
                      setShowPicker(false);
                      setSearch("");
                    }}
                    className="flex w-full items-center justify-between border-b border-border px-2 py-3 text-left hover:bg-surface-1"
                  >
                    <div>
                      <p className="text-body">{s.name}</p>
                      <p className="text-caption text-text-3">{s.ticker}</p>
                    </div>
                    <span className="text-caption text-text-2">{s.market}</span>
                  </button>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="py-6 text-center text-caption text-text-2">
                  검색 결과 없음. <code>pnpm seed:stocks</code> 실행했는지 확인해 줘.
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="grid h-[520px] place-items-center rounded-card border border-border bg-surface-1 text-caption text-text-3">
      차트 로딩...
    </div>
  );
}

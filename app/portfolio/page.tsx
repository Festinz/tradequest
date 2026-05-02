import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatKRW, formatPct, pnlColor, formatDateKR } from "@/lib/utils";
import { loadHoldings } from "@/lib/portfolio/holdings";
import AppShell from "@/components/AppShell";
import SectorTreemap from "@/components/chart/SectorTreemap";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: character } = await supabase
    .from("characters")
    .select("cash_balance")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!character) redirect("/onboarding");

  const holdings = await loadHoldings(supabase, user.id);

  const { data: trades } = await supabase
    .from("trades")
    .select(
      "id, ticker, side, qty, price, status, pnl, pnl_pct, opened_at, closed_at, stocks(name)",
    )
    .eq("user_id", user.id)
    .order("opened_at", { ascending: false })
    .limit(50);

  const positionsValue = holdings.reduce((s, h) => s + h.market_value, 0);
  const total = character.cash_balance + positionsValue;
  const totalPnlPct = ((total - 10000000) / 10000000) * 100;

  const closed = (trades ?? []).filter(
    (t) => t.status === "closed" && t.pnl_pct !== null,
  );
  const winRate =
    closed.length > 0
      ? Math.round(
          (closed.filter((t) => Number(t.pnl_pct) > 0).length /
            closed.length) *
            100,
        )
      : 0;

  return (
    <AppShell active="/portfolio">
      <h1 className="mb-6 text-h1">포트폴리오</h1>

      {/* 4-card 요약 */}
      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="총 자산"
          value={formatKRW(total)}
          accent={pnlColor(totalPnlPct)}
          sub={formatPct(totalPnlPct)}
        />
        <SummaryCard label="예수금" value={formatKRW(character.cash_balance)} />
        <SummaryCard
          label="주식 평가"
          value={formatKRW(positionsValue)}
          sub={`${holdings.length}종목`}
        />
        <SummaryCard
          label="승률 (청산 기준)"
          value={`${winRate}%`}
          sub={`${closed.length}건`}
        />
      </section>

      {/* 섹터 트리맵 (NEW · VIZ-007) */}
      {holdings.length > 0 && (
        <section className="mb-6 rounded-card border border-border bg-surface-0 p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-h3">섹터 분포 (VIZ-007)</h2>
              <p className="text-caption text-text-2">
                크기 = 평가금액 비중 / 색 = 일간 등락률 (빨강↑/파랑↓)
              </p>
            </div>
            <span className="rounded-chip bg-brand/10 px-2.5 py-1 text-caption text-brand">
              {holdings.length}종목 ·{" "}
              {new Set(holdings.map((h) => h.sector)).size}섹터
            </span>
          </div>
          <SectorTreemap holdings={holdings} />
        </section>
      )}

      {/* 보유 종목 + 매매 기록 */}
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <section className="rounded-card border border-border bg-surface-0 p-5">
          <h2 className="mb-3 text-h3">보유 종목</h2>
          {holdings.length > 0 ? (
            <ul className="space-y-2">
              {holdings.map((h) => (
                <li key={h.ticker}>
                  <Link
                    href={`/trade?symbol=KRX:${h.ticker}`}
                    className="flex items-center justify-between rounded-card border border-border bg-surface-1 px-4 py-3 hover:border-brand"
                  >
                    <div className="min-w-0">
                      <p className="text-body">{h.name}</p>
                      <p className="truncate text-caption text-text-3">
                        {h.ticker} · {h.qty}주 · 평단 {formatKRW(h.avg_price)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-body">
                        {formatKRW(h.market_value)}
                      </p>
                      <p
                        className={`font-mono text-caption ${pnlColor(h.daily_change_pct)}`}
                      >
                        {formatPct(h.daily_change_pct)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Link
              href="/trade"
              className="block rounded-card border-2 border-dashed border-border p-6 text-center text-caption text-text-2 hover:border-brand"
            >
              보유 종목 없음 — 매매 화면으로
            </Link>
          )}
        </section>

        <section className="rounded-card border border-border bg-surface-0 p-5">
          <h2 className="mb-3 text-h3">매매 기록</h2>
          {trades && trades.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-body">
                <thead className="text-caption text-text-2">
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left">날짜</th>
                    <th className="px-3 py-2 text-left">종목</th>
                    <th className="px-3 py-2 text-right">수량</th>
                    <th className="px-3 py-2 text-right">단가</th>
                    <th className="px-3 py-2 text-right">손익률</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((t) => {
                    const stock = (
                      t as unknown as { stocks: { name: string } | null }
                    ).stocks;
                    return (
                      <tr
                        key={t.id}
                        className="border-b border-border last:border-b-0"
                      >
                        <td className="px-3 py-2 text-caption text-text-3">
                          {formatDateKR(t.opened_at)}
                        </td>
                        <td className="px-3 py-2">
                          <Link
                            href={`/trade?symbol=KRX:${t.ticker}`}
                            className="hover:text-brand"
                          >
                            {stock?.name ?? t.ticker}
                          </Link>
                          <span
                            className={`ml-2 text-caption ${t.side === "buy" ? "text-bullish" : "text-bearish"}`}
                          >
                            {t.side === "buy" ? "매수" : "매도"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-mono">
                          {t.qty}
                        </td>
                        <td className="px-3 py-2 text-right font-mono">
                          {formatKRW(t.price)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {t.status === "closed" && t.pnl_pct !== null ? (
                            <span
                              className={`font-mono ${pnlColor(Number(t.pnl_pct))}`}
                            >
                              {formatPct(Number(t.pnl_pct))}
                            </span>
                          ) : (
                            <span className="text-caption text-text-3">
                              보유 중
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-6 text-center text-caption text-text-2">
              매매 기록이 없어.
            </p>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-card border border-border bg-surface-0 p-5 shadow-card">
      <p className="text-caption text-text-2">{label}</p>
      <p className="mt-1 font-mono text-h2">{value}</p>
      {sub && (
        <p className={`text-caption font-mono ${accent ?? "text-text-3"}`}>
          {sub}
        </p>
      )}
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles, Trophy, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatKRW, formatPct, pnlColor } from "@/lib/utils";
import AppShell from "@/components/AppShell";

const CLASS_LABEL: Record<string, string> = {
  chartist: "차트 분석가",
  value_investor: "가치투자자",
  momentum_trader: "모멘텀 트레이더",
};

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: character } = await supabase
    .from("characters")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!character) redirect("/onboarding");

  const today = new Date().toISOString().slice(0, 10);
  await supabase.rpc("ensure_daily_missions", { p_user_id: user.id, p_date: today });
  await supabase.rpc("touch_streak", { p_user_id: user.id, p_date: today });

  const { data: quests } = await supabase
    .from("daily_missions")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", today)
    .order("exp_reward");

  const { data: positions } = await supabase
    .from("positions")
    .select("ticker, qty, avg_price, stocks(name)")
    .eq("user_id", user.id)
    .limit(5);

  const positionsValue = (positions ?? []).reduce(
    (s, p) => s + p.qty * p.avg_price,
    0
  );
  const totalAssets = character.cash_balance + positionsValue;

  const { data: earnedTrophies } = await supabase
    .from("user_trophies")
    .select("trophy_id, trophies(name, tier)")
    .eq("user_id", user.id)
    .limit(8);

  const expThreshold = character.level * 1000;
  const expPct = Math.min(100, Math.round((character.exp / expThreshold) * 100));
  const totalPnlPct = ((totalAssets - 10000000) / 10000000) * 100;
  const doneCount = (quests ?? []).filter((q) => q.status === "done").length;

  return (
    <AppShell active="/">
      {/* 캐릭터 + 자산 카드 */}
      <section className="mb-6 rounded-card border border-border bg-surface-0 p-6 shadow-card">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-brand/10 text-4xl">
            🧑‍💼
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-h2">{character.name}</p>
            <p className="text-caption text-text-2">
              {CLASS_LABEL[character.class] ?? character.class} · Lv.{character.level}
            </p>
            <div className="mt-3 max-w-md">
              <div className="mb-1 flex justify-between text-caption text-text-2">
                <span>EXP</span>
                <span className="font-mono">
                  {character.exp} / {expThreshold}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full bg-exp transition-all" style={{ width: `${expPct}%` }} />
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-caption text-text-2">총 자산</p>
            <p className="font-mono text-display">{formatKRW(totalAssets)}</p>
            <p className={`text-caption font-mono ${pnlColor(totalPnlPct)}`}>
              {formatPct(totalPnlPct)} (+{formatKRW(totalAssets - 10000000)})
            </p>
          </div>
        </div>
      </section>

      {/* 2열 그리드: 퀘스트 + 보유종목 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 일일 퀘스트 */}
        <section className="rounded-card border border-border bg-surface-0 p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-h3">오늘의 퀘스트</h2>
            <span className="text-caption text-text-3">
              {doneCount}/{quests?.length ?? 0}
            </span>
          </div>
          <ul className="space-y-2">
            {(quests ?? []).map((q) => {
              const done = q.status === "done";
              return (
                <li
                  key={q.id}
                  className={`flex items-center gap-3 rounded-card border p-4 ${
                    done ? "border-bullish/30 bg-bullish/5" : "border-border bg-surface-1"
                  }`}
                >
                  <span
                    className={`grid h-6 w-6 place-items-center rounded-full text-xs ${
                      done ? "bg-bullish text-white" : "border border-border text-text-3"
                    }`}
                  >
                    {done ? "✓" : ""}
                  </span>
                  <p className={`flex-1 text-body ${done ? "text-text-3 line-through" : "text-text-1"}`}>
                    {q.title}
                  </p>
                  <span className="inline-flex items-center gap-1 text-caption text-exp">
                    <Sparkles className="h-3 w-3" />+{q.exp_reward}
                  </span>
                </li>
              );
            })}
            {(!quests || quests.length === 0) && (
              <li className="rounded-card border border-border bg-surface-1 p-4 text-caption text-text-2">
                퀘스트 함수가 아직 없어. 마이그레이션 0002 적용 후 새로고침.
              </li>
            )}
          </ul>
        </section>

        {/* 보유 종목 */}
        <section className="rounded-card border border-border bg-surface-0 p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-h3">보유 종목</h2>
            <Link href="/portfolio" className="inline-flex items-center gap-0.5 text-caption text-brand">
              포트폴리오 <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {positions && positions.length > 0 ? (
            <ul className="space-y-2">
              {positions.map((p) => {
                const stock = (p as unknown as { stocks: { name: string } | null }).stocks;
                return (
                  <li key={p.ticker}>
                    <Link
                      href={`/trade?symbol=KRX:${p.ticker}`}
                      className="flex items-center justify-between rounded-card border border-border bg-surface-1 p-4 hover:border-brand"
                    >
                      <div>
                        <p className="text-body">{stock?.name ?? p.ticker}</p>
                        <p className="text-caption text-text-3">
                          {p.qty}주 · 평단 {formatKRW(p.avg_price)}
                        </p>
                      </div>
                      <p className="font-mono text-body">{formatKRW(p.qty * p.avg_price)}</p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Link
              href="/trade"
              className="block rounded-card border-2 border-dashed border-border p-6 text-center text-caption text-text-2 hover:border-brand"
            >
              아직 보유한 종목이 없어. <br />
              <span className="text-brand">매매 화면에서 첫 매수를 해 봐 →</span>
            </Link>
          )}
        </section>
      </div>

      {/* 트로피 + 브리핑 */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="rounded-card border border-border bg-surface-0 p-6 shadow-card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-h3">트로피</h2>
            <Link href="/profile/trophies" className="inline-flex items-center gap-0.5 text-caption text-brand">
              전체 보기 <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {earnedTrophies && earnedTrophies.length > 0 ? (
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {earnedTrophies.map((t) => {
                const tro = (t as unknown as { trophies: { name: string; tier: string } }).trophies;
                return (
                  <li
                    key={t.trophy_id}
                    className="flex flex-col items-center gap-1 rounded-card border border-border bg-surface-1 p-3 text-center"
                  >
                    <Trophy className="h-7 w-7 text-tier-rare" />
                    <span className="text-caption text-text-2">{tro?.name ?? t.trophy_id}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="rounded-card border-2 border-dashed border-border p-6 text-center text-caption text-text-2">
              아직 획득한 트로피가 없어. 첫 매매가 너의 첫 트로피야.
            </p>
          )}
        </section>

        <section className="rounded-card border border-border bg-gradient-to-br from-brand/10 to-transparent p-6">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-h3">오늘의 시장</span>
            <span className="rounded-chip bg-brand/10 px-2 py-0.5 text-caption text-brand">AI 브리핑</span>
          </div>
          <p className="text-body text-text-2">
            매매 화면에서 진짜 차트로 시장을 확인해 봐. AI 코치는 매매 직전에 진입 근거를 함께 점검해 줘.
          </p>
          <Link
            href="/trade"
            className="mt-4 inline-flex items-center gap-1 text-caption text-brand"
          >
            매매로 이동 <ArrowRight className="h-3 w-3" />
          </Link>
        </section>
      </div>
    </AppShell>
  );
}

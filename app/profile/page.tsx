import Link from "next/link";
import { redirect } from "next/navigation";
import { Trophy, Brain, Zap, Heart, Flame, Settings, ChevronRight, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";

const CLASS_LABEL: Record<string, string> = {
  chartist: "차트 분석가",
  value_investor: "가치투자자",
  momentum_trader: "모멘텀 트레이더",
};

export default async function ProfilePage() {
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

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: sessions } = await supabase
    .from("learning_sessions")
    .select("duration_sec")
    .eq("user_id", user.id)
    .gte("created_at", weekAgo);
  const weekMinutes = Math.round(
    (sessions ?? []).reduce((s, x) => s + x.duration_sec, 0) / 60
  );

  const { data: earnedTrophies } = await supabase
    .from("user_trophies")
    .select("trophy_id, trophies(name, tier)")
    .eq("user_id", user.id)
    .limit(8);

  const { data: completedSkills } = await supabase
    .from("user_skills")
    .select("skill_id")
    .eq("user_id", user.id)
    .not("completed_at", "is", null);

  const stats = [
    { icon: Flame, label: "연속 출석", value: `${character.streak_days}일`, color: "streak" },
    { icon: Heart, label: "하트", value: `${character.hearts}/5`, color: "heart" },
    { icon: Zap, label: "에너지", value: `${character.energy}/100`, color: "energy" },
    { icon: Brain, label: "주간 학습", value: `${weekMinutes}분`, color: "brand" },
    { icon: Trophy, label: "트로피", value: `${earnedTrophies?.length ?? 0}개`, color: "tier-rare" },
    { icon: Sparkles, label: "스킬 완료", value: `${completedSkills?.length ?? 0}개`, color: "exp" },
  ];

  return (
    <AppShell active="/profile">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand/10 text-4xl">
            🧑‍💼
          </div>
          <div>
            <p className="text-h1">{character.name}</p>
            <p className="text-caption text-text-2">
              {CLASS_LABEL[character.class] ?? character.class} · Lv.{character.level}
            </p>
          </div>
        </div>
        <Link
          href="/profile/settings"
          className="inline-flex items-center gap-2 rounded-card border border-border bg-surface-0 px-4 py-2 text-body text-text-2 hover:border-brand"
        >
          <Settings className="h-4 w-4" />
          설정
        </Link>
      </header>

      {/* 스탯 6개 그리드 */}
      <section className="mb-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-card border border-border bg-surface-0 p-4 text-center shadow-card">
              <Icon className={`mx-auto mb-2 h-6 w-6 text-${s.color}`} />
              <p className="text-caption text-text-2">{s.label}</p>
              <p className="text-h3">{s.value}</p>
            </div>
          );
        })}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 주간 회고 카드 */}
        <section className="rounded-card border border-brand/30 bg-gradient-to-br from-brand/10 to-transparent p-6">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-chip bg-brand/15 px-2 py-0.5 text-caption text-brand">Sonnet</span>
            <h2 className="text-h3">주간 회고</h2>
          </div>
          <p className="mb-4 text-body text-text-2">
            이번 주 매매 패턴과 학습을 종합해 깊은 회고를 받아 봐. <br />
            매매 4건 이상부터 권장 (월 4회 한정).
          </p>
          <button
            className="w-full rounded-card bg-brand py-3 text-body text-white shadow-card disabled:opacity-50"
            disabled
          >
            주간 회고 받기 (준비 중)
          </button>
        </section>

        {/* 트로피 미리보기 */}
        <section className="rounded-card border border-border bg-surface-0 p-6 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-h3">트로피</h2>
            <Link href="/profile/trophies" className="text-caption text-brand">
              전체 보기
            </Link>
          </div>
          {earnedTrophies && earnedTrophies.length > 0 ? (
            <div className="grid grid-cols-4 gap-3">
              {earnedTrophies.slice(0, 8).map((t) => {
                const tro = (t as unknown as { trophies: { name: string } | null }).trophies;
                return (
                  <div
                    key={t.trophy_id}
                    className="flex flex-col items-center rounded-card border border-border bg-surface-1 p-3 text-center"
                  >
                    <Trophy className="mb-1 h-6 w-6 text-tier-rare" />
                    <span className="line-clamp-1 text-caption text-text-2">{tro?.name}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="rounded-card border-2 border-dashed border-border p-6 text-center text-caption text-text-2">
              아직 획득한 트로피가 없어.
            </p>
          )}
        </section>
      </div>

      <Link
        href="/profile/settings"
        className="mt-6 flex items-center justify-between rounded-card border border-border bg-surface-0 p-4 text-body hover:border-brand"
      >
        <span className="inline-flex items-center gap-2">
          <Settings className="h-4 w-4 text-text-2" />
          설정 / KIS 개인 모드 / 로그아웃
        </span>
        <ChevronRight className="h-4 w-4 text-text-3" />
      </Link>
    </AppShell>
  );
}


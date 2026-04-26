import Link from "next/link";
import { redirect } from "next/navigation";
import { Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";

const BRANCH_LABEL = {
  chart: "차트",
  fundamental: "재무",
  psychology: "심리",
  capstone: "캡스톤",
  boss: "보스",
} as const;

const BRANCH_COLOR = {
  chart: "bg-brand/10 text-brand border-brand/30",
  fundamental: "bg-bullish/10 text-bullish border-bullish/30",
  psychology: "bg-energy/10 text-energy border-energy/30",
  capstone: "bg-tier-epic/10 text-tier-epic border-tier-epic/30",
  boss: "bg-bearish/10 text-bearish border-bearish/30",
} as const;

const BRANCH_DESC = {
  chart: "캔들·이평선·RSI·MACD·거래량으로 차트를 읽는 법",
  fundamental: "PER·PBR·DCF·공시로 기업 가치를 보는 법",
  psychology: "손절·FOMO·매매일지로 감정을 다루는 법",
  capstone: "3브랜치를 통합한 본인만의 전략",
  boss: "급락장 같은 보스 시나리오 클리어",
} as const;

export default async function SkillsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: character } = await supabase
    .from("characters")
    .select("level")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: skills } = await supabase
    .from("skills")
    .select("id, name, branch, required_level, prerequisite_id, description")
    .order("required_level");

  const { data: userSkills } = await supabase
    .from("user_skills")
    .select("skill_id, completed_at")
    .eq("user_id", user.id);

  const completedSet = new Set(
    (userSkills ?? []).filter((u) => u.completed_at).map((u) => u.skill_id)
  );
  const myLevel = character?.level ?? 1;

  function stateOf(s: { id: string; required_level: number; prerequisite_id: string | null }) {
    if (completedSet.has(s.id)) return "completed" as const;
    const prereqOk = !s.prerequisite_id || completedSet.has(s.prerequisite_id);
    const levelOk = myLevel >= s.required_level;
    return prereqOk && levelOk ? ("unlocked" as const) : ("locked" as const);
  }

  const branches = ["chart", "fundamental", "psychology", "capstone", "boss"] as const;
  const totalSkills = skills?.length ?? 0;
  const completedCount = completedSet.size;

  return (
    <AppShell active="/skills">
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-h1">스킬 트리</h1>
          <p className="mt-1 text-caption text-text-2">
            해금된 스킬은 매매 화면의 차트 인디케이터를 켜줘.
          </p>
        </div>
        <p className="text-caption text-text-2">
          진행 <span className="font-mono text-brand">{completedCount}</span> / {totalSkills}
        </p>
      </header>

      {(!skills || skills.length === 0) && (
        <div className="mb-6 flex items-start gap-3 rounded-card border border-energy/30 bg-energy/5 p-5">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-energy" />
          <div className="text-body">
            <p className="font-semibold">스킬 데이터가 비어 있어</p>
            <p className="mt-1 text-caption text-text-2">
              아직 시드를 안 돌렸거나, 마이그레이션 0002 가 적용되지 않았을 수 있어.
              <br />
              터미널에서 차례로:
            </p>
            <pre className="mt-2 overflow-x-auto rounded bg-surface-2 p-3 text-caption">
{`# 1) Supabase 대시보드 SQL Editor 에 supabase/migrations/0002_settings_and_quests.sql 붙여넣고 Run
# 2) 터미널:
pnpm seed:trophies
pnpm seed:stocks
pnpm seed:skills        # Anthropic API 호출, 약 $0.10`}
            </pre>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {branches.map((branch) => {
          const items = (skills ?? []).filter((s) => s.branch === branch);
          if (items.length === 0) return null;
          return (
            <section
              key={branch}
              className={`rounded-card border bg-surface-0 p-5 ${BRANCH_COLOR[branch].split(" ")[2] ?? "border-border"}`}
            >
              <div className="mb-1 flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-chip border px-2 py-0.5 text-caption ${BRANCH_COLOR[branch]}`}
                >
                  {BRANCH_LABEL[branch]}
                </span>
                <span className="text-caption text-text-3">
                  {items.filter((s) => completedSet.has(s.id)).length}/{items.length}
                </span>
              </div>
              <p className="mb-4 text-caption text-text-2">{BRANCH_DESC[branch]}</p>
              <ul className="space-y-2">
                {items.map((s) => {
                  const state = stateOf(s);
                  const locked = state === "locked";
                  const done = state === "completed";
                  return (
                    <li key={s.id}>
                      <Link
                        href={locked ? "#" : `/skills/${s.id}`}
                        className={`flex items-center justify-between rounded-card border border-border bg-surface-1 px-4 py-3 transition ${
                          locked
                            ? "cursor-not-allowed opacity-50"
                            : "hover:border-brand hover:shadow-card"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-body">{s.name}</p>
                          <p className="truncate text-caption text-text-3">
                            Lv.{s.required_level}+ 필요
                          </p>
                        </div>
                        {locked && <Lock className="h-4 w-4 shrink-0 text-text-3" />}
                        {done && <CheckCircle2 className="h-4 w-4 shrink-0 text-bullish" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}

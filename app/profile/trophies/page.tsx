import Link from "next/link";
import { ArrowLeft, Trophy, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";

const TIER_COLOR = {
  common: "text-tier-common",
  rare: "text-tier-rare",
  epic: "text-tier-epic",
  legendary: "text-tier-legendary",
} as const;

const TIER_LABEL = {
  common: "일반",
  rare: "레어",
  epic: "에픽",
  legendary: "레전더리",
} as const;

export default async function TrophiesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: trophies } = await supabase
    .from("trophies")
    .select("*")
    .order("tier");

  const { data: earned } = user
    ? await supabase
        .from("user_trophies")
        .select("trophy_id, earned_at")
        .eq("user_id", user.id)
    : { data: [] };

  const earnedMap = new Map((earned ?? []).map((e) => [e.trophy_id, e.earned_at]));

  return (
    <AppShell active="/profile">
      <Link
        href="/profile"
        className="mb-4 inline-flex items-center gap-1 text-caption text-text-2 hover:text-brand"
      >
        <ArrowLeft className="h-4 w-4" /> 프로필로
      </Link>
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-h1">트로피</h1>
          <p className="mt-1 text-caption text-text-2">
            획득 <span className="font-mono text-brand">{earnedMap.size}</span> / 전체 {trophies?.length ?? 0}
          </p>
        </div>
      </header>

      {(!trophies || trophies.length === 0) && (
        <div className="rounded-card border border-energy/30 bg-energy/5 p-5 text-body">
          트로피 데이터가 비어있어. 터미널에서 <code className="rounded bg-surface-2 px-1.5 py-0.5">pnpm seed:trophies</code> 실행해 줘.
        </div>
      )}

      <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {(trophies ?? []).map((t) => {
          const isEarned = earnedMap.has(t.id);
          const isHidden = t.hidden && !isEarned;
          return (
            <li
              key={t.id}
              className={`flex flex-col items-center rounded-card border border-border bg-surface-0 p-5 text-center shadow-card ${
                isEarned ? "" : "opacity-60"
              }`}
            >
              {isHidden ? (
                <Lock className="mb-2 h-10 w-10 text-text-3" />
              ) : (
                <Trophy
                  className={`mb-2 h-10 w-10 ${
                    isEarned ? TIER_COLOR[t.tier as keyof typeof TIER_COLOR] : "text-text-3"
                  }`}
                />
              )}
              <p className="text-body">{isHidden ? "???" : t.name}</p>
              <p className="mt-1 text-caption text-text-2">
                {isHidden ? "숨김 트로피" : t.description}
              </p>
              <span
                className={`mt-2 rounded-chip px-2 py-0.5 text-caption ${
                  isHidden ? "bg-surface-2 text-text-3" : "bg-surface-2 " + TIER_COLOR[t.tier as keyof typeof TIER_COLOR]
                }`}
              >
                {TIER_LABEL[t.tier as keyof typeof TIER_LABEL] ?? t.tier}
              </span>
            </li>
          );
        })}
      </ul>
    </AppShell>
  );
}

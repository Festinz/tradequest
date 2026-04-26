import Link from "next/link";
import { Home, Sparkles, TrendingUp, Briefcase, User, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Flame, Heart, Zap } from "lucide-react";

/**
 * 데스크탑 우선 반응형 셸.
 * - sm: 하단 탭바
 * - md+: 좌측 사이드바 + 상단 톱바
 * - 메인 컨텐츠는 max-w-7xl 로 와이드하게
 */
const NAV = [
  { href: "/", icon: Home, label: "홈" },
  { href: "/skills", icon: Sparkles, label: "스킬" },
  { href: "/trade", icon: TrendingUp, label: "매매" },
  { href: "/portfolio", icon: Briefcase, label: "포트폴리오" },
  { href: "/profile", icon: User, label: "프로필" },
];

export default async function AppShell({
  children,
  active,
}: {
  children: React.ReactNode;
  active?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: character } = user
    ? await supabase
        .from("characters")
        .select("name, level, streak_days, hearts, energy")
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };

  return (
    <div className="min-h-dvh bg-surface-2/30">
      {/* 상단 톱바 */}
      <header className="sticky top-0 z-30 border-b border-border bg-surface-0/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-card bg-brand text-white">
              📈
            </span>
            <span className="text-h3">TradeQuest</span>
          </Link>
          {character && (
            <div className="flex items-center gap-2">
              <Stat icon={<Flame className="h-3.5 w-3.5" />} value={character.streak_days} tint="streak" />
              <Stat icon={<Heart className="h-3.5 w-3.5" />} value={character.hearts} tint="heart" />
              <Stat icon={<Zap className="h-3.5 w-3.5" />} value={character.energy} tint="energy" />
              <span className="hidden text-caption text-text-2 md:block">
                {character.name} · Lv.{character.level}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* 본문 + 사이드바 */}
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 lg:px-8">
        {/* 사이드바 — md+ 만 */}
        <aside className="sticky top-20 hidden h-fit w-56 shrink-0 flex-col gap-1 md:flex">
          {NAV.map((n) => {
            const Icon = n.icon;
            const isActive = active === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-3 rounded-card px-3 py-2.5 text-body transition ${
                  isActive
                    ? "bg-brand text-white shadow-card"
                    : "text-text-2 hover:bg-surface-1"
                }`}
              >
                <Icon className="h-5 w-5" />
                {n.label}
              </Link>
            );
          })}
          <Link
            href="/profile/settings"
            className="mt-4 flex items-center gap-3 rounded-card px-3 py-2.5 text-caption text-text-3 hover:bg-surface-1"
          >
            <LogOut className="h-4 w-4" />
            설정 / 로그아웃
          </Link>
        </aside>

        {/* 메인 */}
        <main className="min-w-0 flex-1 pb-20 md:pb-0">{children}</main>
      </div>

      {/* 모바일 하단 탭바 */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface-0/95 backdrop-blur md:hidden">
        <ul className="grid grid-cols-5">
          {NAV.map((n) => {
            const Icon = n.icon;
            const isActive = active === n.href;
            return (
              <li key={n.href}>
                <Link
                  href={n.href}
                  className={`flex flex-col items-center gap-0.5 py-2 text-caption ${
                    isActive ? "text-brand" : "text-text-2"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {n.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function Stat({
  icon,
  value,
  tint,
}: {
  icon: React.ReactNode;
  value: number;
  tint: "streak" | "heart" | "energy";
}) {
  const tintMap = {
    streak: "bg-streak/10 text-streak",
    heart: "bg-heart/10 text-heart",
    energy: "bg-energy/10 text-energy",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-chip px-2 py-1 text-caption ${tintMap[tint]}`}
    >
      {icon}
      {value}
    </span>
  );
}

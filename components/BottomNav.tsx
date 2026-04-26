import Link from "next/link";

/** 하단 네비게이션 — 모든 메인 화면 공유 */
export default function BottomNav() {
  const items = [
    { href: "/", label: "홈", emoji: "🏠" },
    { href: "/skills", label: "스킬", emoji: "🌳" },
    { href: "/trade", label: "매매", emoji: "📈" },
    { href: "/portfolio", label: "포트", emoji: "💼" },
    { href: "/profile", label: "프로필", emoji: "👤" },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 mx-auto max-w-md border-t border-border bg-surface-0/90 px-5 pb-3 pt-2 backdrop-blur">
      <ul className="grid grid-cols-5 gap-1">
        {items.map((it) => (
          <li key={it.href} className="flex justify-center">
            <Link
              href={it.href}
              className="flex flex-col items-center gap-0.5 px-2 py-1 text-caption text-text-2 hover:text-brand"
            >
              <span className="text-base">{it.emoji}</span>
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

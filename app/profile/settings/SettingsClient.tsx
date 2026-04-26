"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";

type Settings = {
  kis_personal_mode: boolean;
  default_market: string;
};

export default function SettingsClient({
  initial,
  email,
}: {
  initial: Settings;
  email: string;
}) {
  const router = useRouter();
  const [s, setS] = useState<Settings>(initial);
  const [saving, setSaving] = useState(false);

  async function update(patch: Partial<Settings>) {
    setSaving(true);
    setS({ ...s, ...patch });
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-card border border-border bg-surface-1 p-5">
        <p className="text-caption text-text-2">로그인 이메일</p>
        <p className="text-body">{email || "로그인되지 않음"}</p>
      </section>

      {/* KIS 개인 모드 토글 */}
      <section className="rounded-card border border-border bg-surface-1 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-h3">KIS 개인 모드</h2>
            <p className="mt-1 text-caption text-text-2">
              본인 한국투자증권 계좌의 실제 시세를 사용해. 끄면 TradingView 위젯의 공개 시세만 사용.
            </p>
          </div>
          <button
            onClick={() => update({ kis_personal_mode: !s.kis_personal_mode })}
            disabled={saving}
            className={`relative h-7 w-12 rounded-full transition ${
              s.kis_personal_mode ? "bg-brand" : "bg-surface-2"
            }`}
            aria-pressed={s.kis_personal_mode}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                s.kis_personal_mode ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        </div>
        {s.kis_personal_mode && (
          <div className="mt-4 flex gap-2 rounded-card bg-energy/10 p-3 text-caption text-text-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-energy" />
            <span>
              KIS 약관상 본인 계좌만 사용 가능해. 이 모드는 다른 사람과 화면을 공유하면 안 돼.
              <code className="ml-1 rounded bg-surface-2 px-1">.env.local</code> 의 KIS 키가 필요함.
            </span>
          </div>
        )}
      </section>

      {/* 기본 시장 */}
      <section className="rounded-card border border-border bg-surface-1 p-5">
        <h2 className="mb-3 text-h3">기본 시장</h2>
        <div className="flex gap-2">
          {["KRX", "NASDAQ", "NYSE"].map((m) => (
            <button
              key={m}
              onClick={() => update({ default_market: m })}
              className={`rounded-chip px-4 py-1 text-caption ${
                s.default_market === m
                  ? "bg-brand text-white"
                  : "bg-surface-2 text-text-2"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </section>

      <button
        onClick={logout}
        className="w-full rounded-card border border-bearish py-3 text-body text-bearish"
      >
        로그아웃
      </button>
    </div>
  );
}

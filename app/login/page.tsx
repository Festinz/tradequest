"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) {
      alert(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <main className="grid min-h-dvh grid-cols-1 lg:grid-cols-2">
      {/* 좌: 브랜드 영역 (lg+ 만) */}
      <aside className="relative hidden flex-col justify-between bg-gradient-to-br from-brand to-brand/70 p-12 text-white lg:flex">
        <div>
          <span className="grid h-12 w-12 place-items-center rounded-card bg-white/15 text-2xl backdrop-blur">
            📈
          </span>
          <h1 className="mt-6 text-display">TradeQuest</h1>
          <p className="mt-2 text-h3 text-white/80">주식 세계의 듀오링고 + 포켓몬</p>
        </div>
        <div className="space-y-4 text-body text-white/90">
          <Bullet>매일 5분, 매매하지 않아도 EXP</Bullet>
          <Bullet>AI 코치가 진입 근거를 함께 점검</Bullet>
          <Bullet>14개 스킬, 4섹션 학습 + 퀴즈</Bullet>
          <Bullet>TradingView 실시간 차트 임베드</Bullet>
        </div>
      </aside>

      {/* 우: 로그인 폼 */}
      <section className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <h2 className="text-h1 lg:hidden">TradeQuest</h2>
          <h3 className="mt-1 text-h2">로그인</h3>
          <p className="mt-2 text-body text-text-2">
            매직 링크로 로그인 — 비밀번호 같은 건 없어.
          </p>

          {sent ? (
            <div className="mt-6 rounded-card border border-bullish/30 bg-bullish/5 p-5">
              <p className="text-body">
                메일함을 확인해 줘. <br />
                <b>{email}</b> 로 로그인 링크를 보냈어.
              </p>
            </div>
          ) : (
            <form onSubmit={handleMagicLink} className="mt-6 space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-card border border-border bg-surface-1 px-4 py-3 text-body outline-none focus:border-brand"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-card bg-brand py-3 text-h3 text-white shadow-card disabled:opacity-40"
              >
                {loading ? "보내는 중…" : "매직 링크 받기"}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-white/80" />
      <span>{children}</span>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LineChart, Sparkles, Wallet } from "lucide-react";
import t from "@/locales/ko.json";

const CLASSES = [
  {
    id: "chartist",
    icon: LineChart,
    title: t.onboarding.class_chartist,
    desc: "차트와 지표로 타이밍을 잡는 스타일.",
    color: "text-brand",
  },
  {
    id: "value_investor",
    icon: Wallet,
    title: t.onboarding.class_value,
    desc: "기업의 가치를 보고 길게 가져가는 스타일.",
    color: "text-bullish",
  },
  {
    id: "momentum_trader",
    icon: Sparkles,
    title: t.onboarding.class_momentum,
    desc: "추세와 거래량 변화를 빠르게 따라가는 스타일.",
    color: "text-energy",
  },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [name, setName] = useState("");
  const [klass, setKlass] = useState<(typeof CLASSES)[number]["id"] | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate() {
    if (!name || !klass) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/character/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, class: klass }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push("/");
    } catch (e) {
      console.error(e);
      alert(t.errors.generic);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-surface-2/30 px-5">
      <div className="w-full max-w-xl rounded-card border border-border bg-surface-0 p-8 shadow-elevated lg:p-12">
        {/* 진행 점 */}
        <div className="mb-6 flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`h-1.5 w-8 rounded-full transition ${
                i <= step ? "bg-brand" : "bg-surface-2"
              }`}
            />
          ))}
        </div>

        {step === 0 && (
          <section className="animate-in-soft text-center">
            <div className="mb-4 text-5xl">👋</div>
            <h1 className="text-display mb-3">{t.onboarding.welcome_title}</h1>
            <p className="mb-8 whitespace-pre-line text-body text-text-2">
              {t.onboarding.welcome_body}
            </p>
            <button
              onClick={() => setStep(1)}
              className="w-full rounded-card bg-brand py-4 text-h3 text-white shadow-card hover:opacity-90"
            >
              {t.onboarding.start_cta}
            </button>
          </section>
        )}

        {step === 1 && (
          <section className="animate-in-soft">
            <h2 className="mb-5 text-h1">{t.onboarding.pick_class_title}</h2>
            <ul className="grid gap-3">
              {CLASSES.map((c) => {
                const Icon = c.icon;
                const active = klass === c.id;
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => setKlass(c.id)}
                      className={`flex w-full items-center gap-4 rounded-card border p-5 text-left transition ${
                        active ? "border-brand bg-brand/5" : "border-border bg-surface-1 hover:border-brand/50"
                      }`}
                    >
                      <Icon className={`h-8 w-8 shrink-0 ${c.color}`} />
                      <div>
                        <p className="text-h3">{c.title}</p>
                        <p className="text-caption text-text-2">{c.desc}</p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
            <button
              disabled={!klass}
              onClick={() => setStep(2)}
              className="mt-6 w-full rounded-card bg-brand py-4 text-h3 text-white shadow-card disabled:opacity-40"
            >
              다음
            </button>
          </section>
        )}

        {step === 2 && (
          <section className="animate-in-soft">
            <h2 className="mb-5 text-h1">캐릭터 이름을 정해 줘</h2>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.onboarding.name_placeholder}
              className="mb-4 w-full rounded-card border border-border bg-surface-1 px-4 py-4 text-h3 outline-none focus:border-brand"
              maxLength={16}
              autoFocus
            />
            <button
              disabled={!name || submitting}
              onClick={handleCreate}
              className="w-full rounded-card bg-brand py-4 text-h3 text-white shadow-card disabled:opacity-40"
            >
              {submitting ? "생성 중…" : t.onboarding.create_cta}
            </button>
            <button
              onClick={() => setStep(1)}
              className="mt-3 w-full text-caption text-text-2 hover:text-brand"
            >
              ← 이전 단계로
            </button>
          </section>
        )}
      </div>
    </main>
  );
}

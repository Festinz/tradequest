"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";

type Skill = {
  id: string;
  name: string;
  branch: string;
  description: string | null;
  content_json: {
    intro?: string;
    concept?: string;
    exercise?: string;
    quiz?: {
      question: string;
      choices: string[];
      answer_index: number;
      explain: string;
    };
  } | null;
};

const STEPS = ["intro", "concept", "exercise", "quiz"] as const;
const STEP_LABEL = {
  intro: "도입",
  concept: "개념",
  exercise: "연습",
  quiz: "퀴즈",
} as const;

export default function SkillLessonClient({ skill }: { skill: Skill }) {
  const router = useRouter();
  const [step, setStep] = useState<(typeof STEPS)[number]>("intro");
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [completing, setCompleting] = useState(false);
  const c = skill.content_json ?? {};

  async function complete() {
    setCompleting(true);
    try {
      await fetch("/api/skills/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ skill_id: skill.id, quiz_score: pickedIndex === c.quiz?.answer_index ? 100 : 50 }),
      });
      router.push("/skills");
    } finally {
      setCompleting(false);
    }
  }

  return (
    <main className="mx-auto min-h-dvh max-w-md bg-surface-0 px-5 py-6">
      <Link href="/skills" className="mb-4 inline-flex items-center gap-1 text-caption text-text-2">
        <ArrowLeft className="h-4 w-4" /> 스킬 트리로
      </Link>

      <header className="mb-5">
        <span className="rounded-chip bg-brand/10 px-2 py-0.5 text-caption text-brand">
          {skill.branch}
        </span>
        <h1 className="mt-1 text-h1">{skill.name}</h1>
        {skill.description && <p className="text-caption text-text-2">{skill.description}</p>}
      </header>

      {/* 4단계 탭 */}
      <ul className="mb-5 flex gap-2">
        {STEPS.map((s) => (
          <li key={s} className="flex-1">
            <button
              onClick={() => setStep(s)}
              className={`w-full rounded-card py-2 text-caption ${
                step === s ? "bg-brand text-white" : "bg-surface-1 text-text-2"
              }`}
            >
              {STEP_LABEL[s]}
            </button>
          </li>
        ))}
      </ul>

      <article className="min-h-48 rounded-card border border-border bg-surface-1 p-5 text-body">
        {step === "intro" && (c.intro ?? "도입 내용 준비 중")}
        {step === "concept" && (c.concept ?? "개념 내용 준비 중")}
        {step === "exercise" && (c.exercise ?? "연습 문제 준비 중")}
        {step === "quiz" && c.quiz ? (
          <div>
            <p className="mb-3 font-semibold">{c.quiz.question}</p>
            <ul className="space-y-2">
              {c.quiz.choices.map((choice, i) => {
                const isCorrect = i === c.quiz!.answer_index;
                const isPicked = i === pickedIndex;
                return (
                  <li key={i}>
                    <button
                      disabled={submitted}
                      onClick={() => setPickedIndex(i)}
                      className={`w-full rounded-card border px-4 py-3 text-left ${
                        submitted
                          ? isCorrect
                            ? "border-bullish bg-bullish/10"
                            : isPicked
                              ? "border-bearish bg-bearish/10"
                              : "border-border"
                          : isPicked
                            ? "border-brand bg-brand/5"
                            : "border-border"
                      }`}
                    >
                      {i + 1}) {choice}
                    </button>
                  </li>
                );
              })}
            </ul>
            {!submitted ? (
              <button
                disabled={pickedIndex === null}
                onClick={() => setSubmitted(true)}
                className="mt-4 w-full rounded-card bg-brand py-3 text-h3 text-white disabled:opacity-40"
              >
                정답 확인
              </button>
            ) : (
              <div className="mt-4 space-y-3">
                <p className="text-caption text-text-2">{c.quiz.explain}</p>
                <button
                  onClick={complete}
                  disabled={completing}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-card bg-bullish py-3 text-h3 text-white shadow-card disabled:opacity-40"
                >
                  {completing ? "저장 중..." : <><CheckCircle2 className="h-5 w-5" /> 학습 완료 +30 EXP</>}
                </button>
              </div>
            )}
          </div>
        ) : null}
      </article>

      {step !== "quiz" && (
        <button
          onClick={() => setStep(STEPS[STEPS.indexOf(step) + 1])}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-card bg-brand py-3 text-h3 text-white shadow-card"
        >
          <Sparkles className="h-4 w-4" /> 다음
        </button>
      )}
    </main>
  );
}

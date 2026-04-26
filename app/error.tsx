"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * App Router 글로벌 에러 바운더리.
 * 개발 중 ConsoleError 정체를 콘솔에 그대로 띄우고, 사용자에겐 친절한 화면.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 개발자가 보기 좋게 풀어서 출력
    console.error("[TradeQuest GlobalError]", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      digest: error.digest,
    });
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center bg-surface-0 px-5 text-center">
      <div className="mb-4 text-6xl">😵</div>
      <h1 className="text-h1 mb-2">잠깐 문제가 생겼어</h1>
      <p className="mb-2 max-w-sm text-body text-text-2">
        페이지를 그리는 중 에러가 났어. 다시 시도해 봐.
      </p>
      {process.env.NODE_ENV === "development" && (
        <pre className="mb-4 max-h-48 max-w-md overflow-auto rounded-card border border-bearish/30 bg-bearish/5 p-3 text-left text-caption">
          {error.message}
          {error.stack && "\n\n" + error.stack.split("\n").slice(0, 5).join("\n")}
        </pre>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => reset()}
          className="rounded-card bg-brand px-6 py-3 text-body text-white shadow-card hover:opacity-90"
        >
          다시 시도
        </button>
        <Link
          href="/"
          className="rounded-card border border-border bg-surface-1 px-6 py-3 text-body text-text-2 hover:border-brand"
        >
          홈으로
        </Link>
      </div>
    </main>
  );
}

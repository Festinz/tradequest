import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center bg-surface-0 px-5 text-center">
      <div className="mb-4 text-6xl">🧭</div>
      <h1 className="text-h1 mb-2">길을 잃었어</h1>
      <p className="mb-6 text-body text-text-2">
        이 페이지는 아직 만들어지지 않았거나 옮겨졌어.
      </p>
      <Link
        href="/"
        className="rounded-card bg-brand px-6 py-3 text-body text-white shadow-card hover:opacity-90"
      >
        홈으로 돌아가기
      </Link>
    </main>
  );
}

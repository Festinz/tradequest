import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadInsights } from "@/lib/insights/load";
import AppShell from "@/components/AppShell";
import InsightFeed from "@/components/insights/InsightFeed";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { insights, positionCount } = await loadInsights(supabase, user.id);

  return (
    <AppShell active="/insights">
      <p className="mb-2 text-caption text-text-3">
        <span className="hover:text-text-2">홈</span> / 인사이트
      </p>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="mb-1 text-h1">인사이트 피드</h1>
          <p className="text-body text-text-2">
            {positionCount === 0
              ? "보유 종목이 아직 없어. 매매를 시작하면 분석 신호가 떠."
              : `현재 발동 중인 분석 신호 ${insights.length}건. Skills.md §4 의 INS 규칙 12개 기준.`}
          </p>
        </div>
        <p className="text-caption text-text-3">
          ⚙ 결정적 규칙 · 동일 입력 → 동일 출력
        </p>
      </div>

      <InsightFeed insights={insights} />

      {insights.length > 0 && (
        <p className="mt-8 text-center text-caption text-text-3">
          분석 규칙은 <code className="text-text-2">Skills.md §4</code> 에 선언적으로
          정의됨. 새 규칙 추가는{" "}
          <code className="text-text-2">lib/skills/registry.ts</code> 에 등록.
        </p>
      )}
    </AppShell>
  );
}

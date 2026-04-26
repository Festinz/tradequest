import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import SkillLessonClient from "./SkillLessonClient";
import AppShell from "@/components/AppShell";

export default async function SkillLessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: skill } = await supabase
    .from("skills")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!skill) {
    return (
      <AppShell active="/skills">
        <Link
          href="/skills"
          className="mb-4 inline-flex items-center gap-1 text-caption text-text-2 hover:text-brand"
        >
          <ArrowLeft className="h-4 w-4" /> 스킬 트리로
        </Link>
        <div className="max-w-2xl rounded-card border border-energy/30 bg-energy/5 p-6">
          <h1 className="text-h1 mb-3">아직 준비 중인 스킬이야</h1>
          <p className="text-body text-text-2">
            이 스킬의 콘텐츠가 아직 생성되지 않았어. <br />
            터미널에서 <code className="rounded bg-surface-2 px-1.5 py-0.5">pnpm seed:skills</code> 를 실행하면 채워져.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell active="/skills">
      <Link
        href="/skills"
        className="mb-4 inline-flex items-center gap-1 text-caption text-text-2 hover:text-brand"
      >
        <ArrowLeft className="h-4 w-4" /> 스킬 트리로
      </Link>
      <div className="mx-auto max-w-3xl">
        <SkillLessonClient skill={skill} />
      </div>
    </AppShell>
  );
}

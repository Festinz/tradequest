import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** POST /api/skills/complete  body: { skill_id, quiz_score? } */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const { skill_id, quiz_score } = (await req.json()) as {
    skill_id: string;
    quiz_score?: number;
  };

  const { data: existing } = await supabase
    .from("user_skills")
    .select("completed_at")
    .eq("user_id", user.id)
    .eq("skill_id", skill_id)
    .maybeSingle();

  await supabase.from("user_skills").upsert(
    {
      user_id: user.id,
      skill_id,
      completed_at: new Date().toISOString(),
      quiz_score: quiz_score ?? null,
    },
    { onConflict: "user_id,skill_id" }
  );

  let exp = 0;
  if (!existing?.completed_at) {
    exp = 100;
    await supabase.rpc("add_exp", { p_user_id: user.id, p_amount: exp });
  }

  // 학습 시간 5분 퀘스트 진행 (단순화: 스킬 1개 완료 시 인정)
  const today = new Date().toISOString().slice(0, 10);
  await supabase.rpc("ensure_daily_missions", { p_user_id: user.id, p_date: today });
  await supabase
    .from("daily_missions")
    .update({ status: "done", done_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("date", today)
    .eq("code", "study_5min")
    .eq("status", "todo");

  return NextResponse.json({ ok: true, exp });
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** GET /api/quests/today — 오늘 퀘스트 자동 생성 후 조회 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const today = new Date().toISOString().slice(0, 10);

  await supabase.rpc("ensure_daily_missions", { p_user_id: user.id, p_date: today });
  await supabase.rpc("touch_streak", { p_user_id: user.id, p_date: today });

  const { data } = await supabase
    .from("daily_missions")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", today)
    .order("exp_reward");

  return NextResponse.json(data ?? []);
}

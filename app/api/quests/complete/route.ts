import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** POST /api/quests/complete  body: { code } */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const { code } = (await req.json()) as { code: string };
  if (!code) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const today = new Date().toISOString().slice(0, 10);

  // 이미 완료된 건 무시
  const { data: existing } = await supabase
    .from("daily_missions")
    .select("id, status, exp_reward")
    .eq("user_id", user.id)
    .eq("date", today)
    .eq("code", code)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: "quest_not_found" }, { status: 404 });
  }
  if (existing.status === "done") {
    return NextResponse.json({ ok: true, alreadyDone: true });
  }

  await supabase
    .from("daily_missions")
    .update({ status: "done", done_at: new Date().toISOString() })
    .eq("id", existing.id);

  await supabase.rpc("add_exp", {
    p_user_id: user.id,
    p_amount: existing.exp_reward,
  });

  return NextResponse.json({ ok: true, exp: existing.exp_reward });
}

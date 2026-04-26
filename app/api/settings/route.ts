import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/settings  → 본인 설정 조회 (없으면 기본값으로 생성)
 * PATCH /api/settings → 부분 업데이트 (kis_personal_mode, default_market 등)
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  let { data } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) {
    const { data: created } = await supabase
      .from("user_settings")
      .insert({ user_id: user.id })
      .select("*")
      .single();
    data = created;
  }

  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const body = (await req.json()) as Partial<{
    kis_personal_mode: boolean;
    default_market: string;
    ui_theme: string;
  }>;

  const { data, error } = await supabase
    .from("user_settings")
    .upsert(
      { user_id: user.id, ...body, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    )
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

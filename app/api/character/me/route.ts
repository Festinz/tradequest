import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** GET /api/character/me — 본인 캐릭터 + 스탯 한방 조회 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const { data: character } = await supabase
    .from("characters")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({ character, email: user.email });
}

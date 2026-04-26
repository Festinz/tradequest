import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Supabase 매직 링크 콜백.
 * - 코드 → 세션 교환 후 onboarding/holding 으로 분기
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);

    // 캐릭터가 없는 신규 유저는 온보딩으로
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: char } = await supabase
        .from("characters")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!char) {
        return NextResponse.redirect(`${origin}/onboarding`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/`);
}

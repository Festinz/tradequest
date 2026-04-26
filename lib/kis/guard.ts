import { createClient } from "@/lib/supabase/server";

/**
 * KIS API 호출 가드 — kis_personal_mode = true 일 때만 통과
 * - 약관상 본인 계좌만 사용 가능 → 다른 사람이 같은 배포본을 쓰면 안 됨
 * - 설정 페이지에서 토글 가능
 */
export async function assertKisPersonalMode() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: 401, error: "auth_required" } as const;

  const { data: settings } = await supabase
    .from("user_settings")
    .select("kis_personal_mode")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!settings?.kis_personal_mode) {
    return {
      ok: false,
      status: 403,
      error: "kis_disabled",
      message:
        "KIS 개인 모드가 꺼져있어. 프로필 → 설정에서 켜야 해. (KIS 약관: 본인 계좌만 사용)",
    } as const;
  }

  return { ok: true, userId: user.id } as const;
}

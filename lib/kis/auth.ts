import { createClient } from "@/lib/supabase/server";

/**
 * 한국투자증권 OAuth 토큰 발급 + 캐시.
 * - KIS 는 토큰 발급을 1분에 1회로 제한 → 반드시 캐시 필요
 * - 만료 5분 전부터 갱신 시도
 * - kis_tokens 테이블에 환경(real/paper)별로 1행 유지
 *
 * 환경변수:
 *  KIS_BASE_URL          (실전: https://openapi.koreainvestment.com:9443)
 *  KIS_APP_KEY
 *  KIS_APP_SECRET
 *  KIS_ENV               'real' | 'paper'
 */

type KisEnv = "real" | "paper";

const REFRESH_BUFFER_MS = 5 * 60 * 1000;

export async function getKisAccessToken(): Promise<string> {
  const env = (process.env.KIS_ENV ?? "paper") as KisEnv;
  const supabase = await createClient();

  const { data: cached } = await supabase
    .from("kis_tokens")
    .select("access_token, expires_at")
    .eq("env", env)
    .maybeSingle();

  if (cached && new Date(cached.expires_at).getTime() - Date.now() > REFRESH_BUFFER_MS) {
    return cached.access_token;
  }

  return await issueAndCacheToken(env, supabase);
}

async function issueAndCacheToken(
  env: KisEnv,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<string> {
  const baseUrl = process.env.KIS_BASE_URL!;
  const res = await fetch(`${baseUrl}/oauth2/tokenP`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      appkey: process.env.KIS_APP_KEY,
      appsecret: process.env.KIS_APP_SECRET,
    }),
  });

  if (!res.ok) {
    throw new Error(`KIS token issue failed: ${res.status} ${await res.text()}`);
  }

  const json = (await res.json()) as {
    access_token: string;
    token_type: string;
    expires_in: number;
  };

  const expiresAt = new Date(Date.now() + json.expires_in * 1000).toISOString();

  await supabase.from("kis_tokens").upsert(
    {
      env,
      access_token: json.access_token,
      expires_at: expiresAt,
    },
    { onConflict: "env" }
  );

  return json.access_token;
}

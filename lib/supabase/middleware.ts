import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Next.js middleware 에서 Supabase 세션을 갱신.
 * App Router 환경에서 cookie refresh 누락을 방지한다.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 세션 갱신 트리거 (반드시 호출되어야 함)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 인증이 필요한 보호된 경로 → 로그인 페이지로 리다이렉트
  const protectedPaths = ["/skills", "/trade", "/portfolio", "/profile"];
  const isProtected = protectedPaths.some((p) =>
    request.nextUrl.pathname.startsWith(p)
  );
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}

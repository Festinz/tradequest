import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Server Components / Route Handlers / Server Actions 용 Supabase 클라이언트.
 * 사용 예: const supabase = await createClient(); const { data } = await supabase.from('...').select();
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component 에서 호출되었을 때는 set 이 무시되어도 OK.
            // middleware 에서 갱신해 주기 때문.
          }
        },
      },
    }
  );
}

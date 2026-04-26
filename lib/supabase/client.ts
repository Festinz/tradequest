"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * 브라우저 환경용 Supabase 클라이언트.
 * 사용 예: const supabase = createClient(); const { data } = await supabase.from('...').select();
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

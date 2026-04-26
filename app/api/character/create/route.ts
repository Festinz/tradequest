import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** 캐릭터 생성 (온보딩 마지막 단계). */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  const body = (await req.json()) as {
    name?: string;
    class?: "chartist" | "value_investor" | "momentum_trader";
  };

  if (!body.name || !body.class) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  // profiles upsert
  await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      display_name: body.name,
    },
    { onConflict: "user_id" }
  );

  const { error } = await supabase.from("characters").insert({
    user_id: user.id,
    name: body.name,
    class: body.class,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

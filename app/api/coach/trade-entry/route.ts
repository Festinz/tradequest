import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callClaude, CLAUDE_MODELS } from "@/lib/claude/client";
import { tradeEntryCoachPrompt } from "@/lib/claude/prompts";

const DAILY_LIMIT = 30;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  // 일일 호출 한도 체크
  const today = new Date().toISOString().slice(0, 10);
  const { count } = await supabase
    .from("ai_messages")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("kind", "trade_entry_coach")
    .gte("created_at", `${today}T00:00:00Z`);

  if ((count ?? 0) >= DAILY_LIMIT) {
    return NextResponse.json({ error: "daily_limit" }, { status: 429 });
  }

  const body = (await req.json()) as Parameters<typeof tradeEntryCoachPrompt>[0];
  if (!body?.reason || !body.ticker) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const { system, user: userPrompt } = tradeEntryCoachPrompt(body);
  const result = await callClaude({
    model: CLAUDE_MODELS.HAIKU,
    system,
    user: userPrompt,
    maxTokens: 350,
    temperature: 0.6,
  });

  await supabase.from("ai_messages").insert({
    user_id: user.id,
    kind: "trade_entry_coach",
    model: CLAUDE_MODELS.HAIKU,
    prompt_tokens: result.usage?.input_tokens,
    completion_tokens: result.usage?.output_tokens,
    request_payload: body,
    response_text: result.text,
  });

  return NextResponse.json({ text: result.text });
}

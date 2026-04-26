import Anthropic from "@anthropic-ai/sdk";

/**
 * Claude API 클라이언트.
 * - Haiku: 일반 코칭/퀴즈 채점/브리핑 (저비용, 빠름)
 * - Sonnet: 주간 회고 (월 1~4회만 호출)
 */
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export const CLAUDE_MODELS = {
  HAIKU: "claude-haiku-4-5-20251001",
  SONNET: "claude-sonnet-4-6",
} as const;

export type ClaudeModel = (typeof CLAUDE_MODELS)[keyof typeof CLAUDE_MODELS];

/** 가벼운 호출 헬퍼 (단일 메시지 → 텍스트). */
export async function callClaude(opts: {
  model: ClaudeModel;
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}) {
  const res = await anthropic.messages.create({
    model: opts.model,
    max_tokens: opts.maxTokens ?? 600,
    temperature: opts.temperature ?? 0.7,
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
  });

  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  return {
    text,
    usage: res.usage,
  };
}

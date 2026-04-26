/**
 * 스킬 콘텐츠 자동 생성 스크립트 (1회 실행).
 * - docs/02-skill-tree-content.md 의 20개 스킬 정의 → Claude Haiku 로 4섹션 콘텐츠 생성
 * - 결과를 content/skills/<id>.json 으로 저장 + Supabase 의 skills.content_json 에 upsert
 *
 * 실행:
 *   pnpm tsx scripts/generate-skill-content.ts
 */

import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

type SkillSeed = {
  id: string;
  branch: "chart" | "fundamental" | "psychology" | "capstone" | "boss";
  name: string;
  description: string;
  required_level: number;
  prerequisite_id: string | null;
  position_x: number;
  position_y: number;
};

const SKILLS: SkillSeed[] = [
  // 차트 (5)
  { id: "ch_basics",  branch: "chart", name: "캔들 기초",     description: "양봉/음봉/꼬리 읽기.", required_level: 1, prerequisite_id: null,            position_x: 0, position_y: 0 },
  { id: "ch_ma",      branch: "chart", name: "이동평균선",     description: "5/20/60일선의 의미.",   required_level: 2, prerequisite_id: "ch_basics",     position_x: 1, position_y: 0 },
  { id: "ch_rsi",     branch: "chart", name: "RSI",            description: "과매수/과매도 판별.",   required_level: 4, prerequisite_id: "ch_ma",         position_x: 2, position_y: 0 },
  { id: "ch_macd",    branch: "chart", name: "MACD",           description: "추세 전환 신호.",       required_level: 6, prerequisite_id: "ch_rsi",        position_x: 3, position_y: 0 },
  { id: "ch_volume",  branch: "chart", name: "거래량",         description: "가격과 거래량의 관계.", required_level: 5, prerequisite_id: "ch_ma",         position_x: 2, position_y: 1 },
  // 재무 (4)
  { id: "fd_per",     branch: "fundamental", name: "PER 이해",  description: "주가 대비 이익.",      required_level: 1, prerequisite_id: null,            position_x: 0, position_y: 2 },
  { id: "fd_pbr",     branch: "fundamental", name: "PBR / ROE", description: "장부가와 자본 수익성.", required_level: 3, prerequisite_id: "fd_per",        position_x: 1, position_y: 2 },
  { id: "fd_dcf",     branch: "fundamental", name: "DCF 입문",  description: "현금흐름 할인.",       required_level: 7, prerequisite_id: "fd_pbr",        position_x: 2, position_y: 2 },
  { id: "fd_news",    branch: "fundamental", name: "공시 읽기", description: "DART 1줄 요약법.",    required_level: 4, prerequisite_id: "fd_per",        position_x: 1, position_y: 3 },
  // 심리 (3)
  { id: "ps_loss",    branch: "psychology", name: "손절의 기술",  description: "손절선과 감정 분리.", required_level: 2, prerequisite_id: null,            position_x: 0, position_y: 4 },
  { id: "ps_fomo",    branch: "psychology", name: "FOMO 다루기",  description: "추격 매수의 비용.",   required_level: 4, prerequisite_id: "ps_loss",       position_x: 1, position_y: 4 },
  { id: "ps_journal", branch: "psychology", name: "매매 일지",    description: "기록이 만드는 변화.", required_level: 1, prerequisite_id: null,            position_x: 0, position_y: 5 },
  // 캡스톤 + 보스 (각 1)
  { id: "cap_strategy",      branch: "capstone", name: "나만의 전략",     description: "3브랜치 종합 캡스톤.",  required_level: 10, prerequisite_id: "ch_macd",       position_x: 4, position_y: 1 },
  { id: "boss_market_crash", branch: "boss",     name: "급락장 보스",     description: "급락장 시뮬 + 회고.",    required_level: 12, prerequisite_id: "cap_strategy",  position_x: 5, position_y: 1 },
];

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function generateContent(skill: SkillSeed) {
  const system = `너는 일반인을 위한 한국 주식 학습 콘텐츠 작가야.
출력은 항상 JSON 만:
{
  "intro": "1~2문장 도입",
  "concept": "150자 내 핵심 개념 설명",
  "exercise": "사용자가 실제로 해 볼 1개의 미니 연습",
  "quiz": { "question": "...", "choices": ["A","B","C","D"], "answer_index": 0, "explain": "..." }
}
한국어 반말. 비유 1개 이상 포함.`;
  const user = `스킬: ${skill.name}\n설명: ${skill.description}\n브랜치: ${skill.branch}`;

  const res = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    temperature: 0.7,
    system,
    messages: [{ role: "user", content: user }],
  });

  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  const json = JSON.parse(stripCodeFence(text));
  return json;
}

function stripCodeFence(s: string) {
  return s.replace(/```json\n?|```/g, "").trim();
}

async function main() {
  const dir = path.join(process.cwd(), "content", "skills");
  await fs.mkdir(dir, { recursive: true });

  for (const skill of SKILLS) {
    process.stdout.write(`▶ ${skill.id} (${skill.name}) ... `);
    try {
      const content = await generateContent(skill);
      await fs.writeFile(
        path.join(dir, `${skill.id}.json`),
        JSON.stringify(content, null, 2),
        "utf-8"
      );

      const { error } = await supabase.from("skills").upsert({
        ...skill,
        content_json: content,
      });
      if (error) throw error;
      console.log("OK");
    } catch (e) {
      console.error("FAIL", e);
    }
    // KIS 호출 아니므로 간단 sleep 만
    await new Promise((r) => setTimeout(r, 600));
  }

  console.log("✅ done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

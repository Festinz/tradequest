/**
 * 트로피 시드.
 *   pnpm tsx scripts/seed-trophies.ts
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// .env.local → .env 순으로 우선 로드 (Next.js 와 동일 동작)
config({ path: ".env.local" });
config({ path: ".env" });

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ .env.local 에 NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 설정되어 있지 않아요.");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TROPHIES = [
  // 입문
  { id: "first_trade",   name: "첫 매매",       description: "처음으로 매수 또는 매도를 했어.", tier: "common",    hidden: false },
  { id: "first_profit",  name: "첫 수익",       description: "첫 청산에서 플러스를 봤어.",       tier: "common",    hidden: false },
  { id: "first_loss",    name: "첫 손절",       description: "감정 없이 손절을 끝냈어.",         tier: "rare",      hidden: false },
  // 출석
  { id: "streak_3",      name: "3일 연속",      description: "3일 연속 출석.",                   tier: "common",    hidden: false },
  { id: "streak_7",      name: "7일 연속",      description: "7일 연속 출석.",                   tier: "rare",      hidden: false },
  { id: "streak_30",     name: "30일 연속",     description: "30일 연속 출석.",                  tier: "epic",      hidden: false },
  // 학습
  { id: "skill_chart",   name: "차트 마스터",   description: "차트 브랜치 5개 스킬 완료.",       tier: "epic",      hidden: false },
  { id: "skill_fund",    name: "재무 마스터",   description: "재무 브랜치 4개 스킬 완료.",       tier: "epic",      hidden: false },
  { id: "skill_psy",     name: "멘탈 마스터",   description: "심리 브랜치 3개 스킬 완료.",       tier: "epic",      hidden: false },
  { id: "lv10",          name: "Lv.10 도달",    description: "레벨 10 달성.",                    tier: "rare",      hidden: false },
  { id: "lv20",          name: "Lv.20 도달",    description: "레벨 20 달성.",                    tier: "epic",      hidden: false },
  // 매매 스타일
  { id: "patient_holder", name: "인내의 트레이더", description: "한 종목을 30일 이상 보유.",    tier: "rare",      hidden: false },
  { id: "small_size",     name: "리스크 매니저",   description: "10번 매매 동안 단일 종목 30% 미만 유지.", tier: "epic", hidden: false },
  // 히든
  { id: "loss_recovery",  name: "회복 탄력성",   description: "큰 손실 후에도 7일 연속 출석.",    tier: "legendary", hidden: true },
  { id: "boss_clear",     name: "급락장 보스 클리어", description: "보스 시뮬레이션 통과.",       tier: "legendary", hidden: true },
];

async function main() {
  const { error } = await supabase.from("trophies").upsert(TROPHIES);
  if (error) {
    console.error(error);
    process.exit(1);
  }
  console.log(`✅ seeded ${TROPHIES.length} trophies`);
}

main();

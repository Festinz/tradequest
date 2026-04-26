/** 종목 마스터 시드 (KOSPI 상위 + KOSDAQ 일부). */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

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

const STOCKS = [
  { ticker: "005930", name: "삼성전자",     market: "KOSPI",  sector: "반도체" },
  { ticker: "000660", name: "SK하이닉스",   market: "KOSPI",  sector: "반도체" },
  { ticker: "035420", name: "NAVER",        market: "KOSPI",  sector: "인터넷" },
  { ticker: "035720", name: "카카오",        market: "KOSPI",  sector: "인터넷" },
  { ticker: "005380", name: "현대차",        market: "KOSPI",  sector: "자동차" },
  { ticker: "051910", name: "LG화학",        market: "KOSPI",  sector: "화학" },
  { ticker: "207940", name: "삼성바이오로직스", market: "KOSPI", sector: "바이오" },
  { ticker: "068270", name: "셀트리온",      market: "KOSPI",  sector: "바이오" },
  { ticker: "373220", name: "LG에너지솔루션", market: "KOSPI", sector: "이차전지" },
  { ticker: "247540", name: "에코프로비엠",  market: "KOSDAQ", sector: "이차전지" },
  { ticker: "293490", name: "카카오게임즈",  market: "KOSDAQ", sector: "게임" },
  { ticker: "041510", name: "에스엠",        market: "KOSDAQ", sector: "엔터테인먼트" },
];

async function main() {
  const { error } = await supabase.from("stocks").upsert(STOCKS);
  if (error) {
    console.error(error);
    process.exit(1);
  }
  console.log(`✅ seeded ${STOCKS.length} stocks`);
}

main();

/**
 * Claude 프롬프트 빌더 모음.
 * 모든 프롬프트는 한국어 반말, 개인 학습 코치 톤.
 * — 상세한 가이드는 docs/04-ai-tutor-prompts.md 참고.
 */

const COMMON_PERSONA = `너는 TradeQuest 의 개인 트레이딩 코치야.
대상은 한국 주식을 처음 배우는 일반인이고, 모의투자로 학습 중이야.
원칙:
- 반말, 친근하게. 너무 길지 않게.
- 정답을 바로 주기보다 스스로 생각하도록 유도.
- 절대 특정 종목의 매수/매도를 단정적으로 권하지 않는다.
- 손절을 부정적인 일로 만들지 말고, 학습 신호로 다룬다.
- 한국 시장 컨벤션: 빨강=상승, 파랑=하락.`;

/** 1. 매매 진입 근거 코칭 (버튼 트리거). */
export function tradeEntryCoachPrompt(input: {
  ticker: string;
  side: "buy" | "sell";
  price: number;
  reason: string;
  recentClose?: number[];
}) {
  return {
    system: `${COMMON_PERSONA}\n역할: 매매 진입 직전, 사용자가 작성한 진입 근거를 짧게 코칭한다.
출력 형식:
1) 한 줄 요약 (사용자의 근거를 한 문장으로 정리)
2) 잘 잡은 점 1개
3) 놓치고 있는 위험 1개
4) 다음 매매 전 체크할 질문 1개`,
    user: `종목: ${input.ticker}
방향: ${input.side === "buy" ? "매수" : "매도"}
가격: ${input.price}
사용자 진입 근거:
"""${input.reason}"""
${input.recentClose ? `최근 종가(최근→과거): ${input.recentClose.join(", ")}` : ""}`,
  };
}

/** 2. 매매 회고 (포지션 종료 후). */
export function tradeReviewPrompt(input: {
  ticker: string;
  pnlPct: number;
  holdingDays: number;
  entryReason: string;
  exitReason: string;
}) {
  return {
    system: `${COMMON_PERSONA}\n역할: 청산된 매매 1건의 회고를 도와준다.
출력 형식:
1) 결과 한 줄 (수익/손실, 보유 기간 정리)
2) 진입과 청산의 일관성 평가 1줄
3) 이 매매에서 배울 점 1개
4) 다음에 같은 상황을 만나면 시도해 볼 행동 1개`,
    user: `종목: ${input.ticker}
손익률: ${input.pnlPct.toFixed(2)}%
보유 기간: ${input.holdingDays}일
진입 근거: "${input.entryReason}"
청산 사유: "${input.exitReason}"`,
  };
}

/** 3. 매일 아침 시장 브리핑 (보유 종목 맞춤). */
export function dailyBriefingPrompt(input: {
  date: string;
  kospiChangePct: number;
  holdings: Array<{ ticker: string; name: string; pnlPct: number }>;
  topNews?: string[];
}) {
  return {
    system: `${COMMON_PERSONA}\n역할: 사용자가 아침에 읽을 1분짜리 시장 브리핑을 쓴다.
출력 형식 (전체 4문장 이내):
- 어제 시장 요약 1문장
- 보유 종목 중 주목할 1개에 대한 1문장
- 오늘 변수 1개 (이벤트/지표) 1문장
- 마음가짐 한 줄`,
    user: `날짜: ${input.date}
코스피 전일 등락률: ${input.kospiChangePct.toFixed(2)}%
보유 종목: ${input.holdings.map((h) => `${h.name}(${h.pnlPct.toFixed(1)}%)`).join(", ")}
${input.topNews ? `오늘의 주요 뉴스: ${input.topNews.join(" / ")}` : ""}`,
  };
}

/** 4. 스킬 퀴즈 채점 (Haiku, JSON 응답). */
export function quizGradePrompt(input: {
  question: string;
  choices: string[];
  correctIndex: number;
  userIndex: number;
}) {
  return {
    system: `${COMMON_PERSONA}\n역할: 객관식 퀴즈 답변을 채점하고 1줄 피드백을 준다.
응답은 JSON 으로만:
{"correct": boolean, "feedback": string}`,
    user: `문제: ${input.question}
보기:
${input.choices.map((c, i) => `${i + 1}) ${c}`).join("\n")}
정답: ${input.correctIndex + 1}번
사용자 선택: ${input.userIndex + 1}번`,
  };
}

/** 5. 주간 회고 (Sonnet, 월 4회 한정). */
export function weeklyReviewPrompt(input: {
  weekStart: string;
  weekEnd: string;
  trades: Array<{
    ticker: string;
    pnlPct: number;
    entryReason: string;
    exitReason: string;
  }>;
  questsCompleted: number;
  skillsLearned: string[];
}) {
  return {
    system: `${COMMON_PERSONA}\n역할: 한 주를 정리하는 트레이딩 코치. 다음 주의 학습 방향을 1개 제안한다.
출력 형식 (한국어, 6~10문장):
- 이번 주 한 줄 평
- 매매 패턴에서 보이는 강점
- 매매 패턴에서 보이는 약점 (감정/근거 부족 등)
- 다음 주에 집중할 스킬 1개와 그 이유
- 마지막에 격려 한 줄`,
    user: `기간: ${input.weekStart} ~ ${input.weekEnd}
매매:
${input.trades.map((t) => `- ${t.ticker} (${t.pnlPct.toFixed(1)}%) | 진입: ${t.entryReason} | 청산: ${t.exitReason}`).join("\n")}
완료한 퀘스트 수: ${input.questsCompleted}
학습한 스킬: ${input.skillsLearned.join(", ") || "없음"}`,
  };
}

/** 6. 손절 직후 위로 (감정 보호 모듈). */
export function lossComfortPrompt(input: {
  ticker: string;
  pnlPct: number;
}) {
  return {
    system: `${COMMON_PERSONA}\n역할: 손절을 마친 사용자에게 1~2문장 짧은 위로와, "이 손절은 학습"이라는 시각을 짧게 짚어준다.
설교/긴 조언 금지. 4문장 이내.`,
    user: `종목 ${input.ticker} 을 ${input.pnlPct.toFixed(1)}% 손실로 청산했어.`,
  };
}

/**
 * Skills.md §7 — 새 규칙 추가 시 등록 지점.
 * Skills.md 의 ID 와 코드의 함수를 1:1 매핑한다.
 *
 * 새 IND/INS 추가 절차:
 *   1. Skills.md 에 규칙 ID 정의 (수식, 조건, 강도)
 *   2. lib/skills/indicators.ts (또는 insights.ts) 에 함수 추가
 *   3. 이 파일의 INDICATOR_FNS / INSIGHT_EVALUATORS 에 등록
 */

import {
  bollinger,
  ema,
  historicalVolatility,
  macd,
  obv,
  rsi,
  sma,
} from "./indicators";
import type { Candle } from "./types";
import {
  evalConcentration,
  evalDeadCross,
  evalEmotionalGuard,
  evalGoldenCross,
  evalObvDivergence,
  evalOverbought,
  evalOversold,
  evalSectorBias,
  evalTrendAlignment,
  evalVolatilitySpike,
  evalVolumeSurgeDown,
  evalVolumeSurgeUp,
  type PortfolioEvalInput,
  type StockEvalInput,
} from "./insights";
import type { Insight, Severity } from "./types";
import { SEVERITY_RANK } from "./types";

/* ============================================
 * IND 레지스트리
 * 차트 옵션 등에서 동적으로 호출할 때 사용.
 * 시그니처가 제각각이라 함수 자체는 그대로 노출 (래퍼만 ID 매핑).
 * ============================================ */
export const INDICATOR_FNS = {
  "IND-001": (closes: number[], window: number) => sma(closes, window),
  "IND-002": (closes: number[], window: number) => ema(closes, window),
  "IND-003": (closes: number[], window?: number) => rsi(closes, window),
  "IND-004": (closes: number[]) => macd(closes),
  "IND-005": (closes: number[], window?: number, k?: number) =>
    bollinger(closes, window, k),
  "IND-006": (candles: Candle[]) => obv(candles),
  "IND-007": (closes: number[], window: number) =>
    historicalVolatility(closes, window),
} as const;

/* ============================================
 * INS 레지스트리 — 종목 단위
 * ============================================ */
export const STOCK_EVALUATORS: Array<(i: StockEvalInput) => Insight | null> = [
  evalOverbought,
  evalOversold,
  evalGoldenCross,
  evalDeadCross,
  evalVolumeSurgeUp,
  evalVolumeSurgeDown,
  evalObvDivergence,
  evalVolatilitySpike,
  evalTrendAlignment,
];

/* ============================================
 * INS 레지스트리 — 포트폴리오 단위
 * ============================================ */
export const PORTFOLIO_EVALUATORS: Array<
  (i: PortfolioEvalInput) => Insight | null
> = [evalConcentration, evalSectorBias, evalEmotionalGuard];

/* ============================================
 * 종합 평가 — 모든 종목 + 포트폴리오 인사이트 추출
 * Skills.md §5.3 인사이트 추출 단계 구현.
 *
 * 정렬: severity 우선순위 → 동일 severity 내에선 ticker 알파벳 순
 * 중복 제거: 같은 (rule_id, ticker) 는 1개만 (실질적으로 자연스럽게 1개)
 * ============================================ */
export function evaluateAll(args: {
  stocks: StockEvalInput[];
  portfolio: PortfolioEvalInput | null;
}): Insight[] {
  const out: Insight[] = [];

  for (const stockInput of args.stocks) {
    for (const evaluator of STOCK_EVALUATORS) {
      try {
        const ins = evaluator(stockInput);
        if (ins) out.push(ins);
      } catch {
        // 단일 평가 실패는 다른 평가에 영향 X (Skills.md §4.7 무결성)
      }
    }
  }

  if (args.portfolio) {
    for (const evaluator of PORTFOLIO_EVALUATORS) {
      try {
        const ins = evaluator(args.portfolio);
        if (ins) out.push(ins);
      } catch {
        /* swallow */
      }
    }
  }

  return out.sort((a, b) => {
    const r = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (r !== 0) return r;
    return a.ticker.localeCompare(b.ticker);
  });
}

/** Severity 별 한국어 라벨 */
export const SEVERITY_LABEL: Record<Severity, string> = {
  warning: "Warning",
  bearish: "Bearish",
  bullish: "Bullish",
  info: "Info",
};

export const SEVERITY_KO: Record<Severity, string> = {
  warning: "즉시 점검",
  bearish: "약세 신호",
  bullish: "강세 신호",
  info: "참고",
};

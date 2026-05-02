/**
 * Skills.md §1 입력 인터페이스 — 4가지 표준 타입.
 * 외부 데이터 (Naver/Yahoo/Supabase row) 는 어댑터로 이 형태로 정규화한다.
 */

export type Candle = {
  /** 'YYYY-MM-DD' 형식, 시간순 (오래된 → 최신) */
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type Stock = {
  ticker: string;
  name: string;
  market: "KOSPI" | "KOSDAQ" | "NASDAQ" | "NYSE";
  sector?: string;
  per?: number;
  pbr?: number;
  roe?: number;
  eps?: number;
  dividend_yield?: number;
};

export type Position = {
  ticker: string;
  qty: number;
  avg_price: number;
  /** 최신 종가. 시세 fetch 후 채움. */
  current_price: number;
};

export type Trade = {
  ticker: string;
  side: "buy" | "sell";
  qty: number;
  price: number;
  opened_at: string;
  closed_at?: string;
  /** 청산 후 손익률 (%) */
  pnl_pct?: number;
};

/* ============================================
 * §4 인사이트 타입
 * ============================================ */

export type Severity = "warning" | "bearish" | "bullish" | "info";

export type Insight = {
  /** 'INS-001' ~ 'INS-012' */
  rule_id: string;
  severity: Severity;
  /** 종목 단위 인사이트면 ticker, 포트폴리오 단위면 'PORTFOLIO' */
  ticker: string;
  /** 종목명 또는 섹터명 (메시지에서 사용) */
  subject: string;
  message: string;
  /** 추천 액션 (없으면 빈 문자열) */
  action: string;
  /** 발동 시각 (서버 시각). 시간 누적은 Phase 1, MVP 는 평가 시각만. */
  triggered_at: string;
};

/* ============================================
 * 헬퍼
 * ============================================ */

/** 결과 배열 길이 = 입력 배열 길이. 윈도우 미충족 구간은 null. */
export type IndicatorSeries = (number | null)[];

/** Severity 정렬 우선순위. 작을수록 위로. */
export const SEVERITY_RANK: Record<Severity, number> = {
  warning: 0,
  bearish: 1,
  bullish: 2,
  info: 3,
};

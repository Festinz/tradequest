/**
 * Skills.md §4 인사이트 평가 — INS-001 ~ INS-012.
 * 각 evaluator 는 결정적 함수. 조건 충족 시 Insight, 아니면 null.
 * 호출자가 모든 evaluator 를 모은 뒤 severity 우선순위로 정렬한다.
 */

import type {
  Candle,
  Insight,
  Position,
  Stock,
  Trade,
} from "./types";
import {
  bollinger,
  closesOf,
  ema,
  historicalVolatility,
  macd,
  obv,
  rsi,
  sma,
} from "./indicators";

const now = () => new Date().toISOString();

/* ============================================
 * 종목 단위 평가 입력
 * ============================================ */
export type StockEvalInput = {
  stock: Pick<Stock, "ticker" | "name">;
  candles: Candle[]; // 최소 60일 권장 (60-day HV, MDD 등)
};

/* ============================================
 * INS-001 과매수 경고
 * 조건: RSI > 70 AND 직전 5일 RSI 평균 ≥ 65
 * ============================================ */
export function evalOverbought(input: StockEvalInput): Insight | null {
  const { stock, candles } = input;
  const r = rsi(closesOf(candles));
  const last = r[r.length - 1];
  if (last == null || last <= 70) return null;
  // 직전 5일 RSI 평균 (마지막 포함, 마지막 5개 중 null 있으면 무시)
  const tail = r.slice(-5).filter((v): v is number => v != null);
  if (tail.length < 5) return null;
  const avg = tail.reduce((a, b) => a + b, 0) / tail.length;
  if (avg < 65) return null;

  return {
    rule_id: "INS-001",
    severity: "warning",
    ticker: stock.ticker,
    subject: stock.name,
    message: `${stock.name}의 RSI가 ${last.toFixed(1)}로 과매수 영역. 단기 조정 가능성 점검 필요.`,
    action: "익절 분할 또는 신규 매수 보류",
    triggered_at: now(),
  };
}

/* ============================================
 * INS-002 과매도 기회
 * 조건: RSI < 30 AND close < 볼린저 하단
 * ============================================ */
export function evalOversold(input: StockEvalInput): Insight | null {
  const { stock, candles } = input;
  const closes = closesOf(candles);
  const r = rsi(closes);
  const b = bollinger(closes);
  const last = candles.length - 1;
  const rLast = r[last];
  const lower = b.lower[last];
  const cLast = closes[last];
  if (rLast == null || lower == null) return null;
  if (rLast >= 30) return null;
  if (cLast >= lower) return null;

  return {
    rule_id: "INS-002",
    severity: "info",
    ticker: stock.ticker,
    subject: stock.name,
    message: `${stock.name}이 과매도(RSI ${rLast.toFixed(1)}) + 볼린저 하단 이탈. 반등 가능성 모니터링.`,
    action: "분할 매수 검토. 손절선 설정 필수",
    triggered_at: now(),
  };
}

/* ============================================
 * INS-003 골든크로스 / INS-004 데드크로스
 * 조건: 직전 5거래일 내 MACD 가 Signal 을 상향(/하향) 돌파
 * ============================================ */
function macdCross(input: StockEvalInput): "golden" | "dead" | null {
  const closes = closesOf(input.candles);
  const m = macd(closes);
  const len = closes.length;
  for (let i = Math.max(1, len - 5); i < len; i++) {
    const a0 = m.macd[i - 1];
    const a1 = m.macd[i];
    const s0 = m.signal[i - 1];
    const s1 = m.signal[i];
    if (a0 == null || a1 == null || s0 == null || s1 == null) continue;
    if (a0 <= s0 && a1 > s1) return "golden";
    if (a0 >= s0 && a1 < s1) return "dead";
  }
  return null;
}
export function evalGoldenCross(input: StockEvalInput): Insight | null {
  if (macdCross(input) !== "golden") return null;
  return {
    rule_id: "INS-003",
    severity: "bullish",
    ticker: input.stock.ticker,
    subject: input.stock.name,
    message: `${input.stock.name} MACD 골든크로스 발생. 단기 상승 모멘텀 형성 가능.`,
    action: "매수 시 진입 근거에 모멘텀 명시",
    triggered_at: now(),
  };
}
export function evalDeadCross(input: StockEvalInput): Insight | null {
  if (macdCross(input) !== "dead") return null;
  return {
    rule_id: "INS-004",
    severity: "bearish",
    ticker: input.stock.ticker,
    subject: input.stock.name,
    message: `${input.stock.name} MACD 데드크로스. 단기 약세 가능성.`,
    action: "보유 시 손절선 점검",
    triggered_at: now(),
  };
}

/* ============================================
 * INS-005 거래량 폭증 + 가격 상승
 * INS-006 거래량 폭증 + 가격 하락
 * 조건: 거래량 ≥ 20일 평균의 200%
 * ============================================ */
function volumeSurge(input: StockEvalInput): { multiple: number; up: boolean } | null {
  const { candles } = input;
  if (candles.length < 21) return null;
  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  // 직전 20일 평균 (마지막 제외)
  let sum = 0;
  for (let i = candles.length - 21; i < candles.length - 1; i++) {
    sum += candles[i].volume;
  }
  const avg = sum / 20;
  if (avg <= 0) return null;
  const multiple = last.volume / avg;
  if (multiple < 2) return null;
  return { multiple, up: last.close > prev.close };
}
export function evalVolumeSurgeUp(input: StockEvalInput): Insight | null {
  const v = volumeSurge(input);
  if (!v || !v.up) return null;
  return {
    rule_id: "INS-005",
    severity: "bullish",
    ticker: input.stock.ticker,
    subject: input.stock.name,
    message: `${input.stock.name} 평균 대비 ${v.multiple.toFixed(1)}배 거래량 + 상승. 강세 시그널.`,
    action: "",
    triggered_at: now(),
  };
}
export function evalVolumeSurgeDown(input: StockEvalInput): Insight | null {
  const v = volumeSurge(input);
  if (!v || v.up) return null;
  return {
    rule_id: "INS-006",
    severity: "warning",
    ticker: input.stock.ticker,
    subject: input.stock.name,
    message: `${input.stock.name} 평균 대비 ${v.multiple.toFixed(1)}배 거래량 + 하락. 패닉셀 가능성.`,
    action: "성급한 추격 매수 자제",
    triggered_at: now(),
  };
}

/* ============================================
 * INS-007 OBV 다이버전스
 * 조건: 직전 20일 가격은 신고가 갱신 + OBV 는 갱신 못함
 * ============================================ */
export function evalObvDivergence(input: StockEvalInput): Insight | null {
  const { candles } = input;
  if (candles.length < 21) return null;
  const window = 20;
  const last = candles.length - 1;
  const o = obv(candles);

  // 가격 신고가: 마지막 close 가 직전 (window-1)일 max 보다 큼
  let maxPrev = -Infinity;
  for (let i = last - window; i < last; i++) {
    if (candles[i].close > maxPrev) maxPrev = candles[i].close;
  }
  if (candles[last].close <= maxPrev) return null;

  // OBV 갱신 못함: 마지막 OBV ≤ 직전 (window-1)일 max
  let maxObv = -Infinity;
  for (let i = last - window; i < last; i++) {
    const v = o[i];
    if (v != null && v > maxObv) maxObv = v;
  }
  const oLast = o[last];
  if (oLast == null || oLast > maxObv) return null;

  return {
    rule_id: "INS-007",
    severity: "warning",
    ticker: input.stock.ticker,
    subject: input.stock.name,
    message: `${input.stock.name} 가격 신고가 vs OBV 약세 다이버전스. 추세 약화 신호.`,
    action: "추세 약화 점검 필요",
    triggered_at: now(),
  };
}

/* ============================================
 * INS-010 변동성 급등
 * 조건: 20일 HV > 60일 HV × 1.5
 * ============================================ */
export function evalVolatilitySpike(input: StockEvalInput): Insight | null {
  const closes = closesOf(input.candles);
  if (closes.length <= 60) return null;
  const hv20 = historicalVolatility(closes, 20);
  const hv60 = historicalVolatility(closes, 60);
  const last = closes.length - 1;
  const a = hv20[last];
  const b = hv60[last];
  if (a == null || b == null || b === 0) return null;
  const ratio = a / b;
  if (ratio < 1.5) return null;
  return {
    rule_id: "INS-010",
    severity: "warning",
    ticker: input.stock.ticker,
    subject: input.stock.name,
    message: `${input.stock.name} 최근 변동성이 평소의 ${ratio.toFixed(1)}배. 포지션 사이즈 축소 검토.`,
    action: "포지션 사이즈 축소",
    triggered_at: now(),
  };
}

/* ============================================
 * INS-012 추세 정렬 (정배열)
 * 조건: SMA(5) > SMA(20) > SMA(60)
 * ============================================ */
export function evalTrendAlignment(input: StockEvalInput): Insight | null {
  const closes = closesOf(input.candles);
  if (closes.length < 60) return null;
  const s5 = sma(closes, 5);
  const s20 = sma(closes, 20);
  const s60 = sma(closes, 60);
  const last = closes.length - 1;
  const a = s5[last];
  const b = s20[last];
  const c = s60[last];
  if (a == null || b == null || c == null) return null;
  if (!(a > b && b > c)) return null;
  return {
    rule_id: "INS-012",
    severity: "bullish",
    ticker: input.stock.ticker,
    subject: input.stock.name,
    message: `${input.stock.name} 이동평균선 정배열 (5>20>60). 중장기 상승 추세 유지.`,
    action: "추세 추종 전략 유효",
    triggered_at: now(),
  };
}

/* ============================================
 * 포트폴리오 단위 평가 입력
 * ============================================ */
export type PortfolioEvalInput = {
  positions: (Position & { name: string; sector?: string })[];
  /** 직전 5거래일의 청산 손익률 합 (% 단위, -5.0 = 5% 손실) */
  recentClosedPnlPct: number;
  /** 청산 거래 건수 (INS-011 신뢰도용) */
  recentClosedCount: number;
};

/* ============================================
 * INS-008 포트폴리오 집중 위험
 * 조건: 단일 종목이 평가금액의 30% 초과
 * ============================================ */
export function evalConcentration(input: PortfolioEvalInput): Insight | null {
  const total = input.positions.reduce(
    (s, p) => s + p.qty * p.current_price,
    0,
  );
  if (total === 0) return null;
  let max = { pct: 0, name: "", ticker: "" };
  for (const p of input.positions) {
    const v = p.qty * p.current_price;
    const pct = (v / total) * 100;
    if (pct > max.pct) max = { pct, name: p.name, ticker: p.ticker };
  }
  if (max.pct <= 30) return null;
  return {
    rule_id: "INS-008",
    severity: "warning",
    ticker: max.ticker,
    subject: max.name,
    message: `${max.name} 비중이 ${max.pct.toFixed(1)}%. 단일 종목 리스크 노출.`,
    action: "분산투자 검토",
    triggered_at: now(),
  };
}

/* ============================================
 * INS-009 섹터 편중
 * 조건: 단일 섹터가 평가금액의 50% 초과
 * ============================================ */
export function evalSectorBias(input: PortfolioEvalInput): Insight | null {
  const total = input.positions.reduce(
    (s, p) => s + p.qty * p.current_price,
    0,
  );
  if (total === 0) return null;
  const bySector = new Map<string, number>();
  for (const p of input.positions) {
    const k = p.sector ?? "기타";
    bySector.set(k, (bySector.get(k) ?? 0) + p.qty * p.current_price);
  }
  let max = { pct: 0, sector: "" };
  for (const [sector, value] of bySector) {
    const pct = (value / total) * 100;
    if (pct > max.pct) max = { pct, sector };
  }
  if (max.pct <= 50) return null;
  return {
    rule_id: "INS-009",
    severity: "info",
    ticker: "PORTFOLIO",
    subject: max.sector,
    message: `${max.sector} 섹터 편중 ${max.pct.toFixed(1)}%. 섹터 사이클 리스크.`,
    action: "섹터 분산 검토",
    triggered_at: now(),
  };
}

/* ============================================
 * INS-011 손실 누적 (감정 보호)
 * 조건: 직전 5거래일 PnL 합 < -5%
 * ============================================ */
export function evalEmotionalGuard(input: PortfolioEvalInput): Insight | null {
  if (input.recentClosedCount < 2) return null;
  if (input.recentClosedPnlPct >= -5) return null;
  return {
    rule_id: "INS-011",
    severity: "info",
    ticker: "PORTFOLIO",
    subject: "최근 매매",
    message: `최근 5일 누적 ${input.recentClosedPnlPct.toFixed(1)}%. 감정 매매 주의. 한 번 쉬어 가는 것도 전략.`,
    action: "심호흡 후 다음 매매 결정",
    triggered_at: now(),
  };
}

/* ============================================
 * 포트폴리오 단위 PnL 합 계산 헬퍼
 * (직전 5거래일 동안 청산된 trades 의 pnl_pct 합)
 * ============================================ */
export function recentClosedPnl(
  trades: Trade[],
  daysBack = 5,
): { sumPct: number; count: number } {
  const cutoff = Date.now() - daysBack * 24 * 60 * 60 * 1000;
  let sum = 0;
  let count = 0;
  for (const t of trades) {
    if (!t.closed_at || t.pnl_pct == null) continue;
    if (new Date(t.closed_at).getTime() < cutoff) continue;
    sum += t.pnl_pct;
    count++;
  }
  return { sumPct: sum, count };
}

/**
 * Skills.md §2 지표 계산 — IND-001 ~ IND-007.
 * 결정적(deterministic) 순수 함수. 동일 입력 → 동일 출력.
 * NULL 처리: 윈도우 미충족 시 null. 0 으로 채우지 않음.
 *
 * 입력: Candle[] (오래된 → 최신 정렬)
 * 출력: IndicatorSeries (입력과 동일 길이, 미충족은 null)
 */

import type { Candle, IndicatorSeries } from "./types";

/* ============================================
 * IND-001 단순이동평균 (SMA)
 * SMA(n)[t] = (close[t] + ... + close[t-n+1]) / n
 * ============================================ */
export function sma(closes: number[], window: number): IndicatorSeries {
  const out: IndicatorSeries = new Array(closes.length).fill(null);
  if (window <= 0 || closes.length < window) return out;
  let sum = 0;
  for (let i = 0; i < closes.length; i++) {
    sum += closes[i];
    if (i >= window) sum -= closes[i - window];
    if (i >= window - 1) out[i] = sum / window;
  }
  return out;
}

/* ============================================
 * IND-002 지수이동평균 (EMA)
 * EMA(n)[t] = α × close[t] + (1-α) × EMA(n)[t-1], α = 2/(n+1)
 * 시드: 첫 EMA = SMA(n)[t=n-1]
 * ============================================ */
export function ema(closes: number[], window: number): IndicatorSeries {
  const out: IndicatorSeries = new Array(closes.length).fill(null);
  if (window <= 0 || closes.length < window) return out;
  const alpha = 2 / (window + 1);

  let seed = 0;
  for (let i = 0; i < window; i++) seed += closes[i];
  out[window - 1] = seed / window;

  for (let i = window; i < closes.length; i++) {
    const prev = out[i - 1] as number;
    out[i] = alpha * closes[i] + (1 - alpha) * prev;
  }
  return out;
}

/* ============================================
 * IND-003 RSI(14)
 * RS = 평균상승폭 / 평균하락폭, RSI = 100 - 100/(1+RS)
 * Wilder smoothing 사용 (전통적인 방식).
 * ============================================ */
export function rsi(closes: number[], window = 14): IndicatorSeries {
  const out: IndicatorSeries = new Array(closes.length).fill(null);
  if (closes.length <= window) return out;

  let gainSum = 0;
  let lossSum = 0;
  for (let i = 1; i <= window; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gainSum += diff;
    else lossSum -= diff;
  }
  let avgGain = gainSum / window;
  let avgLoss = lossSum / window;

  const rs0 = avgLoss === 0 ? 100 : avgGain / avgLoss;
  out[window] = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs0);

  for (let i = window + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (window - 1) + gain) / window;
    avgLoss = (avgLoss * (window - 1) + loss) / window;
    if (avgLoss === 0) {
      out[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      out[i] = 100 - 100 / (1 + rs);
    }
  }
  return out;
}

/* ============================================
 * IND-004 MACD (12, 26, 9)
 * MACD = EMA(12) - EMA(26)
 * Signal = EMA(MACD, 9)
 * Histogram = MACD - Signal
 * ============================================ */
export type MACDResult = {
  macd: IndicatorSeries;
  signal: IndicatorSeries;
  histogram: IndicatorSeries;
};
export function macd(
  closes: number[],
  fast = 12,
  slow = 26,
  signalWindow = 9,
): MACDResult {
  const emaFast = ema(closes, fast);
  const emaSlow = ema(closes, slow);
  const macdLine: IndicatorSeries = closes.map((_, i) => {
    const f = emaFast[i];
    const s = emaSlow[i];
    return f != null && s != null ? f - s : null;
  });

  // signal = EMA(macdLine, signalWindow), null 은 건너뜀
  const signal: IndicatorSeries = new Array(closes.length).fill(null);
  const compactValues: number[] = [];
  const compactIdx: number[] = [];
  for (let i = 0; i < macdLine.length; i++) {
    const v = macdLine[i];
    if (v != null) {
      compactValues.push(v);
      compactIdx.push(i);
    }
  }
  const signalCompact = ema(compactValues, signalWindow);
  for (let k = 0; k < compactIdx.length; k++) {
    signal[compactIdx[k]] = signalCompact[k];
  }

  const histogram: IndicatorSeries = closes.map((_, i) => {
    const m = macdLine[i];
    const s = signal[i];
    return m != null && s != null ? m - s : null;
  });

  return { macd: macdLine, signal, histogram };
}

/* ============================================
 * IND-005 볼린저 밴드 (20, 2σ)
 * 중심선 = SMA(20), 상단 = 중심 + 2σ, 하단 = 중심 - 2σ
 * σ = 20일 표본 표준편차 (n 분모 사용, 모평균이 SMA 라 가정)
 * ============================================ */
export type BollingerResult = {
  middle: IndicatorSeries;
  upper: IndicatorSeries;
  lower: IndicatorSeries;
};
export function bollinger(
  closes: number[],
  window = 20,
  k = 2,
): BollingerResult {
  const middle = sma(closes, window);
  const upper: IndicatorSeries = new Array(closes.length).fill(null);
  const lower: IndicatorSeries = new Array(closes.length).fill(null);

  for (let i = window - 1; i < closes.length; i++) {
    const m = middle[i];
    if (m == null) continue;
    let varSum = 0;
    for (let j = i - window + 1; j <= i; j++) {
      const d = closes[j] - m;
      varSum += d * d;
    }
    const stdev = Math.sqrt(varSum / window);
    upper[i] = m + k * stdev;
    lower[i] = m - k * stdev;
  }

  return { middle, upper, lower };
}

/* ============================================
 * IND-006 OBV (On-Balance Volume)
 * OBV[t] = OBV[t-1] + (close 상승: +volume, 하락: -volume, 동일: 0)
 * 누적이라 윈도우 없음. 첫 값 = 0.
 * ============================================ */
export function obv(candles: Candle[]): IndicatorSeries {
  const out: IndicatorSeries = new Array(candles.length).fill(null);
  if (candles.length === 0) return out;
  out[0] = 0;
  for (let i = 1; i < candles.length; i++) {
    const prev = out[i - 1] as number;
    const dc = candles[i].close - candles[i - 1].close;
    if (dc > 0) out[i] = prev + candles[i].volume;
    else if (dc < 0) out[i] = prev - candles[i].volume;
    else out[i] = prev;
  }
  return out;
}

/* ============================================
 * IND-007 변동성 (Historical Volatility, 연환산)
 * HV = stdev(log returns) × √252
 * 입력: closes, window (20 또는 60)
 * 결과는 % 가 아닌 비율 (0.18 = 연 18%)
 * ============================================ */
export function historicalVolatility(
  closes: number[],
  window = 20,
): IndicatorSeries {
  const out: IndicatorSeries = new Array(closes.length).fill(null);
  if (closes.length <= window) return out;

  const logRet: number[] = new Array(closes.length).fill(0);
  for (let i = 1; i < closes.length; i++) {
    if (closes[i - 1] > 0 && closes[i] > 0) {
      logRet[i] = Math.log(closes[i] / closes[i - 1]);
    }
  }

  for (let i = window; i < closes.length; i++) {
    let mean = 0;
    for (let j = i - window + 1; j <= i; j++) mean += logRet[j];
    mean /= window;
    let varSum = 0;
    for (let j = i - window + 1; j <= i; j++) {
      const d = logRet[j] - mean;
      varSum += d * d;
    }
    const stdev = Math.sqrt(varSum / window);
    out[i] = stdev * Math.sqrt(252);
  }
  return out;
}

/* ============================================
 * 헬퍼: Candle[] → close 배열
 * ============================================ */
export function closesOf(candles: Candle[]): number[] {
  return candles.map((c) => c.close);
}

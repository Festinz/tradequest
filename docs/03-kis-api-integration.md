# 03 — KIS API Integration (한국투자증권)

서버리스 환경에서 안정적으로 시세를 가져오는 핵심.

## 사전 준비

1. 한국투자증권 계좌 개설 (실계좌 또는 모의계좌)
2. https://apiportal.koreainvestment.com 접속 → 앱 등록
3. **App Key / App Secret** 발급
4. 모의투자 환경 사용 권장 (개발 단계)

```env
# .env.local
KIS_APP_KEY=your_app_key
KIS_APP_SECRET=your_app_secret
KIS_ACCOUNT_NO=12345678-01
KIS_BASE_URL=https://openapivts.koreainvestment.com:29443  # 모의
# 운영: https://openapi.koreainvestment.com:9443
```

## 토큰 캐싱 (서버리스의 핵심)

KIS는 **토큰 발급 1분 1회 제한** + 토큰은 24시간 유효.
매 호출마다 발급하면 즉시 막힘 → Supabase에 캐싱 필수.

```typescript
// lib/kis/auth.ts
import { createClient } from '@/lib/supabase/server';

const KIS_BASE = process.env.KIS_BASE_URL!;

interface CachedToken {
  access_token: string;
  expires_at: string;  // ISO timestamp
}

export async function getKisToken(): Promise<string> {
  const supabase = createClient();

  // 1. 캐시 확인 (만료 5분 전이면 갱신)
  const { data: cached } = await supabase
    .from('kis_tokens')
    .select('*')
    .single();

  const fiveMinFromNow = Date.now() + 5 * 60 * 1000;
  if (cached && new Date(cached.expires_at).getTime() > fiveMinFromNow) {
    return cached.access_token;
  }

  // 2. 새 토큰 발급
  const res = await fetch(`${KIS_BASE}/oauth2/tokenP`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      appkey: process.env.KIS_APP_KEY,
      appsecret: process.env.KIS_APP_SECRET,
    }),
  });

  if (!res.ok) throw new Error(`KIS token failed: ${res.status}`);
  const { access_token, expires_in } = await res.json();

  // 3. Supabase에 upsert
  const expires_at = new Date(Date.now() + expires_in * 1000).toISOString();
  await supabase.from('kis_tokens').upsert({
    id: 1,  // 단일 row
    access_token,
    expires_at,
  });

  return access_token;
}
```

`kis_tokens` 테이블 추가:
```sql
create table kis_tokens (
  id int primary key,
  access_token text not null,
  expires_at timestamptz not null
);
```

## 현재가 조회

```typescript
// lib/kis/getCurrent.ts
export async function getCurrentPrice(symbol: string) {
  const token = await getKisToken();
  const res = await fetch(
    `${KIS_BASE}/uapi/domestic-stock/v1/quotations/inquire-price?` +
    new URLSearchParams({
      FID_COND_MRKT_DIV_CODE: 'J',
      FID_INPUT_ISCD: symbol,
    }),
    {
      headers: {
        authorization: `Bearer ${token}`,
        appkey: process.env.KIS_APP_KEY!,
        appsecret: process.env.KIS_APP_SECRET!,
        tr_id: 'FHKST01010100',
      },
    }
  );
  const data = await res.json();
  return {
    symbol,
    current: parseInt(data.output.stck_prpr),
    change: parseInt(data.output.prdy_vrss),
    changeRate: parseFloat(data.output.prdy_ctrt),
    volume: parseInt(data.output.acml_vol),
  };
}
```

## 일봉 조회

```typescript
// lib/kis/getDaily.ts
export async function getDailyChart(symbol: string, days = 100) {
  const token = await getKisToken();
  const end = formatYYYYMMDD(new Date());
  const start = formatYYYYMMDD(new Date(Date.now() - days * 24 * 3600 * 1000));

  const res = await fetch(
    `${KIS_BASE}/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice?` +
    new URLSearchParams({
      FID_COND_MRKT_DIV_CODE: 'J',
      FID_INPUT_ISCD: symbol,
      FID_INPUT_DATE_1: start,
      FID_INPUT_DATE_2: end,
      FID_PERIOD_DIV_CODE: 'D',
      FID_ORG_ADJ_PRC: '0',
    }),
    {
      headers: {
        authorization: `Bearer ${token}`,
        appkey: process.env.KIS_APP_KEY!,
        appsecret: process.env.KIS_APP_SECRET!,
        tr_id: 'FHKST03010100',
      },
    }
  );
  const data = await res.json();
  return data.output2.map((row: any) => ({
    time: row.stck_bsop_date,
    open: parseInt(row.stck_oprc),
    high: parseInt(row.stck_hgpr),
    low: parseInt(row.stck_lwpr),
    close: parseInt(row.stck_clpr),
    volume: parseInt(row.acml_vol),
  }));
}
```

## 종목 검색

KIS에 검색 API가 약함 → 종목 마스터를 미리 동기화하고 로컬에서 검색 권장.

```typescript
// scripts/sync-stocks.ts (cron 또는 일회성)
// KOSPI/KOSDAQ 종목 리스트 → stocks 테이블에 upsert
```

## TradingView Lightweight Charts 연결

```typescript
// components/Chart.tsx
'use client';
import { createChart, ColorType } from 'lightweight-charts';
import { useEffect, useRef } from 'react';

export function CandleChart({ data }: { data: any[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = createChart(ref.current, {
      layout: { background: { type: ColorType.Solid, color: 'transparent' } },
      width: ref.current.clientWidth,
      height: 320,
    });
    const series = chart.addCandlestickSeries({
      upColor: '#ef4444',     // 한국식: 상승=빨강
      downColor: '#3b82f6',   // 하락=파랑
      borderVisible: false,
    });
    series.setData(data);
    return () => chart.remove();
  }, [data]);

  return <div ref={ref} />;
}
```

`next/dynamic`으로 SSR 회피:
```typescript
const Chart = dynamic(() => import('./Chart'), { ssr: false });
```

## 레이트리밋 + 캐시 TTL

| 데이터 | 캐시 TTL | 비고 |
| ------ | -------- | ---- |
| 현재가 | 5초 (장중) / 1시간 (장외) | Vercel Edge Cache |
| 일봉 | 1시간 | 마감 후 갱신 |
| 종목 마스터 | 1일 | 새벽 cron |
| 토큰 | 24시간 - 5분 | Supabase |

## 장 시간 판단

```typescript
export function isMarketOpen(now = new Date()): boolean {
  const seoul = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  const day = seoul.getDay();
  if (day === 0 || day === 6) return false;  // 주말
  const minutes = seoul.getHours() * 60 + seoul.getMinutes();
  return minutes >= 9 * 60 && minutes <= 15 * 60 + 30;
}
```

## 미국 주식 (Phase 2)

Finnhub 무료 티어 또는 Alpha Vantage. KIS의 해외주식 API는 추가 신청 필요.

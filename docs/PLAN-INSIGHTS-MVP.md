# TradeQuest Insights — MVP 구현 계획

> 기획서(`기획서.html`) + Skills.md 의 분석 엔진 레이어를 기존 v0.2 코드 위에 얹는 작업.
> 신제품이 아니라 확장. RPG 흐름은 그대로 유지.

스코프: **MVP (1주 분량)** — Skills.md 결정적 엔진 + Top Insights 피드 + 섹터 트리맵 + Hero KPI.
Phase 1/2/3 (멀티종목 비교, 백테스트, 자연어 쿼리, 알람 등) 은 **NOT in scope**.

---

## 1. 무엇이 이미 있나 (재사용 베이스)

| 영역 | 파일 | 상태 |
|---|---|---|
| 인증 + 캐릭터 | `app/login`, `app/onboarding`, `app/api/character/*` | 동작 |
| 매매 + 포지션 | `app/api/trade/order`, `app/trade/TradeClient.tsx` | 동작 |
| 캔들 차트 | `app/api/market/candles/route.ts` (Naver→Yahoo 폴백) | **이미 기획서 §2.3 일치** |
| 자체 캔들 렌더 | `components/chart/KoreanCandleChart.tsx` (lightweight-charts, 빨강↑/파랑↓) | 동작 |
| AI 코치 | `app/api/coach/trade-entry/route.ts` (Claude Haiku, 일일 30회 한도 미구현) | 부분 |
| 디자인 시스템 | `tailwind.config.ts` (brand/surface/bullish/bearish/exp 토큰) | 충분 |
| 스킬 트리 | `app/skills/*` (14노드, 4섹션 학습) | 동작 |
| DB 스키마 | `supabase/migrations/0001_init.sql` — `stocks.sector` 컬럼 **이미 있음** | 충분 |

→ 결론: **스키마/데이터 fetch/차트 렌더는 손 댈 필요 없다.** 분석 엔진과 인사이트 UI 만 추가.

---

## 2. 갭 — 기획서 vs 현재

기획서 §2 분석 흐름의 4단계 파이프라인 중:

| 단계 | 기획서 요구 | 현재 |
|---|---|---|
| ① 정규화 | Candle/Stock/Position/Trade 4타입 | 부분 (DB row 그대로 씀) |
| ② 지표 (IND) | 12개 결정적 함수 | **❌ 없음** |
| ③ 인사이트 (INS) | 12개 평가 + severity 정렬 | **❌ 없음** |
| ④ 리포트 조립 | 8개 슬롯 매핑 | 부분 (Hero/Holdings 만, Insights/Sector/Correlation 없음) |

5개 메인 뷰 중 빠진 것:
- **인사이트 피드** (`/insights`) — 신규
- **섹터 트리맵** — 포트폴리오 페이지 안에 추가
- **종목 분석 뷰의 RSI 게이지 + MACD 라인** — Phase 1으로 미룸 (MVP 아님)

---

## 3. MVP 작업 분해 (파일 단위)

### A. Skills.md TS 엔진 (신규 파일 4개)

```
lib/skills/
├── types.ts          # Candle, Stock, Position, Trade, Insight, Severity
├── indicators.ts     # IND-001~007 (SMA, EMA, RSI, MACD, 볼린저, OBV, HV)
├── insights.ts       # INS-001~012 evaluators
└── registry.ts       # INDICATOR_FNS + INSIGHT_EVALUATORS map (확장 시 등록 지점)
```

핵심 규칙:
- 모두 **순수 함수**. I/O 없음. 동일 입력 → 동일 출력.
- NULL 보존 (Skills.md §4.7) — 데이터 부족 시 `null` 반환, 0으로 채우지 않음.
- 입력은 `Candle[]` (오래된→최신 정렬). 시계열 정렬 호출자 책임.

INS 분류 — MVP 에서 다 구현:
- `INS-001/002` 과매수/과매도 (RSI + 볼린저)
- `INS-003/004` 골든/데드크로스 (MACD)
- `INS-005/006` 거래량 폭증 + 가격 상승/하락
- `INS-007` OBV 다이버전스
- `INS-008` 포트폴리오 집중 위험 (positions 만 필요, 캔들 불요)
- `INS-009` 섹터 편중 (positions + stocks.sector)
- `INS-010` 변동성 급등 (HV 20/60)
- `INS-011` 손실 누적 (trades 5일치)
- `INS-012` 추세 정렬 (SMA 5/20/60 정배열)

### B. 인사이트 API + UI (신규)

```
app/api/insights/route.ts            # GET → 사용자 포지션 + 캔들 fetch → 모든 INS 평가 → 정렬 반환
app/insights/page.tsx                # 전체 피드 RSC 페이지
components/insights/InsightCard.tsx  # severity pill + message + action
components/insights/InsightFeed.tsx  # 카드 리스트 (재사용)
```

Severity 우선순위 (Skills.md 부록 A):
`warning > bearish > bullish > info`

### C. 섹터 트리맵 (신규)

```
components/chart/SectorTreemap.tsx   # CSS grid + flexbox 만으로 가중 비례 (D3 X)
```

알고리즘: positions 를 sector 별로 합산 → 평가금액 비례로 grid 영역 분할 → 각 셀 내부에 종목명 + 비중. 한 섹터 내부는 종목별 평가금액으로 sub-flex.

이미 있는 자료: `stocks.sector` 컬럼. 시드(`seed-stocks.ts`)에 sector 값 채워졌는지 확인 필요 (확인 후 업데이트).

### D. UI 통합 (기존 파일 수정 3개)

```
app/page.tsx                # Hero 그대로. + Top 3 Insights 섹션 추가
app/portfolio/page.tsx      # 4-card 요약 그대로. + 섹터 트리맵 섹션 추가
components/AppShell.tsx     # NAV 에 "/insights" 추가 (인사이트 메뉴)
```

### E. 사이드 정리 (Phase 0)

- `Skills.md` 와 `기획서.html` 은 untracked → 첫 commit 에 포함 (스펙은 repo의 일부).
- `docs/mockups/` 디렉토리 생성, HTML 목업 3종 (Task 2).

---

## 4. NOT in scope (의도적으로 미룸)

| 항목 | 미루는 이유 |
|---|---|
| RSI 게이지 (VIZ-009) / MACD 라인 (VIZ-002) on 종목 분석 뷰 | UI 풍요 요소. 인사이트 피드만으로 가치 입증 후 추가. |
| 멀티 종목 비교 (VIZ-005) | 기획서 Phase 1. |
| 상관관계 히트맵 (VIZ-008) | 단일 사용자 보유 종목 수가 적어 가치 낮음. |
| 백테스트 (VIZ-011, BT-규칙) | 기획서 Phase 2. |
| 자연어 쿼리 / 알람 / DART 뉴스 | Phase 1/2. |
| LLM 자연어 보강 (Skills.md §6) | 결정적 INS 부터 검증. AI 호출 비용 절약. |
| Fundamental (PER/PBR/ROE) IND-011 | 추가 데이터 소스 필요 (KRX OpenAPI 등록). |

---

## 5. 결정 기록 (Decisions Log)

| # | 결정 | 이유 |
|---|---|---|
| D1 | **트리맵을 D3 가 아닌 CSS grid 로 구현** | MVP 의 단일 사용자는 종목 5~10개. 진짜 Squarified treemap 알고리즘 불필요. 의존성 추가도 회피. |
| D2 | **인사이트 평가는 RSC 에서 동기 실행** | 6~10 종목 × 180일 캔들 = 가벼움. Edge runtime fetch 캐시 (60s SWR) 로 충분. |
| D3 | **Skills.md 자체는 TS 코드와 별개로 유지** | 사람이 편집하는 SSOT. 코드는 ID 만 매칭 (registry.ts). 기획서 §4.5의 "코드 변경 없이 추가" 원칙 보존. |
| D4 | **MVP 에선 LLM 보강 미사용** | 결정적 INS 12개 만으로 메시지 완결. 비용/지연 회피. Phase 1에서 자연어 해설 추가. |
| D5 | **AI 코치 일일 30회 한도는 별도 작업으로 미룸** | INS 와 직접 관련 없음. 스코프 분리. |

---

## 6. 테스트 계획

타입 체크 + 빌드 통과를 1차 게이트로:
```bash
pnpm typecheck && pnpm build
```

지표 정확성 검증 (수동):
- `IND-003 RSI(14)` 를 삼성전자 005930 6개월치로 계산 → 네이버 증권 RSI 와 ±2 이내 일치 확인.
- `IND-004 MACD(12,26,9)` 마지막 값 부호 일치 확인.

인사이트 평가 (수동):
- 포지션 0건 사용자 → INS-008/009/011 발동 안 함 (조용히 넘어감).
- 단일 종목 100% 비중 → INS-008 `warning` 발동.
- 모든 30일 RSI > 70 인 종목 → INS-001 발동, severity warning.

자동화 테스트는 MVP 외 (Phase 1).

---

## 7. 마이그레이션 / 운영 노트

- DB 마이그레이션 **불필요**. 모든 컬럼 이미 존재.
- `seed-stocks.ts` 가 sector 를 채우는지 확인. 없으면 시드 보강 (Task 6에서 처리).
- `.env.local` 변경 없음.
- Vercel 배포 변경 없음.

---

## 8. 작업 순서 (의존성)

```
Task 2 (목업 HTML)  ─────────┐
                              ├── 시각 합의
Task 1 (이 plan)  ────────────┤
                              ▼
Task 3 (lib/skills/) ───────► Task 5 (api/insights + InsightFeed) ───► Task 7 (홈 통합)
                              │
                              └────► Task 6 (sector treemap on portfolio)
                              
                              ▼
                         Task 8 (typecheck + build)
```

---

## 9. 합의가 필요한 한 가지 (User Challenge)

기획서 §3.5 인사이트 피드는 **시간 누적**으로 그려져 있는데, 이를 위해선 발동 이력 저장 테이블 (`insight_events` 같은 것) 이 필요합니다. 두 가지 길:

- **A. 무상태 (권장, MVP 적합)**: 매 페이지 로드마다 현재 상태로 INS 재평가, 시간 정보 없이 "지금 발동 중인 인사이트" 만 표시. 단순 + 캐시로 빠름.
- **B. 상태 저장**: `insight_events` 테이블 + 마이그레이션 + 정기 평가 잡 추가. MVP 대비 큰 비용.

**A 로 진행** (D6 결정). 시간 누적은 Phase 1 으로.

---

*Plan version: v0.1 · 2026-05-02*

# TradeQuest

> 주식 세계의 듀오링고 + 포켓몬 — 혼자 플레이하는 모의투자 학습 RPG

매일 5분, 진짜 돈 없이 한국 주식을 배우는 단일 플레이용 웹앱.
캐릭터를 키우고 (EXP/레벨/트로피), AI 코치 (Claude Haiku) 가 매매 직전 진입 근거를 함께 점검해 줍니다.

> ⚠️ **이 프로젝트는 학습/교육 목적의 모의투자 게임입니다.** 실제 투자 권유나 재무 상담이 아닙니다.

---

## 주요 기능

- **캐릭터 시스템** — 3개 클래스 (차트 분석가 / 가치투자자 / 모멘텀 트레이더), 레벨, EXP, 하트, 에너지
- **일일 퀘스트** — 시장 브리핑 / 매매 + 진입 근거 / 스킬 학습 5분
- **연속 출석 (Streak)** — 어제 출석 있을 시 +1, 끊기면 1로 리셋
- **스킬 트리** — 14개 스킬, 5개 브랜치 (차트/재무/심리/캡스톤/보스), 레벨+선수스킬 기반 잠금
- **스킬 학습 모듈** — 4섹션 (도입/개념/연습/퀴즈), 콘텐츠는 Claude Haiku 가 자동 생성
- **AI 코치** — 매매 직전 진입 근거 코칭, 일일 30회 한도, 사용 시 EXP +40 (미사용 +20)
- **모의 매매** — 가중평균 평단, 매도 시 손익률 자동 계산, 보유 종목 즉시 차트 점프
- **트로피** — 15종 (일반/레어/에픽/레전더리), 일부 숨김 트로피
- **TradingView 임베드 차트** — 실시간 한국주식, 인디케이터 내장, 종목 검색
- **KIS 개인 모드 토글** — 본인 한국투자증권 계좌만 KIS API 사용 (약관 준수)

---

## 기술 스택

| 영역 | 기술 |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS 3.4, Pretendard Variable 폰트 |
| Auth + DB | Supabase (Postgres 15 + Auth + Row Level Security) |
| AI | Anthropic Claude Haiku 4.5 (코칭/퀴즈) + Sonnet 4.6 (주간 회고) |
| Chart | TradingView Embedded Widget — 실시간/지연 한국 주식, 자체 라이선스 |
| Stock Data (옵션) | 한국투자증권 KIS Developers API (개인 모드 한정) |
| Icons | Lucide React |
| Deploy | Vercel Hobby (무료) |

---

## 빠른 시작 (15~20분)

### 사전 준비

- Node.js 20+ 와 pnpm (`npm i -g pnpm`)
- Supabase 계정 (무료)
- Anthropic API 키 (https://console.anthropic.com)
- (선택) KIS Developers 계정 — 본인 시세 사용 시

### 1. 클론 + 의존성

```bash
git clone https://github.com/<your-username>/tradequest.git
cd tradequest
pnpm install
```

### 2. Supabase 프로젝트 만들기

1. https://supabase.com/dashboard → New project
2. 리전: `Northeast Asia (Seoul)` 권장
3. 데이터베이스 비밀번호 임의 설정 후 저장

### 3. 마이그레이션 적용

Supabase 대시보드 → SQL Editor → New query 에서 다음 두 파일을 차례대로 통째로 붙여넣고 Run:

1. `supabase/migrations/0001_init.sql` — 14개 테이블 + RLS + ENUM
2. `supabase/migrations/0002_settings_and_quests.sql` — user_settings + RPC 함수 3개

> 💡 0002 는 `if not exists` / `drop policy if exists` 로 멱등(idempotent). 여러 번 실행해도 안전.

또는 Supabase CLI 사용:

```bash
npm i -g supabase
supabase login
supabase link --project-ref <YOUR_PROJECT_REF>
supabase db push
```

### 4. 환경변수

`.env.example` 을 `.env.local` 로 복사하고 채우세요:

```bash
cp .env.example .env.local
```

| 변수 | 출처 | 필수 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Settings → API → Project URL | 필수 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API → Legacy → anon public | 필수 |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → Legacy → service_role | 필수 (시드용) |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com/settings/keys | 필수 |
| `KIS_APP_KEY`, `KIS_APP_SECRET` | https://apiportal.koreainvestment.com | 선택 |
| `KIS_BASE_URL`, `KIS_ENV` | 모의투자=paper / 실전=real | 선택 |

> 🔒 `service_role` 키는 RLS 를 우회합니다. 클라이언트 코드에 절대 노출하지 마세요. 시드 스크립트(`scripts/*.ts`) 에서만 사용합니다.

### 5. 시드

```bash
pnpm seed:trophies     # 15개 트로피 정의
pnpm seed:stocks       # 12개 종목 (KOSPI/KOSDAQ 대표)
pnpm seed:skills       # 14개 스킬 콘텐츠 자동 생성 (Claude Haiku, 약 $0.10)
```

### 6. 개발 서버

```bash
pnpm dev
```

→ http://localhost:3000

---

## 첫 실행 흐름

1. `/login` → 본인 이메일 → 매직링크 메일 클릭
2. 신규라 자동으로 `/onboarding` → 클래스 선택 → 캐릭터 이름
3. `/` 홈 → 진짜 본인 캐릭터, EXP 진행률, 오늘의 퀘스트 자동 생성
4. `/skills` → DB 의 14개 스킬 표시. `Lv.{n}+` 부터 잠금 해제, 선수스킬 완료 필요
5. `/skills/{id}` → 4섹션 학습 → 퀴즈 정답 시 +100 EXP, 학습 퀘스트 자동 완료
6. `/trade` → KRX:005930 (삼성전자) TradingView 차트, 종목 변경 가능
7. 가격/수량/근거 입력 → "AI 코치 의견 받기" → Claude Haiku 답변 (일일 30회)
8. "매수 주문" → trades + positions 갱신 + EXP +20~40 + 매매 퀘스트 완료
9. `/portfolio` → 보유 종목, 매매 기록, 승률 자동 계산
10. `/profile/settings` → "KIS 개인 모드" 토글 (본인만 ON)

---

## 프로젝트 구조

```
tradequest/
├── app/                          # Next.js App Router
│   ├── login/                    # 매직링크 로그인
│   ├── auth/callback/            # OAuth 콜백
│   ├── onboarding/               # 캐릭터 생성 3단계
│   ├── api/                      # 서버 라우트
│   │   ├── character/{create,me}
│   │   ├── coach/trade-entry     # Claude Haiku 코칭
│   │   ├── trade/order           # 매매 주문 + 포지션 + EXP
│   │   ├── quests/{today,complete}
│   │   ├── skills/complete
│   │   ├── settings              # user_settings GET/PATCH
│   │   └── market/{price,daily}  # KIS (개인 모드만)
│   ├── skills/{page,[id]}        # 트리 + 학습
│   ├── trade/                    # TradingView + 주문 폼
│   ├── portfolio/                # 보유종목 + 매매기록 테이블
│   ├── profile/{page,trophies,settings}
│   ├── error.tsx                 # 글로벌 에러 바운더리
│   ├── not-found.tsx
│   └── page.tsx                  # 홈 대시보드
├── components/
│   ├── AppShell.tsx              # 사이드바 + 톱바 + 모바일 탭바
│   ├── chart/
│   │   ├── TradingViewChart.tsx  # Advanced Chart 위젯
│   │   ├── SymbolMini.tsx        # Mini Symbol Overview
│   │   └── SymbolSearch.tsx
│   └── BottomNav.tsx
├── lib/
│   ├── supabase/{client,server,middleware}.ts
│   ├── claude/{client,prompts}.ts # 6종 프롬프트 빌더
│   ├── kis/{auth,getCurrent,getDaily,guard}.ts
│   └── utils.ts                   # cn, formatKRW, pnlColor
├── locales/ko.json                # 모든 UI 카피 (한국어 반말)
├── supabase/migrations/
│   ├── 0001_init.sql              # 14개 테이블 + RLS
│   └── 0002_settings_and_quests.sql
├── scripts/
│   ├── seed-trophies.ts
│   ├── seed-stocks.ts
│   └── generate-skill-content.ts  # Claude Haiku 호출
├── docs/                          # 설계 문서 9종
└── content/skills/                # seed:skills 가 만든 JSON 캐시
```

---

## 핵심 디자인 결정

### 1. KIS 라이선스 안전장치

KIS Developers API 는 본인 계좌에서만 사용 가능 (재배포 금지).
공개 사이트 배포 시 다른 사람이 KIS 시세를 보면 약관 위반.

**해결**: `lib/kis/guard.ts` 에서 모든 KIS API 라우트가 `user_settings.kis_personal_mode = true` 인 경우만 통과.
기본값은 false → 공개 배포해도 안전.
설정 페이지에서 본인이 ON 하면 본인 세션만 KIS 사용.

### 2. 차트 = TradingView 위젯

자체 차트 라이브러리 + 데이터 소스 직접 가져오는 대신, TradingView 가 라이선스를 보유한 임베드 위젯 사용.

장점:
- 한국 주식 실시간(또는 지연) 시세 무료
- 인디케이터 (RSI, MACD, MA) 다 내장
- 종목 검색, 인터벌 변경, 풀스크린 모두 위젯 자체 처리
- 재배포 정책 깨끗 (TradingView 가 라이선스 책임)

### 3. Server Component + RPC 함수 위주

페이지 데이터 페칭은 React Server Component 에서 직접.
복잡한 트랜잭션 (EXP 부여, 스트릭 갱신, 일일퀘스트 시드) 은 Postgres RPC 함수로:

- `ensure_daily_missions(user_id, date)` — 오늘 퀘스트 3개 멱등 INSERT
- `add_exp(user_id, amount)` — EXP 합산 + level × 1000 임계 시 레벨업
- `touch_streak(user_id, date)` — 어제 출석 체크 후 streak +1 / 1 reset

→ 클라이언트-서버 왕복 줄이고, 동시성 안전.

### 4. EXP 부여 규칙

| 행동 | EXP |
|---|---|
| 매매 + 진입 근거 (AI 미사용) | +20 |
| 매매 + 진입 근거 (AI 코치 사용) | +40 |
| 스킬 학습 완료 (퀴즈 정답) | +100 |
| 일일 퀘스트 (3종) | 30 / 40 / 30 |

> AI 의견을 들었음에도 매매하면 EXP 가 더 높음 = "근거를 다지고 매매하는 것" 을 보상하는 구조.

### 5. 시작 자본 ₩10,000,000

캐릭터 생성 시 `cash_balance` 기본값 1천만원.
`(현재총자산 - 1000만원) / 1000만원 × 100` 으로 누적 손익률.

---

## 배포 (Vercel Hobby, 무료)

### 1. 푸시

```bash
git remote add origin https://github.com/<your-username>/tradequest.git
git branch -M main
git push -u origin main
```

### 2. Vercel 연동

1. https://vercel.com/new → GitHub 레포 import
2. Framework: Next.js 자동 감지
3. Environment Variables 에 `.env.local` 의 모든 키 등록
   - `NEXT_PUBLIC_*` 는 Production / Preview / Development 다 체크
   - `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `KIS_*` 는 Encrypted

### 3. Supabase 콜백 URL 업데이트

Supabase Dashboard → Authentication → URL Configuration:
- Site URL: `https://your-app.vercel.app`
- Redirect URLs: `https://your-app.vercel.app/auth/callback`

### 4. (옵션) 본인 전용으로 잠그기

`middleware.ts` 에 이메일 화이트리스트 추가:

```ts
const ALLOWED_EMAILS = ["you@example.com"];
if (user && !ALLOWED_EMAILS.includes(user.email!)) {
  return NextResponse.redirect(new URL("/login", request.url));
}
```

### Vercel 함정

- **Hobby 함수 timeout 10초**: Claude Sonnet 회고 호출이 5~8초라 가끔 위험
- **동적 IP**: KIS API 가 IP 화이트리스트 요구하면 실패 → 모의투자 IP 제한 끄거나 KIS 모드 OFF

---

## 정책 요약 (배포 시 반드시 확인)

| 서비스 | 개인 사용 | 공개 사이트 |
|---|---|---|
| Vercel Hobby | OK | OK (비상업) |
| Supabase 무료 | OK | OK |
| Anthropic | OK | usage policy 동의 필요 |
| TradingView 임베드 | OK | OK (자체 라이선스) |
| KIS Developers | OK (본인 계좌) | ToS 위반 |

→ **KIS 모드 토글 OFF + 이메일 화이트리스트** 가 가장 안전한 공개 배포 패턴.

---

## 문서

`docs/` 폴더에 설계 문서 9종:

- `00-master-guide.md` — 6주 로드맵
- `01-database-schema.md` — DB 스키마 상세
- `02-skill-tree-content.md` — 스킬 14개 내용
- `03-kis-api-integration.md` — KIS 통합 패턴
- `04-ai-tutor-prompts.md` — Claude 프롬프트 6종
- `05-design-brief.md` — 디자인 시스템
- `06-brand-system.md` — 브랜드 + Tailwind 설정
- `07-copywriting-library.md` — 모든 UI 카피
- `08-assets-and-links.md` — 외부 리소스 링크

---

## 트러블슈팅

**Q. `pnpm dev` 후 페이지가 404**
→ 마이그레이션 0002 가 안 된 상태일 수 있음. SQL Editor 에서 적용 필요.

**Q. 스킬 트리가 비어있음**
→ `pnpm seed:skills` 실행. ANTHROPIC_API_KEY 설정 확인.

**Q. 차트가 "Invalid symbol" 또는 안 뜸**
→ TradingView 가 해당 종목 미지원. 매매 화면의 "네이버 증권" 우회 링크로 확인.

**Q. 매매 시 "insufficient_cash"**
→ 시작 자본 1천만원 초과 시도. 더 작은 수량으로 재시도 또는 매도로 현금화.

**Q. KIS API 호출 시 "kis_disabled"**
→ 의도된 동작. 설정 페이지에서 "KIS 개인 모드" 토글 ON.

**Q. 매직 링크 클릭 후 localhost 로 가짐**
→ 배포 후엔 Supabase Auth → URL Configuration 에서 Site URL 갱신.

---

## 라이선스

MIT — 자유롭게 fork 해서 본인 학습용으로 쓰세요.
다만 KIS / TradingView / Anthropic 각자의 ToS 는 별도 준수 (LICENSE 파일 참고).

---

## 만든 사람

shin (shincj005@gmail.com)
한국 일반인을 위한 주식 학습 RPG 를 만들고 싶어서 시작.

기여나 버그 리포트는 GitHub Issues 로.

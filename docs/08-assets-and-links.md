# 08 — Assets and Links

폰트, 아이콘, 일러스트, 차트, UI 라이브러리 — 전부 무료/오픈소스.

## 빠른 설치 (한 번에)

```bash
# 핵심 의존성
npm install @supabase/supabase-js @supabase/ssr
npm install @anthropic-ai/sdk
npm install lightweight-charts
npm install lucide-react
npm install zod react-hook-form @hookform/resolvers

# UI
npm install tailwind-merge clsx class-variance-authority
npx shadcn@latest init

# 차트 부가
npm install date-fns

# 개발 도구
npm install -D @types/node typescript prettier eslint-config-prettier
```

## 1. 폰트

### Pretendard (한국어) ⭐
- 라이선스: SIL Open Font License (상용 무료)
- 가변 폰트 지원
- CDN: `https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css`
- GitHub: https://github.com/orioncactus/pretendard

### JetBrains Mono (코드/숫자)
- 라이선스: SIL OFL
- 사용처: 가격 표시, 종목 코드
- CDN: Google Fonts

```html
<!-- app/layout.tsx의 <head> 또는 globals.css에 -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css" />
```

## 2. 아이콘 — Lucide React

- 라이선스: ISC (자유)
- 패키지: `lucide-react`
- 약 1500개 아이콘
- 공식: https://lucide.dev

### TradeQuest용 25개 핵심 매핑

| 용도 | Lucide 아이콘 | import |
| --- | --- | --- |
| 홈 | `Home` | `import { Home } from 'lucide-react'` |
| 스킬 트리 | `Network` | |
| 매매 | `TrendingUp` | |
| 포트폴리오 | `Wallet` | |
| 프로필 | `User` | |
| 트로피 | `Trophy` | |
| 스트릭 | `Flame` | |
| 하트 | `Heart` | |
| 에너지 | `Zap` | |
| EXP | `Sparkles` | |
| 매수 | `ArrowUp` | |
| 매도 | `ArrowDown` | |
| 검색 | `Search` | |
| 설정 | `Settings` | |
| 알림 | `Bell` | |
| AI | `Bot` | |
| 차트 | `LineChart` | |
| 캔들 | `Candlestick` (없으면 `BarChart3`) | |
| 잠금 | `Lock` | |
| 해금 | `Unlock` | |
| 체크 | `CheckCircle2` | |
| 경고 | `AlertCircle` | |
| 정보 | `Info` | |
| 다음 | `ChevronRight` | |
| 닫기 | `X` | |

## 3. 일러스트레이션

### unDraw ⭐
- 라이선스: MIT (저작자 표시 불필요)
- 색상 커스터마이징 (브랜드 컬러로 자동 변환)
- https://undraw.co

추천 일러스트:
- 빈 포트폴리오: "Empty" / "Investment"
- 학습: "Learning" / "Online learning"
- 성취: "Winners" / "Achievement"
- 에러: "Cancel" / "Page not found"

### Storyset (Bro 스타일)
- 라이선스: 무료 (저작자 표시 필요)
- 캐릭터 일러스트
- https://storyset.com (Bro / Pana 스타일)

### Open Peeps
- 라이선스: CC0
- 손그림 캐릭터 (아바타 빌더)
- https://www.openpeeps.com

## 4. 애니메이션

### LottieFiles
- 라이선스: 개별 (무료/유료 혼합)
- React: `lottie-react`
- https://lottiefiles.com

추천:
- 스트릭 불꽃 애니메이션
- 트로피 획득 효과
- 로딩 스피너

```bash
npm install lottie-react
```

## 5. 차트 — TradingView Lightweight Charts

- 라이선스: Apache 2.0
- 무료 + 가벼움 (~40KB)
- https://tradingview.github.io/lightweight-charts/

```bash
npm install lightweight-charts
```

> ⚠️ Next.js에서는 `dynamic import + ssr: false` 필수.

## 6. UI 컴포넌트

### shadcn/ui ⭐
- 라이선스: MIT
- Radix UI 기반, 복사해서 쓰는 방식
- https://ui.shadcn.com

```bash
npx shadcn@latest init
npx shadcn@latest add button card dialog input form
```

### Radix UI Primitives
- shadcn 의존성 (자동 설치)
- 접근성 잘 되어있음

## 7. 효과음 (선택)

### Mixkit
- 라이선스: 무료 (저작자 표시 불필요)
- https://mixkit.co/free-sound-effects

추천 효과음:
- 스킬 해금: 짧은 "ding"
- 트로피 획득: 팡파르 (짧게)
- 매수 체결: 부드러운 "click"

## 8. 색상 도구

### Coolors
- 팔레트 검증/대비 체크
- https://coolors.co

### Tailwind Color Generator
- shadcn 호환 팔레트 생성
- https://ui.shadcn.com/themes

## 9. 모니터링

### Sentry
- 무료 티어 (월 5K 에러)
- `@sentry/nextjs`
- https://sentry.io

### Vercel Analytics
- Vercel Hobby 무료
- 페이지뷰 + Web Vitals

## 10. 빠른 설치 명령 (복붙용)

```bash
# 1. Next.js 프로젝트 생성
npx create-next-app@latest tradequest --ts --tailwind --app --eslint

cd tradequest

# 2. 핵심 의존성
npm install \
  @supabase/supabase-js @supabase/ssr \
  @anthropic-ai/sdk \
  lightweight-charts \
  lucide-react \
  zod react-hook-form @hookform/resolvers \
  date-fns \
  tailwind-merge clsx class-variance-authority

# 3. shadcn/ui
npx shadcn@latest init

# 4. 자주 쓰는 shadcn 컴포넌트
npx shadcn@latest add button card dialog input form badge progress sheet tabs toast tooltip

# 5. 개발 도구
npm install -D prettier eslint-config-prettier prettier-plugin-tailwindcss
```

## 11. 환경변수 템플릿

```env
# .env.example
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

ANTHROPIC_API_KEY=

KIS_APP_KEY=
KIS_APP_SECRET=
KIS_ACCOUNT_NO=
KIS_BASE_URL=https://openapivts.koreainvestment.com:29443
```

## 12. 체크리스트 (셋업 완료 기준)

- [ ] `pnpm`/`npm` 의존성 설치 완료
- [ ] Pretendard 로딩 확인 (홈 화면 한글 폰트)
- [ ] Tailwind 토큰 적용 (06번 문서)
- [ ] Supabase 프로젝트 연결 확인 (`supabase.from('profiles').select()`)
- [ ] Anthropic API 키 동작 확인 (간단한 호출)
- [ ] KIS 토큰 발급 성공 (Postman 또는 lib/kis 테스트)
- [ ] shadcn `Button` 렌더링 확인
- [ ] Lucide 아이콘 렌더링 확인
- [ ] TradingView 차트 1개 표시 확인 (mock 데이터)
- [ ] 다크모드 토글 동작

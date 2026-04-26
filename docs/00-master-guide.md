# 00 — 마스터 가이드 (TradeQuest 6주 로드맵)

이 문서는 01~08 문서를 **언제 꺼내 쓸지**까지 명시한 시간축 로드맵입니다. 개발하면서 "지금 뭐 해야 하지?" 하고 고민할 필요가 없게 짜놨어요.

---

## 6주 플랜 요약

| Week | 주제 | 사용 문서 |
| ---- | --- | --------- |
| 0 (지금) | 계정/API 신청 + 환경 준비 | 05 정독 |
| 1 | Next.js 세팅 + DB + 로그인 | 01, 06, 08 |
| 2 | 스킬 트리 + AI 튜터 | 02, 04, 07 |
| 3 | KIS 연동 + 차트 + 매매 | 03, 04, 07 |
| 4 | EXP/트로피/스트릭/복기 | 02, 04 |
| 5 | 다듬기 (성능, UX, 버그) | 05, 06, 07 |
| 6 | Vercel 배포 | — |

---

## Week 0 — 지금 당장 (오늘의 체크리스트)

> 한투 계좌만 해도 오늘 일 다 한 거예요.

- [ ] **한국투자증권 계좌 개설 신청** ⚠️ — 평일 낮에 해야 당일 개설 가능. 주말 시작이면 월요일까지 대기.
- [ ] **Supabase 프로젝트 생성** — supabase.com → New project (region: Northeast Asia / Seoul 권장)
- [ ] **Anthropic API 키 발급 + $5 충전** — console.anthropic.com → API Keys
- [ ] **GitHub 저장소 만들기** — `tradequest` (private)
- [ ] **`docs/05-design-brief.md` 정독** — Week 1 들어가기 전 디자인 톤 머리에 박기

KIS API는 신청 → 승인 1~2일 걸리므로 **이게 가장 중요한 병목**입니다.

---

## Week 1 — 뼈대

### Day 1 (Mon)
- Next.js 프로젝트 생성: `npx create-next-app@latest tradequest --ts --tailwind --app --eslint`
- 08번 문서의 npm install 묶음 한 번에 실행 (Pretendard, lucide-react, shadcn/ui, Supabase JS 등)
- `06-brand-system.md`의 Tailwind config 복붙

### Day 2~3
- Supabase 연동: `lib/supabase/client.ts`, `lib/supabase/server.ts`
- `01-database-schema.md`의 SQL을 `supabase/migrations/0001_init.sql`에 넣고 적용
- RLS 정책 함께 적용

### Day 4~5
- Supabase Auth: 이메일 + Google 로그인
- 회원가입 시 캐릭터 생성 플로우 (`app/onboarding/page.tsx`)
- DB에 `characters` 레코드 생성, 직업 선택 화면

### Week 1 끝났을 때 보여야 할 것
- 로그인 → 캐릭터 생성 → 빈 홈 화면

---

## Week 2 — 학습 시스템

### Day 6~7
- 스킬 트리 SVG 컴포넌트 (`components/SkillTree.tsx`)
- `02-skill-tree-content.md`의 자동 생성 스크립트로 20개 노드 seed (3~4시간)

### Day 8~9
- 스킬 노드 상세 페이지 (`app/skills/[id]/page.tsx`)
- AI 튜터 대화 컴포넌트 (`components/TutorChat.tsx`)
- `04-ai-tutor-prompts.md`의 "1. 스킬 학습" 프롬프트로 Claude Haiku 호출

### Day 10
- 퀴즈 + 하트 시스템 (`components/QuizCard.tsx`)
- 스킬 해금 로직 — 완료 시 `user_skills` 인서트, 차트 지표 활성화

### Week 2 끝났을 때 보여야 할 것
- 첫 노드 학습 → 퀴즈 통과 → 캔들차트 스킬 해금

---

## Week 3 — 모의투자

### Day 11~12 (KIS 토큰 관문)
- `03-kis-api-integration.md`의 토큰 캐싱 로직 (서버리스의 핵심) — Supabase에 토큰 저장
- 일봉 데이터 페치 → `lib/kis/getDaily.ts`

### Day 13
- TradingView Lightweight Charts 통합 — `components/Chart.tsx`
- 해금된 스킬에 따라 지표 활성화 (예: RSI 미해금 시 회색 처리)

### Day 14~15
- 종목 검색 + 상세 페이지 (`app/trade/[symbol]/page.tsx`)
- 매수/매도 모달 — 진입 근거 메모 필수
- "AI에게 물어보기" 버튼 (`04-ai-tutor-prompts.md`의 "2-3 매매 전 코칭")

### Week 3 끝났을 때 보여야 할 것
- 종목 검색 → 차트 보기 → 진입 근거 작성 → 매수 → 포트폴리오에 반영

---

## Week 4 — 게임화 + 다듬기

### Day 16~17
- 일일 미션 + 스트릭 + EXP/레벨 (`components/DailyQuest.tsx`)
- Vercel Cron Job으로 매일 0시 미션 리셋

### Day 18
- 트로피 시스템 — 첫 수익, 첫 손절, 10연승 등 트리거 함수
- 트로피 캐러셀 (홈 화면)

### Day 19~20
- AI 주간 복기 리포트 (Sonnet 4.6) — 일요일 저녁 자동 생성
- 캐릭터 스킨/배경 테마 수집 페이지

### Week 4 끝났을 때 보여야 할 것
- 매일 들어가서 퀘스트 깨고 → 매매하고 → 스트릭 쌓고 → 일요일에 복기 받는 풀 루프

---

## Week 5 — 다듬기

- 모바일 반응형 정밀 조정 (목업 기준)
- 로딩 스켈레톤
- 에러 바운더리
- AI 응답 캐싱 (동일 프롬프트 → 같은 응답)
- 다크모드 토글
- 자기 자신이 일주일 동안 써보고 재미없는 곳 찾기 ⭐

---

## Week 6 — 배포

- 환경변수 정리 (`.env.local` → Vercel)
- 도메인 연결 (Cloudflare → Vercel)
- 에러 모니터링 (Sentry 또는 Vercel Analytics)
- KIS API 운영 키로 교체
- README 정비
- 친구 3명에게 공유 → 피드백

---

## 흔히 막히는 지점 5개 (사전 경고)

1. **KIS 토큰 1분 1회 제한** — 토큰을 Supabase에 캐싱하고 만료 시간 체크 필수. 매 호출마다 새 토큰 발급하면 즉시 막힘.
2. **Claude API 비용 폭증** — Haiku/Sonnet 분리 안 하면 한 달에 $50 넘어갈 수 있음. `04-ai-tutor-prompts.md`의 모델 선택 전략 그대로 따르기.
3. **Supabase RLS 권한 문제** — 정책 누락 시 `select`는 되는데 `insert`가 안 되거나 그 반대. 마이그레이션에 RLS 미리 다 박아두기.
4. **TradingView 차트 렌더링 실패** — Next.js SSR에서 `window`를 찾으니까 `dynamic import + ssr: false`로 감싸기.
5. **스킬 트리 SVG 반응형** — 모바일에서 깨지기 쉬움. `viewBox` + 줌/팬 기능 미리 넣기.

---

## 막히면 어떻게 물어볼까

정확한 컨텍스트를 주려면:

> "Week 3 Day 12에서 KIS 토큰 캐싱하는 부분, 만료 5분 전 갱신 로직이 동작 안 해. 코드는 이거고, 에러는 저거야."

이런 식으로 **Week/Day 번호 + 어느 문서의 어느 섹션 + 코드 + 에러**를 묶어주면 답변 정확도가 확 올라가요.

---

## 체크포인트

- [x] 0주차 완료
- [ ] 1주차 완료 (로그인 + 캐릭터)
- [ ] 2주차 완료 (스킬 트리 학습)
- [ ] 3주차 완료 (모의투자 풀 사이클)
- [ ] 4주차 완료 (게임화 풀 루프)
- [ ] 5주차 완료 (자기 검증)
- [ ] 6주차 완료 (배포)

---

## 다음 9개 문서

이 가이드는 진입점이고, 실제 작업할 때는 각 Week에 명시된 문서를 펼쳐서 보세요.

→ [`01-database-schema.md`](01-database-schema.md)부터 시작

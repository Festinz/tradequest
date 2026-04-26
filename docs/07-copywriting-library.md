# 07 — Copywriting Library

모든 화면의 UI 텍스트. `locales/ko.json`에 그대로 사용. 반말/간결 톤 일관 유지.

## 사용 패턴

```typescript
// lib/i18n.ts
import ko from '@/locales/ko.json';

export function t(key: string): string {
  return key.split('.').reduce((obj, k) => obj?.[k], ko as any) ?? key;
}

// 사용
t('home.greeting.morning')  // "오늘도 들렀구나, 반가워"
```

## 카테고리별 전체 텍스트

### 1. 온보딩 (`onboarding`)

```json
{
  "welcome": {
    "title": "주식, 게임처럼 배워보자",
    "subtitle": "혼자서, 부담 없이, 매일 조금씩",
    "cta": "시작하기"
  },
  "character_create": {
    "title": "트레이더 캐릭터를 만들어줘",
    "name_label": "캐릭터 이름",
    "name_placeholder": "예: 창준",
    "class_label": "초기 직업",
    "classes": {
      "chartist": { "name": "차트 분석가", "desc": "캔들과 지표로 시장의 흐름을 읽어" },
      "value_investor": { "name": "가치 투자자", "desc": "재무제표에서 보석을 찾아내" },
      "momentum_trader": { "name": "모멘텀 트레이더", "desc": "흐름의 파도 위에 올라타" }
    },
    "next": "캐릭터 만들기"
  },
  "tutorial": {
    "step1": "100만원으로 시작해. 모의 자금이라 부담 없어.",
    "step2": "스킬을 배우면 차트에 새 도구가 생겨.",
    "step3": "매매할 때마다 진입 근거를 적으면 EXP가 쌓여.",
    "done": "이제 시작해보자"
  }
}
```

### 2. 홈 대시보드 (`home`)

```json
{
  "greeting": {
    "morning": "좋은 아침, {{name}}!",
    "afternoon": "오늘도 잘 하고 있어, {{name}}",
    "evening": "오늘 하루도 수고했어, {{name}}",
    "streak_continued": "스트릭 {{days}}일째!",
    "streak_broken": "오랜만이야. 다시 시작해보자"
  },
  "stats": {
    "hp": "하트",
    "energy": "집중력",
    "streak": "연속 출석",
    "level": "레벨",
    "exp_to_next": "{{exp}} / {{required}} EXP"
  },
  "quests": {
    "title": "오늘의 퀘스트",
    "completed": "완료",
    "in_progress": "진행중",
    "locked": "내일 잠금해제",
    "all_done": "오늘 퀘스트 다 깼어! 🎉"
  },
  "briefing": {
    "title": "오늘의 시장",
    "loading": "AI가 시장을 읽는 중...",
    "empty": "장 마감 후 다시 들어와줘"
  }
}
```

### 3. 스킬 트리 (`skills`)

```json
{
  "title": "스킬 트리",
  "filter": {
    "all": "전체",
    "chart": "차트",
    "fundamental": "기본",
    "psychology": "심리"
  },
  "node": {
    "locked": "🔒 잠김 — {{prereq}} 먼저 완료하기",
    "available": "✨ 학습 가능",
    "in_progress": "이어하기",
    "completed": "✅ 완료"
  },
  "session": {
    "intro_continue": "다음",
    "quiz_check": "확인",
    "quiz_correct": "정답이야!",
    "quiz_wrong": "아쉽다, 다시 생각해볼까?",
    "quiz_no_hearts": "하트가 없어. 5시간 후 회복돼"
  },
  "complete": {
    "title": "스킬 해금!",
    "exp_gained": "+{{exp}} EXP",
    "indicator_unlocked": "차트에서 {{indicator}}를 쓸 수 있어",
    "next": "다음 스킬 보기"
  }
}
```

### 4. 모의투자 (`trade`)

```json
{
  "search_placeholder": "종목명 또는 코드",
  "tabs": {
    "chart": "차트",
    "info": "정보",
    "ai": "AI 요약"
  },
  "side": {
    "buy": "매수",
    "sell": "매도"
  },
  "form": {
    "quantity_label": "수량",
    "quantity_placeholder": "0",
    "price_label": "가격",
    "reason_label": "왜 이 매매를 하는지 적어줘",
    "reason_placeholder": "예: 5일선 위에 안착했고 거래량 늘어남",
    "reason_hint": "구체적일수록 EXP가 많아",
    "ai_consult": "AI에게 물어보기",
    "ai_consult_hint": "확신 있으면 바로 매수해도 좋아",
    "ai_consult_loading": "AI가 생각하는 중...",
    "buy": "매수하기",
    "sell": "매도하기",
    "exp_preview": "+{{exp}} EXP"
  },
  "ai_advice": {
    "ask_again": "다시 물어보기",
    "buy_anyway": "조언 보고 매수 (+40 EXP)",
    "revise_reason": "근거 수정 (+60 EXP)"
  },
  "execution": {
    "success": "체결됐어",
    "fail": "잠깐, 잔고가 부족해",
    "energy_low": "오늘 매매 한도 도달. 내일 다시 와"
  }
}
```

### 5. 포트폴리오 (`portfolio`)

```json
{
  "title": "내 포트폴리오",
  "summary": {
    "total_value": "평가금액",
    "cash": "현금",
    "total_return": "수익률",
    "today_return": "오늘"
  },
  "positions": {
    "title": "보유 종목",
    "empty": "아직 보유 종목이 없어. 첫 매매를 해보자",
    "headers": {
      "name": "종목",
      "qty": "수량",
      "avg": "평균가",
      "current": "현재가",
      "return": "수익률"
    }
  },
  "history": {
    "title": "매매 일지",
    "empty": "기록이 쌓이면 여기서 복기할 수 있어"
  }
}
```

### 6. 트로피 (`trophies`)

```json
{
  "title": "트로피",
  "subtitle": "꾸준한 학습의 흔적",
  "categories": {
    "trade": "매매",
    "learn": "학습",
    "streak": "꾸준함",
    "milestone": "마일스톤"
  },
  "locked": "획득 조건: {{condition}}",
  "earned_at": "{{date}} 획득"
}
```

### 7. 주간 복기 (`review`)

```json
{
  "title": "이번 주 복기",
  "loading": "AI가 한 주를 정리하는 중...",
  "sections": {
    "summary": "한 줄 요약",
    "good": "잘한 점",
    "improve": "개선할 점",
    "next": "다음 주 학습 추천",
    "encouragement": "응원의 한마디"
  },
  "no_activity": "이번 주는 활동이 적었어. 다음 주에 다시 와"
}
```

### 8. 프로필 (`profile`)

```json
{
  "edit": "편집",
  "stats": {
    "total_trades": "총 매매",
    "win_rate": "승률",
    "best_trade": "최고 수익",
    "total_exp": "누적 EXP",
    "joined": "{{date}} 시작"
  },
  "skins": {
    "avatar": "아바타",
    "background": "배경",
    "mentor": "AI 멘토"
  }
}
```

### 9. 시스템 / 에러 (`system`)

```json
{
  "loading": "잠깐만 기다려줘",
  "error_generic": "어, 뭔가 잘못됐어. 잠시 후 다시 시도해줘",
  "error_network": "인터넷 연결을 확인해줘",
  "error_market_closed": "지금은 장 마감 시간이야",
  "saved": "저장됐어",
  "confirm": "확인",
  "cancel": "취소",
  "retry": "다시 시도"
}
```

### 10. 알림 (`notifications`)

```json
{
  "streak_warning": "오늘 접속 안 하면 스트릭 끊겨!",
  "heart_recovered": "하트가 회복됐어",
  "weekly_review_ready": "이번 주 복기가 준비됐어",
  "skill_recommend": "{{skill}} 배워볼래?"
}
```

## 톤 가이드 요약

| 상황 | 좋은 예 | 나쁜 예 |
| ---- | ------ | ------ |
| 환영 | "오늘도 들렀구나" | "환영합니다!" |
| 칭찬 | "지지선 매매 좋네" | "대단해요!" |
| 실패 | "아쉽다, 다시 해볼까" | "실패하셨습니다" |
| 한도 | "내일 다시 와" | "한도 초과" |
| 완료 | "오늘 미션 다 깼어 🎉" | "수고하셨습니다" |

## 언어 추가 (Phase 2)

`locales/en.json` 추가 시 같은 키 구조 유지. 영어는 1인칭 구어체.

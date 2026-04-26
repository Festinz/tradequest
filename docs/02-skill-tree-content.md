# 02 — Skill Tree Content (20 Nodes)

3개 분기(차트 / 기본 / 심리) × 약 6~7개 노드 + 종합 운용 + AI 마스터 보스.

## 트리 구조

```
              [시작의 문]
                   │
       ┌───────────┼───────────┐
       │           │           │
    [차트]      [기본]      [심리]
       │           │           │
   캔들차트       PER         손절
       │           │           │
   이동평균      ROE        분할매수
       │           │           │
   지지·저항    재무제표     리스크관리
       │           │           │
    RSI         밸류에이션    감정통제
       │           │           │
    MACD        섹터분석      복리이해
       │           │           │
   거래량분석    배당투자     장기관점
        \\        │         //
         [종합 운용]
              │
         [AI 마스터 보스]
```

## 노드 정의 (20개)

| id | name | branch | 선행 | 해금 지표 | EXP |
| -- | ---- | ------ | --- | -------- | --- |
| `start-gate` | 시작의 문 | tutorial | — | — | 30 |
| `candle-basics` | 캔들차트 읽기 | chart | start-gate | candlestick | 50 |
| `moving-avg` | 이동평균선 | chart | candle-basics | sma, ema | 60 |
| `support-resist` | 지지·저항선 | chart | candle-basics | support_lines | 60 |
| `rsi` | RSI 지표 | chart | moving-avg | rsi | 70 |
| `macd` | MACD 지표 | chart | rsi | macd | 80 |
| `volume` | 거래량 분석 | chart | support-resist | volume_profile | 70 |
| `per-basics` | PER 이해하기 | fundamental | start-gate | — | 50 |
| `roe-roa` | ROE / ROA | fundamental | per-basics | — | 60 |
| `financials` | 재무제표 읽기 | fundamental | roe-roa | — | 80 |
| `valuation` | 밸류에이션 | fundamental | financials | — | 80 |
| `sector-analysis` | 섹터 분석 | fundamental | valuation | sector_filter | 70 |
| `dividend` | 배당 투자 | fundamental | valuation | — | 60 |
| `stop-loss` | 손절의 기술 | psychology | start-gate | stop_loss_alert | 60 |
| `position-sizing` | 분할 매수 | psychology | stop-loss | dca_helper | 70 |
| `risk-mgmt` | 리스크 관리 | psychology | position-sizing | risk_meter | 80 |
| `emotion-control` | 감정 통제 | psychology | risk-mgmt | mood_check | 70 |
| `compounding` | 복리의 마법 | psychology | emotion-control | — | 60 |
| `long-term` | 장기 관점 | psychology | compounding | — | 70 |
| `comprehensive` | 종합 운용 | capstone | rsi, valuation, risk-mgmt | strategy_builder | 150 |
| `ai-master-boss` | AI 마스터 보스 | boss | comprehensive | — | 300 |

## 노드 1개의 표준 구조

각 노드는 **5~10분짜리 학습 단위**로 다음 4개 섹션을 가집니다.

```
1. 도입 (30초) — 왜 이걸 배우는가
2. 핵심 개념 (2~3분) — Claude Haiku 대화형 설명 + 그림
3. 미니 실습 (2분) — 실제 차트나 데이터에 적용
4. 퀴즈 (1~2분) — 4지선다 3문제, 2개 이상 맞아야 통과
```

## 풀 스크립트 예시 — `candle-basics`

### 1. 도입
> "차트는 주식의 언어야. 그 중에서도 캔들 하나는 하루치 마음을 담고 있어. 오늘 배우면 차트가 갑자기 말을 걸어올 거야."

### 2. 핵심 개념 (AI 튜터 프롬프트 템플릿)
```
[시스템] 너는 TradeQuest의 친근한 AI 멘토야. 학습자는 주식 입문자.
반말 사용. 비유 적극 활용. 1턴에 200자 이내.

[주제] 캔들차트 기본
- 캔들 하나 = 하루 (시가/종가/고가/저가)
- 양봉/음봉 의미
- 몸통과 꼬리

[학습자 레벨] 1
[직업] {{character.class}}
```

### 3. 미니 실습
삼성전자(005930) 최근 5일 캔들을 보여주고 "어제 양봉이야 음봉이야?" "꼬리가 긴 이유는?" 등 인터랙티브 질문.

### 4. 퀴즈 (3문제)
1. 양봉의 정의는?
2. 위꼬리가 긴 캔들이 의미하는 것은?
3. 시가가 종가보다 높을 때 캔들 색은?

---

## 자동 생성 스크립트

나머지 15개 노드도 같은 구조 — 매뉴얼로 쓰면 3일, Claude로 생성하면 3~4시간.

```typescript
// scripts/generate-skill-content.ts
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';

const client = new Anthropic();
const skills = JSON.parse(fs.readFileSync('skills.json', 'utf8'));

const PROMPT_TEMPLATE = (skill) => `
TradeQuest의 스킬 노드 콘텐츠를 작성해줘.

스킬: ${skill.name}
브랜치: ${skill.branch}
대상: 주식 입문자
톤: 반말, 친근, 비유 활용

다음 4개 섹션을 JSON으로:
{
  "intro": "30초 분량 도입 (~100자)",
  "concept_messages": ["AI 튜터가 200자씩 4~5턴 분량으로 설명한 메시지 배열"],
  "exercise": { "type": "chart|data", "instruction": "...", "data_query": "..." },
  "quiz": [{ "question": "...", "options": ["A","B","C","D"], "correct": 0, "explanation": "..." }]
}

3문제, 4지선다.
`;

for (const skill of skills) {
  const res = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 2000,
    messages: [{ role: 'user', content: PROMPT_TEMPLATE(skill) }],
  });
  const json = JSON.parse(res.content[0].text);
  fs.writeFileSync(`./content/skills/${skill.id}.json`, JSON.stringify(json, null, 2));
  console.log(`✓ ${skill.id}`);
}
```

---

## 학습 → 실전 연결 (가장 중요한 룰)

해금된 스킬은 **모의투자 화면에서 실제로 활용 가능**해야 함:

- `rsi` 미해금 → 차트 RSI 지표 회색 처리
- `support-resist` 해금 → 지지/저항선 자동 그리기 토글 활성화
- `risk-mgmt` 해금 → 매매 화면에 손절가 입력 필드 추가

이게 학습 동기의 핵심.

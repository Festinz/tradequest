# 01 — Database Schema (Supabase / Postgres)

13개 테이블 + RLS 정책 + 인덱스. `supabase/migrations/0001_init.sql`에 그대로 넣으면 됩니다.

## 테이블 구성

| 테이블 | 역할 |
| ------ | ---- |
| `profiles` | Supabase Auth 사용자 ↔ 앱 프로필 (1:1) |
| `characters` | 트레이더 캐릭터 (직업, 레벨, EXP, 스탯) |
| `skills` | 스킬 트리 노드 정의 (시드 데이터) |
| `user_skills` | 사용자별 스킬 해금 상태 |
| `stocks` | 종목 마스터 (KIS 동기화) |
| `trades` | 매수/매도 체결 기록 + 진입 근거 |
| `positions` | 현재 보유 포지션 (평균단가 / 수량) |
| `daily_missions` | 일일 퀘스트 정의 + 사용자 진행 상태 |
| `streak_logs` | 연속 출석 기록 |
| `trophies` | 트로피 정의 |
| `user_trophies` | 사용자 획득 트로피 |
| `ai_messages` | AI 튜터 대화 히스토리 (비용 추적용) |
| `learning_sessions` | 스킬 학습 세션 (퀴즈 결과 포함) |

## 마이그레이션 SQL

```sql
-- supabase/migrations/0001_init.sql

create extension if not exists "uuid-ossp";

-- 1. profiles (auth.users 와 1:1)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null,
  email text,
  created_at timestamptz default now(),
  timezone text default 'Asia/Seoul'
);

-- 2. characters
create type character_class as enum ('chartist', 'value_investor', 'momentum_trader');

create table characters (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade unique,
  name text not null,
  class character_class not null,
  level int default 1,
  exp int default 0,
  hp int default 5,             -- 하트
  energy int default 100,        -- 집중력
  cash bigint default 1000000,   -- 현금 (원)
  avatar_skin text default 'default',
  background_skin text default 'default',
  mentor_skin text default 'default',
  created_at timestamptz default now()
);

-- 3. skills
create table skills (
  id text primary key,           -- 'candle-basics', 'rsi-intro' 등
  name text not null,
  description text,
  branch text not null,          -- 'chart' | 'fundamental' | 'psychology'
  position_x int not null,
  position_y int not null,
  prerequisites text[] default '{}',  -- 선행 스킬 id 배열
  exp_reward int default 50,
  unlocks_indicator text         -- 차트에서 활성화할 지표 ('rsi', 'macd' 등)
);

-- 4. user_skills (해금 상태)
create table user_skills (
  user_id uuid references profiles(id) on delete cascade,
  skill_id text references skills(id),
  status text check (status in ('locked', 'available', 'in_progress', 'completed')),
  completed_at timestamptz,
  primary key (user_id, skill_id)
);

-- 5. stocks (마스터)
create table stocks (
  symbol text primary key,       -- '005930', 'AAPL'
  market text check (market in ('KOSPI', 'KOSDAQ', 'NASDAQ', 'NYSE')),
  name_ko text,
  name_en text,
  sector text,
  updated_at timestamptz default now()
);

-- 6. trades
create table trades (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  symbol text references stocks(symbol),
  side text check (side in ('buy', 'sell')),
  quantity int not null,
  price bigint not null,         -- 체결가 (원)
  reason text not null,          -- 진입/청산 근거 (필수)
  ai_consulted boolean default false,
  exp_earned int default 20,
  tags text[] default '{}',
  executed_at timestamptz default now()
);

-- 7. positions (현재 보유)
create table positions (
  user_id uuid references profiles(id) on delete cascade,
  symbol text references stocks(symbol),
  quantity int not null,
  avg_price bigint not null,
  primary key (user_id, symbol)
);

-- 8. daily_missions
create table daily_missions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  date date not null,
  mission_type text not null,    -- 'briefing_read', 'trade_with_reason', 'learn_5min'
  description text,
  completed boolean default false,
  exp_reward int default 30,
  unique (user_id, date, mission_type)
);

-- 9. streak_logs
create table streak_logs (
  user_id uuid references profiles(id) on delete cascade,
  date date,
  primary key (user_id, date)
);

-- 10. trophies
create table trophies (
  id text primary key,           -- 'first_profit', 'streak_30'
  name text not null,
  description text,
  icon text,
  rarity text check (rarity in ('common', 'rare', 'epic', 'legendary'))
);

-- 11. user_trophies
create table user_trophies (
  user_id uuid references profiles(id) on delete cascade,
  trophy_id text references trophies(id),
  earned_at timestamptz default now(),
  primary key (user_id, trophy_id)
);

-- 12. ai_messages (비용 추적)
create table ai_messages (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  session_type text not null,    -- 'tutor', 'quiz', 'trade_advice', 'weekly_review'
  model text not null,           -- 'haiku-4-5', 'sonnet-4-6'
  input_tokens int,
  output_tokens int,
  cost_usd numeric(10, 6),
  created_at timestamptz default now()
);

-- 13. learning_sessions
create table learning_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  skill_id text references skills(id),
  quiz_score int,
  quiz_total int,
  duration_seconds int,
  completed_at timestamptz default now()
);

-- 인덱스
create index trades_user_date on trades(user_id, executed_at desc);
create index missions_user_date on daily_missions(user_id, date);
create index ai_messages_user_date on ai_messages(user_id, created_at desc);

-- RLS 활성화
alter table profiles enable row level security;
alter table characters enable row level security;
alter table user_skills enable row level security;
alter table trades enable row level security;
alter table positions enable row level security;
alter table daily_missions enable row level security;
alter table streak_logs enable row level security;
alter table user_trophies enable row level security;
alter table ai_messages enable row level security;
alter table learning_sessions enable row level security;

-- 본인 데이터만 읽기/쓰기
create policy "own profile" on profiles for all using (auth.uid() = id);
create policy "own character" on characters for all using (auth.uid() = user_id);
create policy "own skills" on user_skills for all using (auth.uid() = user_id);
create policy "own trades" on trades for all using (auth.uid() = user_id);
create policy "own positions" on positions for all using (auth.uid() = user_id);
create policy "own missions" on daily_missions for all using (auth.uid() = user_id);
create policy "own streaks" on streak_logs for all using (auth.uid() = user_id);
create policy "own trophies" on user_trophies for all using (auth.uid() = user_id);
create policy "own ai messages" on ai_messages for all using (auth.uid() = user_id);
create policy "own learning" on learning_sessions for all using (auth.uid() = user_id);

-- 마스터 테이블은 전체 공개 (읽기만)
alter table skills enable row level security;
alter table stocks enable row level security;
alter table trophies enable row level security;
create policy "skills public read" on skills for select using (true);
create policy "stocks public read" on stocks for select using (true);
create policy "trophies public read" on trophies for select using (true);
```

## 시드 데이터

`supabase/seed.sql` 또는 `scripts/seed.ts`에서 처리:

- `skills` 20개 노드 (`docs/02-skill-tree-content.md` 참조)
- `trophies` 30~50개 정의
- 종목 마스터는 KIS API에서 동기화 (`scripts/sync-stocks.ts`)

## 타임존 주의

- 모든 `timestamptz`는 UTC로 저장
- 일일 미션 리셋은 `Asia/Seoul` 기준 0시 → Vercel Cron Job 시간대 명시 필수

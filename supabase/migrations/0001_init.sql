-- TradeQuest 초기 스키마
-- 개인 단일 플레이용. Supabase auth.users 를 기반으로 RLS 적용.

create extension if not exists "pgcrypto";

-- ============================================
-- ENUMS
-- ============================================
create type character_class as enum ('chartist', 'value_investor', 'momentum_trader');
create type trade_side as enum ('buy', 'sell');
create type trade_status as enum ('open', 'closed', 'canceled');
create type quest_status as enum ('todo', 'done');
create type tier as enum ('common', 'rare', 'epic', 'legendary');
create type ai_kind as enum (
  'trade_entry_coach',
  'trade_review',
  'daily_briefing',
  'quiz_grade',
  'weekly_review',
  'loss_comfort'
);

-- ============================================
-- 1. profiles  (auth.users 1:1)
-- ============================================
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  locale text not null default 'ko',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- 2. characters  (한 user 당 1캐릭터)
-- ============================================
create table public.characters (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  class character_class not null,
  level int not null default 1,
  exp int not null default 0,
  hearts int not null default 5,
  energy int not null default 80,
  streak_days int not null default 0,
  cash_balance bigint not null default 10000000, -- 시작 자본 1천만원
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- 3. skills  (스킬 트리 정의)
-- ============================================
create table public.skills (
  id text primary key,
  branch text not null,         -- 'chart' | 'fundamental' | 'psychology' | 'capstone' | 'boss'
  name text not null,
  description text,
  required_level int not null default 1,
  prerequisite_id text references public.skills(id),
  position_x int not null,
  position_y int not null,
  content_json jsonb,           -- 4섹션 콘텐츠 (intro/concept/exercise/quiz)
  created_at timestamptz not null default now()
);

-- ============================================
-- 4. user_skills  (해금 + 진행도)
-- ============================================
create table public.user_skills (
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_id text not null references public.skills(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  completed_at timestamptz,
  quiz_score int,
  primary key (user_id, skill_id)
);

-- ============================================
-- 5. stocks  (종목 마스터)
-- ============================================
create table public.stocks (
  ticker text primary key,
  name text not null,
  market text not null,         -- 'KOSPI' | 'KOSDAQ'
  sector text,
  created_at timestamptz not null default now()
);

-- ============================================
-- 6. trades  (매매 1건)
-- ============================================
create table public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ticker text not null references public.stocks(ticker),
  side trade_side not null,
  qty int not null check (qty > 0),
  price bigint not null check (price > 0),
  status trade_status not null default 'open',
  entry_reason text,            -- 진입 근거 (필수 입력)
  exit_reason text,             -- 청산 사유
  ai_advice_used bool not null default false,
  ai_advice_text text,
  pnl bigint,                   -- 청산 후 손익(원)
  pnl_pct numeric(8,2),         -- 청산 후 손익률
  opened_at timestamptz not null default now(),
  closed_at timestamptz
);
create index trades_user_idx on public.trades (user_id, opened_at desc);

-- ============================================
-- 7. positions  (현재 보유)
-- ============================================
create table public.positions (
  user_id uuid not null references auth.users(id) on delete cascade,
  ticker text not null references public.stocks(ticker),
  qty int not null,
  avg_price bigint not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, ticker)
);

-- ============================================
-- 8. daily_missions
-- ============================================
create table public.daily_missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  code text not null,              -- 'read_briefing' | 'trade_with_reason' | 'study_5min' ...
  title text not null,
  exp_reward int not null,
  status quest_status not null default 'todo',
  done_at timestamptz,
  unique (user_id, date, code)
);

-- ============================================
-- 9. streak_logs  (출석)
-- ============================================
create table public.streak_logs (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  primary key (user_id, date)
);

-- ============================================
-- 10. trophies  (정의)
-- ============================================
create table public.trophies (
  id text primary key,
  name text not null,
  description text,
  tier tier not null default 'common',
  hidden bool not null default false
);

-- ============================================
-- 11. user_trophies
-- ============================================
create table public.user_trophies (
  user_id uuid not null references auth.users(id) on delete cascade,
  trophy_id text not null references public.trophies(id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, trophy_id)
);

-- ============================================
-- 12. ai_messages  (Claude 호출 로그)
-- ============================================
create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind ai_kind not null,
  model text not null,
  prompt_tokens int,
  completion_tokens int,
  cost_usd numeric(10,6),
  request_payload jsonb,
  response_text text,
  created_at timestamptz not null default now()
);
create index ai_messages_user_kind_idx on public.ai_messages (user_id, kind, created_at desc);

-- ============================================
-- 13. learning_sessions
-- ============================================
create table public.learning_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_id text not null references public.skills(id),
  duration_sec int not null,
  created_at timestamptz not null default now()
);

-- ============================================
-- 14. kis_tokens  (한국투자증권 OAuth 토큰 캐시)
-- ============================================
create table public.kis_tokens (
  env text primary key,            -- 'real' | 'paper'
  access_token text not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

-- ============================================
-- RLS  (Row Level Security)
-- ============================================
alter table public.profiles        enable row level security;
alter table public.characters      enable row level security;
alter table public.user_skills     enable row level security;
alter table public.trades          enable row level security;
alter table public.positions       enable row level security;
alter table public.daily_missions  enable row level security;
alter table public.streak_logs     enable row level security;
alter table public.user_trophies   enable row level security;
alter table public.ai_messages     enable row level security;
alter table public.learning_sessions enable row level security;
alter table public.kis_tokens      enable row level security;

-- 본인 행만 read/write
create policy "self_select" on public.profiles for select using (auth.uid() = user_id);
create policy "self_modify" on public.profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "self_select" on public.characters for select using (auth.uid() = user_id);
create policy "self_modify" on public.characters for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "self_select" on public.user_skills for select using (auth.uid() = user_id);
create policy "self_modify" on public.user_skills for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "self_select" on public.trades for select using (auth.uid() = user_id);
create policy "self_modify" on public.trades for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "self_select" on public.positions for select using (auth.uid() = user_id);
create policy "self_modify" on public.positions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "self_select" on public.daily_missions for select using (auth.uid() = user_id);
create policy "self_modify" on public.daily_missions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "self_select" on public.streak_logs for select using (auth.uid() = user_id);
create policy "self_modify" on public.streak_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "self_select" on public.user_trophies for select using (auth.uid() = user_id);
create policy "self_modify" on public.user_trophies for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "self_select" on public.ai_messages for select using (auth.uid() = user_id);
create policy "self_modify" on public.ai_messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "self_select" on public.learning_sessions for select using (auth.uid() = user_id);
create policy "self_modify" on public.learning_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- kis_tokens 는 service_role 만 접근 (개인용 단일 키)
create policy "service_only" on public.kis_tokens for all using (false) with check (false);

-- 공개 읽기 (모두 선택 가능)
alter table public.skills  enable row level security;
alter table public.stocks  enable row level security;
alter table public.trophies enable row level security;
create policy "public_read" on public.skills   for select using (true);
create policy "public_read" on public.stocks   for select using (true);
create policy "public_read" on public.trophies for select using (true);

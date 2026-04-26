-- 0002: 사용자 설정 + 일일 퀘스트 자동 생성 함수
-- 멱등(idempotent) — 여러 번 실행해도 안전.

-- ============================================
-- user_settings  (1:1 with auth.users)
-- ============================================
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  kis_personal_mode bool not null default false,
  default_market text not null default 'KRX',
  ui_theme text not null default 'light',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

drop policy if exists "self_select" on public.user_settings;
drop policy if exists "self_modify" on public.user_settings;
create policy "self_select" on public.user_settings for select using (auth.uid() = user_id);
create policy "self_modify" on public.user_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================
-- 일일 퀘스트 자동 시드 함수
-- ============================================
create or replace function public.ensure_daily_missions(p_user_id uuid, p_date date)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.daily_missions (user_id, date, code, title, exp_reward)
  values
    (p_user_id, p_date, 'read_briefing',     '오늘의 시장 브리핑 읽기',  30),
    (p_user_id, p_date, 'trade_with_reason', '매매 1회 + 진입 근거 작성', 40),
    (p_user_id, p_date, 'study_5min',        '스킬 학습 5분',            30)
  on conflict (user_id, date, code) do nothing;
end;
$$;

-- ============================================
-- EXP / 레벨업
-- ============================================
create or replace function public.add_exp(p_user_id uuid, p_amount int)
returns table(new_level int, new_exp int, leveled_up bool)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_level int;
  v_exp int;
  v_threshold int;
  v_leveled bool := false;
begin
  select level, exp into v_level, v_exp from public.characters where user_id = p_user_id;
  v_exp := v_exp + p_amount;
  v_threshold := v_level * 1000;
  while v_exp >= v_threshold loop
    v_exp := v_exp - v_threshold;
    v_level := v_level + 1;
    v_threshold := v_level * 1000;
    v_leveled := true;
  end loop;

  update public.characters
     set level = v_level, exp = v_exp, updated_at = now()
   where user_id = p_user_id;

  new_level := v_level;
  new_exp := v_exp;
  leveled_up := v_leveled;
  return next;
end;
$$;

-- ============================================
-- 출석 + 스트릭
-- ============================================
create or replace function public.touch_streak(p_user_id uuid, p_date date)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_was_new bool;
  v_yesterday_exists bool;
  v_streak int;
begin
  -- 오늘 첫 출석인지
  insert into public.streak_logs (user_id, date) values (p_user_id, p_date)
    on conflict (user_id, date) do nothing
  returning true into v_was_new;

  if v_was_new is true then
    select exists (
      select 1 from public.streak_logs
       where user_id = p_user_id and date = p_date - interval '1 day'
    ) into v_yesterday_exists;

    if v_yesterday_exists then
      update public.characters
         set streak_days = streak_days + 1, updated_at = now()
       where user_id = p_user_id;
    else
      update public.characters
         set streak_days = 1, updated_at = now()
       where user_id = p_user_id;
    end if;
  end if;

  select streak_days into v_streak from public.characters where user_id = p_user_id;
  return coalesce(v_streak, 0);
end;
$$;

grant execute on function public.ensure_daily_missions(uuid, date) to authenticated;
grant execute on function public.add_exp(uuid, int) to authenticated;
grant execute on function public.touch_streak(uuid, date) to authenticated;

-- =====================================================================
-- Stroke3D — Supabase schema
-- รันสคริปต์นี้ใน Supabase SQL Editor (ทำครั้งเดียว)
-- =====================================================================

-- 1) PROFILES (1 ต่อ 1 กับ auth.users)
create table if not exists public.profiles (
    id           uuid primary key references auth.users(id) on delete cascade,
    email        text,
    full_name    text,
    avatar_url   text,
    locale       text default 'th',
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now()
);

-- 2) USER SETTINGS (theme + ขนาดตัวอักษร + ฯลฯ ต่อบัญชี ใช้ได้ข้ามอุปกรณ์)
create table if not exists public.user_settings (
    user_id        uuid primary key references auth.users(id) on delete cascade,
    theme          text not null default 'dark' check (theme in ('light','dark')),
    text_scale     numeric not null default 1.0 check (text_scale between 0.75 and 1.75),
    audio_enabled  boolean not null default true,
    reduced_motion boolean not null default false,
    updated_at     timestamptz not null default now()
);

-- 3) USER PROGRESS (รวมความคืบหน้า, fav scene, completion)
create table if not exists public.user_progress (
    user_id          uuid primary key references auth.users(id) on delete cascade,
    last_scene       int  not null default 0,
    max_scene        int  not null default 0,
    total_completed  int  not null default 0,
    last_seen_at     timestamptz not null default now(),
    updated_at       timestamptz not null default now()
);

-- 4) STREAKS (ความต่อเนื่องการเข้าแอป/เล่นเกม)
create table if not exists public.user_streaks (
    user_id          uuid primary key references auth.users(id) on delete cascade,
    current_streak   int not null default 0,
    longest_streak   int not null default 0,
    last_active_date date,
    updated_at       timestamptz not null default now()
);

-- 5) ACTIVITY LOG (ประวัติการเล่น/กิจกรรมในแอป)
create table if not exists public.user_activities (
    id          bigserial primary key,
    user_id     uuid not null references auth.users(id) on delete cascade,
    type        text not null,                 -- 'scene_view','game_play','login','setting_change' ฯลฯ
    payload     jsonb not null default '{}'::jsonb,
    created_at  timestamptz not null default now()
);
create index if not exists user_activities_user_idx
    on public.user_activities (user_id, created_at desc);

-- =====================================================================
-- ROW LEVEL SECURITY: เปิดทุกตาราง และให้ผู้ใช้เห็น/แก้ไขเฉพาะของตัวเอง
-- =====================================================================
alter table public.profiles        enable row level security;
alter table public.user_settings   enable row level security;
alter table public.user_progress   enable row level security;
alter table public.user_streaks    enable row level security;
alter table public.user_activities enable row level security;

-- profiles
drop policy if exists "profiles self read"   on public.profiles;
drop policy if exists "profiles self upsert" on public.profiles;
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self read"   on public.profiles for select using (auth.uid() = id);
create policy "profiles self upsert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles self update" on public.profiles for update using (auth.uid() = id);

-- user_settings
drop policy if exists "settings self read"   on public.user_settings;
drop policy if exists "settings self upsert" on public.user_settings;
drop policy if exists "settings self update" on public.user_settings;
create policy "settings self read"   on public.user_settings for select using (auth.uid() = user_id);
create policy "settings self upsert" on public.user_settings for insert with check (auth.uid() = user_id);
create policy "settings self update" on public.user_settings for update using (auth.uid() = user_id);

-- user_progress
drop policy if exists "progress self read"   on public.user_progress;
drop policy if exists "progress self upsert" on public.user_progress;
drop policy if exists "progress self update" on public.user_progress;
create policy "progress self read"   on public.user_progress for select using (auth.uid() = user_id);
create policy "progress self upsert" on public.user_progress for insert with check (auth.uid() = user_id);
create policy "progress self update" on public.user_progress for update using (auth.uid() = user_id);

-- user_streaks
drop policy if exists "streaks self read"   on public.user_streaks;
drop policy if exists "streaks self upsert" on public.user_streaks;
drop policy if exists "streaks self update" on public.user_streaks;
create policy "streaks self read"   on public.user_streaks for select using (auth.uid() = user_id);
create policy "streaks self upsert" on public.user_streaks for insert with check (auth.uid() = user_id);
create policy "streaks self update" on public.user_streaks for update using (auth.uid() = user_id);

-- user_activities
drop policy if exists "activities self read"   on public.user_activities;
drop policy if exists "activities self insert" on public.user_activities;
create policy "activities self read"   on public.user_activities for select using (auth.uid() = user_id);
create policy "activities self insert" on public.user_activities for insert with check (auth.uid() = user_id);

-- =====================================================================
-- TRIGGER: auto-create profile + default rows ทุกครั้งที่มีผู้ใช้ใหม่
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
      new.raw_user_meta_data->>'avatar_url'
    )
    on conflict (id) do nothing;

  insert into public.user_settings (user_id) values (new.id) on conflict do nothing;
  insert into public.user_progress (user_id) values (new.id) on conflict do nothing;
  insert into public.user_streaks  (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- RPC: อัปเดต streak อย่างถูกต้อง (atomic) ทุกครั้งที่ผู้ใช้เปิดแอป
-- =====================================================================
create or replace function public.touch_streak()
returns public.user_streaks
language plpgsql
security definer
set search_path = public
as $$
declare
  uid       uuid := auth.uid();
  rec       public.user_streaks;
  today     date := (now() at time zone 'utc')::date;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  insert into public.user_streaks (user_id, current_streak, longest_streak, last_active_date)
    values (uid, 1, 1, today)
    on conflict (user_id) do nothing;

  select * into rec from public.user_streaks where user_id = uid;

  if rec.last_active_date is null then
    update public.user_streaks
       set current_streak = 1,
           longest_streak = greatest(longest_streak, 1),
           last_active_date = today,
           updated_at = now()
     where user_id = uid
     returning * into rec;
  elsif rec.last_active_date = today then
    -- already counted today, nothing to do
    null;
  elsif rec.last_active_date = today - interval '1 day' then
    update public.user_streaks
       set current_streak = current_streak + 1,
           longest_streak = greatest(longest_streak, current_streak + 1),
           last_active_date = today,
           updated_at = now()
     where user_id = uid
     returning * into rec;
  else
    update public.user_streaks
       set current_streak = 1,
           last_active_date = today,
           updated_at = now()
     where user_id = uid
     returning * into rec;
  end if;

  return rec;
end;
$$;

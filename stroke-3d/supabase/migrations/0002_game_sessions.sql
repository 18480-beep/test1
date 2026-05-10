-- =====================================================================
-- Game Sessions & Results — บันทึกผลเล่นเกม (BEAT SLASH, Brain Game)
-- =====================================================================

-- 6) GAME SESSIONS (บันทึกแต่ละครั้งที่เล่นเกม)
create table if not exists public.game_sessions (
    id              bigserial primary key,
    user_id         uuid not null references auth.users(id) on delete cascade,
    game_type       text not null,                          -- 'beat_slash', 'brain_game'
    session_date    date not null,                          -- วันที่เล่น (UTC)
    
    -- ผลเล่นทั่วไป
    score           int not null default 0,                 -- คะแนนรวม
    duration_sec    int not null default 0,                 -- ระยะเวลาเล่น (วินาที)
    completed       boolean not null default false,         -- จบเกมหรือไม่
    
    -- BEAT SLASH specific
    hit_count       int default 0,                          -- ตีติดต่อกันกี่ครั้ง
    miss_count      int default 0,                          -- พลาดกี่ครั้ง
    combo           int default 0,                          -- combo สูงสุด
    accuracy        numeric default 0,                      -- ความถูกต้อง (0-100%)
    
    -- Hand tracking metrics
    left_hand_score numeric default 0,                      -- คะแนนมือซ้าย (0-100)
    right_hand_score numeric default 0,                     -- คะแนนมือขวา (0-100)
    response_time_ms numeric default 0,                     -- ความตอบสนอง (milliseconds)
    
    -- Overall metrics
    responsiveness  numeric default 0,                      -- ร้อยละความตอบสนอง (0-100)
    left_arm_quality text default 'normal',                 -- 'excellent', 'good', 'normal', 'poor'
    right_arm_quality text default 'normal',                -- 'excellent', 'good', 'normal', 'poor'
    
    -- เพิ่มเติม
    raw_data        jsonb not null default '{}'::jsonb,     -- ข้อมูลดิบอื่นๆ
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create index if not exists game_sessions_user_idx
    on public.game_sessions (user_id, session_date desc);
create index if not exists game_sessions_date_idx
    on public.game_sessions (user_id, session_date, game_type);

-- 7) DAILY SUMMARIES (สรุปรายวัน — ทั้งสองเกม)
create table if not exists public.daily_summaries (
    id              bigserial primary key,
    user_id         uuid not null references auth.users(id) on delete cascade,
    summary_date    date not null,                          -- วันที่สรุป
    
    -- สรุปทั่วไป
    games_played    int not null default 0,                 -- เล่นกี่เกม
    total_score     int not null default 0,                 -- คะแนนรวม
    avg_accuracy    numeric default 0,                      -- ความถูกต้องเฉลี่ย
    
    -- มือซ้าย/ขวา
    avg_left_score  numeric default 0,
    avg_right_score numeric default 0,
    avg_responsiveness numeric default 0,                   -- ความตอบสนองเฉลี่ย
    
    -- สรุปคุณภาพ
    left_arm_status text default 'normal',                  -- สำเร็จ/normal/poor
    right_arm_status text default 'normal',
    
    -- บันทึกการทำให้เสร็จ
    is_complete     boolean not null default false,         -- ครบ 7 วันแล้วไหม
    
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    
    unique(user_id, summary_date)
);

create index if not exists daily_summaries_user_idx
    on public.daily_summaries (user_id, summary_date desc);

-- 8) CERTIFICATIONS (ใบรับรองหลังครบ 7 วัน)
create table if not exists public.user_certifications (
    id              bigserial primary key,
    user_id         uuid not null references auth.users(id) on delete cascade unique,
    
    -- ข้อมูล 7 วัน
    period_start    date not null,
    period_end      date not null,
    total_games     int not null default 0,
    total_score     int not null default 0,
    avg_accuracy    numeric default 0,
    avg_responsiveness numeric default 0,
    
    -- คุณภาพ
    overall_performance text,                               -- 'excellent', 'very_good', 'good', etc.
    
    -- cert code
    cert_code       text unique,                            -- สำหรับ QR code / verification
    
    issued_at       timestamptz not null default now()
);

create index if not exists certifications_user_idx
    on public.user_certifications (user_id);
create index if not exists certifications_cert_code_idx
    on public.user_certifications (cert_code);

-- =====================================================================
-- ROW LEVEL SECURITY: game_sessions, daily_summaries, certifications
-- =====================================================================
alter table public.game_sessions enable row level security;
alter table public.daily_summaries enable row level security;
alter table public.user_certifications enable row level security;

-- game_sessions
drop policy if exists "game_sessions self" on public.game_sessions;
create policy "game_sessions self"
    on public.game_sessions
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- daily_summaries
drop policy if exists "summaries self" on public.daily_summaries;
create policy "summaries self"
    on public.daily_summaries
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- certifications
drop policy if exists "certifications self read" on public.user_certifications;
drop policy if exists "certifications self insert" on public.user_certifications;
create policy "certifications self read"
    on public.user_certifications for select
    using (auth.uid() = user_id);
create policy "certifications self insert"
    on public.user_certifications for insert
    with check (auth.uid() = user_id);

-- =====================================================================
-- FUNCTION: บันทึก game session + update daily summary อัตโนมัติ
-- =====================================================================
create or replace function public.save_game_session(
    p_game_type text,
    p_score int,
    p_duration_sec int,
    p_hit_count int default 0,
    p_miss_count int default 0,
    p_combo int default 0,
    p_accuracy numeric default 0,
    p_left_hand_score numeric default 0,
    p_right_hand_score numeric default 0,
    p_response_time_ms numeric default 0,
    p_raw_data jsonb default '{}'::jsonb
)
returns table(session_id bigint, daily_summary_id bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user_id uuid;
    v_today date;
    v_session_id bigint;
    v_summary_id bigint;
    v_responsiveness numeric;
    v_left_quality text;
    v_right_quality text;
begin
    v_user_id := auth.uid();
    if v_user_id is null then
        raise exception 'not authenticated';
    end if;
    
    v_today := (now() at time zone 'utc')::date;
    
    -- คำนวณ metrics
    v_responsiveness := case
        when p_response_time_ms <= 300 then 95
        when p_response_time_ms <= 500 then 85
        when p_response_time_ms <= 800 then 70
        else 50
    end;
    
    v_left_quality := case
        when p_left_hand_score >= 85 then 'excellent'
        when p_left_hand_score >= 70 then 'good'
        when p_left_hand_score >= 50 then 'normal'
        else 'poor'
    end;
    
    v_right_quality := case
        when p_right_hand_score >= 85 then 'excellent'
        when p_right_hand_score >= 70 then 'good'
        when p_right_hand_score >= 50 then 'normal'
        else 'poor'
    end;
    
    -- บันทึก session
    insert into public.game_sessions (
        user_id, game_type, session_date, score, duration_sec,
        completed, hit_count, miss_count, combo, accuracy,
        left_hand_score, right_hand_score, response_time_ms,
        responsiveness, left_arm_quality, right_arm_quality,
        raw_data
    ) values (
        v_user_id, p_game_type, v_today, p_score, p_duration_sec,
        true, p_hit_count, p_miss_count, p_combo, p_accuracy,
        p_left_hand_score, p_right_hand_score, p_response_time_ms,
        v_responsiveness, v_left_quality, v_right_quality,
        p_raw_data
    )
    returning id into v_session_id;
    
    -- Update หรือ insert daily summary
    insert into public.daily_summaries (
        user_id, summary_date, games_played, total_score,
        avg_accuracy, avg_left_score, avg_right_score,
        avg_responsiveness, left_arm_status, right_arm_status
    ) values (
        v_user_id, v_today, 1, p_score,
        p_accuracy, p_left_hand_score, p_right_hand_score,
        v_responsiveness, v_left_quality, v_right_quality
    )
    on conflict (user_id, summary_date) do update set
        games_played = daily_summaries.games_played + 1,
        total_score = daily_summaries.total_score + p_score,
        avg_accuracy = (daily_summaries.avg_accuracy * (daily_summaries.games_played - 1) + p_accuracy) / daily_summaries.games_played,
        avg_left_score = (daily_summaries.avg_left_score * (daily_summaries.games_played - 1) + p_left_hand_score) / daily_summaries.games_played,
        avg_right_score = (daily_summaries.avg_right_score * (daily_summaries.games_played - 1) + p_right_hand_score) / daily_summaries.games_played,
        avg_responsiveness = (daily_summaries.avg_responsiveness * (daily_summaries.games_played - 1) + v_responsiveness) / daily_summaries.games_played,
        updated_at = now()
    returning id into v_summary_id;
    
    return query select v_session_id, v_summary_id;
end;
$$;

-- =====================================================================
-- FUNCTION: ตรวจสอบ 7 วันและออกใบรับรอง
-- =====================================================================
create or replace function public.check_and_issue_certification()
returns table(certification_issued boolean, message text)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user_id uuid;
    v_days_count int;
    v_period_start date;
    v_period_end date;
    v_total_games int;
    v_total_score int;
    v_avg_accuracy numeric;
    v_avg_resp numeric;
    v_performance text;
    v_cert_code text;
begin
    v_user_id := auth.uid();
    if v_user_id is null then
        raise exception 'not authenticated';
    end if;
    
    -- นับวันที่มีการเล่นเกม (ไม่จำเป็นต้องเป็น 7 วันติดต่อ)
    v_days_count := (
        select count(distinct summary_date)
        from public.daily_summaries
        where user_id = v_user_id
    );
    
    -- ถ้ายังไม่ครบ 7 วัน return false
    if v_days_count < 7 then
        return query select false, 'ยังไม่ครบ 7 วัน (' || v_days_count::text || '/7)';
        return;
    end if;
    
    -- ตรวจสอบว่าออกใบรับรองแล้วหรือไม่
    if exists (select 1 from public.user_certifications where user_id = v_user_id) then
        return query select false, 'ได้ออกใบรับรองแล้ว';
        return;
    end if;
    
    -- คำนวณเมตริกส์
    select
        min(summary_date), max(summary_date),
        sum(games_played), sum(total_score),
        avg(avg_accuracy), avg(avg_responsiveness)
    into v_period_start, v_period_end, v_total_games, v_total_score, v_avg_accuracy, v_avg_resp
    from public.daily_summaries
    where user_id = v_user_id
    and summary_date >= (now()::date - interval '30 days')::date
    limit 7;
    
    -- กำหนดคุณภาพ
    v_performance := case
        when v_avg_accuracy >= 90 and v_avg_resp >= 90 then 'excellent'
        when v_avg_accuracy >= 80 and v_avg_resp >= 80 then 'very_good'
        when v_avg_accuracy >= 70 and v_avg_resp >= 70 then 'good'
        when v_avg_accuracy >= 60 and v_avg_resp >= 60 then 'satisfactory'
        else 'needs_improvement'
    end;
    
    -- สร้าง cert code
    v_cert_code := 'CERT-' || upper(substring(encode(gen_random_bytes(4), 'hex'), 1, 8)) || '-' || to_char(now(), 'YYYY');
    
    -- บันทึกใบรับรอง
    insert into public.user_certifications (
        user_id, period_start, period_end, total_games, total_score,
        avg_accuracy, avg_responsiveness, overall_performance, cert_code
    ) values (
        v_user_id, v_period_start, v_period_end, v_total_games, v_total_score,
        v_avg_accuracy, v_avg_resp, v_performance, v_cert_code
    );
    
    return query select true, 'ออกใบรับรองสำเร็จ! Code: ' || v_cert_code;
end;
$$;

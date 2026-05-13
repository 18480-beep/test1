-- =====================================================================
-- Speech Stage Progress
-- Stores per-user progress for client/public/game/NEW.html.
-- =====================================================================

create table if not exists public.speech_stage_progress (
    user_id        uuid not null references auth.users(id) on delete cascade,
    stage_id       text not null,
    chapter_id     int,
    stage_level    int,
    stage_name     text,
    stars          int not null default 0 check (stars between 0 and 3),
    best_accuracy  numeric not null default 0 check (best_accuracy between 0 and 100),
    attempts       int not null default 0,
    cleared        boolean not null default true,
    last_played_at timestamptz not null default now(),
    raw_data       jsonb not null default '{}'::jsonb,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now(),
    primary key (user_id, stage_id)
);

create index if not exists speech_stage_progress_user_idx
    on public.speech_stage_progress (user_id, last_played_at desc);

alter table public.speech_stage_progress enable row level security;

drop policy if exists "speech progress self read" on public.speech_stage_progress;
drop policy if exists "speech progress self insert" on public.speech_stage_progress;
drop policy if exists "speech progress self update" on public.speech_stage_progress;

create policy "speech progress self read"
    on public.speech_stage_progress for select
    using (auth.uid() = user_id);

create policy "speech progress self insert"
    on public.speech_stage_progress for insert
    with check (auth.uid() = user_id);

create policy "speech progress self update"
    on public.speech_stage_progress for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create or replace function public.save_speech_stage_progress(
    p_stage_id text,
    p_chapter_id int default null,
    p_stage_level int default null,
    p_stage_name text default null,
    p_stars int default 0,
    p_accuracy numeric default 0,
    p_raw_data jsonb default '{}'::jsonb
)
returns public.speech_stage_progress
language plpgsql
security definer
set search_path = public
as $$
declare
    uid uuid := auth.uid();
    rec public.speech_stage_progress;
begin
    if uid is null then
        raise exception 'not authenticated';
    end if;

    insert into public.speech_stage_progress (
        user_id,
        stage_id,
        chapter_id,
        stage_level,
        stage_name,
        stars,
        best_accuracy,
        attempts,
        cleared,
        last_played_at,
        raw_data
    ) values (
        uid,
        p_stage_id,
        p_chapter_id,
        p_stage_level,
        p_stage_name,
        least(greatest(coalesce(p_stars, 0), 0), 3),
        least(greatest(coalesce(p_accuracy, 0), 0), 100),
        1,
        true,
        now(),
        coalesce(p_raw_data, '{}'::jsonb)
    )
    on conflict (user_id, stage_id) do update set
        chapter_id = coalesce(excluded.chapter_id, speech_stage_progress.chapter_id),
        stage_level = coalesce(excluded.stage_level, speech_stage_progress.stage_level),
        stage_name = coalesce(excluded.stage_name, speech_stage_progress.stage_name),
        stars = greatest(speech_stage_progress.stars, excluded.stars),
        best_accuracy = greatest(speech_stage_progress.best_accuracy, excluded.best_accuracy),
        attempts = speech_stage_progress.attempts + 1,
        cleared = true,
        last_played_at = now(),
        raw_data = excluded.raw_data,
        updated_at = now()
    returning * into rec;

    return rec;
end;
$$;

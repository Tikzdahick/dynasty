-- ============================================================================
-- Phase 3: real leaderboard. Result tables + RLS, plus a trigger that forces the
-- stored username to the submitter's real profile display_name (no impersonation,
-- no matter what the client sends). Run in the Supabase SQL editor. Idempotent.
-- ============================================================================

create table if not exists public.nba_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  username text not null,
  wins int not null,
  losses int not null,
  players text[] not null,
  rating numeric not null,
  chemistry text,
  created_at timestamptz not null default now()
);

create table if not exists public.soccer_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  username text not null,
  result text not null,
  players text[] not null,
  formation text not null,
  rating numeric not null,
  chemistry text,
  created_at timestamptz not null default now()
);

create index if not exists nba_results_wins_idx on public.nba_results (wins desc);
create index if not exists soccer_results_created_idx on public.soccer_results (created_at desc);

alter table public.nba_results enable row level security;
alter table public.soccer_results enable row level security;

-- Anyone can read the leaderboard.
drop policy if exists "nba public read" on public.nba_results;
drop policy if exists "soccer public read" on public.soccer_results;
create policy "nba public read"    on public.nba_results    for select using (true);
create policy "soccer public read" on public.soccer_results for select using (true);

-- Authenticated users can insert only rows for themselves.
drop policy if exists "nba insert own" on public.nba_results;
drop policy if exists "soccer insert own" on public.soccer_results;
create policy "nba insert own"    on public.nba_results    for insert with check (auth.uid() = user_id);
create policy "soccer insert own" on public.soccer_results for insert with check (auth.uid() = user_id);

-- Force the displayed name to the submitter's real profile name. A client can't
-- post under someone else's name, or a made-up one, once logged in.
create or replace function public.set_result_username()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.user_id is not null then
    new.username := coalesce(
      (select display_name from public.profiles where user_id = new.user_id),
      new.username
    );
  end if;
  return new;
end; $$;

drop trigger if exists nba_results_set_username on public.nba_results;
create trigger nba_results_set_username
  before insert on public.nba_results
  for each row execute function public.set_result_username();

drop trigger if exists soccer_results_set_username on public.soccer_results;
create trigger soccer_results_set_username
  before insert on public.soccer_results
  for each row execute function public.set_result_username();

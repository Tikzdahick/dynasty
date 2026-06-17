-- Dynasty — Supabase schema
-- Run this in the Supabase SQL editor (or via the CLI) to enable cloud leaderboards.

-- ---------- NBA results ----------
create table if not exists public.nba_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  username text not null,
  wins int not null,
  losses int not null,
  players text[] not null,
  rating numeric not null,
  chemistry text,
  created_at timestamptz not null default now()
);

create index if not exists nba_results_wins_idx on public.nba_results (wins desc);
create index if not exists nba_results_created_idx on public.nba_results (created_at desc);

-- ---------- Soccer results ----------
create table if not exists public.soccer_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  username text not null,
  result text not null,
  players text[] not null,
  formation text not null,
  rating numeric not null,
  chemistry text,
  created_at timestamptz not null default now()
);

create index if not exists soccer_results_created_idx on public.soccer_results (created_at desc);

-- ---------- Row Level Security ----------
alter table public.nba_results enable row level security;
alter table public.soccer_results enable row level security;

-- Anyone can read the leaderboard.
create policy "nba public read" on public.nba_results
  for select using (true);
create policy "soccer public read" on public.soccer_results
  for select using (true);

-- Authenticated users can insert their own rows.
create policy "nba insert own" on public.nba_results
  for insert with check (auth.uid() = user_id);
create policy "soccer insert own" on public.soccer_results
  for insert with check (auth.uid() = user_id);

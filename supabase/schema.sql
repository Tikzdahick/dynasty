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

-- ---------- NBA players (headshots) ----------
-- NOTE: the running app currently reads its roster from the static array in
-- src/lib/nba/players.ts, NOT from this table. This is defined here so that
-- `nba_player_id` (the NBA.com person id used to build headshot URLs,
-- https://cdn.nba.com/headshots/nba/latest/1040x760/<nba_player_id>.png) has a
-- home if/when the roster moves into Supabase. Safe to run; nothing depends on it yet.
create table if not exists public.nba_players (
  id text primary key,                 -- slug id, matches NbaPlayer.id in the app
  name text not null,
  era text,
  position text,
  ppg numeric,
  rpg numeric,
  apg numeric,
  overall int not null,
  cost int,
  nba_player_id int,                   -- nullable: not every player has one yet
  created_at timestamptz not null default now()
);

-- If the table already exists from an earlier run, make sure the column is present.
alter table public.nba_players add column if not exists nba_player_id int;

-- ---------- Soccer players (headshots) ----------
-- NOTE: like nba_players above, the running app currently reads its soccer roster
-- from the static array in src/lib/soccer/players.ts, NOT from this table. This is
-- defined here so that `espn_player_id` (the ESPN player id used to build headshot
-- URLs, https://a.espncdn.com/i/headshots/soccer/players/full/<espn_player_id>.png)
-- has a home if/when the roster moves into Supabase. Safe to run; nothing depends on it yet.
create table if not exists public.soccer_players (
  id text primary key,                 -- slug id, matches SoccerPlayer.id in the app
  name text not null,
  country text,
  era text,
  position text,
  pace int,
  shooting int,
  passing int,
  defending int,
  overall int not null,
  cost int,
  espn_player_id int,                  -- nullable: not every player has one yet
  created_at timestamptz not null default now()
);

-- If the table already exists from an earlier run, make sure the column is present.
alter table public.soccer_players add column if not exists espn_player_id int;

-- ---------- Redeem codes ----------
-- NOTE: the app currently uses a no-backend implementation — codes live in
-- src/lib/redeem/codes.ts and per-browser redemptions in localStorage. These
-- tables are the target schema for a real, shared, admin-editable code system
-- once Supabase is configured. `reward_type` matches the in-game currency name
-- ("coins"). Safe to run; nothing reads from these yet.
create table if not exists public.redeem_codes (
  code text primary key,               -- the code players type, e.g. "2040"
  reward_amount int not null,
  reward_type text not null default 'coins',
  max_uses int,                        -- nullable: null = unlimited
  times_used int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Per-user redemptions, so the same user can't redeem a code twice. Without
-- login there's no auth.uid(); `user_ref` would hold an anonymous browser id.
create table if not exists public.code_redemptions (
  id uuid primary key default gen_random_uuid(),
  code text not null references public.redeem_codes (code) on delete cascade,
  user_ref text not null,              -- auth.uid() when logged in, else anon browser id
  redeemed_at timestamptz not null default now(),
  unique (code, user_ref)              -- enforces one redemption per user per code
);

-- Seed the launch code: 2040 -> 100,000 coins, unlimited, active.
insert into public.redeem_codes (code, reward_amount, reward_type, max_uses, active)
values ('2040', 100000, 'coins', null, true)
on conflict (code) do nothing;

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

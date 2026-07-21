-- ============================================================================
-- Phase 2: server-authoritative data model (coins, cards, squads)
-- Run this in the Supabase SQL editor. Idempotent (safe to re-run).
-- ============================================================================

-- ---- coin balances: one row per (user, sport). Read-own only; the balance
-- column is NEVER written by clients directly — only via adjust_coins().
create table if not exists public.coin_balances (
  user_id uuid not null references auth.users(id) on delete cascade,
  sport text not null check (sport in ('nba','soccer')),
  balance int not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, sport)
);
alter table public.coin_balances enable row level security;
drop policy if exists "balances read own" on public.coin_balances;
create policy "balances read own" on public.coin_balances
  for select using (auth.uid() = user_id);
-- (no insert/update/delete policies => clients cannot write balances directly)

-- ---- owned cards: one row per copy, keyed by the client instance id (iid).
create table if not exists public.owned_cards (
  iid text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  sport text not null check (sport in ('nba','soccer')),
  card_id text not null,
  acquired_at timestamptz not null default now()
);
alter table public.owned_cards enable row level security;
drop policy if exists "cards read own"   on public.owned_cards;
drop policy if exists "cards insert own" on public.owned_cards;
drop policy if exists "cards delete own" on public.owned_cards;
create policy "cards read own"   on public.owned_cards for select using (auth.uid() = user_id);
create policy "cards insert own" on public.owned_cards for insert with check (auth.uid() = user_id);
create policy "cards delete own" on public.owned_cards for delete using (auth.uid() = user_id);
create index if not exists owned_cards_user_sport_idx on public.owned_cards (user_id, sport);

-- ---- squads: one per (user, sport).
create table if not exists public.squads (
  user_id uuid not null references auth.users(id) on delete cascade,
  sport text not null check (sport in ('nba','soccer')),
  formation text,
  starters jsonb not null default '[]'::jsonb,
  bench jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, sport)
);
alter table public.squads enable row level security;
drop policy if exists "squads read own"   on public.squads;
drop policy if exists "squads insert own" on public.squads;
drop policy if exists "squads update own" on public.squads;
create policy "squads read own"   on public.squads for select using (auth.uid() = user_id);
create policy "squads insert own" on public.squads for insert with check (auth.uid() = user_id);
create policy "squads update own" on public.squads for update using (auth.uid() = user_id);

-- ---- adjust_coins: the ONLY way a balance changes. Validates >= 0 atomically.
-- Positive delta = credit, negative = spend. Raises on insufficient funds.
create or replace function public.adjust_coins(p_sport text, p_delta int)
returns int language plpgsql security definer set search_path = public as $$
declare cur int; new_bal int;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if p_sport not in ('nba','soccer') then raise exception 'bad sport'; end if;
  insert into public.coin_balances (user_id, sport, balance)
    values (auth.uid(), p_sport, 0)
    on conflict (user_id, sport) do nothing;
  select balance into cur from public.coin_balances
    where user_id = auth.uid() and sport = p_sport for update;
  new_bal := cur + p_delta;
  if new_bal < 0 then raise exception 'insufficient balance'; end if;
  update public.coin_balances set balance = new_bal, updated_at = now()
    where user_id = auth.uid() and sport = p_sport;
  return new_bal;
end; $$;

revoke all on function public.adjust_coins(text, int) from public;
grant execute on function public.adjust_coins(text, int) to authenticated;

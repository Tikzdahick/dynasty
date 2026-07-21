-- Phase 5.3 (step 2): server-authoritative coin rewards for challenges + season.
-- Moves the remaining client-side coin CREDITS (challenge claims, season-pass
-- tier claims) onto the server. The coin amounts live in reward_defs (server
-- owned, so a client can't inflate them) and each claim is deduped in
-- reward_claims. Progress itself is still client-attested (the game runs in the
-- browser) — this closes amount-inflation and same-period replay, and is the
-- prerequisite for locking adjust_coins to deduct-only next.
--
-- Pack/card rewards are NOT here: they don't touch coins, so they keep granting
-- cards on the client (that's the separate card-grant lockdown).
-- Idempotent — safe to re-run.

-- Server-owned coin amounts. Keyed by (source, ref); amounts are identical
-- across sports, so sport is not part of the key.
create table if not exists public.reward_defs (
  source text not null,
  ref    text not null,
  coins  int  not null check (coins > 0),
  primary key (source, ref)
);

-- One row per (user, reward, sport, period). period is '' for one-time rewards
-- (season tiers) and the daily/weekly period key for challenges, so a challenge
-- can be earned again next period but not twice in the same one.
create table if not exists public.reward_claims (
  user_id    uuid not null references auth.users(id) on delete cascade,
  source     text not null,
  ref        text not null,
  sport      text not null check (sport in ('nba','soccer')),
  period     text not null default '',
  claimed_at timestamptz not null default now(),
  primary key (user_id, source, ref, sport, period)
);

alter table public.reward_claims enable row level security;
drop policy if exists "reward claims read own" on public.reward_claims;
create policy "reward claims read own" on public.reward_claims
  for select using (auth.uid() = user_id);

-- Coin amounts for the coin-kind challenges and season tiers.
insert into public.reward_defs (source, ref, coins) values
  ('challenge', 'd_win2',    200),
  ('challenge', 'd_play3',   150),
  ('challenge', 'd_pack1',   150),
  ('challenge', 'd_rival1',  250),
  ('challenge', 'd_upgrade1',150),
  ('challenge', 'w_sell3',  1000),
  ('season', '1',  250),
  ('season', '3',  500),
  ('season', '5',  750),
  ('season', '7', 1000),
  ('season', '9', 1500),
  ('season', '11',2000)
on conflict (source, ref) do update set coins = excluded.coins;

create or replace function public.claim_reward(
  p_source text,
  p_ref    text,
  p_sport  text,
  p_period text default ''
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_coins int;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if p_sport not in ('nba','soccer') then raise exception 'bad sport'; end if;

  -- amount is server-owned; an unknown (source,ref) can't be claimed
  select coins into v_coins from public.reward_defs
    where source = p_source and ref = p_ref;
  if v_coins is null then raise exception 'unknown reward'; end if;

  -- dedup: one claim per (user, reward, sport, period)
  begin
    insert into public.reward_claims (user_id, source, ref, sport, period)
      values (v_uid, p_source, p_ref, p_sport, coalesce(p_period, ''));
  exception when unique_violation then
    raise exception 'already claimed';
  end;

  insert into public.coin_balances (user_id, sport, balance)
    values (v_uid, p_sport, 0)
    on conflict (user_id, sport) do nothing;
  update public.coin_balances
    set balance = balance + v_coins, updated_at = now()
    where user_id = v_uid and sport = p_sport;

  return v_coins;
end;
$$;

revoke all on function public.claim_reward(text,text,text,text) from public, anon;
grant execute on function public.claim_reward(text,text,text,text) to authenticated;

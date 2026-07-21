-- Phase 5.3 (step 1): server-authoritative daily login rewards.
-- Moves the once-per-day claim, the streak, and the coin credit onto the server
-- so a client can no longer re-claim (edit localStorage / re-open the modal) for
-- unlimited coins. The 7-day ladder is fixed and identical for both sports:
--   Day 1: 150c  Day 2: 250c  Day 3: Pro pack  Day 4: 400c
--   Day 5: 600c  Day 6: 800c  Day 7: Gold+ card
-- Coin days are credited server-side here; the pack/card days (3 & 7) return the
-- day so the client grants the cards (card-generation lockdown comes later).
-- Idempotent — safe to re-run.

create table if not exists public.daily_claims (
  user_id    uuid not null references auth.users(id) on delete cascade,
  sport      text not null check (sport in ('nba','soccer')),
  last_claim date,
  streak     int not null default 0,
  best       int not null default 0,
  primary key (user_id, sport)
);

alter table public.daily_claims enable row level security;

-- Read-own only. There is deliberately NO client insert/update policy: the only
-- writer is claim_daily() below (security definer), so streaks can't be forged.
drop policy if exists "daily read own" on public.daily_claims;
create policy "daily read own" on public.daily_claims
  for select using (auth.uid() = user_id);

create or replace function public.claim_daily(p_sport text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_last   date;
  v_streak int;
  v_best   int;
  v_new    int;
  v_day    int;
  v_coins  int;
  -- Day 1..7 coin rewards; 0 = a non-coin (pack/card) day granted client-side.
  v_ladder int[] := array[150, 250, 0, 400, 600, 800, 0];
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if p_sport not in ('nba','soccer') then raise exception 'bad sport'; end if;

  insert into public.daily_claims (user_id, sport) values (v_uid, p_sport)
    on conflict (user_id, sport) do nothing;

  select last_claim, streak, best into v_last, v_streak, v_best
    from public.daily_claims
    where user_id = v_uid and sport = p_sport
    for update;

  -- Server date (UTC) is authoritative; one claim per calendar day.
  if v_last = current_date then
    raise exception 'already claimed today';
  end if;

  if v_last = current_date - 1 then
    v_new := v_streak + 1;          -- consecutive day → extend streak
  else
    v_new := 1;                      -- missed a day (or first ever) → reset
  end if;

  v_day   := ((v_new - 1) % 7) + 1;
  v_coins := v_ladder[v_day];

  update public.daily_claims
    set last_claim = current_date,
        streak     = v_new,
        best       = greatest(v_best, v_new)
    where user_id = v_uid and sport = p_sport;

  if v_coins > 0 then
    insert into public.coin_balances (user_id, sport, balance)
      values (v_uid, p_sport, 0)
      on conflict (user_id, sport) do nothing;
    update public.coin_balances
      set balance = balance + v_coins, updated_at = now()
      where user_id = v_uid and sport = p_sport;
  end if;

  return json_build_object('day', v_day, 'streak', v_new, 'coins', v_coins);
end;
$$;

revoke all on function public.claim_daily(text) from public, anon;
grant execute on function public.claim_daily(text) to authenticated;

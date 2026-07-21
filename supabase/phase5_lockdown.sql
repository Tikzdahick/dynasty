-- Phase 5.3 (final): lock adjust_coins to DEDUCT-ONLY.
-- Every legitimate coin CREDIT now flows through a dedicated server function that
-- owns the amount and dedups the claim:
--   • starting balance  -> grant_starting_coins()  (below, one-time)
--   • daily rewards      -> claim_daily()
--   • challenges/season  -> claim_reward()
--   • redeem codes       -> redeem_code()
--   • auction sale       -> buy_listing() / cancel_listing() (direct transfer)
-- So adjust_coins no longer needs to credit — a positive delta is now rejected.
-- This closes the infinite-coins hole (a logged-in client could previously call
-- adjust_coins with any positive amount to mint coins). Spending is unchanged.
-- Idempotent — safe to re-run.

create or replace function public.adjust_coins(p_sport text, p_delta int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  cur     int;
  new_bal int;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if p_sport not in ('nba','soccer') then raise exception 'bad sport'; end if;

  -- Deduct-only. Credits must go through a dedicated reward/grant function so the
  -- server owns the amount; a client can no longer self-credit here.
  if p_delta > 0 then
    raise exception 'adjust_coins is deduct-only; credits go through server reward functions';
  end if;

  insert into public.coin_balances (user_id, sport, balance)
    values (auth.uid(), p_sport, 0)
    on conflict (user_id, sport) do nothing;

  select balance into cur from public.coin_balances
    where user_id = auth.uid() and sport = p_sport for update;

  new_bal := cur + p_delta;               -- p_delta <= 0
  if new_bal < 0 then raise exception 'insufficient balance'; end if;

  update public.coin_balances set balance = new_bal, updated_at = now()
    where user_id = auth.uid() and sport = p_sport;

  return new_bal;
end;
$$;

-- One-time starting balance for a brand-new account. The amount is server-owned
-- (2500, matching STARTING_COINS) and this only seeds a wallet that doesn't yet
-- exist — a second call (or a spent-down wallet) is a no-op, so it can't be
-- farmed. Called by the first-login migration in place of the old credit.
create or replace function public.grant_starting_coins(p_sport text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_bal   int;
  v_start int := 2500;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if p_sport not in ('nba','soccer') then raise exception 'bad sport'; end if;

  insert into public.coin_balances (user_id, sport, balance)
    values (v_uid, p_sport, v_start)
    on conflict (user_id, sport) do nothing;   -- existing wallet → untouched

  select balance into v_bal from public.coin_balances
    where user_id = v_uid and sport = p_sport;
  return v_bal;
end;
$$;

revoke all on function public.grant_starting_coins(text) from public, anon;
grant execute on function public.grant_starting_coins(text) to authenticated;

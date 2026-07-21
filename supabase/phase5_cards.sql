-- Card-grant lockdown (server side). These SECURITY DEFINER functions are the
-- ONLY way cards enter owned_cards for logged-in users; the card ids are chosen
-- by the server route (which owns the pool + odds), not the client. They take an
-- explicit p_user and are callable ONLY by the service role (the /api/grant
-- route), so a client can't call them to grant cards to itself or others.
-- A later migration revokes the client's direct INSERT on owned_cards, at which
-- point these become the sole grant path. Idempotent — safe to re-run.

-- One-time starter-pack guard (per user, per sport).
create table if not exists public.starter_grants (
  user_id uuid not null references auth.users(id) on delete cascade,
  sport   text not null check (sport in ('nba','soccer')),
  granted_at timestamptz not null default now(),
  primary key (user_id, sport)
);

-- Paid pack: deduct the price and insert the server-generated cards atomically.
create or replace function public.srv_open_pack(
  p_user uuid, p_sport text, p_price int, p_card_ids text[]
) returns int
language plpgsql security definer set search_path = public as $$
declare cur int;
begin
  if p_sport not in ('nba','soccer') then raise exception 'bad sport'; end if;
  insert into public.coin_balances (user_id, sport, balance)
    values (p_user, p_sport, 0) on conflict (user_id, sport) do nothing;
  select balance into cur from public.coin_balances
    where user_id = p_user and sport = p_sport for update;
  if cur < p_price then raise exception 'insufficient balance'; end if;
  update public.coin_balances set balance = cur - p_price, updated_at = now()
    where user_id = p_user and sport = p_sport;
  insert into public.owned_cards (iid, user_id, sport, card_id, acquired_at)
    select gen_random_uuid()::text, p_user, p_sport, cid, now()
    from unnest(p_card_ids) as cid;
  return cur - p_price;
end; $$;

-- Starter pack: free, one-time per (user, sport). Returns true if granted.
create or replace function public.srv_grant_starter(
  p_user uuid, p_sport text, p_card_ids text[]
) returns boolean
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if p_sport not in ('nba','soccer') then raise exception 'bad sport'; end if;
  insert into public.starter_grants (user_id, sport)
    values (p_user, p_sport) on conflict (user_id, sport) do nothing;
  get diagnostics n = row_count;      -- 1 = first time, 0 = already granted
  if n = 0 then return false; end if;
  insert into public.owned_cards (iid, user_id, sport, card_id, acquired_at)
    select gen_random_uuid()::text, p_user, p_sport, cid, now()
    from unnest(p_card_ids) as cid;
  return true;
end; $$;

-- Reward cards (daily day 3/7, weekly challenge cards, season card tiers).
-- Dedups on reward_claims (shared with the coin path) and inserts the cards; no
-- coins involved. Raises 'already claimed' on a duplicate (user,reward,period).
create or replace function public.srv_grant_reward_cards(
  p_user uuid, p_sport text, p_source text, p_ref text, p_period text, p_card_ids text[]
) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if p_sport not in ('nba','soccer') then raise exception 'bad sport'; end if;
  begin
    insert into public.reward_claims (user_id, source, ref, sport, period)
      values (p_user, p_source, p_ref, p_sport, coalesce(p_period, ''));
  exception when unique_violation then
    raise exception 'already claimed';
  end;
  insert into public.owned_cards (iid, user_id, sport, card_id, acquired_at)
    select gen_random_uuid()::text, p_user, p_sport, cid, now()
    from unnest(p_card_ids) as cid;
  return true;
end; $$;

-- Moment purchase: deduct the (server-computed) price and grant one specific
-- card, once per card. Priced buy — no time-window validation.
create or replace function public.srv_buy_moment(
  p_user uuid, p_sport text, p_price int, p_card_id text
) returns int
language plpgsql security definer set search_path = public as $$
declare cur int;
begin
  if p_sport not in ('nba','soccer') then raise exception 'bad sport'; end if;
  if exists (select 1 from public.owned_cards
             where user_id = p_user and sport = p_sport and card_id = p_card_id) then
    raise exception 'already owned';
  end if;
  insert into public.coin_balances (user_id, sport, balance)
    values (p_user, p_sport, 0) on conflict (user_id, sport) do nothing;
  select balance into cur from public.coin_balances
    where user_id = p_user and sport = p_sport for update;
  if cur < p_price then raise exception 'insufficient balance'; end if;
  update public.coin_balances set balance = cur - p_price, updated_at = now()
    where user_id = p_user and sport = p_sport;
  insert into public.owned_cards (iid, user_id, sport, card_id, acquired_at)
    values (gen_random_uuid()::text, p_user, p_sport, p_card_id, now());
  return cur - p_price;
end; $$;

-- Service-role only: revoke from every client role, keep for service_role.
revoke all on function public.srv_open_pack(uuid,text,int,text[])                    from public, anon, authenticated;
revoke all on function public.srv_grant_starter(uuid,text,text[])                    from public, anon, authenticated;
revoke all on function public.srv_grant_reward_cards(uuid,text,text,text,text,text[]) from public, anon, authenticated;
revoke all on function public.srv_buy_moment(uuid,text,int,text)                     from public, anon, authenticated;
grant execute on function public.srv_open_pack(uuid,text,int,text[])                    to service_role;
grant execute on function public.srv_grant_starter(uuid,text,text[])                    to service_role;
grant execute on function public.srv_grant_reward_cards(uuid,text,text,text,text,text[]) to service_role;
grant execute on function public.srv_buy_moment(uuid,text,int,text)                     to service_role;

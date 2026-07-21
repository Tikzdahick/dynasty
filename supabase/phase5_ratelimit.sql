-- Phase 5.4a: server-side rate limiting. A durable per-user sliding-window
-- counter guards the sensitive actions so they can't be scripted/hammered even
-- through the legit routes. Most important: it throttles redeem-code attempts
-- (short codes are brute-forceable). Idempotent — safe to re-run.
--
-- NOTE: rate_limit returns a boolean and does NOT raise, and redeem_code returns
-- a status json instead of raising. This is deliberate: if these raised, the
-- attempt's rate_events row would roll back with the aborted transaction and
-- failed attempts (the brute-force case) would never be counted.

create table if not exists public.rate_events (
  id         bigserial primary key,
  user_id    uuid not null,
  action     text not null,
  created_at timestamptz not null default now()
);
create index if not exists rate_events_lookup
  on public.rate_events (user_id, action, created_at);

-- No RLS policies → clients can't read/write this table directly.
alter table public.rate_events enable row level security;

-- Drop first: these functions change return type (rate_limit void->boolean,
-- redeem_code int->json), which `create or replace` refuses. Drop the callers
-- before rate_limit since they depend on it.
drop function if exists public.redeem_code(text);
drop function if exists public.list_card(text,text,int);
drop function if exists public.buy_listing(uuid);
drop function if exists public.cancel_listing(uuid);
drop function if exists public.rate_limit(uuid,text,int,int);

-- Returns true (and records the attempt) if the user is under the limit for
-- p_action in the last p_window_secs; returns false when over (recording
-- nothing, so the window naturally clears). Never raises. Callable only by the
-- service role (route) and internally by the DEFINER RPCs (owner context).
create or replace function public.rate_limit(
  p_user uuid, p_action text, p_max int, p_window_secs int
) returns boolean
language plpgsql security definer set search_path = public as $$
declare c int;
begin
  if p_user is null then return false; end if;
  delete from public.rate_events
    where user_id = p_user and created_at < now() - interval '2 hours';
  select count(*) into c from public.rate_events
    where user_id = p_user and action = p_action
      and created_at > now() - make_interval(secs => p_window_secs);
  if c >= p_max then return false; end if;
  insert into public.rate_events (user_id, action) values (p_user, p_action);
  return true;
end; $$;

revoke all on function public.rate_limit(uuid,text,int,int) from public, anon, authenticated;
grant execute on function public.rate_limit(uuid,text,int,int) to service_role;

-- redeem_code → returns json {ok, error?, amount?}. Throttled 10 attempts/hour;
-- because it never raises, every attempt (incl. invalid codes) is counted.
create or replace function public.redeem_code(p_code text)
returns json language plpgsql security definer set search_path = public as $$
declare c record; v_uid uuid := auth.uid();
begin
  if v_uid is null then return json_build_object('ok', false, 'error', 'not authenticated'); end if;
  if not public.rate_limit(v_uid, 'redeem', 10, 3600) then
    return json_build_object('ok', false, 'error', 'rate limited');
  end if;
  select * into c from public.redeem_codes where upper(code) = upper(p_code) for update;
  if c is null then return json_build_object('ok', false, 'error', 'invalid code'); end if;
  if not c.active then return json_build_object('ok', false, 'error', 'code inactive'); end if;
  if c.max_uses is not null and c.times_used >= c.max_uses then
    return json_build_object('ok', false, 'error', 'code exhausted'); end if;
  if exists (select 1 from public.code_redemptions where code = c.code and user_id = v_uid) then
    return json_build_object('ok', false, 'error', 'already redeemed'); end if;
  insert into public.code_redemptions (code, user_id) values (c.code, v_uid);
  update public.redeem_codes set times_used = times_used + 1 where code = c.code;
  insert into public.coin_balances (user_id, sport, balance) values (v_uid, 'nba', c.reward_amount)
    on conflict (user_id, sport) do update set balance = public.coin_balances.balance + c.reward_amount, updated_at = now();
  insert into public.coin_balances (user_id, sport, balance) values (v_uid, 'soccer', c.reward_amount)
    on conflict (user_id, sport) do update set balance = public.coin_balances.balance + c.reward_amount, updated_at = now();
  return json_build_object('ok', true, 'amount', c.reward_amount);
end; $$;
revoke all on function public.redeem_code(text) from public;
grant execute on function public.redeem_code(text) to authenticated;

-- Auction RPCs + throttle (60 successful actions / minute). These still raise on
-- error (their callers expect it); the throttle counts the successful actions,
-- which is the case worth limiting (rapid listing/sniping).
create or replace function public.list_card(p_sport text, p_card_iid text, p_price int)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_card_id text; v_listing uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if not public.rate_limit(auth.uid(), 'auction', 60, 60) then raise exception 'rate limited: too many auction actions'; end if;
  if p_price <= 0 then raise exception 'bad price'; end if;
  delete from public.owned_cards where iid=p_card_iid and user_id=auth.uid() and sport=p_sport returning card_id into v_card_id;
  if v_card_id is null then raise exception 'card not owned'; end if;
  insert into public.auction_listings (seller_id, sport, card_iid, card_id, price)
    values (auth.uid(), p_sport, p_card_iid, v_card_id, p_price) returning id into v_listing;
  return v_listing;
end; $$;

create or replace function public.buy_listing(p_listing uuid)
returns void language plpgsql security definer set search_path = public as $$
declare l record; buyer uuid := auth.uid(); bal int;
begin
  if buyer is null then raise exception 'not authenticated'; end if;
  if not public.rate_limit(buyer, 'auction', 60, 60) then raise exception 'rate limited: too many auction actions'; end if;
  select * into l from public.auction_listings where id=p_listing for update;
  if l is null then raise exception 'listing not found'; end if;
  if l.status <> 'active' then raise exception 'listing not available'; end if;
  if l.seller_id = buyer then raise exception 'cannot buy your own listing'; end if;
  insert into public.coin_balances (user_id,sport,balance) values (buyer,l.sport,0) on conflict do nothing;
  select balance into bal from public.coin_balances where user_id=buyer and sport=l.sport for update;
  if bal < l.price then raise exception 'insufficient balance'; end if;
  update public.coin_balances set balance=balance-l.price, updated_at=now() where user_id=buyer and sport=l.sport;
  insert into public.coin_balances (user_id,sport,balance) values (l.seller_id,l.sport,0) on conflict do nothing;
  update public.coin_balances set balance=balance+l.price, updated_at=now() where user_id=l.seller_id and sport=l.sport;
  insert into public.owned_cards (iid,user_id,sport,card_id) values (l.card_iid,buyer,l.sport,l.card_id);
  update public.auction_listings set status='sold', buyer_id=buyer, sold_at=now() where id=p_listing;
end; $$;

create or replace function public.cancel_listing(p_listing uuid)
returns void language plpgsql security definer set search_path = public as $$
declare l record;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if not public.rate_limit(auth.uid(), 'auction', 60, 60) then raise exception 'rate limited: too many auction actions'; end if;
  select * into l from public.auction_listings where id=p_listing for update;
  if l is null then raise exception 'listing not found'; end if;
  if l.seller_id <> auth.uid() then raise exception 'not your listing'; end if;
  if l.status <> 'active' then raise exception 'not active'; end if;
  insert into public.owned_cards (iid,user_id,sport,card_id) values (l.card_iid,l.seller_id,l.sport,l.card_id);
  update public.auction_listings set status='cancelled' where id=p_listing;
end; $$;

revoke all on function public.list_card(text,text,int), public.buy_listing(uuid), public.cancel_listing(uuid) from public;
grant execute on function public.list_card(text,text,int), public.buy_listing(uuid), public.cancel_listing(uuid) to authenticated;

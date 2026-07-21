-- ============================================================================
-- Phase 4: real auction house. auction_listings + atomic transfer RPCs.
-- Run in the Supabase SQL editor. Idempotent.
-- ============================================================================
create table if not exists public.auction_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  sport text not null check (sport in ('nba','soccer')),
  card_iid text not null,
  card_id text not null,
  price int not null check (price > 0),
  status text not null default 'active' check (status in ('active','sold','cancelled')),
  buyer_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  sold_at timestamptz
);
create index if not exists auction_active_idx on public.auction_listings (sport, status, created_at desc);
alter table public.auction_listings enable row level security;
drop policy if exists "listings read" on public.auction_listings;
create policy "listings read" on public.auction_listings
  for select using (status = 'active' or auth.uid() = seller_id or auth.uid() = buyer_id);

create or replace function public.list_card(p_sport text, p_card_iid text, p_price int)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_card_id text; v_listing uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
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
  select * into l from public.auction_listings where id=p_listing for update;
  if l is null then raise exception 'listing not found'; end if;
  if l.seller_id <> auth.uid() then raise exception 'not your listing'; end if;
  if l.status <> 'active' then raise exception 'not active'; end if;
  insert into public.owned_cards (iid,user_id,sport,card_id) values (l.card_iid,l.seller_id,l.sport,l.card_id);
  update public.auction_listings set status='cancelled' where id=p_listing;
end; $$;

revoke all on function public.list_card(text,text,int), public.buy_listing(uuid), public.cancel_listing(uuid) from public;
grant execute on function public.list_card(text,text,int), public.buy_listing(uuid), public.cancel_listing(uuid) to authenticated;

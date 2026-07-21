-- ============================================================================
-- Phase 5.1: server-side redeem codes. Per-user redemption is enforced in the
-- DB (by user_id), the reward is server-defined, and the credit is atomic.
-- Run in the Supabase SQL editor. Idempotent.
-- ============================================================================
create table if not exists public.redeem_codes (
  code text primary key,
  reward_amount int not null,
  reward_type text not null default 'coins',
  max_uses int,
  times_used int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.redeem_codes enable row level security;
-- no client policies: codes are read/written only through the RPC / service key

create table if not exists public.code_redemptions (
  id uuid primary key default gen_random_uuid(),
  code text not null references public.redeem_codes(code) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  unique (code, user_id)  -- one redemption per user per code (hard backstop)
);
alter table public.code_redemptions enable row level security;
drop policy if exists "redemptions read own" on public.code_redemptions;
create policy "redemptions read own" on public.code_redemptions for select using (auth.uid() = user_id);

insert into public.redeem_codes (code, reward_amount, reward_type, max_uses, active)
values ('2040', 100000, 'coins', null, true) on conflict (code) do nothing;

create or replace function public.redeem_code(p_code text)
returns int language plpgsql security definer set search_path = public as $$
declare c record;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into c from public.redeem_codes where upper(code) = upper(p_code) for update;
  if c is null then raise exception 'invalid code'; end if;
  if not c.active then raise exception 'code inactive'; end if;
  if c.max_uses is not null and c.times_used >= c.max_uses then raise exception 'code exhausted'; end if;
  if exists (select 1 from public.code_redemptions where code = c.code and user_id = auth.uid()) then
    raise exception 'already redeemed';
  end if;
  insert into public.code_redemptions (code, user_id) values (c.code, auth.uid());
  update public.redeem_codes set times_used = times_used + 1 where code = c.code;
  insert into public.coin_balances (user_id, sport, balance) values (auth.uid(), 'nba', c.reward_amount)
    on conflict (user_id, sport) do update set balance = public.coin_balances.balance + c.reward_amount, updated_at = now();
  insert into public.coin_balances (user_id, sport, balance) values (auth.uid(), 'soccer', c.reward_amount)
    on conflict (user_id, sport) do update set balance = public.coin_balances.balance + c.reward_amount, updated_at = now();
  return c.reward_amount;
end; $$;
revoke all on function public.redeem_code(text) from public;
grant execute on function public.redeem_code(text) to authenticated;

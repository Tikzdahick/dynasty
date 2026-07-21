-- Phase 5.4b: duplicate-account flagging (log only, no auto-ban). Records each
-- new account's IP + a lightweight browser fingerprint and flags it when another
-- account signed up from the same IP or fingerprint in the last 24h. Reviewed in
-- the admin dashboard. Idempotent — safe to re-run.

create table if not exists public.signup_events (
  id          bigserial primary key,
  user_id     uuid not null,
  ip          text,
  fingerprint text,
  flagged     boolean not null default false,
  created_at  timestamptz not null default now()
);
create unique index if not exists signup_events_user on public.signup_events (user_id);
create index if not exists signup_events_ip on public.signup_events (ip, created_at);
create index if not exists signup_events_fp on public.signup_events (fingerprint, created_at);

-- No RLS policies → only the service role (admin dashboard / log route) reads it.
alter table public.signup_events enable row level security;

-- Records one row per user (first call wins) and returns whether it looked like a
-- duplicate (same ip/fingerprint as another account within 24h). Service-role only.
create or replace function public.log_signup(p_user uuid, p_ip text, p_fingerprint text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_flag boolean;
begin
  select exists (
    select 1 from public.signup_events
    where user_id <> p_user
      and created_at > now() - interval '24 hours'
      and (
        (p_ip is not null and ip = p_ip)
        or (p_fingerprint is not null and fingerprint = p_fingerprint)
      )
  ) into v_flag;

  insert into public.signup_events (user_id, ip, fingerprint, flagged)
    values (p_user, p_ip, p_fingerprint, v_flag)
    on conflict (user_id) do nothing;

  return v_flag;
end; $$;

revoke all on function public.log_signup(uuid,text,text) from public, anon, authenticated;
grant execute on function public.log_signup(uuid,text,text) to service_role;

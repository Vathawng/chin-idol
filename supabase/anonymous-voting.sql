-- Migration: anonymous (no-account) voting.
-- Run this in the Supabase SQL editor AFTER the base schema.sql.
--
-- Votes are no longer tied to an auth.users row — the Stripe payment is the
-- gate. We keep the user_id column for historical rows but make it optional,
-- capture the payer's email from Stripe instead, and re-key the checkout rate
-- limiter on client IP rather than user id.

-- 1. votes: user_id becomes optional; drop the FK so a null (anonymous) vote
--    is allowed. Capture the Stripe customer email instead.
alter table votes alter column user_id drop not null;

do $$
begin
  if exists (
    select 1 from information_schema.table_constraints
    where table_name = 'votes' and constraint_name = 'votes_user_id_fkey'
  ) then
    alter table votes drop constraint votes_user_id_fkey;
  end if;
end $$;

alter table votes add column if not exists voter_email text;

-- The old "users see their own votes" RLS policy is meaningless without auth.
-- Inserts happen via the service-role webhook (bypasses RLS); no anon SELECT
-- on votes is granted, so totals are only ever exposed through the
-- contestant_vote_totals view.
drop policy if exists "users see their own votes" on votes;

-- 2. checkout_attempts: rate limit by IP now. Add an ip column and make the
--    old user_id optional in case it was NOT NULL. (Table may have been
--    created outside schema.sql; create it here if missing.)
create table if not exists checkout_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  ip text,
  created_at timestamptz not null default now()
);

alter table checkout_attempts add column if not exists ip text;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'checkout_attempts' and column_name = 'user_id'
      and is_nullable = 'NO'
  ) then
    alter table checkout_attempts alter column user_id drop not null;
  end if;
end $$;

create index if not exists checkout_attempts_ip_created_idx
  on checkout_attempts (ip, created_at);

-- Run this in the Supabase SQL editor for a fresh setup.
-- (Existing databases created before anonymous voting: run
--  supabase/anonymous-voting.sql instead, which migrates in place.)

create table if not exists contestants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  hometown text not null,
  bio text not null default '',
  image_url text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Voting is anonymous — the Stripe payment is the gate, so a vote is not tied
-- to an auth.users row. We record the email Stripe collected at checkout
-- instead (voter_email) for traceability.
create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,                          -- optional / legacy; anonymous votes are null
  contestant_id uuid not null references contestants(id),
  round_id uuid,
  quantity int not null check (quantity > 0),
  amount_cents int not null,
  voter_email text,
  stripe_session_id text not null unique, -- keeps webhook retries idempotent
  status text not null default 'paid',
  created_at timestamptz not null default now()
);

-- Sliding-window checkout rate limiter, keyed by client IP (lib/rate-limit.ts).
create table if not exists checkout_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  ip text,
  created_at timestamptz not null default now()
);
create index if not exists checkout_attempts_ip_created_idx
  on checkout_attempts (ip, created_at);

create or replace view contestant_vote_totals as
select
  c.*,
  coalesce(sum(v.quantity) filter (where v.status = 'paid'), 0) as votes
from contestants c
left join votes v on v.contestant_id = c.id
group by c.id;

alter table contestants enable row level security;
alter table votes enable row level security;

create policy "contestants are public" on contestants
  for select using (true);

-- No public SELECT policy on votes: totals are exposed only through the
-- contestant_vote_totals view. Inserts happen via the service-role webhook,
-- which bypasses RLS.

-- Run this in the Supabase SQL editor.

create table if not exists contestants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  hometown text not null,
  bio text not null default '',
  image_url text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  contestant_id uuid not null references contestants(id),
  quantity int not null check (quantity > 0),
  amount_cents int not null,
  stripe_session_id text not null unique, -- keeps webhook retries idempotent
  status text not null default 'paid',
  created_at timestamptz not null default now()
);

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

create policy "users see their own votes" on votes
  for select using (auth.uid() = user_id);

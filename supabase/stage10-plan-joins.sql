-- Real plan-join flow (unlocks feature #8's host-charge end-to-end).
--
-- A verified traveller asks to join a plan; the host accepts/declines. Accepting
-- is the "first traveller joins" trigger for the ₹49 host charge, and bumps the
-- plan's joined count — both done server-side in the `economy` function's
-- `respond-join` action (plans is service-role-write only), so they're tamper-proof.
--
-- Apply in the Supabase Studio SQL editor (after stage9).

create table if not exists public.plan_joins (
  id uuid primary key default gen_random_uuid(),
  plan_id text not null references public.plans (id) on delete cascade,
  traveller_id uuid not null references public.profiles (id) on delete cascade,
  note text,
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at timestamptz not null default now(),
  unique (plan_id, traveller_id)
);

create index if not exists plan_joins_plan_idx on public.plan_joins (plan_id);

alter table public.plan_joins enable row level security;
grant select, insert on public.plan_joins to authenticated;

-- Traveller inserts only their OWN pending request (verified).
drop policy if exists pj_insert on public.plan_joins;
create policy pj_insert on public.plan_joins for insert
  with check (is_verified(me()) and traveller_id = me() and status = 'pending');

-- Traveller reads their own requests; a host reads requests on their own plans.
drop policy if exists pj_read_own on public.plan_joins;
create policy pj_read_own on public.plan_joins for select using (traveller_id = me());

-- NB: plans.host_id is a text column, so cast me() (uuid) to text to compare.
drop policy if exists pj_read_host on public.plan_joins;
create policy pj_read_host on public.plan_joins for select
  using (plan_id in (select id from public.plans where host_id = me()::text));

-- No client UPDATE/DELETE: accept/decline (and the joined bump + host charge)
-- happen only in the economy Edge Function with the service role.

-- Live updates: host sees new requests, traveller sees the answer.
do $$ begin
  alter publication supabase_realtime add table public.plan_joins;
exception when duplicate_object then null;
end $$;

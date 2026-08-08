-- Server-authoritative ₹49 economy + waitlist (feature #8).
--
-- The queue ordering, priority, seat lifecycle, wallet and host charge become
-- real and tamper-proof: clients may only join/leave and read; every privileged
-- mutation (priority, seat state, wallet) happens in the `economy` Edge Function
-- with the service role. This migration adds the columns, locks down RLS, ships
-- the ordering view, and schedules the 24h seat-expiry job.
--
-- Apply in the Supabase Studio SQL editor (after 0001/apply-to-hosted).

-- ── columns ─────────────────────────────────────────────────────────────────
alter table public.waitlist_entries add column if not exists priority_at timestamptz;
alter table public.waitlist_entries add column if not exists paid_at timestamptz;

-- Widen the status vocabulary: 'called' = seat offered, 24h clock running.
alter table public.waitlist_entries drop constraint if exists waitlist_entries_status_check;
alter table public.waitlist_entries add constraint waitlist_entries_status_check
  check (status in ('pending','called','confirmed','forfeit','missed'));

-- Host charge (₹49) is levied once, on the first traveller to join a plan.
alter table public.plans add column if not exists host_charged boolean not null default false;

-- ── tamper-proof RLS ────────────────────────────────────────────────────────
-- Replace the permissive insert policy: a client may only insert its OWN entry
-- as a plain pending join — never granting itself priority or a seat. Priority,
-- seat state and wallet moves are service-role only (the Edge Function).
drop policy if exists wl_insert on public.waitlist_entries;
create policy wl_insert on public.waitlist_entries for insert
  with check (
    is_verified(me()) and profile_id = me()
    and has_priority = false and priority_source is null and priority_at is null
    and status = 'pending' and called_at is null and paid_at is null
  );

-- A client may leave the queue while still pending (its own entry only).
drop policy if exists wl_delete on public.waitlist_entries;
create policy wl_delete on public.waitlist_entries for delete
  using (profile_id = me() and status = 'pending');

-- (No client UPDATE policy: has_priority/status/wallet never move client-side.)

-- ── ordering view ───────────────────────────────────────────────────────────
-- The live queue in seat-allocation order: locked (confirmed/called) seats first,
-- then priority buyers by when they paid, then FIFO. `position <= trip.group_size`
-- means "inside the seats". security_invoker so the caller's RLS still applies.
create or replace view public.v_waitlist_ordered as
select
  w.*,
  row_number() over (
    partition by w.trip_id
    order by
      (w.status in ('confirmed','called')) desc,
      w.has_priority desc,
      w.priority_at asc nulls last,
      w.joined_at asc
  ) as position
from public.waitlist_entries w
where w.status in ('pending','called','confirmed');

alter view public.v_waitlist_ordered set (security_invoker = on);
grant select on public.v_waitlist_ordered to authenticated;

-- ── 24h seat expiry (pg_cron) ───────────────────────────────────────────────
-- A called seat not paid within 24h is forfeited (the ₹49 is NOT refunded — the
-- seat was held out of the queue). Enable pg_cron once (Dashboard → Database →
-- Extensions, or the line below), then schedule the sweep every 15 minutes.
create extension if not exists pg_cron;

create or replace function public.expire_called_seats() returns void
language sql security definer set search_path = public as $$
  update public.waitlist_entries
     set status = 'forfeit'
   where status = 'called'
     and called_at is not null
     and called_at < now() - interval '24 hours';
$$;

-- Idempotent (re)schedule.
select cron.unschedule('expire-called-seats')
  where exists (select 1 from cron.job where jobname = 'expire-called-seats');
select cron.schedule('expire-called-seats', '*/15 * * * *', $$select public.expire_called_seats();$$);

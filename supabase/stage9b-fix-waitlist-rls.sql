-- Fix: infinite recursion (42P17) in the waitlist_entries SELECT policy.
--
-- The original wl_self policy subqueries waitlist_entries inside its own USING
-- clause ("see entries on trips you're on"), so evaluating it re-triggers the
-- same policy → infinite recursion. It was dormant until feature #8 actually
-- read the table (v_waitlist_ordered). Per the repo's RLS rule #1, move the
-- self-referential lookup into a SECURITY DEFINER helper, which runs as the
-- owner and bypasses RLS — breaking the cycle.
--
-- Apply in the Supabase Studio SQL editor (after stage9).

create or replace function public.on_waitlist(p_trip text, p_uid uuid)
returns boolean
language sql
security definer
stable
set search_path = public as $$
  select exists (
    select 1 from public.waitlist_entries
    where trip_id = p_trip and profile_id = p_uid
  );
$$;

drop policy if exists wl_self on public.waitlist_entries;
create policy wl_self on public.waitlist_entries for select
  using (
    is_verified(me())
    and (profile_id = me() or public.on_waitlist(trip_id, me()))
  );

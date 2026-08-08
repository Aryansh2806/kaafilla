-- Stage 3: collaboration layer.
-- 1) Let verified users create/edit/delete their OWN traveller plans (the seeded
--    catalog stays readable to everyone via the existing plans_read policy).
-- 2) Stream row changes on plans + profiles over Realtime so every teammate's
--    app updates live when someone hosts a plan or a new traveller joins.

-- ── plans: row-level write access (RLS still restricts to the host's own rows) ──
drop policy if exists plans_insert on public.plans;
create policy plans_insert on public.plans for insert to authenticated
  with check (host_id = me()::text and is_verified(me()));

drop policy if exists plans_update_own on public.plans;
create policy plans_update_own on public.plans for update to authenticated
  using (host_id = me()::text) with check (host_id = me()::text);

drop policy if exists plans_delete_own on public.plans;
create policy plans_delete_own on public.plans for delete to authenticated
  using (host_id = me()::text);

-- Catalog tables were granted SELECT only; add write grants on plans (RLS gates rows).
grant insert, update, delete on public.plans to authenticated;

-- ── Realtime: broadcast changes on these tables to subscribed clients ──────────
-- (Realtime still enforces RLS: clients only receive rows they may SELECT.)
alter publication supabase_realtime add table public.plans;
alter publication supabase_realtime add table public.profiles;

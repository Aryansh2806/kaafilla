-- Push notifications: per-device Expo push tokens, so the server can reach a
-- user's phone when the app is closed. One row per device (token is the PK);
-- a device re-registering just refreshes owner/platform/updated_at.
--
-- Apply in the Supabase Studio SQL editor (same workflow as the other stage*.sql).

create table if not exists public.device_push_tokens (
  token text primary key,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  platform text,
  updated_at timestamptz not null default now()
);

create index if not exists device_push_tokens_profile_idx
  on public.device_push_tokens (profile_id);

alter table public.device_push_tokens enable row level security;

-- A user only ever sees/writes their own device tokens. The Edge Function reads
-- them with the service role, which bypasses RLS, so it can target any recipient.
drop policy if exists "push_tokens_select_own" on public.device_push_tokens;
create policy "push_tokens_select_own" on public.device_push_tokens for select to authenticated
  using (profile_id = auth.uid());

drop policy if exists "push_tokens_insert_own" on public.device_push_tokens;
create policy "push_tokens_insert_own" on public.device_push_tokens for insert to authenticated
  with check (profile_id = auth.uid());

drop policy if exists "push_tokens_update_own" on public.device_push_tokens;
create policy "push_tokens_update_own" on public.device_push_tokens for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

drop policy if exists "push_tokens_delete_own" on public.device_push_tokens;
create policy "push_tokens_delete_own" on public.device_push_tokens for delete to authenticated
  using (profile_id = auth.uid());

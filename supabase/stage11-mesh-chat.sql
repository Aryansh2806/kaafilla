-- Mesh ↔ Supabase reconciliation for chat (mesh feature, phase 4).
--
-- client_id lets the same message dedupe across transports (a message sent over
-- the BLE mesh and later persisted to Postgres is one message, not two).
-- chat_mesh_keys holds a per-chat shared secret, readable only by that chat's
-- members, so every member derives the same channel key (SHA-256 of the secret)
-- and only members can decrypt the chat's mesh traffic.
--
-- Apply in the Supabase Studio SQL editor (after stage5).

alter table public.messages add column if not exists client_id text;
create index if not exists messages_client_idx on public.messages (chat_id, client_id);

create table if not exists public.chat_mesh_keys (
  chat_id uuid primary key references public.chats (id) on delete cascade,
  secret text not null,
  created_at timestamptz not null default now()
);

alter table public.chat_mesh_keys enable row level security;
grant select, insert on public.chat_mesh_keys to authenticated;

-- Members-only: only a chat member may read or seed its mesh secret. Uses the
-- SECURITY DEFINER helper (no self-referential policy → no 42P17 recursion).
drop policy if exists cmk_read on public.chat_mesh_keys;
create policy cmk_read on public.chat_mesh_keys for select
  using (public.is_chat_member(chat_id, me()));

drop policy if exists cmk_insert on public.chat_mesh_keys;
create policy cmk_insert on public.chat_mesh_keys for insert
  with check (public.is_chat_member(chat_id, me()));

-- No update/delete: the first member to seed the secret wins (via upsert
-- ignore-duplicates on the client), and everyone else reads that same value.

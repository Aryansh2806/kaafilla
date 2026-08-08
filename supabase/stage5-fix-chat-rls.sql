-- Stage 5 FIX: the original chat_members read policy referenced chat_members
-- inside its own USING clause, so every read of chat_members / chats / messages
-- raised "infinite recursion detected" (42P17) — breaking chat entirely.
-- Fix: a SECURITY DEFINER helper that checks membership without re-triggering RLS,
-- and rewrite the affected policies to use it.

create or replace function public.is_chat_member(cid uuid, uid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.chat_members
    where chat_id = cid and profile_id = uid
  );
$$;
grant execute on function public.is_chat_member(uuid, uuid) to authenticated, anon;

-- chat_members: rows for chats you belong to (no self-reference now).
drop policy if exists chat_members_read on public.chat_members;
create policy chat_members_read on public.chat_members for select
  using (public.is_chat_member(chat_id, me()));

-- chats: verified members only.
drop policy if exists chat_member_read on public.chats;
create policy chat_member_read on public.chats for select
  using (is_verified(me()) and public.is_chat_member(id, me()));

-- messages: read + send for members.
drop policy if exists messages_read on public.messages;
create policy messages_read on public.messages for select
  using (public.is_chat_member(chat_id, me()));

drop policy if exists messages_send on public.messages;
create policy messages_send on public.messages for insert
  with check (sender_id = me() and public.is_chat_member(chat_id, me()));

-- chat_members insert: add yourself, or add an accepted-connect peer to a chat
-- you already belong to (uses the helper instead of a self-referential subquery).
drop policy if exists chat_members_insert on public.chat_members;
create policy chat_members_insert on public.chat_members for insert to authenticated
  with check (
    profile_id = me()
    or (
      public.is_chat_member(chat_members.chat_id, me())
      and exists (
        select 1 from public.connects c
        where c.status = 'accepted'
          and (
            (c.from_id = me() and c.to_id = chat_members.profile_id)
            or (c.to_id = me() and c.from_id = chat_members.profile_id)
          )
      )
    )
  );

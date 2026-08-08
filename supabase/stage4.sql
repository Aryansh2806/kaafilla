-- Stage 4: connects + 1:1 chat.
-- connects already have full RLS (send/receive/respond). messages already have
-- member read/send policies. The gap is creating a chat + its members when a
-- connect is accepted — add those insert policies, then turn on Realtime.

-- A verified user may create a chat.
drop policy if exists chats_insert on public.chats;
create policy chats_insert on public.chats for insert to authenticated
  with check (is_verified(me()));

-- A user may add themselves to a chat, or add a peer they have an accepted
-- connect with to a chat they are already a member of.
drop policy if exists chat_members_insert on public.chat_members;
create policy chat_members_insert on public.chat_members for insert to authenticated
  with check (
    profile_id = me()
    or (
      exists (
        select 1 from public.chat_members m
        where m.chat_id = chat_members.chat_id and m.profile_id = me()
      )
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

-- Realtime streams for the social tables.
alter publication supabase_realtime add table public.connects;
alter publication supabase_realtime add table public.chats;
alter publication supabase_realtime add table public.chat_members;
alter publication supabase_realtime add table public.messages;

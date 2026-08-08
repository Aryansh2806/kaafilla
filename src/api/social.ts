import { supabase } from './client';

// Connects + 1:1 chat over Supabase. RLS is the real gate; these shape requests.

// Client-side uuid v4 so we can create a chat WITHOUT a RETURNING read-back
// (the SELECT policy needs membership, which doesn't exist yet at creation).
function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function uid(): Promise<string> {
  if (!supabase) throw new Error('Backend not configured');
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not signed in');
  return session.user.id;
}

async function namesFor(
  ids: string[],
): Promise<Record<string, { name: string; handle: string; city: string }>> {
  const map: Record<string, { name: string; handle: string; city: string }> = {};
  if (!supabase || ids.length === 0) return map;
  const { data } = await supabase.from('profiles').select('id,first_name,city,instagram').in('id', ids);
  for (const r of (data ?? []) as any[]) {
    map[r.id] = { name: r.first_name ?? 'Traveller', handle: r.instagram ?? '', city: r.city ?? '' };
  }
  return map;
}

export type ConnStatus = 'none' | 'sent' | 'accepted' | 'incoming';
export interface IncomingConnect { id: string; fromId: string; name: string; city: string; note: string }
export interface SentConnect { id: string; toId: string; name: string }
export interface AcceptedConnect { connectId: string; peerId: string; name: string; handle: string }
export interface Msg { id: string; senderId: string; body: string; createdAt: string }

export async function sendConnect(toId: string, note?: string): Promise<void> {
  if (!supabase) throw new Error('Backend not configured');
  const me = await uid();
  const { error } = await supabase.from('connects').insert({ from_id: me, to_id: toId, note: note ?? null });
  if (error) throw error;
}

export async function cancelConnect(toId: string): Promise<void> {
  if (!supabase) throw new Error('Backend not configured');
  const me = await uid();
  const { error } = await supabase.from('connects').delete().eq('from_id', me).eq('to_id', toId);
  if (error) throw error;
}

export async function getConnectStatusWith(peerId: string): Promise<ConnStatus> {
  if (!supabase) return 'none';
  const me = await uid();
  const { data, error } = await supabase
    .from('connects')
    .select('from_id,to_id,status')
    .or(`and(from_id.eq.${me},to_id.eq.${peerId}),and(from_id.eq.${peerId},to_id.eq.${me})`);
  if (error) throw error;
  const row = (data ?? [])[0] as any;
  if (!row) return 'none';
  if (row.status === 'accepted') return 'accepted';
  if (row.status === 'pending') return row.from_id === me ? 'sent' : 'incoming';
  return 'none';
}

export async function getIncoming(): Promise<IncomingConnect[]> {
  if (!supabase) return [];
  const me = await uid();
  const { data, error } = await supabase
    .from('connects')
    .select('id,from_id,note')
    .eq('to_id', me)
    .eq('status', 'pending');
  if (error) throw error;
  const rows = (data ?? []) as any[];
  const names = await namesFor(rows.map((r) => r.from_id));
  return rows.map((r) => ({
    id: r.id,
    fromId: r.from_id,
    name: names[r.from_id]?.name ?? 'Traveller',
    city: names[r.from_id]?.city ?? '',
    note: r.note ?? '',
  }));
}

export async function getSent(): Promise<SentConnect[]> {
  if (!supabase) return [];
  const me = await uid();
  const { data, error } = await supabase
    .from('connects')
    .select('id,to_id')
    .eq('from_id', me)
    .eq('status', 'pending');
  if (error) throw error;
  const rows = (data ?? []) as any[];
  const names = await namesFor(rows.map((r) => r.to_id));
  return rows.map((r) => ({ id: r.id, toId: r.to_id, name: names[r.to_id]?.name ?? 'Traveller' }));
}

export async function getAccepted(): Promise<AcceptedConnect[]> {
  if (!supabase) return [];
  const me = await uid();
  const { data, error } = await supabase
    .from('connects')
    .select('id,from_id,to_id')
    .eq('status', 'accepted')
    .or(`from_id.eq.${me},to_id.eq.${me}`);
  if (error) throw error;
  const rows = (data ?? []) as any[];
  const peers = rows.map((r) => (r.from_id === me ? r.to_id : r.from_id));
  const names = await namesFor(peers);
  return rows.map((r) => {
    const peer = r.from_id === me ? r.to_id : r.from_id;
    return { connectId: r.id, peerId: peer, name: names[peer]?.name ?? 'Traveller', handle: names[peer]?.handle ?? '' };
  });
}

export async function respondConnect(connectId: string, accept: boolean): Promise<void> {
  if (!supabase) throw new Error('Backend not configured');
  const { error } = await supabase
    .from('connects')
    .update({ status: accept ? 'accepted' : 'declined' })
    .eq('id', connectId);
  if (error) throw error;
}

// Find the existing 1:1 chat with a peer, or create it (both become members).
// The chat id is generated client-side and inserted WITHOUT a RETURNING read-back:
// the chats SELECT policy requires membership, which doesn't exist at creation time,
// so `.select()` here would be denied by RLS.
export async function getOrCreateSoloChat(peerId: string): Promise<string> {
  if (!supabase) throw new Error('Backend not configured');
  const me = await uid();
  const { data: mine, error: e1 } = await supabase.from('chat_members').select('chat_id').eq('profile_id', me);
  if (e1) throw e1;
  const myChats = ((mine ?? []) as any[]).map((r) => r.chat_id);
  if (myChats.length) {
    const { data: shared, error: e2 } = await supabase
      .from('chat_members')
      .select('chat_id')
      .eq('profile_id', peerId)
      .in('chat_id', myChats);
    if (e2) throw e2;
    if (shared && shared.length) return (shared[0] as any).chat_id;
  }
  const chatId = uuidv4();
  const { error: e3 } = await supabase.from('chats').insert({ id: chatId, kind: 'solo' });
  if (e3) throw e3;
  const { error: e4 } = await supabase.from('chat_members').insert({ chat_id: chatId, profile_id: me });
  if (e4) throw e4;
  const { error: e5 } = await supabase.from('chat_members').insert({ chat_id: chatId, profile_id: peerId });
  if (e5) throw e5;
  return chatId;
}

export async function getMessages(chatId: string): Promise<Msg[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('messages')
    .select('id,sender_id,body,created_at')
    .eq('chat_id', chatId)
    .order('created_at');
  if (error) throw error;
  return ((data ?? []) as any[]).map((r) => ({ id: r.id, senderId: r.sender_id, body: r.body, createdAt: r.created_at }));
}

export async function sendMessage(chatId: string, body: string): Promise<void> {
  if (!supabase) throw new Error('Backend not configured');
  const me = await uid();
  console.warn('[chat] sendMessage chat=', chatId, 'me=', me);
  const { error } = await supabase.from('messages').insert({ chat_id: chatId, sender_id: me, body });
  if (error) { console.warn('[chat] sendMessage FAILED', JSON.stringify(error)); throw error; }
  console.warn('[chat] sendMessage OK');
}

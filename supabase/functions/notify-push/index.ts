// Edge Function: notify-push
//
// Fired by a Postgres "Database Webhook" on INSERT into public.connects and
// public.messages. It looks up the recipient's Expo push tokens and sends a
// notification via Expo's push service, so users hear about connects/messages
// even with the app closed.
//
// Deploy (no CLI needed): Supabase Dashboard → Edge Functions → Deploy a new
// function → name it "notify-push" → paste this file. Then create the two
// Database Webhooks (see supabase/webhooks-notify-push.sql). SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY are injected automatically. Optionally set a
// WEBHOOK_SECRET function secret and the matching x-webhook-secret header on the
// webhooks to reject spoofed calls.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: Record<string, any> | null;
  old_record: Record<string, any> | null;
}

interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  sound: 'default';
  channelId: 'default';
}

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

async function senderIdentity(id: string): Promise<{ name: string; handle: string }> {
  const { data } = await admin.from('profiles').select('first_name,instagram').eq('id', id).maybeSingle();
  return { name: data?.first_name ?? 'A traveller', handle: data?.instagram ?? '' };
}

async function tokensFor(profileIds: string[]): Promise<string[]> {
  if (profileIds.length === 0) return [];
  const { data } = await admin.from('device_push_tokens').select('token').in('profile_id', profileIds);
  return (data ?? []).map((r: { token: string }) => r.token);
}

// Build the (recipientIds, message-template) for a given insert.
async function buildForRecord(
  table: string,
  record: Record<string, any>,
): Promise<{ recipients: string[]; make: (token: string) => ExpoMessage } | null> {
  if (table === 'connects') {
    if (record.status && record.status !== 'pending') return null;
    const { name } = await senderIdentity(record.from_id);
    const note = (record.note ?? '').toString().trim();
    return {
      recipients: [record.to_id],
      make: (token) => ({
        to: token,
        title: 'New connect request',
        body: note ? `${name}: ${note}` : `${name} wants to connect`,
        data: { kind: 'connect' },
        sound: 'default',
        channelId: 'default',
      }),
    };
  }

  if (table === 'messages') {
    const senderId = record.sender_id;
    const { data: members } = await admin
      .from('chat_members')
      .select('profile_id')
      .eq('chat_id', record.chat_id);
    const recipients = (members ?? [])
      .map((m: { profile_id: string }) => m.profile_id)
      .filter((pid: string) => pid !== senderId);
    if (recipients.length === 0) return null;

    const { name, handle } = await senderIdentity(senderId);
    const body = (record.body ?? '').toString();
    return {
      recipients,
      make: (token) => ({
        to: token,
        title: name,
        body: body.length > 140 ? `${body.slice(0, 139)}…` : body,
        data: { kind: 'message', peerId: senderId, peerName: name, peerHandle: handle },
        sound: 'default',
        channelId: 'default',
      }),
    };
  }

  // Operator-portal notifications (stage20). The portal's server actions write
  // the row with the service role after assertPermission + audit; the title/body
  // are already composed there and are deliberately minimal (they show on a lock
  // screen), so we pass them through verbatim rather than re-deriving anything.
  if (table === 'notifications') {
    const recipient = record.profile_id;
    if (!recipient) return null;
    const title = (record.title ?? 'Kaafilla').toString();
    const body = (record.body ?? '').toString();
    return {
      recipients: [recipient],
      make: (token) => ({
        to: token,
        title,
        body: body.length > 140 ? `${body.slice(0, 139)}…` : body,
        // The deep link re-authorizes on open — never trust this payload alone.
        data: { kind: record.kind ?? 'notification', ...(record.data ?? {}) },
        sound: 'default',
        channelId: 'default',
      }),
    };
  }

  return null;
}

Deno.serve(async (req) => {
  try {
    const secret = Deno.env.get('WEBHOOK_SECRET');
    if (secret && req.headers.get('x-webhook-secret') !== secret) {
      return new Response('unauthorized', { status: 401 });
    }

    const payload = (await req.json()) as WebhookPayload;
    if (payload.type !== 'INSERT' || !payload.record) {
      return new Response(JSON.stringify({ skipped: 'not an insert' }), { status: 200 });
    }

    const built = await buildForRecord(payload.table, payload.record);
    if (!built) return new Response(JSON.stringify({ skipped: 'nothing to notify' }), { status: 200 });

    const tokens = await tokensFor(built.recipients);
    if (tokens.length === 0) return new Response(JSON.stringify({ sent: 0 }), { status: 200 });

    const messages = tokens.map(built.make);
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages),
    });
    const result = await res.json();
    return new Response(JSON.stringify({ sent: messages.length, result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[notify-push] error', e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});

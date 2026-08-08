// Edge Function: economy
//
// The server-authoritative ₹49 economy (feature #8). Every privileged mutation —
// priority, seat lifecycle, wallet moves, host charge — happens here with the
// service role, so clients can't grant themselves priority or edit their wallet
// (RLS blocks direct writes). Reads (queue, wallet) stay client-side via RLS.
//
// Payment is recorded-only (simulated) per the app's payments seam: the ledger
// and state are real; no real money moves.
//
// Deploy: Dashboard → Edge Functions → Deploy new function → name `economy` →
// paste this file. Keep Verify JWT = ON (callers send their user token).
// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are auto-injected.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const PRIORITY_FEE = 49;
const PRIORITY_CAP = 6; // only 6 priority places sold per batch, so it stays worth something
const SEAT_WINDOW_HOURS = 24;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const admin = createClient(SUPABASE_URL, SERVICE_KEY);

// wallet move: shift balance by `amount` (negative = spend) and log the ledger.
async function moveWallet(uid: string, amount: number, reason: string): Promise<number> {
  const { data: w } = await admin.from('wallets').select('balance').eq('profile_id', uid).maybeSingle();
  const balance = (w?.balance ?? 0) + amount;
  await admin.from('wallets').upsert({ profile_id: uid, balance });
  await admin.from('wallet_ledger').insert({ profile_id: uid, amount, reason });
  return balance;
}

async function entryFor(tripId: string, uid: string) {
  const { data } = await admin
    .from('waitlist_entries')
    .select('*')
    .eq('trip_id', tripId)
    .eq('profile_id', uid)
    .maybeSingle();
  return data as Record<string, any> | null;
}

Deno.serve(async (req) => {
  try {
    // Identify the caller from their JWT.
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) return json({ error: 'not signed in' }, 401);
    const uid = user.id;

    // Everything here is verified-only (matches the gating matrix + RLS).
    const { data: prof } = await admin.from('profiles').select('is_verified').eq('id', uid).maybeSingle();
    if (!prof?.is_verified) return json({ error: 'verification required' }, 403);

    const { action, tripId, planId, source } = await req.json();
    const now = new Date().toISOString();

    switch (action) {
      case 'join': {
        if (!tripId) return json({ error: 'tripId required' }, 400);
        await admin
          .from('waitlist_entries')
          .upsert({ trip_id: tripId, profile_id: uid, status: 'pending' }, { onConflict: 'trip_id,profile_id', ignoreDuplicates: true });
        return json({ ok: true, entry: await entryFor(tripId, uid) });
      }

      case 'buy-priority': {
        if (!tripId || (source !== 'cash' && source !== 'wallet')) return json({ error: 'tripId + source required' }, 400);
        const entry = await entryFor(tripId, uid);
        if (!entry) return json({ error: 'join the waitlist first' }, 400);
        if (entry.has_priority) return json({ ok: true, entry }); // idempotent
        if (entry.status !== 'pending') return json({ error: 'seat already in progress' }, 400);

        const { count } = await admin
          .from('waitlist_entries')
          .select('id', { count: 'exact', head: true })
          .eq('trip_id', tripId)
          .eq('has_priority', true);
        if ((count ?? 0) >= PRIORITY_CAP) return json({ error: 'priority sold out for this batch' }, 409);

        if (source === 'wallet') {
          const { data: w } = await admin.from('wallets').select('balance').eq('profile_id', uid).maybeSingle();
          if ((w?.balance ?? 0) < PRIORITY_FEE) return json({ error: 'not enough wallet balance' }, 400);
          await moveWallet(uid, -PRIORITY_FEE, 'Priority placement (wallet)');
        }
        // cash: simulated payment to Kaafilla — no wallet movement, just recorded state.
        const { data: updated } = await admin
          .from('waitlist_entries')
          .update({ has_priority: true, priority_source: source, priority_at: now })
          .eq('id', entry.id)
          .select()
          .single();
        return json({ ok: true, entry: updated });
      }

      case 'call-seat': {
        // Offer the caller their seat and start the 24h clock. (In production an
        // operator calls the top of the queue; here the traveller triggers their own.)
        const entry = await entryFor(tripId, uid);
        if (!entry || entry.status !== 'pending') return json({ error: 'nothing to call' }, 400);
        const { data: updated } = await admin
          .from('waitlist_entries')
          .update({ status: 'called', called_at: now })
          .eq('id', entry.id)
          .select()
          .single();
        return json({ ok: true, entry: updated });
      }

      case 'pay-seat': {
        const entry = await entryFor(tripId, uid);
        if (!entry || entry.status !== 'called') return json({ error: 'no seat is called' }, 400);
        const expired = Date.now() - new Date(entry.called_at).getTime() > SEAT_WINDOW_HOURS * 3600 * 1000;
        if (expired) {
          await admin.from('waitlist_entries').update({ status: 'forfeit' }).eq('id', entry.id);
          return json({ error: 'the 24h window passed — the seat has moved on', forfeit: true }, 409);
        }
        const { data: updated } = await admin
          .from('waitlist_entries')
          .update({ status: 'confirmed', paid_at: now })
          .eq('id', entry.id)
          .select()
          .single();
        return json({ ok: true, entry: updated });
      }

      case 'finalize-batch': {
        // The batch confirmed without the caller. A priority buyer's ₹49 carries
        // over to their wallet; a plain waitlister just misses out.
        const entry = await entryFor(tripId, uid);
        if (!entry) return json({ error: 'not on this waitlist' }, 400);
        if (entry.status === 'confirmed') return json({ ok: true, entry }); // already in
        const credited = entry.has_priority ? PRIORITY_FEE : 0;
        let balance: number | undefined;
        if (credited) balance = await moveWallet(uid, credited, 'Batch filled without you');
        const { data: updated } = await admin
          .from('waitlist_entries')
          .update({ status: 'missed' })
          .eq('id', entry.id)
          .select()
          .single();
        return json({ ok: true, entry: updated, credited, balance });
      }

      case 'host-charge': {
        // ₹49 to host, once, on the first traveller to join a plan (recorded-only).
        if (!planId) return json({ error: 'planId required' }, 400);
        const { data: plan } = await admin.from('plans').select('host_charged').eq('id', planId).maybeSingle();
        if (!plan) return json({ error: 'no such plan' }, 400);
        if (plan.host_charged) return json({ ok: true, charged: false });
        await admin.from('plans').update({ host_charged: true }).eq('id', planId);
        return json({ ok: true, charged: true, amount: PRIORITY_FEE });
      }

      default:
        return json({ error: 'unknown action' }, 400);
    }
  } catch (e) {
    console.error('[economy] error', e);
    return json({ error: String(e) }, 500);
  }
});

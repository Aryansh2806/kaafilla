import { supabase } from './client';

// Client side of the server-authoritative ₹49 economy (feature #8). Reads come
// straight from RLS-guarded tables/views; every mutation goes through the
// `economy` Edge Function (service role), so priority/seat/wallet state can't be
// forged client-side.

export type WlStatus = 'pending' | 'called' | 'confirmed' | 'forfeit' | 'missed';

export interface QueueRow {
  id: string;
  profileId: string;
  name: string; // "You" for the caller
  position: number;
  status: WlStatus;
  hasPriority: boolean;
  isMe: boolean;
}

export interface WaitlistState {
  rows: QueueRow[];
  me: QueueRow | null;
}

export interface LedgerRow {
  id: string;
  amount: number;
  reason: string;
}
export interface WalletState {
  balance: number;
  ledger: LedgerRow[];
}

async function myId(): Promise<string | null> {
  if (!supabase) return null;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user.id ?? null;
}

type Action = 'join' | 'buy-priority' | 'call-seat' | 'pay-seat' | 'finalize-batch' | 'host-charge';

// Invoke an economy action; surfaces the server's error message when it 4xx/5xx's.
export async function economyAction(action: Action, payload: Record<string, unknown>): Promise<any> {
  if (!supabase) throw new Error('Backend not configured');
  const { data, error } = await supabase.functions.invoke('economy', { body: { action, ...payload } });
  if (error) {
    let msg = error.message;
    try {
      const body = await (error as any).context?.json?.();
      if (body?.error) msg = body.error;
    } catch {
      // keep the generic message
    }
    throw new Error(msg);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export const joinWaitlist = (tripId: string) => economyAction('join', { tripId });
export const buyPriority = (tripId: string, source: 'cash' | 'wallet') => economyAction('buy-priority', { tripId, source });
export const callSeat = (tripId: string) => economyAction('call-seat', { tripId });
export const paySeat = (tripId: string) => economyAction('pay-seat', { tripId });
export const finalizeBatch = (tripId: string) => economyAction('finalize-batch', { tripId });
export const hostCharge = (planId: string) => economyAction('host-charge', { planId });

// The live, ordered queue for a trip (throws if the economy schema isn't deployed
// yet — callers treat that as "economy not live" and fall back).
export async function getWaitlist(tripId: string): Promise<WaitlistState> {
  if (!supabase) throw new Error('Backend not configured');
  const me = await myId();
  const { data: rows, error } = await supabase
    .from('v_waitlist_ordered')
    .select('id,profile_id,position,status,has_priority')
    .eq('trip_id', tripId)
    .order('position');
  if (error) throw error;

  const ids = (rows ?? []).map((r: any) => r.profile_id).filter((id: string) => id !== me);
  const nameMap: Record<string, string> = {};
  if (ids.length) {
    const { data: profs } = await supabase.from('profiles').select('id,first_name').in('id', ids);
    for (const p of (profs ?? []) as any[]) nameMap[p.id] = p.first_name ?? 'Traveller';
  }

  const out: QueueRow[] = (rows ?? []).map((r: any) => ({
    id: r.id,
    profileId: r.profile_id,
    name: r.profile_id === me ? 'You' : nameMap[r.profile_id] ?? 'Traveller',
    position: r.position,
    status: r.status as WlStatus,
    hasPriority: r.has_priority,
    isMe: r.profile_id === me,
  }));
  return { rows: out, me: out.find((r) => r.isMe) ?? null };
}

// The caller's wallet + ledger (RLS: owner-only).
export async function getWallet(): Promise<WalletState> {
  if (!supabase) return { balance: 0, ledger: [] };
  const me = await myId();
  if (!me) return { balance: 0, ledger: [] };
  const { data: w } = await supabase.from('wallets').select('balance').eq('profile_id', me).maybeSingle();
  const { data: ledger } = await supabase
    .from('wallet_ledger')
    .select('id,amount,reason')
    .eq('profile_id', me)
    .order('created_at', { ascending: false });
  return {
    balance: (w as any)?.balance ?? 0,
    ledger: ((ledger ?? []) as any[]).map((l) => ({ id: l.id, amount: l.amount, reason: l.reason })),
  };
}

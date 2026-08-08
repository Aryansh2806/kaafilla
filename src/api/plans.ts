import { supabase } from './client';
import { economyAction } from './economy';

// Real plan-join flow. Travellers ask to join (RLS-guarded insert); the host
// accepts/declines through the economy Edge Function (which also bumps the plan's
// joined count and levies the ₹49 host charge on the first accepted join).

export type JoinStatus = 'none' | 'pending' | 'accepted';

export interface HostRequest {
  id: string;
  planId: string;
  planName: string;
  travellerId: string;
  name: string;
  city: string;
  note: string;
}

async function myId(): Promise<string | null> {
  if (!supabase) return null;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user.id ?? null;
}

export async function askToJoin(planId: string, note?: string): Promise<void> {
  if (!supabase) throw new Error('Backend not configured');
  const me = await myId();
  if (!me) throw new Error('Not signed in');
  const { error } = await supabase
    .from('plan_joins')
    .upsert({ plan_id: planId, traveller_id: me, note: note ?? null, status: 'pending' }, { onConflict: 'plan_id,traveller_id', ignoreDuplicates: true });
  if (error) throw error;
}

// The caller's request state for a plan. A declined request reads as 'pending'
// so the traveller is never told — declining is silent (per the product copy).
export async function getMyJoinStatus(planId: string): Promise<JoinStatus> {
  if (!supabase) return 'none';
  const me = await myId();
  if (!me) return 'none';
  const { data } = await supabase
    .from('plan_joins')
    .select('status')
    .eq('plan_id', planId)
    .eq('traveller_id', me)
    .maybeSingle();
  if (!data) return 'none';
  return data.status === 'accepted' ? 'accepted' : 'pending';
}

// Pending requests across all of the host's plans, with traveller details.
export async function getHostRequests(): Promise<HostRequest[]> {
  if (!supabase) return [];
  const me = await myId();
  if (!me) return [];
  const { data: myPlans } = await supabase.from('plans').select('id,name').eq('host_id', me);
  const plans = (myPlans ?? []) as { id: string; name: string }[];
  if (plans.length === 0) return [];
  const planName: Record<string, string> = {};
  for (const p of plans) planName[p.id] = p.name;

  const { data: reqs, error } = await supabase
    .from('plan_joins')
    .select('id,plan_id,traveller_id,note')
    .in('plan_id', plans.map((p) => p.id))
    .eq('status', 'pending')
    .order('created_at');
  if (error) throw error;
  const rows = (reqs ?? []) as any[];

  const nameMap: Record<string, { name: string; city: string }> = {};
  if (rows.length) {
    const { data: profs } = await supabase.from('profiles').select('id,first_name,city').in('id', rows.map((r) => r.traveller_id));
    for (const p of (profs ?? []) as any[]) nameMap[p.id] = { name: p.first_name ?? 'Traveller', city: p.city ?? '' };
  }

  return rows.map((r) => ({
    id: r.id,
    planId: r.plan_id,
    planName: planName[r.plan_id] ?? 'your plan',
    travellerId: r.traveller_id,
    name: nameMap[r.traveller_id]?.name ?? 'Traveller',
    city: nameMap[r.traveller_id]?.city ?? '',
    note: r.note ?? '',
  }));
}

export interface RespondResult {
  accepted: boolean;
  travellerId?: string;
  hostCharged?: boolean;
  amount?: number;
}
export const respondToJoin = (requestId: string, accept: boolean): Promise<RespondResult> =>
  economyAction('respond-join', { requestId, accept });

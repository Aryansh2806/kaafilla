import { supabase, hasBackend } from './client';
import type { AppNotification } from '../types';

// Notifications (stage20) — the durable record behind the Activity screen.
//
// Rows are written SERVER-SIDE ONLY (the operator portal, with the service role):
// there is no INSERT policy, so this module is read + mark-read only.
//
// RLS does the scoping for us, exactly like the other reads in `catalog.ts`:
//   select → `profile_id = auth.uid()`   (never returns anyone else's rows)
//   update → same, and a BEFORE UPDATE trigger rejects any change other than
//            `read_at`, so the mark-read call below can't rewrite the message.
// Signed out, the select simply returns nothing — no uid filter needed here.
//
// With no backend configured the Activity screen is legitimately EMPTY: these
// are real events, so there is deliberately no seed fallback.

const SELECT = 'id,kind,title,body,data,trip_id,read_at,created_at';

interface Row {
  id: string;
  kind: AppNotification['kind'];
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  trip_id: string | null;
  read_at: string | null;
  created_at: string;
}

const toNotification = (r: Row): AppNotification => ({
  id: r.id,
  kind: r.kind,
  title: r.title,
  body: r.body,
  data: r.data,
  tripId: r.trip_id,
  readAt: r.read_at,
  createdAt: r.created_at,
});

export async function getNotifications(): Promise<AppNotification[]> {
  if (!hasBackend) return [];
  const { data, error } = await supabase!
    .from('notifications')
    .select(SELECT)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return ((data ?? []) as Row[]).map(toNotification);
}

// Stamp read_at on rows that are still unread. Guarded with `.is('read_at', null)`
// so re-opening Activity never rewrites an older read time.
export async function markNotificationsRead(ids: string[]): Promise<void> {
  if (!hasBackend || ids.length === 0) return;
  const { error } = await supabase!
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .in('id', ids)
    .is('read_at', null);
  if (error) throw error;
}

// Badge count — head request, no rows transferred.
export async function unreadNotificationCount(): Promise<number> {
  if (!hasBackend) return 0;
  const { count, error } = await supabase!
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .is('read_at', null);
  if (error) throw error;
  return count ?? 0;
}

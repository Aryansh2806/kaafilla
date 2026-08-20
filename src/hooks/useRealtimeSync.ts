import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase, hasBackend } from '../api/client';

// Postgres change streams → react-query cache invalidation. When any teammate
// inserts/updates/deletes a row in these tables, everyone's matching queries
// refetch, so screens reflect the change live. Realtime still enforces RLS, so
// clients only receive rows they are allowed to read.
const WATCH: { table: string; keys: string[] }[] = [
  // Operator portal publishes/cancels/reschedules departures (trips rows) live.
  { table: 'trips', keys: ['trips', 'trip', 'departures'] },
  { table: 'plans', keys: ['plans'] },
  { table: 'profiles', keys: ['people'] },
  { table: 'connects', keys: ['incoming', 'sent', 'accepted', 'connect'] },
  { table: 'plan_joins', keys: ['hostRequests', 'joinStatus'] },
  // Operator portal writes these (seat calls, cancellations, refunds) — Activity
  // and the 🔔 unread badge update the moment one lands.
  { table: 'notifications', keys: ['notifications', 'unreadCount'] },
];

export function useRealtimeSync(): void {
  const qc = useQueryClient();
  useEffect(() => {
    const client = supabase;
    if (!hasBackend || !client) return;
    const channel = client.channel('kaafilla-realtime');
    for (const { table, keys } of WATCH) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => {
          for (const key of keys) void qc.invalidateQueries({ queryKey: [key] });
        },
      );
    }
    channel.subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }, [qc]);
}

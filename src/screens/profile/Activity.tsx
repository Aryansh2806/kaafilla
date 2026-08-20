import { useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../theme/ThemeProvider';
import { Header } from '../../components/molecules/Header';
import { EmptyState } from '../../components/molecules/Card';
import { useNotifications } from '../../api/hooks';
import { markNotificationsRead } from '../../api/notifications';
import type { NotificationKind } from '../../types';

// Real notifications (stage20) written by the operator portal. `title`/`body`
// render verbatim — the portal owns that copy, we don't paraphrase it.
const ICONS: Record<NotificationKind, string> = {
  seat_called: '🎟️',
  departure_cancelled: '⚠️',
  departure_rescheduled: '📅',
  batch_finalized: '👥',
  refund_processed: '💸',
  trip_published: '✨',
};

// Tiny relative-time formatter — no new dependency for six branches.
function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const secs = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (secs < 60) return 'Just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function Activity({ navigation }: any) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { data } = useNotifications();
  const items = data ?? [];

  // Opening the screen IS the read. Mark everything on screen read once,
  // fire-and-forget, then refresh both queries so the 🔔 badge clears too.
  // `seen` keeps the accent tint on rows that were unread when we walked in, so
  // the list doesn't visibly reshuffle itself out from under the reader.
  const seen = useRef<Set<string>>(new Set());
  const marked = useRef(false);
  useEffect(() => {
    if (marked.current) return;
    const unread = items.filter((n) => !n.readAt).map((n) => n.id);
    if (unread.length === 0) return;
    marked.current = true;
    for (const id of unread) seen.current.add(id);
    void markNotificationsRead(unread)
      .then(() => {
        void qc.invalidateQueries({ queryKey: ['notifications'] });
        void qc.invalidateQueries({ queryKey: ['unreadCount'] });
      })
      .catch(() => {
        // Non-blocking: an unmarked row simply stays unread and retries next visit.
        marked.current = false;
      });
  }, [items, qc]);

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20 }}><Header title="Activity" onBack={() => navigation.goBack()} /></View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {items.length === 0 ? (
          <EmptyState title="Nothing new" body="Requests, seat calls and messages show up here." />
        ) : (
          items.map((n) => {
            const unread = !n.readAt || seen.current.has(n.id);
            return (
              <View key={n.id} style={[styles.row, { borderBottomColor: t.colors.n900 }]}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: unread ? t.colors.sectionBg : t.colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 16 }}>{ICONS[n.kind] ?? '🔔'}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: t.colors.text, fontSize: t.typography.size.body2, fontWeight: '600', lineHeight: t.typography.size.body2 * t.typography.lineHeight.relaxed }}>{n.title}</Text>
                  <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.body2, marginTop: 2, lineHeight: t.typography.size.body2 * t.typography.lineHeight.relaxed }}>{n.body}</Text>
                  <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: 2 }}>{timeAgo(n.createdAt)}</Text>
                </View>
                {unread && <View style={{ width: 8, height: 8, borderRadius: t.radius.full, backgroundColor: t.colors.accentL4, marginLeft: 10 }} />}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 } });

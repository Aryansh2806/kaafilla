import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { Avatar } from '../../components/atoms/Avatar';
import { Button } from '../../components/atoms/Button';
import { LockGate } from '../../components/molecules/LockGate';
import { lockGate, notes } from '../../data/copy';
import { hasBackend } from '../../api/client';
import { getIncoming, getSent, getAccepted, respondConnect, cancelConnect } from '../../api/social';

export function ChatList({ navigation }: any) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const verified = useAuthStore((s) => s.isVerified);
  const qc = useQueryClient();
  const { incoming: storeIncoming, connects, groupState, setGroupState } = useChatStore();
  const [tab, setTab] = useState<'chats' | 'requests'>('chats');

  // Backend social data (real connects). Falls back to the seeded store off-backend.
  const beIncoming = useQuery({ queryKey: ['incoming'], queryFn: getIncoming, enabled: hasBackend && verified });
  const beSent = useQuery({ queryKey: ['sent'], queryFn: getSent, enabled: hasBackend && verified });
  const beAccepted = useQuery({ queryKey: ['accepted'], queryFn: getAccepted, enabled: hasBackend && verified });

  if (!verified) {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.bg, paddingTop: insets.top, paddingHorizontal: 20 }}>
        <LockGate {...lockGate.chats} onVerify={() => navigation.navigate('VerifyGate', { gateFrom: 'chats' })} />
      </View>
    );
  }

  const incomingItems = hasBackend
    ? beIncoming.data ?? []
    : storeIncoming.map((r) => ({ id: r.id, fromId: r.id, name: r.name, city: r.city, note: r.note }));
  const sentItems = hasBackend
    ? beSent.data ?? []
    : Object.entries(connects)
        .filter(([, s]) => s === 'sent')
        .map(([id]) => ({ id, toId: id, name: id[0].toUpperCase() + id.slice(1) }));
  const acceptedItems = hasBackend
    ? beAccepted.data ?? []
    : Object.entries(connects)
        .filter(([, s]) => s === 'accepted')
        .map(([id]) => ({ connectId: id, peerId: id, name: id[0].toUpperCase() + id.slice(1), handle: '' }));

  const onAccept = async (connectId: string, peerId: string, name: string, handle: string) => {
    try {
      await respondConnect(connectId, true);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['incoming'] }),
        qc.invalidateQueries({ queryKey: ['accepted'] }),
      ]);
      navigation.navigate('ChatRoom', { peerId, name, kind: 'solo', handle: handle ? `@${handle}` : undefined });
    } catch (e: any) {
      Alert.alert('Could not accept', e?.message ?? 'Please try again.');
    }
  };
  const onDecline = async (connectId: string) => {
    try {
      await respondConnect(connectId, false);
      await qc.invalidateQueries({ queryKey: ['incoming'] });
    } catch (e: any) {
      Alert.alert('Could not decline', e?.message ?? 'Please try again.');
    }
  };
  const onCancel = async (toId: string) => {
    try {
      await cancelConnect(toId);
      await qc.invalidateQueries({ queryKey: ['sent'] });
    } catch (e: any) {
      Alert.alert('Could not cancel', e?.message ?? 'Please try again.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20 }}>
        <Text style={{ color: t.colors.text, fontSize: t.typography.size['2xl'], fontWeight: '600', marginTop: 8 }}>Chats</Text>
        <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.body2, marginTop: 2 }}>A chat opens only when both of you agree to it. Nobody can message you cold.</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
          {(['chats', 'requests'] as const).map((k) => (
            <Pressable key={k} onPress={() => setTab(k)} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: t.radius.full, backgroundColor: tab === k ? t.colors.accentL3 : t.colors.n900 }}>
              <Text style={{ color: tab === k ? t.colors.accentD4 : t.colors.textSub, fontSize: t.typography.size.body2, fontWeight: '600' }}>
                {k === 'chats' ? 'Chats' : `Requests · ${incomingItems.length}`}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {tab === 'chats' ? (
          <View style={{ marginTop: 16 }}>
            {/* Group chat — locked → live → archived (prototype lifecycle simulation) */}
            <Pressable
              onPress={() => groupState !== 'locked' && navigation.navigate('ChatRoom', { chatId: 'group', name: 'Spiti Sep 12–17', kind: 'group', archived: groupState === 'archived' })}
              style={[styles.row, { borderBottomColor: t.colors.n900 }]}
            >
              <Avatar name={groupState === 'locked' ? '🔒' : 'S'} size={48} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: t.colors.text, fontSize: t.typography.size.md, fontWeight: '600' }}>Spiti Sep 12–17</Text>
                {groupState === 'locked' && <>
                  <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs }}>Opens when the batch confirms</Text>
                  <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.body2, marginTop: 2 }}>Nobody is in here yet — the batch needs 2 more</Text>
                </>}
                {groupState === 'live' && <>
                  <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs }}>9 travellers · 3 nearby</Text>
                  <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.body2, marginTop: 2 }}>Meera: Anyone flying into Chandigarh on the 11th?</Text>
                </>}
                {groupState === 'archived' && <>
                  <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs }}>Archived · read-only</Text>
                  <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.body2, marginTop: 2 }}>Ritu: Home. Thanks for the chai stops.</Text>
                </>}
              </View>
              {groupState === 'live' && (
                <View style={{ backgroundColor: t.colors.accentL3, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
                  <Text style={{ color: t.colors.accentD4, fontSize: t.typography.size['2xs'], fontWeight: '700' }}>3</Text>
                </View>
              )}
              {groupState === 'archived' && <Text style={{ color: t.colors.textMuted, fontSize: 16 }}>🗄</Text>}
            </Pressable>

            {groupState === 'live' ? (
              <Pressable onPress={() => setGroupState('archived')} style={{ paddingVertical: 10 }}>
                <Text style={{ color: t.colors.accentL3, fontSize: t.typography.size.body2 }}>Simulate: three days after the trip ends</Text>
              </Pressable>
            ) : groupState === 'archived' ? (
              <View style={{ paddingVertical: 10 }}>
                <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, lineHeight: t.typography.size.xs * t.typography.lineHeight.relaxed }}>
                  The group archived itself three days after the trip. One-to-one chats stay — those were mutual.
                </Text>
                <Pressable onPress={() => setGroupState('live')}><Text style={{ color: t.colors.accentL3, fontSize: t.typography.size.body2, marginTop: 6 }}>Reset this state</Text></Pressable>
              </View>
            ) : null}

            {acceptedItems.map((c) => (
              <Pressable key={c.connectId} onPress={() => navigation.navigate('ChatRoom', { peerId: c.peerId, name: c.name, kind: 'solo', handle: c.handle ? `@${c.handle}` : undefined })} style={[styles.row, { borderBottomColor: t.colors.n900 }]}>
                <Avatar name={c.name} size={48} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: t.colors.text, fontSize: t.typography.size.md, fontWeight: '600' }}>{c.name}</Text>
                  <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.body2, marginTop: 2 }}>Connected · say hello</Text>
                </View>
              </Pressable>
            ))}

            <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: 16, lineHeight: t.typography.size.xs * t.typography.lineHeight.relaxed }}>
              Your trip group chat is created the moment the batch confirms — not before, so nobody sits in a room with strangers who may never travel together.
            </Text>
          </View>
        ) : (
          <View style={{ marginTop: 16 }}>
            {incomingItems.length === 0 ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Text style={{ color: t.colors.text, fontSize: t.typography.size.lg, fontWeight: '600' }}>No requests waiting</Text>
                <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.body2, marginTop: 4, textAlign: 'center' }}>{notes.silentDecline}</Text>
              </View>
            ) : (
              incomingItems.map((r) => (
                <View key={r.id} style={[styles.req, { backgroundColor: t.colors.surface, borderColor: t.colors.n800, borderRadius: t.radius.lg }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Avatar name={r.name} size={40} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: t.colors.text, fontSize: t.typography.size.md, fontWeight: '600' }}>{r.name}</Text>
                      <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs }}>{r.city}</Text>
                    </View>
                  </View>
                  <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.body2, marginTop: 10, lineHeight: t.typography.size.body2 * t.typography.lineHeight.relaxed }}>{r.note}</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                    <View style={{ flex: 1 }}><Button label="Not this time" variant="ghost" onPress={() => onDecline(r.id)} /></View>
                    <View style={{ flex: 1 }}><Button label="Accept & open chat" onPress={() => onAccept(r.id, (r as any).fromId ?? r.id, r.name, '')} /></View>
                  </View>
                </View>
              ))
            )}

            {sentItems.length > 0 && (
              <View style={{ marginTop: 20 }}>
                <Text style={{ color: t.colors.textFaint, fontSize: t.typography.size.kicker, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 }}>Sent by you</Text>
                {sentItems.map((s) => (
                  <View key={s.id} style={[styles.row, { borderBottomColor: t.colors.n900 }]}>
                    <Avatar name={s.name} size={40} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ color: t.colors.text, fontSize: t.typography.size.md, fontWeight: '600' }}>{s.name}</Text>
                      <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs }}>Waiting · expires in 30 days</Text>
                    </View>
                    <Pressable onPress={() => onCancel(s.toId)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Cancel request to ${s.name}`}>
                      <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.body2 }}>Cancel</Text>
                    </Pressable>
                  </View>
                ))}
                <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: 8 }}>You’ll never see whether they read it. If they accept, the chat and both handles open at the same moment.</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  req: { padding: 14, borderWidth: 1, marginBottom: 12 },
});

import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../theme/ThemeProvider';
import { usePerson } from '../../api/hooks';
import { useChatStore } from '../../store/chatStore';
import { hasBackend } from '../../api/client';
import { getConnectStatusWith, sendConnect } from '../../api/social';
import { Header } from '../../components/molecules/Header';
import { Button } from '../../components/atoms/Button';
import { Chip } from '../../components/atoms/Chip';
import { VerifiedBadge, Tag } from '../../components/atoms/Badges';
import { Avatar } from '../../components/atoms/Avatar';

const HABITS = [['Smoking', 'No'], ['Drinking', 'Socially'], ['Food', 'Vegetarian'], ['Body clock', 'Early riser'], ['On the road', 'Plan everything'], ['Where she sleeps', 'Homestays']];
const HISTORY = [
  { name: 'Spiti Valley Circuit', when: 'Sep 2025 · operator · with 14 people' },
  { name: 'Coorg coffee week', when: 'Mar 2026 · traveller plan · with 5 people' },
  { name: 'Hampta Pass Trek', when: 'Jun 2026 · operator · with 9 people' },
];

function Section({ title, children }: any) {
  const t = useTheme();
  return (
    <View style={{ marginTop: 24 }}>
      <Text style={{ color: t.colors.textFaint, fontSize: t.typography.size.kicker, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 }}>{title}</Text>
      {children}
    </View>
  );
}
function Chips({ items }: { items: string[] }) {
  const t = useTheme();
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing[2] }}>{items.map((x) => <Chip key={x} label={x} />)}</View>;
}

export function TravelerProfile({ navigation, route }: any) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const peerId = route.params?.id ?? 'meera';
  const { data: p } = usePerson(peerId);
  const qc = useQueryClient();
  const chatStatus = useChatStore((s) => s.connectStatus(peerId));
  const chatSend = useChatStore((s) => s.sendConnect);
  const { data: beStatus } = useQuery({
    queryKey: ['connect', peerId],
    queryFn: () => getConnectStatusWith(peerId),
    enabled: hasBackend,
  });
  const [sending, setSending] = useState(false);
  const status = hasBackend ? beStatus ?? 'none' : chatStatus;

  const onConnect = async () => {
    if (!hasBackend) {
      chatSend(peerId);
      return;
    }
    try {
      setSending(true);
      await sendConnect(peerId);
      await qc.invalidateQueries({ queryKey: ['connect', peerId] });
      await qc.invalidateQueries({ queryKey: ['sent'] });
    } catch (e: any) {
      Alert.alert('Could not send connect', e?.message ?? 'Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (!p) return <View style={{ flex: 1, backgroundColor: t.colors.bg }} />;

  const connected = status === 'accepted';

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20 }}><Header onBack={() => navigation.goBack()} /></View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <Avatar name={p.name} size={96} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
            <Text style={{ color: t.colors.text, fontSize: t.typography.size['2xl'], fontWeight: '600' }}>{p.name}, {p.age}</Text>
            <VerifiedBadge size={16} />
          </View>
          <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.body2, marginTop: 2 }}>{p.city} · Aadhaar verified · {p.trips} trips</Text>
        </View>

        <Text style={{ color: t.colors.text, fontSize: t.typography.size.md, marginTop: 20, lineHeight: t.typography.size.md * t.typography.lineHeight.relaxed }}>{p.bio}</Text>

        <Section title="Trips she’s drawn to"><Chips items={['Mountains', 'Treks', 'Road trips']} /></Section>
        <Section title="Places already"><Chips items={['Himachal', 'Ladakh', 'Sikkim', 'Kerala', 'Goa', '+4']} /></Section>
        <Section title="Languages"><Chips items={['Kannada', 'Hindi', 'English']} /></Section>
        <Section title="Things she’s into"><Chips items={['Photography', 'Guitar', 'Cooking', 'Birding']} /></Section>

        <Section title="Sharing a room with her">
          <View style={[styles.habits, { backgroundColor: t.colors.surface, borderColor: t.colors.n800, borderRadius: t.radius.lg }]}>
            {HABITS.map(([k, v], i) => (
              <View key={k} style={[styles.hrow, i < HABITS.length - 1 && { borderBottomWidth: 1, borderBottomColor: t.colors.n900 }]}>
                <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.body2 }}>{k}</Text>
                <Text style={{ color: t.colors.text, fontSize: t.typography.size.body2, fontWeight: '600' }}>{v}</Text>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Trips done">
          {HISTORY.map((h) => (
            <View key={h.name} style={[styles.trip, { backgroundColor: t.colors.surface, borderColor: t.colors.n800, borderRadius: t.radius.lg }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.colors.text, fontSize: t.typography.size.md, fontWeight: '600' }}>{h.name}</Text>
                <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: 2 }}>{h.when}</Text>
              </View>
              <Tag label="ALL SETTLED" tone="accent" />
            </View>
          ))}
          <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: 8 }}>{p.trips} trips · every balance settled. Amounts stay private — only whether she settled is public.</Text>
        </Section>

        <Section title="Instagram">
          {connected ? (
            <Text style={{ color: t.colors.accentL3, fontSize: t.typography.size.md }}>{p.handle} · Handle unlocked — request accepted</Text>
          ) : (
            <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.md }}>@•••••••••• · Unlocks when she accepts your connect</Text>
          )}
        </Section>

        <View style={{ marginTop: 24 }}>
          {connected ? (
            <Button label="Open chat" onPress={() => navigation.navigate('Main', { screen: 'Chats', params: { screen: 'ChatRoom', params: { peerId: p.id, name: p.name, kind: 'solo', handle: p.handle } } })} />
          ) : status === 'sent' ? (
            <Button label="Connect sent · waiting" variant="secondary" disabled />
          ) : status === 'incoming' ? (
            <Button label="They asked to connect — reply in Chats" variant="secondary" onPress={() => navigation.navigate('Main', { screen: 'Chats' })} />
          ) : (
            <Button label={sending ? 'Sending…' : 'Send a connect'} onPress={onConnect} disabled={sending} />
          )}
        </View>
        <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: 16, textAlign: 'center' }}>Report or block {p.name}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  habits: { borderWidth: 1, paddingHorizontal: 16 },
  hrow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  trip: { flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 1, marginBottom: 10 },
});

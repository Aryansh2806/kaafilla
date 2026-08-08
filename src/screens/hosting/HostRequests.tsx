import { useState } from 'react';
import { View, Text, ScrollView, Alert, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../theme/ThemeProvider';
import { Header } from '../../components/molecules/Header';
import { Button } from '../../components/atoms/Button';
import { ProgressBar } from '../../components/atoms/Progress';
import { Avatar } from '../../components/atoms/Avatar';
import { useHostRequests } from '../../api/hooks';
import { respondToJoin, type HostRequest } from '../../api/plans';
import { getOrCreateSoloChat } from '../../api/social';

// Fallback simulator content, used only when the plan-join backend isn't live.
const FALLBACK = [
  { id: 'nikita', planId: '', planName: 'your plan', travellerId: '', name: 'Nikita', city: 'Pune · first solo trip', note: 'Read your note about trout. I fish badly but enthusiastically. Free the whole of October.' },
  { id: 'dev', planId: '', planName: 'your plan', travellerId: '', name: 'Dev', city: 'Mumbai · 3 trips', note: 'Can drive, happy to take the Aut–Banjar stretch. Been to Tirthan twice.' },
];

export function HostRequests({ navigation }: any) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const reqsQ = useHostRequests();
  const live = reqsQ.isSuccess;
  const [localReqs, setLocalReqs] = useState(FALLBACK); // fallback list
  const [busy, setBusy] = useState<string | null>(null);

  const reqs: HostRequest[] = live ? reqsQ.data : localReqs;

  const openChat = (r: HostRequest) => {
    // HostRequests lives in the profile stack; navigate up to the Chats tab.
    try {
      navigation.navigate('Chats', { screen: 'ChatRoom', params: { peerId: r.travellerId, name: r.name, kind: 'solo' } });
    } catch {
      // cross-stack nav unavailable — the chat still exists in Chats
    }
  };

  const accept = async (r: HostRequest) => {
    if (!live) return setLocalReqs((x) => x.filter((y) => y.id !== r.id));
    try {
      setBusy(r.id);
      const res = await respondToJoin(r.id, true);
      await getOrCreateSoloChat(r.travellerId); // both become members; opens the room
      await qc.invalidateQueries({ queryKey: ['hostRequests'] });
      await qc.invalidateQueries({ queryKey: ['plans'] });
      if (res.hostCharged) Alert.alert('₹49 hosting fee charged', 'Charged now that your first traveller has joined.');
      openChat(r);
    } catch (e: any) {
      Alert.alert('Try again', e?.message ?? 'Could not accept.');
    } finally {
      setBusy(null);
    }
  };

  const decline = async (r: HostRequest) => {
    if (!live) return setLocalReqs((x) => x.filter((y) => y.id !== r.id));
    try {
      setBusy(r.id);
      await respondToJoin(r.id, false);
      await qc.invalidateQueries({ queryKey: ['hostRequests'] });
    } catch (e: any) {
      Alert.alert('Try again', e?.message ?? 'Could not decline.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20 }}><Header onBack={() => navigation.goBack()} /></View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={{ color: t.colors.text, fontSize: t.typography.size['2xl'], fontWeight: '600', marginTop: 8 }}>Who’s asking to come</Text>
        <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.body2, marginTop: 4 }}>You’re hosting. Declining is silent — they’re never told.</Text>

        <View style={[styles.fill, { backgroundColor: t.colors.surface, borderColor: t.colors.n800, borderRadius: t.radius.lg }]}>
          <Text style={{ color: t.colors.text, fontSize: t.typography.size.md, fontWeight: '600' }}>{reqs.length} asking to join</Text>
          <View style={{ marginTop: 10 }}><ProgressBar value={reqs.length ? 0.5 : 1} /></View>
          <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: 8 }}>The ₹49 hosting fee is charged when your first traveller joins.</Text>
        </View>

        {reqs.length === 0 ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <Text style={{ color: t.colors.text, fontSize: t.typography.size.lg, fontWeight: '600' }}>You’re all caught up</Text>
            <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.body2, marginTop: 4, textAlign: 'center' }}>Anyone new who asks to join will show up here.</Text>
          </View>
        ) : (
          reqs.map((r) => (
            <View key={r.id} style={[styles.req, { backgroundColor: t.colors.surface, borderColor: t.colors.n800, borderRadius: t.radius.lg }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Avatar name={r.name} size={40} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.colors.text, fontSize: t.typography.size.md, fontWeight: '600' }}>{r.name}</Text>
                  <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs }}>{r.city}{live ? ` · ${r.planName}` : ''}</Text>
                </View>
              </View>
              {!!r.note && <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.body2, marginTop: 10, lineHeight: t.typography.size.body2 * t.typography.lineHeight.relaxed }}>{r.note}</Text>}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <View style={{ flex: 1 }}><Button label="Not this time" variant="ghost" disabled={busy === r.id} onPress={() => decline(r)} /></View>
                <View style={{ flex: 1 }}><Button label={busy === r.id ? 'Working…' : 'Accept & open chat'} disabled={busy === r.id} onPress={() => accept(r)} /></View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { padding: 14, borderWidth: 1, marginTop: 20 },
  req: { padding: 14, borderWidth: 1, marginTop: 12 },
});

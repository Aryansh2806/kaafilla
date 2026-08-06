import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { Header } from '../../components/molecules/Header';
import { Button } from '../../components/atoms/Button';
import { ProgressBar } from '../../components/atoms/Progress';
import { Avatar } from '../../components/atoms/Avatar';

const REQUESTS = [
  { id: 'nikita', name: 'Nikita', from: 'Pune · first solo trip', note: 'Read your note about trout. I fish badly but enthusiastically. Free the whole of October.' },
  { id: 'dev', name: 'Dev', from: 'Mumbai · 3 trips', note: 'Can drive, happy to take the Aut–Banjar stretch. Been to Tirthan twice.' },
];

export function HostRequests({ navigation }: any) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [reqs, setReqs] = useState(REQUESTS);
  const joined = 4 + (REQUESTS.length - reqs.length);

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20 }}><Header onBack={() => navigation.goBack()} /></View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={{ color: t.colors.text, fontSize: t.typography.size['2xl'], fontWeight: '600', marginTop: 8 }}>Who’s asking to come</Text>
        <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.body2, marginTop: 4 }}>Tirthan Valley cabin week · you’re hosting. Declining is silent — they’re never told.</Text>

        <View style={[styles.fill, { backgroundColor: t.colors.surface, borderColor: t.colors.n800, borderRadius: t.radius.lg }]}>
          <Text style={{ color: t.colors.text, fontSize: t.typography.size.md, fontWeight: '600' }}>{joined} of 6 joined</Text>
          <View style={{ marginTop: 10 }}><ProgressBar value={joined / 6} /></View>
          <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: 8 }}>₹49 hosting fee charged when your first traveller joined</Text>
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
                  <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs }}>{r.from}</Text>
                </View>
              </View>
              <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.body2, marginTop: 10, lineHeight: t.typography.size.body2 * t.typography.lineHeight.relaxed }}>{r.note}</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <View style={{ flex: 1 }}><Button label="Not this time" variant="ghost" onPress={() => setReqs((x) => x.filter((y) => y.id !== r.id))} /></View>
                <View style={{ flex: 1 }}><Button label="Accept & open chat" onPress={() => setReqs((x) => x.filter((y) => y.id !== r.id))} /></View>
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

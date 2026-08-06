import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { Header } from '../../components/molecules/Header';
import { Tag } from '../../components/atoms/Badges';
import { ProgressBar } from '../../components/atoms/Progress';
import { MY_WAITLISTS, MY_HOSTED } from '../../data/me';

export function MyTrips({ navigation }: any) {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20 }}><Header title="Your trips" onBack={() => navigation.goBack()} /></View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={{ color: t.colors.textFaint, fontSize: t.typography.size.kicker, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 8, marginBottom: 10 }}>Waitlisted</Text>
        {MY_WAITLISTS.map((w) => (
          <View key={w.id} style={[styles.card, { backgroundColor: t.colors.surface, borderColor: t.colors.n800, borderRadius: t.radius.lg }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: t.colors.text, fontSize: t.typography.size.md, fontWeight: '600' }}>{w.name}</Text>
              <Tag label="WAITLISTED" tone="accent" />
            </View>
            <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: 4 }}>{w.dates} · #{w.pos} in queue · needs {w.need} more</Text>
            <View style={{ marginTop: 10 }}><ProgressBar value={w.joined / w.size} /></View>
            <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: 6 }}>{w.joined} / {w.size}</Text>
          </View>
        ))}

        <Text style={{ color: t.colors.textFaint, fontSize: t.typography.size.kicker, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 24, marginBottom: 10 }}>Hosting</Text>
        {MY_HOSTED.map((h) => (
          <View key={h.id} style={[styles.card, { backgroundColor: t.colors.surface, borderColor: t.colors.n800, borderRadius: t.radius.lg }]}>
            <Text style={{ color: t.colors.text, fontSize: t.typography.size.md, fontWeight: '600' }}>{h.name}</Text>
            <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: 4 }}>{h.joined} of {h.size} joined · {h.asking} asking to join</Text>
            <View style={{ marginTop: 10 }}><ProgressBar value={h.joined / h.size} /></View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({ card: { padding: 14, borderWidth: 1, marginBottom: 10 } });

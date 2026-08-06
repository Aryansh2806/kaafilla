import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { Header } from '../../components/molecules/Header';
import { Tag } from '../../components/atoms/Badges';
import { MY_HISTORY } from '../../data/me';

export function TripHistory({ navigation }: any) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const settled = MY_HISTORY.filter((h) => h.settled).length;

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20 }}><Header title="Trips done" onBack={() => navigation.goBack()} /></View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.body2, marginTop: 4 }}>
          {settled} of {MY_HISTORY.length} fully settled · ₹24,450 travelled through
        </Text>
        <View style={{ marginTop: 16 }}>
          {MY_HISTORY.map((h) => (
            <View key={h.name} style={[styles.card, { backgroundColor: t.colors.surface, borderColor: t.colors.n800, borderRadius: t.radius.lg }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.colors.text, fontSize: t.typography.size.md, fontWeight: '600' }}>{h.name}</Text>
                <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: 2 }}>{h.when} · {h.amount}</Text>
              </View>
              <Tag label={h.settled ? 'ALL SETTLED' : 'ONE BALANCE OPEN'} tone={h.settled ? 'accent' : 'neutral'} />
            </View>
          ))}
        </View>
        <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: 12, lineHeight: t.typography.size.xs * t.typography.lineHeight.relaxed }}>
          A trip appears here as soon as it ends. The settled mark appears when the last balance clears — everyone can see both.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({ card: { flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 1, marginBottom: 10 } });

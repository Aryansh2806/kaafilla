import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { useReviews, useOperator } from '../../api/hooks';
import { Header } from '../../components/molecules/Header';
import { Avatar } from '../../components/atoms/Avatar';

const HIST = [
  { star: 5, pct: 62 }, { star: 4, pct: 24 }, { star: 3, pct: 9 }, { star: 2, pct: 3 }, { star: 1, pct: 2 },
];

export function Reviews({ navigation, route }: any) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const operatorId = route.params?.operatorId ?? 'himalayan-nomads';
  const { data: op } = useOperator(operatorId);
  const { data: reviews } = useReviews(operatorId);

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20 }}>
        <Header title="Comparison" onBack={() => navigation.goBack()} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={{ color: t.colors.text, fontSize: t.typography.size['2xl'], fontWeight: '600', marginTop: 8 }}>{op?.name}</Text>
        <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.body2, marginTop: 4 }}>
          ★ 4.6 · {reviews?.length ?? 0} reviews
        </Text>

        <View style={{ marginTop: 20, gap: 8 }}>
          {HIST.map((h) => (
            <View key={h.star} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.body2, width: 24 }}>{h.star}★</Text>
              <View style={{ flex: 1, height: 6, backgroundColor: t.colors.n900, borderRadius: t.radius.full, overflow: 'hidden' }}>
                <View style={{ width: `${h.pct}%`, height: '100%', backgroundColor: t.colors.accentL5 }} />
              </View>
              <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, width: 32, textAlign: 'right' }}>{h.pct}%</Text>
            </View>
          ))}
        </View>

        <Text style={{ color: t.colors.textFaint, fontSize: t.typography.size.kicker, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 28, marginBottom: 12 }}>
          From travellers who went
        </Text>
        {(reviews ?? []).map((r) => (
          <View key={r.id} style={[styles.card, { backgroundColor: t.colors.surface, borderColor: t.colors.n800, borderRadius: t.radius.lg }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Avatar name={r.name} size={36} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.colors.text, fontSize: t.typography.size.md, fontWeight: '600' }}>{r.name}</Text>
                <Text style={{ color: t.colors.warning, fontSize: t.typography.size.body2 }}>{'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</Text>
              </View>
            </View>
            <Text style={{ color: t.colors.text, fontSize: t.typography.size.md, marginTop: 10, lineHeight: t.typography.size.md * t.typography.lineHeight.relaxed }}>{r.text}</Text>
            <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: 8 }}>{r.when} · verified traveller</Text>
          </View>
        ))}

        <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: 12, lineHeight: t.typography.size.xs * t.typography.lineHeight.relaxed }}>
          Only travellers who actually booked through Kaafilla can review. Operators can’t remove a review.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({ card: { padding: 14, borderWidth: 1, marginBottom: 12 } });

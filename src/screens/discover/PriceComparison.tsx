import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { useTrip } from '../../api/hooks';
import { useTripStore } from '../../store/tripStore';
import { Header } from '../../components/molecules/Header';
import { Tag } from '../../components/atoms/Badges';
import { Button } from '../../components/atoms/Button';
import { operatorsFor, type CompareOp } from '../../utils/compare';

const ROWS: { label: string; get: (o: CompareOp) => string; reviews?: boolean }[] = [
  { label: 'Price', get: (o) => `₹${o.price.toLocaleString('en-IN')}` },
  { label: 'Per day', get: (o) => `₹${o.perDay.toLocaleString('en-IN')}` },
  { label: 'Rating', get: (o) => `★ ${o.rating.toFixed(1)}` },
  { label: 'Reviews', get: (o) => `${o.reviews} reviews →`, reviews: true },
  { label: 'Stay', get: (o) => o.stay },
  { label: 'Meals', get: (o) => o.meals },
  { label: 'Transport', get: (o) => o.transport },
  { label: 'Permits & fees', get: (o) => o.permits },
  { label: 'Group size', get: (o) => String(o.groupSize) },
  { label: 'Solo travellers', get: (o) => `${o.solo}%` },
  { label: 'Departs from', get: (o) => o.departs },
  { label: 'Cancellation', get: (o) => o.cancel },
  { label: 'What people said', get: (o) => o.quote },
];

const COL_W = 150;
const ROW_H = 56;

export function PriceComparison({ navigation, route }: any) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const id = route.params?.id ?? 'spiti';
  const { data: trip } = useTrip(id);
  const chooseOperator = useTripStore((s) => s.chooseOperator);
  const [hideSame, setHideSame] = useState(false);
  if (!trip) return <View style={{ flex: 1, backgroundColor: t.colors.bg }} />;

  const ops = operatorsFor(trip);
  const cheapest = [...ops].sort((a, b) => a.price - b.price)[0];
  const topRated = [...ops].sort((a, b) => b.rating - a.rating)[0];
  const mostSolo = [...ops].sort((a, b) => b.solo - a.solo)[0];
  const lo = Math.min(...ops.map((o) => o.price));
  const hi = Math.max(...ops.map((o) => o.price));

  const isSame = (r: (typeof ROWS)[number]) => ops.every((o) => r.get(o) === r.get(ops[0]));
  const sameCount = ROWS.filter(isSame).length;
  const rows = hideSame ? ROWS.filter((r) => !isSame(r)) : ROWS;

  const best = [
    { tag: 'CHEAPEST', op: cheapest.name, val: `₹${cheapest.price.toLocaleString('en-IN')}` },
    { tag: 'HIGHEST RATED', op: topRated.name, val: `★ ${topRated.rating.toFixed(1)}` },
    { tag: 'MOST SOLO TRAVELLERS', op: mostSolo.name, val: `${mostSolo.solo}%` },
  ];

  const choose = (o: CompareOp) => {
    chooseOperator(id, { name: o.name, price: o.price });
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20 }}>
        <Header title="Back to the trip" onBack={() => navigation.goBack()} />
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={{ color: t.colors.text, fontSize: t.typography.size['2xl'], fontWeight: '600', marginTop: 8 }}>{trip.name} — {trip.days} days</Text>
          <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.body2, marginTop: 4 }}>
            {ops.length} operators run this route in {trip.month}. Same road, different company.
          </Text>
        </View>

        {/* Best-of */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10, marginTop: 16 }}>
          {best.map((b) => (
            <View key={b.tag} style={[styles.bestCard, { backgroundColor: t.colors.surface, borderColor: t.colors.n800, borderRadius: t.radius.lg }]}>
              <Tag label={b.tag} tone="accent" />
              <Text style={{ color: t.colors.text, fontSize: t.typography.size.lg, fontWeight: '600', marginTop: 8 }}>{b.val}</Text>
              <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: 2 }}>{b.op}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Hide-same toggle */}
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <Pressable onPress={() => setHideSame((h) => !h)} style={{ alignSelf: 'flex-start', backgroundColor: t.colors.n900, borderRadius: t.radius.full, paddingVertical: 8, paddingHorizontal: 14 }}>
            <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.body2 }}>
              {hideSame ? (sameCount ? `${sameCount} identical rows hidden` : 'No identical rows') : 'Hide rows that are the same'}
            </Text>
          </Pressable>
        </View>

        {/* Comparison table: fixed label column + horizontally scrolling operator columns */}
        <View style={{ flexDirection: 'row', marginTop: 16 }}>
          <View style={{ paddingLeft: 20 }}>
            <View style={{ height: ROW_H }} />{/* header spacer */}
            {rows.map((r) => (
              <View key={r.label} style={{ height: ROW_H, justifyContent: 'center' }}>
                <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs }}>{r.label}</Text>
              </View>
            ))}
            <View style={{ height: ROW_H }} />{/* choose spacer */}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
            {ops.map((o, ci) => (
              <View key={ci} style={[styles.col, { width: COL_W, backgroundColor: o.self ? t.colors.surfaceRaised : 'transparent', borderColor: o.self ? t.colors.accent : t.colors.n900 }]}>
                <View style={{ height: ROW_H, justifyContent: 'center', paddingHorizontal: 10 }}>
                  <Text numberOfLines={1} style={{ color: t.colors.text, fontSize: t.typography.size.body2, fontWeight: '600' }}>{o.name}</Text>
                  <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size['2xs'] }}>{o.self ? 'this listing' : 'also runs it'}</Text>
                </View>
                {rows.map((r) => (
                  <Pressable key={r.label} disabled={!r.reviews} onPress={() => navigation.navigate('Reviews', { operatorId: trip.operatorId })} style={{ height: ROW_H, justifyContent: 'center', paddingHorizontal: 10, borderTopWidth: 1, borderTopColor: t.colors.n900 }}>
                    <Text numberOfLines={2} style={{ color: r.reviews ? t.colors.accentL3 : t.colors.text, fontSize: t.typography.size.body2 }}>{r.get(o)}</Text>
                  </Pressable>
                ))}
                <View style={{ height: ROW_H, justifyContent: 'center', paddingHorizontal: 8 }}>
                  <Button label="Choose" variant={o.self ? 'secondary' : 'primary'} onPress={() => choose(o)} />
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Price dot-plot */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Text style={{ color: t.colors.textFaint, fontSize: t.typography.size.kicker, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 }}>Price at a glance</Text>
          {ops.map((o, i) => {
            const pos = hi === lo ? 0 : ((o.price - lo) / (hi - lo)) * 100;
            return (
              <View key={i} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: o.self ? t.colors.accentL3 : t.colors.text, fontSize: t.typography.size.body2, fontWeight: o.self ? '600' : '400' }}>{o.name}{o.self ? ' · this listing' : ''}</Text>
                  <Text style={{ color: t.colors.text, fontSize: t.typography.size.body2 }}>₹{o.price.toLocaleString('en-IN')}</Text>
                </View>
                <View style={{ height: 4, backgroundColor: t.colors.n900, borderRadius: t.radius.full, marginTop: 8 }}>
                  <View style={{ position: 'absolute', left: `${pos}%`, top: -3, width: 10, height: 10, borderRadius: 5, backgroundColor: o.self ? t.colors.accent : t.colors.n400, marginLeft: -5 }} />
                </View>
                <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: 6 }}>★ {o.rating.toFixed(1)} · {o.stay} · {o.transport}</Text>
              </View>
            );
          })}
          <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: 4, lineHeight: t.typography.size.xs * t.typography.lineHeight.relaxed }}>
            ₹{(hi - lo).toLocaleString('en-IN')} between cheapest and priciest — mostly {trip.stay} versus camps. Kaafilla earns a commission from the operator, never from you.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bestCard: { padding: 14, borderWidth: 1, width: 160 },
  col: { borderWidth: 1, borderRadius: 12, marginRight: 8, overflow: 'hidden' },
});

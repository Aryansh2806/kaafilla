import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { Chip } from '../../components/atoms/Chip';
import { Button } from '../../components/atoms/Button';
import { useTripStore, SORT_LABEL, type SortKey, type TripFilters } from '../../store/tripStore';
import { useTrips, usePlans } from '../../api/hooks';
import { applyFilters } from '../../utils/filters';

function Group({ title, note, value, options, onPick }: {
  title: string; note?: string; value: string; options: { v: string; label: string }[]; onPick: (v: string) => void;
}) {
  const t = useTheme();
  return (
    <View style={{ marginTop: t.spacing[6] }}>
      <Text style={{ color: t.colors.text, fontSize: t.typography.size.lg, fontWeight: '600' }}>{title}</Text>
      {note && <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: 4 }}>{note}</Text>}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing[2], marginTop: t.spacing[3] }}>
        {options.map((o) => (
          <Chip key={String(o.v)} label={o.label} selected={value === o.v} onPress={() => onPick(o.v)} />
        ))}
      </View>
    </View>
  );
}

export function FilterSheet({ navigation }: any) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { filters, setFilters, reset } = useTripStore();
  const trips = useTrips();
  const plans = usePlans();
  const count = applyFilters(trips.data ?? [], plans.data ?? [], filters).length;

  const sortOpts: { v: SortKey; label: string }[] = (Object.keys(SORT_LABEL) as SortKey[]).map((k) => ({ v: k, label: SORT_LABEL[k] }));

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg, paddingTop: insets.top }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
          <Text style={{ color: t.colors.text, fontSize: 22 }}>✕</Text>
        </Pressable>
        <Text style={{ color: t.colors.text, fontSize: t.typography.size.xl, fontWeight: '600' }}>Filters</Text>
        <Pressable onPress={reset} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear all">
          <Text style={{ color: t.colors.accent, fontSize: t.typography.size.md }}>Clear all</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <Group title="Sort by" value={filters.sort} onPick={(v) => setFilters({ sort: v as SortKey })} options={sortOpts} />
        <Group title="Run by" note="Operators sell a seat. Travellers plan their own and split the cost." value={filters.runBy}
          onPick={(v) => setFilters({ runBy: v as TripFilters['runBy'] })}
          options={[{ v: 'any', label: 'Anyone' }, { v: 'operator', label: 'Operators' }, { v: 'traveller', label: 'Travellers' }]} />
        <Group title="Price per person" value={filters.price} onPick={(v) => setFilters({ price: v as TripFilters['price'] })}
          options={[{ v: 'any', label: 'Any' }, { v: 'under10', label: 'Under ₹10k' }, { v: '10to20', label: '₹10–20k' }, { v: 'over20', label: 'Over ₹20k' }]} />
        <Group title="Number of days" value={filters.days} onPick={(v) => setFilters({ days: v as TripFilters['days'] })}
          options={[{ v: 'any', label: 'Any' }, { v: '1to3', label: '1–3' }, { v: '4to6', label: '4–6' }, { v: '7plus', label: '7+' }]} />
        <Group title="Travel type" value={filters.type} onPick={(v) => setFilters({ type: v })}
          options={[{ v: 'any', label: 'Any' }, ...['Mountains', 'Treks', 'Beaches', 'Road trips', 'Deserts'].map((x) => ({ v: x, label: x }))]} />
        <Group title="Places" value={filters.place} onPick={(v) => setFilters({ place: v })}
          options={[{ v: 'any', label: 'Any' }, ...['Himachal', 'Ladakh', 'Uttarakhand', 'Northeast', 'Rajasthan', 'Karnataka', 'Kerala'].map((x) => ({ v: x, label: x }))]} />
        <Group title="Month" value={filters.month} onPick={(v) => setFilters({ month: v })}
          options={[{ v: 'any', label: 'Any' }, { v: 'Sep', label: 'Sep' }, { v: 'Oct', label: 'Oct' }, { v: 'Nov', label: 'Nov' }]} />
        <Group title="Difficulty" value={filters.difficulty} onPick={(v) => setFilters({ difficulty: v })}
          options={[{ v: 'any', label: 'Any' }, { v: 'Easy', label: 'Easy' }, { v: 'Moderate', label: 'Moderate' }, { v: 'Hard', label: 'Hard' }]} />
        <Group title="Operator rating" value={filters.rating} onPick={(v) => setFilters({ rating: v as TripFilters['rating'] })}
          options={[{ v: 'any', label: 'Any' }, { v: '4', label: '4.0+' }, { v: '4.5', label: '4.5+' }]} />
      </ScrollView>

      <View style={[styles.cta, { backgroundColor: t.colors.bg, borderTopColor: t.colors.n800, paddingBottom: insets.bottom + 12 }]}>
        <Button label={count ? `Show ${count} listings` : 'No matches'} onPress={() => navigation.goBack()} disabled={count === 0} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 48 },
  cta: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1 },
});

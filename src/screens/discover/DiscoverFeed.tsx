import { useMemo } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { useTrips, usePlans } from '../../api/hooks';
import { useAuthStore } from '../../store/authStore';
import { FeedCard } from '../../components/molecules/FeedCard';
import { VerifiedBadge, Tag } from '../../components/atoms/Badges';
import { Chip } from '../../components/atoms/Chip';
import { EmptyState } from '../../components/molecules/Card';
import { useTripStore, SORT_LABEL, type TripFilters } from '../../store/tripStore';
import { applyFilters } from '../../utils/filters';

const FILTER_LABEL: Record<string, string> = {
  under10: 'Under ₹10k', '10to20': '₹10–20k', over20: 'Over ₹20k',
  '1to3': '1–3 days', '4to6': '4–6 days', '7plus': '7+ days',
  operator: 'Operators', traveller: 'Travellers', '4': '4.0+', '4.5': '4.5+',
};

export function DiscoverFeed({ navigation }: any) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const verified = useAuthStore((s) => s.isVerified);
  const trips = useTrips();
  const plans = usePlans();
  const filters = useTripStore((s) => s.filters);
  const activeCount = useTripStore((s) => s.activeCount());
  const resetFilters = useTripStore((s) => s.reset);
  const setFilters = useTripStore((s) => s.setFilters);

  const activeChips = (Object.entries(filters) as [keyof TripFilters, string][])
    .filter(([k, v]) => k !== 'sort' && v !== 'any')
    .map(([k, v]) => ({ key: k, label: FILTER_LABEL[v] ?? v }));

  const rows = useMemo(
    () => applyFilters(trips.data ?? [], plans.data ?? [], filters),
    [trips.data, plans.data, filters],
  );

  const loading = trips.isLoading || plans.isLoading;

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg, paddingTop: insets.top }}>
      <FlashList
        data={rows}
        keyExtractor={(r) => `${r.type}-${r.data.id}`}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        ListHeaderComponent={
          <View style={{ paddingBottom: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <Text style={{ color: t.colors.textFaint, fontSize: t.typography.size.kicker, letterSpacing: 1.2, textTransform: 'uppercase' }}>kaafilla</Text>
              {verified ? <VerifiedBadge variant="pill" /> : <Tag label="Unverified" tone="neutral" />}
            </View>
            <Text style={{ color: t.colors.text, fontSize: t.typography.size['4xl'], fontWeight: '500', marginTop: 12, lineHeight: t.typography.size['4xl'] * 1.1 }}>
              Where’s the{'\n'}kaafila going?
            </Text>
            <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.body2, marginTop: 8 }}>
              {rows.length} · across India this season
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
              <Pressable onPress={() => navigation.navigate('FilterSheet')} accessibilityRole="button" accessibilityLabel="Filters"
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: t.colors.surface, borderRadius: t.radius.full, borderWidth: 1, borderColor: activeCount ? t.colors.accent : t.colors.n800, paddingVertical: 8, paddingHorizontal: 14 }}>
                <Text style={{ color: t.colors.text, fontSize: t.typography.size.body2 }}>Filters</Text>
                {activeCount > 0 && (
                  <View style={{ backgroundColor: t.colors.accentL3, borderRadius: t.radius.full, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 }}>
                    <Text style={{ color: t.colors.accentD4, fontSize: t.typography.size['2xs'], fontWeight: '700' }}>{activeCount}</Text>
                  </View>
                )}
              </Pressable>
              <View style={{ backgroundColor: t.colors.n900, borderRadius: t.radius.full, paddingVertical: 8, paddingHorizontal: 14 }}>
                <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.body2 }}>{SORT_LABEL[filters.sort]}</Text>
              </View>
              {activeChips.map((c) => (
                <Chip key={c.key} label={c.label} selected onRemove={() => setFilters({ [c.key]: 'any' } as Partial<TripFilters>)} />
              ))}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ marginTop: 14 }}>
            <FeedCard
              {...item}
              verified={verified}
              onPress={() => navigation.navigate(item.type === 'trip' ? 'TripDetail' : 'PlanDetail', { id: item.data.id })}
            />
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={t.colors.accent} style={{ marginTop: 40 }} />
          ) : (
            <EmptyState
              title="Nothing matches all that"
              body="Loosen a filter and the list fills back up."
              ctaLabel="Clear all filters"
              onCta={resetFilters}
            />
          )
        }
      />
    </View>
  );
}

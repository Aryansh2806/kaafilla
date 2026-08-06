import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { useExploreRegion } from '../../api/hooks';
import { Header } from '../../components/molecules/Header';
import { EmptyState } from '../../components/molecules/Card';
import type { ExplorePlace } from '../../types';

const TABS = [
  { key: 'famous', label: 'Famous', note: 'The things everyone goes for — worth knowing before you decide what to skip.' },
  { key: 'food', label: 'Food', note: 'Prices are what travellers actually paid, not menu prices.' },
  { key: 'gems', label: 'Hidden gems', note: 'Added by travellers who went. Only people who completed a trip here can add one.' },
  { key: 'shops', label: 'Shops', note: 'Distances are from where your group is staying.' },
] as const;

export function LocalDiscover({ navigation, route }: any) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { data: region } = useExploreRegion(route.params?.region ?? 'himachal');
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('famous');
  const [offline, setOffline] = useState(false);

  if (!region) {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.bg, paddingTop: insets.top, paddingHorizontal: 20 }}>
        <Header onBack={() => navigation.goBack()} />
        <EmptyState title="Nothing added here yet" body="Nobody’s been here with Kaafilla yet. Go, and you can be the first to add the places worth knowing." ctaLabel="Add the first place" />
      </View>
    );
  }

  const items: ExplorePlace[] = (region as any)[tab] ?? [];
  const activeTab = TABS.find((x) => x.key === tab)!;

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20 }}>
        <Header onBack={() => navigation.goBack()} />
        <Text style={{ color: t.colors.text, fontSize: t.typography.size['2xl'], fontWeight: '600', marginTop: 8 }}>{region.base}</Text>
        <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.body2, marginTop: 2 }}>{region.sub}</Text>

        <Pressable onPress={() => setOffline((o) => !o)} style={[styles.offline, { backgroundColor: t.colors.surface, borderColor: offline ? t.colors.accent : t.colors.n800, borderRadius: t.radius.lg }]}>
          <Text style={{ color: t.colors.text, fontSize: t.typography.size.md, fontWeight: '600' }}>{offline ? 'Available offline' : 'Save this for offline'}</Text>
          <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: 2 }}>
            {offline ? 'Shared to everyone in your group chat too' : '4.2 MB · works with no signal and no data'}
          </Text>
        </Pressable>

        {offline && (
          <Text style={{ color: t.colors.accentL2, fontSize: t.typography.size.xs, marginTop: 10 }}>
            {(region.famous.length + region.food.length + region.gems.length)} places shared with your group
          </Text>
        )}
        <Text style={{ color: t.colors.accentL3, fontSize: t.typography.size.body2, marginTop: 12 }}>About ₹{region.perDay} a day here, beyond the trip cost</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, marginTop: 16 }} style={{ flexGrow: 0 }}>
        {TABS.map((x) => (
          <Pressable key={x.key} onPress={() => setTab(x.key)}
            style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: t.radius.full, backgroundColor: tab === x.key ? t.colors.accentL3 : t.colors.n900 }}>
            <Text style={{ color: tab === x.key ? t.colors.accentD4 : t.colors.textSub, fontSize: t.typography.size.body2, fontWeight: '600' }}>{x.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: 12, marginBottom: 8 }}>{activeTab.note}</Text>
        {items.length === 0 ? (
          <EmptyState title="Nothing here yet" body="Been here before? Add the one place you’d tell a friend about." ctaLabel="Add a hidden gem" />
        ) : (
          items.map((p, i) => (
            <Pressable key={i} onPress={() => navigation.navigate('PlaceDetail', { name: p.name, region: region.key })}
              style={[styles.place, { backgroundColor: t.colors.surface, borderColor: t.colors.n800, borderRadius: t.radius.lg }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: t.colors.text, fontSize: t.typography.size.md, fontWeight: '600', flex: 1 }}>{p.name}</Text>
                {p.meta && <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs }}>{p.meta}</Text>}
              </View>
              <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.body2, marginTop: 4, lineHeight: t.typography.size.body2 * t.typography.lineHeight.relaxed }}>{p.desc}</Text>
              {p.addedBy && <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: 6 }}>Added by {p.addedBy}</Text>}
              {p.status && <Text style={{ color: t.colors.success, fontSize: t.typography.size.xs, marginTop: 6 }}>{p.status}</Text>}
            </Pressable>
          ))
        )}

        {tab === 'gems' && items.length > 0 && (
          <View style={[styles.place, { backgroundColor: t.colors.sectionBg, borderColor: 'transparent', borderRadius: t.radius.lg }]}>
            <Text style={{ color: t.colors.accentL1, fontSize: t.typography.size.md, fontWeight: '600' }}>Been here before?</Text>
            <Text style={{ color: t.colors.accentL3, fontSize: t.typography.size.body2, marginTop: 2 }}>Add the one place you’d tell a friend about.</Text>
            <Text style={{ color: t.colors.accentL2, fontSize: t.typography.size.body2, fontWeight: '600', marginTop: 8 }}>Add a hidden gem</Text>
          </View>
        )}

        <Text style={{ color: t.colors.textFaint, fontSize: t.typography.size.kicker, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 24, marginBottom: 8 }}>Worth knowing</Text>
        {region.know.map((k, i) => (
          <Text key={i} style={{ color: t.colors.textSub, fontSize: t.typography.size.body2, marginBottom: 6 }}>· {k}</Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  offline: { padding: 14, borderWidth: 1, marginTop: 14 },
  place: { padding: 14, borderWidth: 1, marginBottom: 10 },
});

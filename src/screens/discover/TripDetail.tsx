import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Defs, LinearGradient as SvgLinear, Stop, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { useTrip, useTrips, useOperator, useItinerary } from '../../api/hooks';
import { useAuthStore } from '../../store/authStore';
import { useTripStore } from '../../store/tripStore';
import { Header } from '../../components/molecules/Header';
import { Button } from '../../components/atoms/Button';
import { LeadBadge } from '../../components/atoms/Badges';
import { RatioBar } from '../../components/atoms/Progress';
import { Avatar } from '../../components/atoms/Avatar';
import { PhotoCarousel } from '../../components/molecules/PhotoCarousel';
import { coverFor, galleryFor } from '../../data/tripImages';
import { gradients } from '../../theme/tokens';
import type { Trip } from '../../types';

function Section({ title, children }: any) {
  const t = useTheme();
  return (
    <View style={{ marginTop: t.spacing[6] }}>
      <Text style={{ color: t.colors.textFaint, fontSize: t.typography.size.kicker, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: t.spacing[3] }}>{title}</Text>
      {children}
    </View>
  );
}

const fmtK = (n: number) => `₹${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;

// Compact horizontal card for the "similar trips" rail.
function SimilarCard({ trip, onPress }: { trip: Trip; onPress: () => void }) {
  const t = useTheme();
  const uri = coverFor(trip);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${trip.name}, ${fmtK(trip.price)}`}
      style={({ pressed }) => [
        styles.simCard,
        { backgroundColor: t.colors.surface, borderColor: t.colors.n800, borderRadius: t.radius.lg, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      <View style={{ height: 96, backgroundColor: t.colors.sectionGlow, overflow: 'hidden' }}>
        {uri ? <Image source={uri} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} cachePolicy="memory-disk" /> : null}
      </View>
      <View style={{ padding: 10 }}>
        <Text numberOfLines={1} style={{ color: t.colors.text, fontSize: t.typography.size.md, fontWeight: '600' }}>{trip.name}</Text>
        <Text style={{ color: t.colors.accentL3, fontSize: t.typography.size.lg, fontWeight: '600', marginTop: 2 }}>{fmtK(trip.price)}</Text>
        <Text numberOfLines={1} style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: 4 }}>
          {trip.days} days · {trip.place} · ★ {trip.rating}
        </Text>
      </View>
    </Pressable>
  );
}

// Trips near this one: same region first, then same difficulty elsewhere. Excludes self.
function SimilarTrips({ trip, onOpen }: { trip: Trip; onOpen: (id: string) => void }) {
  const t = useTheme();
  const { data } = useTrips();
  const others = (data ?? []).filter((x) => x.id !== trip.id);
  const sameRegion = others.filter((x) => x.region === trip.region);
  const rest = others.filter((x) => x.region !== trip.region && x.difficulty === trip.difficulty);
  const similar = [...sameRegion, ...rest].slice(0, 8);
  if (similar.length === 0) return null;
  return (
    <Section title="Similar trips">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 20 }} style={{ marginHorizontal: -20, paddingHorizontal: 20 }}>
        {similar.map((x) => (
          <SimilarCard key={x.id} trip={x} onPress={() => onOpen(x.id)} />
        ))}
      </ScrollView>
    </Section>
  );
}

export function TripDetail({ navigation, route }: any) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const id = route.params?.id ?? 'spiti';
  const { data: trip } = useTrip(id);
  const { data: op } = useOperator(trip?.operatorId ?? '');
  const { data: itinerary } = useItinerary(id);
  const verified = useAuthStore((s) => s.isVerified);
  const override = useTripStore((s) => s.overrides[id]);

  if (!trip) return <View style={{ flex: 1, backgroundColor: t.colors.bg }} />;

  const price = override?.price ?? trip.price;
  const operatorName = override?.name ?? op?.name;
  const imgs = galleryFor(trip);
  const join = () => navigation.navigate(verified ? 'Joined' : 'VerifyGate', { id, gateFrom: 'waitlist' });

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {imgs.length ? (
          <View>
            <PhotoCarousel images={imgs} height={280} />
            <View style={{ position: 'absolute', top: insets.top, left: 0, right: 0, paddingHorizontal: 20 }}>
              <Header onBack={() => navigation.goBack()} />
            </View>
          </View>
        ) : (
          <View style={styles.hero}>
            <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
              <Defs>
                <SvgLinear id="td" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor={gradients.sectionGlow[0]} />
                  <Stop offset="1" stopColor={gradients.sectionGlow[2]} />
                </SvgLinear>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#td)" />
            </Svg>
            <View style={{ paddingTop: insets.top, paddingHorizontal: 20 }}>
              <Header onBack={() => navigation.goBack()} />
            </View>
          </View>
        )}

        <View style={{ paddingHorizontal: 20 }}>
          {override && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.colors.accentD4, borderRadius: t.radius.md, paddingVertical: 8, paddingHorizontal: 12, marginTop: t.spacing[4] }}>
              <Text style={{ color: t.colors.accentL2, fontSize: t.typography.size.body2 }}>✓ Switched to {override.name} from the comparison</Text>
            </View>
          )}
          <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.body2, marginTop: t.spacing[4] }}>
            {operatorName} · ★ {trip.rating} · since {op?.since}
          </Text>
          <Text style={{ color: t.colors.text, fontSize: t.typography.size['3xl'], fontWeight: '500', marginTop: 4 }}>{trip.name}</Text>
          <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.sm, marginTop: 6 }}>
            {trip.month} · {trip.days} days · {trip.stay} · group of {trip.groupSize}
          </Text>
          <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.sm }}>Departs from {trip.cities}</Text>

          {/* Trip lead */}
          <View style={[styles.leadCard, { backgroundColor: t.colors.surface, borderColor: t.colors.n800, borderRadius: t.radius.lg }]}>
            <Avatar name={trip.leadName} size={44} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: t.colors.text, fontSize: t.typography.size.lg, fontWeight: '600' }}>{trip.leadName}</Text>
              <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.body2 }}>
                {trip.lead === 'women' ? 'Woman' : 'Man'} · trip lead · {trip.leadYears} years on this route
              </Text>
            </View>
            <LeadBadge lead={trip.lead} />
          </View>

          {/* Compare row */}
          <Section title="Operators">
            <Text onPress={() => navigation.navigate('PriceComparison', { id })} style={{ color: t.colors.accentL3, fontSize: t.typography.size.md }}>
              {trip.operators} operators run this route — compare prices →
            </Text>
          </Section>

          {/* Waitlist */}
          <Section title="Who’s on the waitlist">
            <Text style={{ color: t.colors.text, fontSize: t.typography.size.lg, fontWeight: '600' }}>{trip.waitlist} travellers</Text>
            <View style={{ marginTop: 12 }}>
              <RatioBar women={trip.womenPct} masked={!verified} />
            </View>
            {!verified && (
              <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.body2, marginTop: 8, lineHeight: t.typography.size.body2 * t.typography.lineHeight.relaxed }}>
                The ratio only means something if everyone in it is verified. Yours unlocks when you are.
              </Text>
            )}
          </Section>

          {/* Queue */}
          <Section title="The queue & priority">
            <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.md }}>
              {trip.groupSize} seats · {trip.waitlist} in the queue · final call 2 days before
            </Text>
          </Section>

          {/* Explore */}
          <Section title="What’s around you there">
            <Text onPress={() => navigation.navigate('LocalDiscover', { region: trip.region })} style={{ color: t.colors.accentL3, fontSize: t.typography.size.md }}>
              Famous spots, food, hidden gems, shops near your stay →
            </Text>
          </Section>

          {/* Itinerary */}
          <Section title="Itinerary">
            {(itinerary ?? []).map((line, i) => (
              <View key={i} style={{ flexDirection: 'row', marginBottom: 10 }}>
                <Text style={{ color: t.colors.accentL5, fontSize: t.typography.size.body2, width: 28, fontVariant: ['tabular-nums'] }}>{String(i + 1).padStart(2, '0')}</Text>
                <Text style={{ color: t.colors.text, fontSize: t.typography.size.md, flex: 1 }}>{line}</Text>
              </View>
            ))}
          </Section>

          {/* Similar trips */}
          <SimilarTrips trip={trip} onOpen={(nextId) => navigation.push('TripDetail', { id: nextId })} />
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={[styles.cta, { backgroundColor: t.colors.bg, borderTopColor: t.colors.n800, paddingBottom: insets.bottom + 12 }]}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.colors.text, fontSize: t.typography.size.xl, fontWeight: '600' }}>₹{price.toLocaleString('en-IN')}</Text>
          <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs }}>per person</Text>
        </View>
        <View style={{ flex: 1.4 }}>
          <Button label="Join the waitlist" onPress={join} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { height: 200 },
  simCard: { width: 190, borderWidth: 1, overflow: 'hidden' },
  leadCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 1, marginTop: 20 },
  cta: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1 },
});

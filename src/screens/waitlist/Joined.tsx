import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { useTrip } from '../../api/hooks';
import { Button } from '../../components/atoms/Button';
import { RatioBar } from '../../components/atoms/Progress';
import { AvatarStack } from '../../components/atoms/Avatar';

export function Joined({ navigation, route }: any) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const id = route.params?.id ?? 'spiti';
  const { data: trip } = useTrip(id);
  if (!trip) return <View style={{ flex: 1, backgroundColor: t.colors.bg }} />;

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg, paddingTop: insets.top + 24, paddingHorizontal: 20 }}>
      <Text style={{ color: t.colors.text, fontSize: t.typography.size['3xl'], fontWeight: '500' }}>You’re in the {trip.name} queue</Text>
      <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.md, marginTop: 8, lineHeight: t.typography.size.md * t.typography.lineHeight.relaxed }}>
        Seats are called two days before the trip. Until then nobody pays, and you can see exactly where you stand.
      </Text>

      <View style={[styles.card, { backgroundColor: t.colors.surface, borderColor: t.colors.n800, borderRadius: t.radius.lg }]}>
        <Text style={{ color: t.colors.text, fontSize: t.typography.size.md, fontWeight: '600' }}>{trip.waitlist} waiting · {trip.groupSize} on the trip</Text>
        <Text style={{ color: t.colors.accentL3, fontSize: t.typography.size.body2, marginTop: 4 }}>{trip.womenPct}% women</Text>
        <View style={{ marginTop: 12 }}>
          <RatioBar women={trip.womenPct} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 }}>
          <AvatarStack names={['A', 'M', 'R', 'D', 'N']} />
          <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs }}>All Aadhaar-verified</Text>
        </View>
      </View>

      <View style={{ marginTop: 'auto', paddingBottom: insets.bottom + 16, gap: 12 }}>
        <Button label="See your place in the queue" onPress={() => navigation.replace('Waitlist', { id })} />
        <Button label="See who’s going" variant="ghost" onPress={() => navigation.navigate('Main', { screen: 'Travellers' })} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ card: { marginTop: 24, padding: 16, borderWidth: 1 } });

import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { usePeople } from '../../api/hooks';
import { useAuthStore } from '../../store/authStore';
import { Avatar } from '../../components/atoms/Avatar';
import { VerifiedBadge } from '../../components/atoms/Badges';
import { LockGate } from '../../components/molecules/LockGate';
import { lockGate } from '../../data/copy';

export function TravellersBoard({ navigation }: any) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const verified = useAuthStore((s) => s.isVerified);
  const { data: people } = usePeople();

  if (!verified) {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.bg, paddingTop: insets.top, paddingHorizontal: 20 }}>
        <LockGate {...lockGate.people} count={3} countSuffix="people are looking right now" onVerify={() => navigation.navigate('VerifyGate', { gateFrom: 'people' })} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg, paddingTop: insets.top }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={{ color: t.colors.text, fontSize: t.typography.size['2xl'], fontWeight: '600', marginTop: 8 }}>Going where you’re going</Text>
        <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.body2, marginTop: 4 }}>Verified travellers on the Spiti Sep 12–17 batch. Everyone here has cleared Aadhaar.</Text>

        <Pressable onPress={() => navigation.navigate('LookingForCompany')} style={[styles.row, { backgroundColor: t.colors.surface, borderColor: t.colors.n800, borderRadius: t.radius.lg }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.colors.text, fontSize: t.typography.size.md, fontWeight: '600' }}>Looking for company</Text>
            <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: 2 }}>People with no plan yet — just a place and dates</Text>
          </View>
          <Text style={{ color: t.colors.accentL3, fontSize: 20 }}>→</Text>
        </Pressable>

        {(people ?? []).map((p) => (
          <Pressable key={p.id} onPress={() => navigation.navigate('TravelerProfile', { id: p.id })} style={[styles.person, { backgroundColor: t.colors.surface, borderColor: t.colors.n800, borderRadius: t.radius.lg }]}>
            <Avatar name={p.name} uri={p.photo} size={48} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ color: t.colors.text, fontSize: t.typography.size.lg, fontWeight: '600' }}>{p.name}, {p.age}</Text>
                <VerifiedBadge />
              </View>
              <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: 2 }}>{p.city} · {p.trips} trips</Text>
              <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.body2, marginTop: 6 }} numberOfLines={2}>{p.bio}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 1, marginTop: 16 },
  person: { flexDirection: 'row', padding: 14, borderWidth: 1, marginTop: 12 },
});

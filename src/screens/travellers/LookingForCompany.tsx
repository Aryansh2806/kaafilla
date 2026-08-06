import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuthStore } from '../../store/authStore';
import { Header } from '../../components/molecules/Header';
import { Avatar } from '../../components/atoms/Avatar';
import { VerifiedBadge } from '../../components/atoms/Badges';
import { LockGate } from '../../components/molecules/LockGate';
import { lockGate } from '../../data/copy';

const POSTS = [
  { id: 'nikita', name: 'Nikita', city: 'Pune', posted: '2 days ago', where: 'Kasol or Tosh', when: 'Any weekend in Oct', line: 'First solo trip. Would rather join a group that already has women in it.' },
  { id: 'dev', name: 'Dev', city: 'Mumbai', posted: '4 days ago', where: 'Spiti', when: 'Sep 10–20, flexible', line: 'Have a car, need two more to split fuel and drive shifts.' },
  { id: 'ritu', name: 'Ritu', city: 'Delhi', posted: '1 week ago', where: 'Anywhere in the Northeast', when: 'Late Oct, 8–10 days', line: 'Two weeks off and no plan. Slow travel, homestays, no itinerary.' },
];

export function LookingForCompany({ navigation }: any) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const verified = useAuthStore((s) => s.isVerified);

  if (!verified) {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.bg, paddingTop: insets.top, paddingHorizontal: 20 }}>
        <LockGate {...lockGate.looking} count={3} onVerify={() => navigation.navigate('VerifyGate', { gateFrom: 'looking' })} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20 }}><Header onBack={() => navigation.goBack()} /></View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={{ color: t.colors.text, fontSize: t.typography.size['2xl'], fontWeight: '600', marginTop: 8 }}>Looking for company</Text>
        <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.body2, marginTop: 4 }}>No trip, no plan — just a place and some dates. The lightest way to find your kaafila.</Text>

        <Pressable onPress={() => navigation.navigate('CreatePost')} style={[styles.cta, { backgroundColor: t.colors.surface, borderColor: t.colors.accent, borderRadius: t.radius.lg }]}>
          <Text style={{ color: t.colors.text, fontSize: t.typography.size.md, fontWeight: '600' }}>Say where you want to go</Text>
          <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: 2 }}>One line · free · expires in 30 days</Text>
        </Pressable>

        {POSTS.map((p) => (
          <Pressable key={p.id} onPress={() => navigation.navigate('TravelerProfile', { id: p.id })} style={[styles.post, { backgroundColor: t.colors.surface, borderColor: t.colors.n800, borderRadius: t.radius.lg }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Avatar name={p.name} size={36} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ color: t.colors.text, fontSize: t.typography.size.md, fontWeight: '600' }}>{p.name}</Text>
                  <VerifiedBadge />
                </View>
                <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs }}>{p.city} · {p.posted}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.colors.textFaint, fontSize: t.typography.size['2xs'], letterSpacing: 1, textTransform: 'uppercase' }}>Where</Text>
                <Text style={{ color: t.colors.text, fontSize: t.typography.size.body2, marginTop: 2 }}>{p.where}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.colors.textFaint, fontSize: t.typography.size['2xs'], letterSpacing: 1, textTransform: 'uppercase' }}>When</Text>
                <Text style={{ color: t.colors.text, fontSize: t.typography.size.body2, marginTop: 2 }}>{p.when}</Text>
              </View>
            </View>
            <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.body2, marginTop: 10 }}>{p.line}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  cta: { padding: 14, borderWidth: 1, marginTop: 16 },
  post: { padding: 14, borderWidth: 1, marginTop: 12 },
});

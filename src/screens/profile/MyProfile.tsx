import { View, Text, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuthStore } from '../../store/authStore';
import { useWalletStore } from '../../store/walletStore';
import { appealGenderCheck } from '../../api/auth';
import { Avatar } from '../../components/atoms/Avatar';
import { VerifiedBadge, Tag } from '../../components/atoms/Badges';
import { ProgressBar } from '../../components/atoms/Progress';
import { MY_HISTORY } from '../../data/me';

function Row({ title, sub, onPress }: any) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.row, { backgroundColor: t.colors.surface, borderColor: t.colors.n800, borderRadius: t.radius.lg }]}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: t.colors.text, fontSize: t.typography.size.md, fontWeight: '600' }}>{title}</Text>
        {sub && <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: 2 }}>{sub}</Text>}
      </View>
      <Text style={{ color: t.colors.accentL3, fontSize: 20 }}>→</Text>
    </Pressable>
  );
}

export function MyProfile({ navigation }: any) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const verified = useAuthStore((s) => s.isVerified);
  const signOut = useAuthStore((s) => s.signOut);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const balance = useWalletStore((s) => s.balance);

  // Appeal a wrong-model flag: the photo is right, so send it to a person.
  const appeal = () =>
    Alert.alert(
      'Appeal the review?',
      "If your photos are right and the check got it wrong, a person will review it. If you actually picked the wrong gender, cancel and fix it in Edit instead — that re-checks instantly.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Appeal',
          onPress: () => {
            updateProfile({ genderCheck: 'appealed' });
            void appealGenderCheck();
          },
        },
      ],
    );

  // Clearing the user swaps RootNavigator back to onboarding automatically.
  const logout = () =>
    Alert.alert('Log out?', "You'll need to sign in again to get back in.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => { void signOut(); } },
    ]);

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg, paddingTop: insets.top }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8 }}>
          <Avatar name={user?.firstName} uri={user?.photos?.[0]} size={64} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ color: t.colors.text, fontSize: t.typography.size['2xl'], fontWeight: '600' }}>{user?.firstName}, {user?.age ?? 24}</Text>
              {verified && <VerifiedBadge size={16} />}
            </View>
            <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.body2 }}>{user?.city ?? 'Mumbai'}{user?.lead ? ` · ${user.lead === 'women' ? 'Woman' : 'Man'}` : ''} · {verified ? 'Aadhaar verified' : 'Not verified yet'}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 8 }}>
            <Pressable onPress={() => navigation.navigate('Activity')} accessibilityRole="button" accessibilityLabel="Activity"><Text style={{ fontSize: 20 }}>🔔</Text></Pressable>
            <Pressable onPress={() => navigation.navigate('EditProfile')}><Text style={{ color: t.colors.accent, fontSize: t.typography.size.md }}>Edit</Text></Pressable>
          </View>
        </View>

        {user?.genderCheck === 'needs_review' && (
          <View style={{ marginTop: 16, padding: 14, borderRadius: t.radius.lg, backgroundColor: 'rgba(251,191,36,0.12)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.4)' }}>
            <Text style={{ color: t.colors.warning, fontSize: t.typography.size.body2, fontWeight: '700' }}>Gender under review</Text>
            <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.xs, marginTop: 4, lineHeight: t.typography.size.xs * t.typography.lineHeight.relaxed }}>
              A photo check didn't match your selection. Picked the wrong one by mistake? Fix it in Edit. If your choice is right, appeal and a person will look.
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <Pressable onPress={() => navigation.navigate('EditProfile')} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: t.radius.md, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.n800 }}>
                <Text style={{ color: t.colors.text, fontSize: t.typography.size.body2, fontWeight: '600' }}>Fix in Edit</Text>
              </Pressable>
              <Pressable onPress={appeal} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: t.radius.md, backgroundColor: t.colors.accentL3 }}>
                <Text style={{ color: t.colors.accentD4, fontSize: t.typography.size.body2, fontWeight: '600' }}>Appeal — my choice is right</Text>
              </Pressable>
            </View>
          </View>
        )}

        {user?.genderCheck === 'appealed' && (
          <View style={{ marginTop: 16, padding: 14, borderRadius: t.radius.lg, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.n800 }}>
            <Text style={{ color: t.colors.text, fontSize: t.typography.size.body2, fontWeight: '700' }}>Appeal submitted</Text>
            <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: 4, lineHeight: t.typography.size.xs * t.typography.lineHeight.relaxed }}>
              A person will review your photos and gender within a day. You keep full browsing access meanwhile.
            </Text>
          </View>
        )}

        {/* My trips */}
        <Text style={{ color: t.colors.textFaint, fontSize: t.typography.size.kicker, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 24, marginBottom: 10 }}>Your trips</Text>
        <View style={[styles.card, { backgroundColor: t.colors.surface, borderColor: t.colors.n800, borderRadius: t.radius.lg }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: t.colors.text, fontSize: t.typography.size.md, fontWeight: '600' }}>Spiti Valley Circuit</Text>
            <Tag label="WAITLISTED" tone="accent" />
          </View>
          <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: 4 }}>Sep 12–17 · #13 in queue · needs 2 more</Text>
          <View style={{ marginTop: 10 }}><ProgressBar value={13 / 15} /></View>
          <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: 6 }}>13 / 15</Text>
        </View>

        {balance > 0 && (
          <View style={[styles.card, { backgroundColor: t.colors.sectionBg, borderColor: 'transparent', borderRadius: t.radius.lg, marginTop: 12 }]}>
            <Text style={{ color: t.colors.accentL2, fontSize: t.typography.size.body2 }}>Kaafilla wallet</Text>
            <Text style={{ color: t.colors.accentL1, fontSize: t.typography.size['2xl'], fontWeight: '600', marginTop: 2 }}>₹{balance}</Text>
            <Text style={{ color: t.colors.accentL3, fontSize: t.typography.size.xs, marginTop: 6 }}>Carried over from a batch that didn’t confirm. Uses itself on your next priority — before anyone who pays cash.</Text>
          </View>
        )}

        <View style={{ marginTop: 16, gap: 10 }}>
          <Row title="All your trips" sub="Waitlisted & hosting" onPress={() => navigation.navigate('MyTrips')} />
          <Row title="Your Tirthan plan" sub="4 of 6 joined · 2 asking to join" onPress={() => navigation.navigate('HostRequests')} />
          <Row title="Settle up" sub="Tirthan Valley cabin week" onPress={() => navigation.navigate('SettleLedger')} />
          <Row title="Wallet" sub="Priority credit from unconfirmed batches" onPress={() => navigation.navigate('Wallet')} />
          <Row title="Host a new plan" sub="Plan your own, find your kaafila" onPress={() => navigation.navigate('CreatePlan')} />
        </View>

        {/* Trips done */}
        <Pressable onPress={() => navigation.navigate('TripHistory')} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 10 }}>
          <Text style={{ color: t.colors.textFaint, fontSize: t.typography.size.kicker, letterSpacing: 1.2, textTransform: 'uppercase' }}>Trips done · 2 of 3 fully settled</Text>
          <Text style={{ color: t.colors.accentL3, fontSize: t.typography.size.body2 }}>See all →</Text>
        </Pressable>
        {MY_HISTORY.map((h) => (
          <View key={h.name} style={[styles.hist, { backgroundColor: t.colors.surface, borderColor: t.colors.n800, borderRadius: t.radius.lg }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.colors.text, fontSize: t.typography.size.md, fontWeight: '600' }}>{h.name}</Text>
              <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: 2 }}>{h.when} · {h.amount}</Text>
            </View>
            <Tag label={h.settled ? 'ALL SETTLED' : 'ONE BALANCE OPEN'} tone={h.settled ? 'accent' : 'neutral'} />
          </View>
        ))}

        <View style={{ marginTop: 16, gap: 10 }}>
          <Row title="Safety" sub="Handle visibility, blocked travellers, trip check-in" onPress={() => navigation.navigate('Safety')} />
          <Row title="Bluetooth mesh (dev)" sub="Offline chat over BLE — test across two phones" onPress={() => navigation.navigate('MeshDebug')} />
        </View>

        <Pressable
          onPress={logout}
          accessibilityRole="button"
          accessibilityLabel="Log out"
          style={({ pressed }) => [styles.row, { backgroundColor: t.colors.surface, borderColor: t.colors.n800, borderRadius: t.radius.lg, marginTop: 24, justifyContent: 'center', opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={{ color: t.colors.danger, fontSize: t.typography.size.md, fontWeight: '600' }}>Log out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 1 },
  card: { padding: 14, borderWidth: 1 },
  hist: { flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 1, marginBottom: 10 },
});

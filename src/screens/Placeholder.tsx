import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { useAuthStore } from '../store/authStore';

// Single reusable stub for every not-yet-built screen. Shows the route name so
// navigation is verifiable before real screens exist. Delete usages as each
// real screen lands.
export function PlaceholderScreen({ route }: { route: RouteProp<Record<string, object | undefined>, string> }) {
  const t = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: t.colors.bg }]}>
      <Text style={{ color: t.colors.textFaint, fontSize: t.typography.size.xs, letterSpacing: 1.2 }}>
        SCREEN
      </Text>
      <Text style={{ color: t.colors.text, fontSize: t.typography.size['3xl'], marginTop: t.spacing[2] }}>
        {route.name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
});

// Convenience for onboarding scaffold: a Splash stub with a "sign in" shortcut
// so you can jump into the tabs without building the whole flow first.
export function SplashStub({ navigation }: any) {
  const t = useTheme();
  const signIn = () => {
    useAuthStore.getState().signIn({ id: 'dev', firstName: 'Dev', isVerified: true, verificationStatus: 'verified' });
  };
  return (
    <View style={[styles.root, { backgroundColor: t.colors.bg }]}>
      <Text style={{ color: t.colors.accentL1, fontSize: t.typography.size['5xl'], letterSpacing: 8 }}>
        KAAFILLA
      </Text>
      <Text style={{ color: t.colors.textSub, marginTop: t.spacing[3] }}>the caravan you travel with</Text>
      <Pressable
        onPress={() => navigation.navigate('PhoneEntry')}
        style={{ marginTop: t.spacing[10], backgroundColor: t.colors.accent, paddingVertical: 14, paddingHorizontal: 32, borderRadius: t.radius.lg }}
        accessibilityRole="button"
        accessibilityLabel="Get started"
      >
        <Text style={{ color: t.colors.bg, fontWeight: '600' }}>Get started</Text>
      </Pressable>
      <Pressable onPress={signIn} style={{ marginTop: t.spacing[4] }} accessibilityRole="button" accessibilityLabel="Skip to trips (dev)">
        <Text style={{ color: t.colors.textMuted }}>Skip to trips (dev)</Text>
      </Pressable>
    </View>
  );
}

import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import { usePushNotifications } from '../notifications/usePushNotifications';
import { navigationRef } from '../notifications/navigation';
import { colors } from '../theme/tokens';
import { OnboardingStack } from './OnboardingStack';
import { AppStack } from './AppStack';

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    primary: colors.accent,
    border: colors.border,
  },
};

export function RootNavigator() {
  const user = useAuthStore((s) => s.user);
  const booting = useAuthStore((s) => s.booting);
  const bootstrap = useAuthStore((s) => s.bootstrap);

  // Restore a persisted Supabase session once on launch.
  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  // Live-sync plans/profiles across teammates.
  useRealtimeSync();

  // Register this device for push + route notification taps (no-op until signed in).
  usePushNotifications(user?.id);

  if (booting) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      {user ? <AppStack /> : <OnboardingStack />}
    </NavigationContainer>
  );
}

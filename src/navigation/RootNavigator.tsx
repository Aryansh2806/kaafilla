import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
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
  return (
    <NavigationContainer theme={navTheme}>
      {user ? <AppStack /> : <OnboardingStack />}
    </NavigationContainer>
  );
}

import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeroGradient } from '../../components/HeroGradient';
import { Button } from '../../components/atoms/Button';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuthStore } from '../../store/authStore';
import { brand } from '../../data/copy';

const POINTS = [
  'Everyone here has cleared Aadhaar — once, for good.',
  'You see who you’re travelling with before you say yes.',
  'Nobody messages you cold. A chat opens only when you both agree.',
];

export function ValueProp({ navigation }: any) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const setReturning = useAuthStore((s) => s.setReturning);

  const go = (returning: boolean) => {
    setReturning(returning);
    navigation.navigate('PhoneEntry');
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <HeroGradient />
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }}>
        <Text style={{ color: t.colors.textFaint, fontSize: t.typography.size.kicker, letterSpacing: 1.2, textTransform: 'uppercase' }}>{brand.name}</Text>
        <Text style={{ color: t.colors.accentL1, fontSize: t.typography.size['4xl'], fontWeight: '500', marginTop: 16, lineHeight: t.typography.size['4xl'] * 1.05, letterSpacing: -0.5 }}>
          Nobody travels with a stranger here.
        </Text>

        <View style={{ gap: 16, marginTop: 28 }}>
          {POINTS.map((p, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 12 }}>
              <Text style={{ color: t.colors.accentL4, fontSize: t.typography.size.lg }}>✓</Text>
              <Text style={{ color: t.colors.accentL3, fontSize: t.typography.size.md, flex: 1, lineHeight: t.typography.size.md * t.typography.lineHeight.relaxed }}>{p}</Text>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 'auto', gap: 12 }}>
          <Button label="Get started" onPress={() => go(false)} />
          <Button label="I already have an account" variant="ghost" onPress={() => go(true)} />
        </View>
      </View>
    </View>
  );
}

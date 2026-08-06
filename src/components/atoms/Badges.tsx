import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeProvider';

// Checkmark glyph (prototype path d="M20 6 9 17l-5-5").
export function Check({ size = 12, color, strokeWidth = 2.6 }: { size?: number; color: string; strokeWidth?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6 9 17l-5-5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Inline verified check (next to a name) or a full pill.
export function VerifiedBadge({ variant = 'inline', size = 12 }: { variant?: 'inline' | 'pill'; size?: number }) {
  const t = useTheme();
  if (variant === 'inline') return <Check size={size} color={t.colors.accentL4} />;
  return (
    <View style={[styles.pill, { backgroundColor: t.colors.sectionBg, borderRadius: 7 }]}>
      <Check size={12} color={t.colors.accentL3} />
      <Text style={{ color: t.colors.accentL3, fontSize: t.typography.size.xs, fontWeight: '600', marginLeft: 6 }}>
        VERIFIED
      </Text>
    </View>
  );
}

type TagTone = 'accent' | 'neutral' | 'outline';
export function Tag({ label, tone = 'neutral', style }: { label: string; tone?: TagTone; style?: ViewStyle }) {
  const t = useTheme();
  const bg = tone === 'accent' ? t.colors.accentD3 : tone === 'neutral' ? t.colors.n800 : 'transparent';
  const fg = tone === 'accent' ? t.colors.accentL1 : t.colors.n100;
  const border = tone === 'outline' ? { borderWidth: 1, borderColor: t.colors.accent } : null;
  return (
    <View style={[styles.tag, { backgroundColor: bg, borderRadius: 6 }, border, style]}>
      <Text style={{ color: fg, fontSize: t.typography.size.xs, fontWeight: '600', letterSpacing: 0.2 }}>{label}</Text>
    </View>
  );
}

// WOMEN-LED (accent) / MEN-LED (neutral) / TRAVELLER PLAN (accent).
export function LeadBadge({ lead }: { lead: 'women' | 'men' | 'plan' }) {
  const label = lead === 'women' ? 'WOMEN-LED' : lead === 'men' ? 'MEN-LED' : 'TRAVELLER PLAN';
  return <Tag label={label} tone={lead === 'men' ? 'neutral' : 'accent'} />;
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingVertical: 5, paddingHorizontal: 10 },
  tag: { alignSelf: 'flex-start', paddingVertical: 3, paddingHorizontal: 10 },
});

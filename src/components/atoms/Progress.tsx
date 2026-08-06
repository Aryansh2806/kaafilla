import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

// Striped progress bar (fill 0..1).
export function ProgressBar({ value, height = 8, style }: { value: number; height?: number; style?: ViewStyle }) {
  const t = useTheme();
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View
      style={[
        { height, borderRadius: t.radius.full, backgroundColor: t.colors.n900, overflow: 'hidden' },
        style,
      ]}
    >
      <View style={{ width: `${pct}%`, height: '100%', backgroundColor: t.colors.accentL3 }} />
    </View>
  );
}

// Women/men ratio bar with optional masked (unverified) state.
export function RatioBar({ women, masked }: { women: number; masked?: boolean }) {
  const t = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={[styles.bar, { backgroundColor: t.colors.n800, borderRadius: t.radius.full }]}>
        {masked ? (
          <View style={{ flex: 1, backgroundColor: t.colors.n700, opacity: 0.5 }} />
        ) : (
          <View style={{ width: `${women}%`, height: '100%', backgroundColor: t.colors.accent }} />
        )}
      </View>
      {!masked && (
        <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.xs, marginTop: t.spacing[2] }}>
          {women}% women · {100 - women}% men
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  bar: { height: 8, overflow: 'hidden', flexDirection: 'row' },
});

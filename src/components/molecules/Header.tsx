import type { ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

function BackChevron({ onPress, label = 'Back' }: { onPress?: () => void; label?: string }) {
  const t = useTheme();
  if (!onPress) return <View style={{ width: 28 }} />;
  return (
    <Pressable onPress={onPress} hitSlop={10} accessibilityRole="button" accessibilityLabel={label}>
      <Text style={{ color: t.colors.text, fontSize: 24 }}>‹</Text>
    </Pressable>
  );
}

// Plain screen header: back + title + optional right slot.
export function Header({ title, onBack, right }: { title?: string; onBack?: () => void; right?: ReactNode }) {
  const t = useTheme();
  return (
    <View style={styles.header}>
      <BackChevron onPress={onBack} />
      {title ? (
        <Text style={{ color: t.colors.text, fontSize: t.typography.size.xl, fontWeight: '600', flex: 1, marginLeft: t.spacing[2] }}>
          {title}
        </Text>
      ) : (
        <View style={{ flex: 1 }} />
      )}
      {right}
    </View>
  );
}

// Onboarding top bar: back chevron + striped step/total progress bar.
export function SignupTopBar({ step, total, onBack }: { step: number; total: number; onBack?: () => void }) {
  const t = useTheme();
  return (
    <View style={styles.suRow}>
      <BackChevron onPress={onBack} />
      <View style={[styles.track, { backgroundColor: t.colors.n900, borderRadius: t.radius.full }]}>
        <View
          style={{
            width: `${(step / total) * 100}%`,
            height: '100%',
            backgroundColor: t.colors.accentL3,
            borderRadius: t.radius.full,
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  suRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  track: { flex: 1, height: 4, overflow: 'hidden' },
});

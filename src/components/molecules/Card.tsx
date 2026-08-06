import type { ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Button } from '../atoms/Button';

type CardProps = { children: ReactNode; onPress?: () => void; selected?: boolean; style?: ViewStyle };

// Surface card with 1px ring elevation; accent ring when selected.
export function Card({ children, onPress, selected, style }: CardProps) {
  const t = useTheme();
  const body = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: t.colors.surface,
          borderRadius: t.radius.lg,
          borderColor: selected ? t.colors.accent : t.colors.n800,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}>
      {body}
    </Pressable>
  );
}

type RowProps = { title: string; sub?: string; left?: ReactNode; right?: ReactNode; onPress?: () => void };
export function ListRow({ title, sub, left, right, onPress }: RowProps) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={styles.row}
    >
      {left}
      <View style={{ flex: 1, marginLeft: left ? t.spacing[3] : 0 }}>
        <Text style={{ color: t.colors.text, fontSize: t.typography.size.lg, fontWeight: '600' }}>{title}</Text>
        {sub && <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.body2 }}>{sub}</Text>}
      </View>
      {right}
    </Pressable>
  );
}

type EmptyProps = { title: string; body?: string; ctaLabel?: string; onCta?: () => void };
export function EmptyState({ title, body, ctaLabel, onCta }: EmptyProps) {
  const t = useTheme();
  return (
    <View style={styles.empty}>
      <Text style={{ color: t.colors.text, fontSize: t.typography.size.xl, fontWeight: '600', textAlign: 'center' }}>
        {title}
      </Text>
      {body && (
        <Text
          style={{
            color: t.colors.textMuted,
            fontSize: t.typography.size.md,
            textAlign: 'center',
            marginTop: t.spacing[2],
            lineHeight: t.typography.size.md * t.typography.lineHeight.relaxed,
          }}
        >
          {body}
        </Text>
      )}
      {ctaLabel && (
        <View style={{ marginTop: t.spacing[5] }}>
          <Button label={ctaLabel} variant="ghost" onPress={onCta} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 15, borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 24 },
});

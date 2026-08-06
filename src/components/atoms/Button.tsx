import { Pressable, Text, StyleSheet, ActivityIndicator, View, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeProvider';

type Variant = 'primary' | 'ghost' | 'secondary';
type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  haptic?: boolean;
  style?: ViewStyle;
  accessibilityHint?: string;
};

// Primary CTA is the prototype's #d2cefd fill / #2b2741 text, full-width, min-height 50.
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  haptic = true,
  style,
  accessibilityHint,
}: Props) {
  const t = useTheme();
  const isDisabled = disabled || loading;

  const bg =
    isDisabled ? t.roles.buttonDisabledBg
    : variant === 'primary' ? t.roles.buttonPrimaryBg
    : variant === 'secondary' ? t.roles.buttonDisabledBg
    : 'transparent';
  const fg =
    isDisabled ? t.colors.textMuted
    : variant === 'primary' ? t.roles.buttonPrimaryText
    : variant === 'secondary' ? t.colors.text
    : t.colors.accent;
  const border = variant === 'ghost' && !isDisabled ? { borderWidth: 1, borderColor: t.colors.accent } : null;

  const press = () => {
    if (isDisabled) return;
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <Pressable
      onPress={press}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!isDisabled }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg, borderRadius: t.radius.md, opacity: pressed ? 0.9 : 1 },
        border,
        style,
      ]}
    >
      <View style={styles.row}>
        {loading && <ActivityIndicator size="small" color={fg} style={{ marginRight: 8 }} />}
        <Text style={[styles.label, { color: fg, fontSize: t.typography.size.lg }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { width: '100%', minHeight: 50, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  label: { fontWeight: '600' },
});

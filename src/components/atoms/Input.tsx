import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, type TextInputProps, type ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

type Props = TextInputProps & {
  label?: string;
  hint?: string;
  containerStyle?: ViewStyle;
  prefix?: string;
};

export function Input({ label, hint, containerStyle, prefix, style, ...rest }: Props) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={containerStyle}>
      {label && (
        <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.sm, marginBottom: t.spacing[2] }}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.field,
          {
            backgroundColor: t.colors.surface,
            borderRadius: t.radius.md,
            borderColor: focused ? t.colors.accent : t.colors.border,
          },
        ]}
      >
        {prefix && <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.md }}>{prefix}</Text>}
        <TextInput
          placeholderTextColor={t.colors.textMuted}
          selectionColor={t.colors.accent}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[{ flex: 1, color: t.colors.text, fontSize: t.typography.size.md, paddingVertical: 0 }, style]}
          {...rest}
        />
      </View>
      {hint && (
        <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: t.spacing[2] }}>
          {hint}
        </Text>
      )}
    </View>
  );
}

type AreaProps = TextInputProps & { label?: string; min?: number; containerStyle?: ViewStyle };

// Bio-style textarea with a live "N / min" counter that turns accent once satisfied.
export function TextArea({ label, min, value = '', containerStyle, style, ...rest }: AreaProps) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);
  const len = (value as string).length;
  const met = min ? len >= min : true;
  return (
    <View style={containerStyle}>
      {label && (
        <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.sm, marginBottom: t.spacing[2] }}>
          {label}
        </Text>
      )}
      <TextInput
        multiline
        value={value}
        placeholderTextColor={t.colors.textMuted}
        selectionColor={t.colors.accent}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.area,
          {
            backgroundColor: t.colors.surface,
            borderRadius: t.radius.md,
            borderColor: focused ? t.colors.accent : t.colors.border,
            color: t.colors.text,
            fontSize: t.typography.size.md,
          },
          style,
        ]}
        {...rest}
      />
      {min != null && (
        <Text
          style={{
            color: met ? t.colors.accent : t.colors.textMuted,
            fontSize: t.typography.size.xs,
            marginTop: t.spacing[2],
          }}
        >
          {len} / {min} min
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, paddingHorizontal: 12, borderWidth: 1 },
  area: { minHeight: 96, padding: 12, borderWidth: 1, textAlignVertical: 'top' },
});

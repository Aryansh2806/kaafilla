import { Pressable, Text, View, StyleSheet, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeProvider';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  style?: ViewStyle;
};

// Selectable pill. Selected = accent fill + ring; unselected = neutral surface.
export function Chip({ label, selected, onPress, onRemove, style }: ChipProps) {
  const t = useTheme();
  const press = () => {
    Haptics.selectionAsync();
    onPress?.();
  };
  return (
    <Pressable
      onPress={press}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      accessibilityLabel={label}
      style={[
        styles.chip,
        {
          borderRadius: t.radius.md,
          backgroundColor: selected ? t.colors.accentL3 : t.colors.n900,
          borderColor: selected ? t.colors.accent : 'transparent',
        },
        style,
      ]}
    >
      <Text
        style={{
          color: selected ? t.colors.accentD4 : t.colors.n300,
          fontSize: t.typography.size.body2,
          fontWeight: '600',
        }}
      >
        {label}
      </Text>
      {onRemove && (
        <Pressable onPress={onRemove} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Remove ${label}`}>
          <Text style={{ color: selected ? t.colors.accentD4 : t.colors.n300, marginLeft: 6 }}>✕</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

type SegProps<T extends string> = {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  style?: ViewStyle;
};

// Segmented control — track with an accent active thumb (prototype "Run by" etc.).
export function SegmentedControl<T extends string>({ options, value, onChange, style }: SegProps<T>) {
  const t = useTheme();
  return (
    <View style={[styles.seg, { backgroundColor: t.colors.n900, borderRadius: t.radius.full }, style]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(o.value);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[
              styles.segItem,
              { borderRadius: t.radius.full, backgroundColor: active ? t.colors.accentL3 : 'transparent' },
            ]}
          >
            <Text
              style={{
                color: active ? t.colors.accentD4 : t.colors.textSub,
                fontSize: t.typography.size.body2,
                fontWeight: '600',
              }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderWidth: 1,
  },
  seg: { flexDirection: 'row', padding: 3 },
  segItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
});

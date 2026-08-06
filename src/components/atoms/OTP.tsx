import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeProvider';

// 6 boxes, 56px tall, radius 12; ring toggles grey ↔ accent on active/filled.
export function OTPInput({ value, length = 6, warm = false }: { value: string; length?: number; warm?: boolean }) {
  const t = useTheme();
  return (
    <View style={styles.row}>
      {Array.from({ length }).map((_, i) => {
        const char = value[i] ?? '';
        const active = i === value.length;
        const ring = char || active ? t.colors.accent : t.colors.n800;
        return (
          <View
            key={i}
            style={[
              styles.box,
              {
                borderRadius: 12,
                backgroundColor: warm ? t.colors.accentD4 : t.colors.surface,
                borderColor: ring,
              },
            ]}
          >
            <Text style={{ color: t.colors.accentL1, fontSize: 22, fontWeight: '600' }}>{char}</Text>
          </View>
        );
      })}
    </View>
  );
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

// Custom numeric keypad — 3×3 + 0 + backspace, haptics on press.
export function KeyPad({ onKey, onDelete }: { onKey: (d: string) => void; onDelete: () => void }) {
  const t = useTheme();
  return (
    <View style={styles.pad}>
      {KEYS.map((k, i) => {
        if (k === '') return <View key={i} style={styles.key} />;
        const del = k === '⌫';
        return (
          <Pressable
            key={i}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              del ? onDelete() : onKey(k);
            }}
            accessibilityRole="button"
            accessibilityLabel={del ? 'Delete' : k}
            style={({ pressed }) => [
              styles.key,
              {
                backgroundColor: t.colors.surface,
                borderRadius: t.radius.md,
                transform: [{ scale: pressed ? 0.94 : 1 }],
              },
            ]}
          >
            <Text style={{ color: t.colors.text, fontSize: t.typography.size.xl, fontWeight: '600' }}>{k}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  box: { flex: 1, height: 56, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  pad: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  key: { width: '31.5%', height: 48, alignItems: 'center', justifyContent: 'center' },
});

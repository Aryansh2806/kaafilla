import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { Check } from '../../components/atoms/Badges';
import { Button } from '../../components/atoms/Button';
import { useAuthStore } from '../../store/authStore';
import { notes } from '../../data/copy';

export function VerifySuccess({ navigation }: any) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const record = useAuthStore((s) => s.record);

  const rows = [
    { k: 'Name', v: record?.name ?? '—' },
    { k: 'Gender', v: `${record?.gender ?? '—'} · FROM RECORD` },
    { k: 'Age', v: `${record?.age ?? '—'} · over 18` },
    { k: 'Face match', v: record?.faceMatch ?? '—' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg, paddingTop: insets.top + 24, paddingHorizontal: 20 }}>
      <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: t.colors.accentD3, alignItems: 'center', justifyContent: 'center' }}>
        <Check size={26} color={t.colors.accentL3} strokeWidth={2.6} />
      </View>
      <Text style={{ color: t.colors.text, fontSize: t.typography.size['3xl'], fontWeight: '500', marginTop: 20, lineHeight: t.typography.size['3xl'] * 1.1 }}>
        Verified.{'\n'}Once, for good.
      </Text>
      <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.md, marginTop: 8, lineHeight: t.typography.size.md * t.typography.lineHeight.relaxed }}>
        Your face matched the Aadhaar photo. Everything below came off the record — you never told us any of it.
      </Text>

      <View style={[styles.card, { backgroundColor: t.colors.surface, borderColor: t.colors.n800, borderRadius: t.radius.lg }]}>
        {rows.map((r, i) => (
          <View key={r.k} style={[styles.row, i < rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: t.colors.n900 }]}>
            <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.body2 }}>{r.k}</Text>
            <Text style={{ color: t.colors.text, fontSize: t.typography.size.body2, fontWeight: '600' }}>{r.v}</Text>
          </View>
        ))}
      </View>

      <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: 16, lineHeight: t.typography.size.xs * t.typography.lineHeight.relaxed }}>
        {notes.verifiedRecordFootnote}
      </Text>

      <View style={{ marginTop: 'auto', paddingBottom: insets.bottom + 16 }}>
        <Button label="Back to your trip" onPress={() => navigation.popToTop()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 24, borderWidth: 1, paddingHorizontal: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14 },
});

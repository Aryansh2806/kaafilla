import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { Header } from '../../components/molecules/Header';

const ITEMS = [
  { k: 'Who can see my handle', v: 'Women · accepted connects' },
  { k: 'Blocked travellers', v: 'Nobody can see you at all' },
  { k: 'Trip check-in', v: 'Share live location with one person' },
];

export function Safety({ navigation }: any) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg, paddingTop: insets.top, paddingHorizontal: 20 }}>
      <Header title="Safety" onBack={() => navigation.goBack()} />
      <View style={{ marginTop: 16, gap: 12 }}>
        {ITEMS.map((i) => (
          <View key={i.k} style={[styles.card, { backgroundColor: t.colors.surface, borderColor: t.colors.n800, borderRadius: t.radius.lg }]}>
            <Text style={{ color: t.colors.text, fontSize: t.typography.size.md, fontWeight: '600' }}>{i.k}</Text>
            <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.body2, marginTop: 2 }}>{i.v}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ card: { padding: 14, borderWidth: 1 } });

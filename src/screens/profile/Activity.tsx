import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { Header } from '../../components/molecules/Header';
import { EmptyState } from '../../components/molecules/Card';
import { ACTIVITY } from '../../data/me';

export function Activity({ navigation }: any) {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20 }}><Header title="Activity" onBack={() => navigation.goBack()} /></View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {ACTIVITY.length === 0 ? (
          <EmptyState title="Nothing new" body="Requests, seat calls and messages show up here." />
        ) : (
          ACTIVITY.map((a) => (
            <View key={a.id} style={[styles.row, { borderBottomColor: t.colors.n900 }]}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 16 }}>{a.icon}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: t.colors.text, fontSize: t.typography.size.body2, lineHeight: t.typography.size.body2 * t.typography.lineHeight.relaxed }}>{a.text}</Text>
                <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: 2 }}>{a.when}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 } });

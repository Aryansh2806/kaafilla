import { View, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { Header } from '../../components/molecules/Header';

export function PlaceDetail({ navigation, route }: any) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const name = route.params?.name ?? 'Place';
  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20 }}>
        <Header onBack={() => navigation.goBack()} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <Text style={{ color: t.colors.text, fontSize: t.typography.size['2xl'], fontWeight: '600', marginTop: 8 }}>{name}</Text>
        <Text style={{ color: t.colors.textFaint, fontSize: t.typography.size.kicker, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 24, marginBottom: 8 }}>
          What travellers said
        </Text>
        <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.md, lineHeight: t.typography.size.md * t.typography.lineHeight.relaxed }}>
          Reviews here come only from verified travellers who booked through Kaafilla. Operators can’t remove a review.
        </Text>
      </ScrollView>
    </View>
  );
}

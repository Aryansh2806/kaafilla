import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { Header } from '../../components/molecules/Header';
import { Button } from '../../components/atoms/Button';
import { payByUpi } from '../../payments';

const EXPENSES = [
  { who: 'Arjun', what: 'Cabin, 3 nights', amount: 18000 },
  { who: 'You', what: 'Cab from Aut', amount: 4200 },
  { who: 'Ritu', what: 'Groceries & trout', amount: 3600 },
  { who: 'Dev', what: 'Fuel + tolls', amount: 2800 },
];
const OTHERS = [
  { name: 'Ritu', state: 'settled · ₹0' },
  { name: 'Dev', state: 'owes Arjun ₹1,400' },
  { name: 'Nikita', state: 'is owed ₹900' },
];

export function SettleLedger({ navigation }: any) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [paid, setPaid] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20 }}><Header onBack={() => navigation.goBack()} /></View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={{ color: t.colors.text, fontSize: t.typography.size['2xl'], fontWeight: '600', marginTop: 8 }}>Tirthan, settled up</Text>
        <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.body2, marginTop: 4, lineHeight: t.typography.size.body2 * t.typography.lineHeight.relaxed }}>
          Kaafilla keeps the ledger and nudges. The money moves between your own UPI apps — we never hold it.
        </Text>

        <View style={[styles.balance, { backgroundColor: t.colors.sectionBg, borderRadius: t.radius.lg }]}>
          <Text style={{ color: t.colors.accentL2, fontSize: t.typography.size.body2 }}>You owe Arjun</Text>
          <Text style={{ color: t.colors.accentL1, fontSize: t.typography.size['4xl'], fontWeight: '600', marginTop: 2 }}>₹2,850</Text>
          {paid ? (
            <Text style={{ color: t.colors.accentL3, fontSize: t.typography.size.body2, marginTop: 10 }}>✓ Marked paid — waiting for Arjun to confirm</Text>
          ) : (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <View style={{ flex: 1 }}><Button label="Pay by UPI" onPress={() => payByUpi({ payeeVpa: 'arjun@upi', payeeName: 'Arjun', amount: 2850, note: 'Tirthan' })} /></View>
              <View style={{ flex: 1 }}><Button label="Mark as paid" variant="secondary" onPress={() => setPaid(true)} /></View>
            </View>
          )}
        </View>

        <Text style={{ color: t.colors.textFaint, fontSize: t.typography.size.kicker, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 24, marginBottom: 10 }}>What the trip cost · ₹28,600 · ₹7,150 each</Text>
        {EXPENSES.map((e, i) => (
          <View key={i} style={[styles.row, { borderBottomColor: t.colors.n900 }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.colors.text, fontSize: t.typography.size.md }}>{e.what}</Text>
              <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs }}>{e.who} paid</Text>
            </View>
            <Text style={{ color: t.colors.text, fontSize: t.typography.size.md, fontWeight: '600' }}>₹{e.amount.toLocaleString('en-IN')}</Text>
          </View>
        ))}

        <Text style={{ color: t.colors.textFaint, fontSize: t.typography.size.kicker, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 24, marginBottom: 10 }}>Everyone else</Text>
        {OTHERS.map((o) => (
          <View key={o.name} style={[styles.row, { borderBottomColor: t.colors.n900 }]}>
            <Text style={{ color: t.colors.text, fontSize: t.typography.size.md, flex: 1 }}>{o.name}</Text>
            <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.body2 }}>{o.state}</Text>
          </View>
        ))}

        <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: 16, lineHeight: t.typography.size.xs * t.typography.lineHeight.relaxed }}>
          Both sides confirm a settlement before it clears. Once everyone’s square, this trip gets an “all settled” mark on your profile.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  balance: { padding: 16, marginTop: 20 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
});

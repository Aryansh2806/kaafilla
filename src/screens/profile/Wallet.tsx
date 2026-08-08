import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { Header } from '../../components/molecules/Header';
import { useWallet } from '../../api/hooks';
import { useWalletStore } from '../../store/walletStore';

export function Wallet({ navigation }: any) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  // Real wallet when the economy backend is deployed; the in-memory store is the
  // fallback so the screen still reads sensibly before stage9 is applied.
  const walletQ = useWallet();
  const store = useWalletStore();
  const balance = walletQ.isSuccess ? walletQ.data.balance : store.balance;
  const ledger = walletQ.isSuccess ? walletQ.data.ledger : store.ledger;

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20 }}><Header title="Wallet" onBack={() => navigation.goBack()} /></View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: t.colors.sectionBg, borderRadius: t.radius.lg }]}>
          <Text style={{ color: t.colors.accentL2, fontSize: t.typography.size.body2 }}>Kaafilla wallet</Text>
          <Text style={{ color: t.colors.accentL1, fontSize: t.typography.size['4xl'], fontWeight: '600', marginTop: 2 }}>₹{balance}</Text>
          <Text style={{ color: t.colors.accentL3, fontSize: t.typography.size.xs, marginTop: 8, lineHeight: t.typography.size.xs * t.typography.lineHeight.relaxed }}>
            Only ever credited when a batch fills without you. Uses itself on your next priority — before anyone who pays cash. Kaafilla never lets you top it up.
          </Text>
        </View>

        <Text style={{ color: t.colors.textFaint, fontSize: t.typography.size.kicker, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 24, marginBottom: 10 }}>History</Text>
        {ledger.length === 0 ? (
          <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.body2 }}>Nothing yet. If a batch fills without you, the ₹49 lands here.</Text>
        ) : (
          ledger.map((l) => (
            <View key={l.id} style={[styles.row, { borderBottomColor: t.colors.n900 }]}>
              <Text style={{ color: t.colors.text, fontSize: t.typography.size.md, flex: 1 }}>{l.reason}</Text>
              <Text style={{ color: l.amount > 0 ? t.colors.success : t.colors.textSub, fontSize: t.typography.size.md, fontWeight: '600' }}>
                {l.amount > 0 ? '+' : '−'}₹{Math.abs(l.amount)}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { padding: 16, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
});

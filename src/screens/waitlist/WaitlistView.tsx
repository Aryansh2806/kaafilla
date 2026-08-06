import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { useTrip } from '../../api/hooks';
import { Header } from '../../components/molecules/Header';
import { Button } from '../../components/atoms/Button';
import { Tag } from '../../components/atoms/Badges';
import { useWalletStore } from '../../store/walletStore';

type Phase = 'pending' | 'confirmed' | 'forfeit' | 'missed';
type Priority = 'none' | 'cash' | 'wallet';

const QUEUE = ['Meera', 'Rohit', 'Priya', 'Karan', 'Ibanri', 'Dev', 'Sana', 'Vikram', 'Nandita', 'Tashi', 'Arjun', 'Ritu', 'You', 'Nikita', 'Stanzin'];
const YOU_POS = 13;

function Card({ title, children }: any) {
  const t = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: t.colors.surface, borderColor: t.colors.n800, borderRadius: t.radius.lg }]}>
      <Text style={{ color: t.colors.text, fontSize: t.typography.size.md, fontWeight: '600', marginBottom: 6 }}>{title}</Text>
      {children}
    </View>
  );
}

export function WaitlistView({ navigation, route }: any) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { data: trip } = useTrip(route.params?.id ?? 'spiti');
  const wallet = useWalletStore();
  const [pri, setPri] = useState<Priority>('none');
  const [phase, setPhase] = useState<Phase>('pending');

  if (!trip) return <View style={{ flex: 1, backgroundColor: t.colors.bg }} />;
  const seats = trip.groupSize;
  const inSeats = YOU_POS <= seats;

  const buyPriority = (source: Priority) => {
    if (source === 'wallet' && !wallet.spend(49)) return;
    setPri(source);
  };
  const sub = { color: t.colors.textMuted, fontSize: t.typography.size.body2, lineHeight: t.typography.size.body2 * t.typography.lineHeight.relaxed };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20 }}>
        <Header title="Trip" onBack={() => navigation.goBack()} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={{ color: t.colors.text, fontSize: t.typography.size['3xl'], fontWeight: '500', marginTop: 8 }}>You’re #{YOU_POS} in the queue</Text>
        <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.body2, marginTop: 6 }}>{seats} seats left · {trip.waitlist} in the queue</Text>
        <Text style={[sub, { marginTop: 4 }]}>{inSeats ? 'You’re inside the seats as it stands.' : `${YOU_POS - seats} people ahead of you would have to drop out.`}</Text>

        <Card title="Final call on Sep 10">
          <Text style={sub}>Two days before the trip.</Text>
        </Card>

        {/* Priority — sold out on high-demand batches */}
        {pri === 'none' && trip.waitlist > 15 ? (
          <Card title="Priority sold out">
            <Text style={sub}>Priority is sold out for this batch — only 6 are ever sold, so it stays worth something.</Text>
          </Card>
        ) : pri === 'none' ? (
          <Card title="Move up the queue">
            <Text style={sub}>₹49 puts you above everyone who hasn’t paid. It never displaces someone who has already paid for their seat.</Text>
            <Text style={[sub, { marginTop: 8 }]}>Nobody ahead of you has paid for priority · 4 of 6 priority places left on this batch</Text>
            <View style={{ marginTop: 12, gap: 8 }}>
              <Button label="Pay ₹49 for priority" onPress={() => buyPriority('cash')} />
              {wallet.balance >= 49 && <Button label={`Use ₹49 from your wallet (₹${wallet.balance})`} variant="ghost" onPress={() => buyPriority('wallet')} />}
            </View>
          </Card>
        ) : (
          <Card title="Priority active">
            <Text style={sub}>
              {pri === 'wallet'
                ? 'Paid from your wallet — carried over from a batch that didn’t confirm you, so you sit above anyone paying cash today.'
                : '₹49 paid · refunded to your wallet if this batch doesn’t confirm you.'}
            </Text>
          </Card>
        )}

        {/* Queue */}
        <Text style={{ color: t.colors.textFaint, fontSize: t.typography.size.kicker, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 24, marginBottom: 8 }}>The queue, in order</Text>
        {QUEUE.map((name, i) => {
          const pos = i + 1;
          const you = name === 'You';
          return (
            <View key={i} style={[styles.qrow, you && { backgroundColor: t.colors.surfaceRaised, borderRadius: t.radius.md }]}>
              <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.body2, width: 30 }}>#{pos}</Text>
              <Text style={{ color: you ? t.colors.accentL3 : t.colors.text, fontSize: t.typography.size.md, flex: 1, fontWeight: you ? '600' : '400' }}>{name}</Text>
              <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs }}>{pos <= seats ? 'In the seats' : 'Below the line'}</Text>
            </View>
          );
        })}
        <Text style={[sub, { marginTop: 12 }]}>Nobody pays for the trip until the seats are called. Priority is the only thing you pay for now.</Text>

        {/* What happens next — simulator states */}
        <Text style={{ color: t.colors.textFaint, fontSize: t.typography.size.kicker, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 24, marginBottom: 8 }}>What happens next</Text>

        {phase === 'pending' && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}><Button label="If you’re called" variant="ghost" onPress={() => setPhase('confirmed')} /></View>
            <View style={{ flex: 1 }}><Button label="If you’re not" variant="ghost" onPress={() => { setPhase('missed'); wallet.credit(49); }} /></View>
          </View>
        )}

        {phase === 'confirmed' && (
          <Card title="Your seat is called">
            <Text style={sub}>Pay within 24 hours to lock it. Miss the window and it passes to the next person in the queue.</Text>
            <Text style={{ color: t.colors.text, fontSize: t.typography.size.md, fontWeight: '600', marginTop: 10 }}>Trip cost ₹{trip.price.toLocaleString('en-IN')}</Text>
            <View style={{ marginTop: 12, gap: 8 }}>
              <Button label="Pay and confirm" onPress={() => navigation.popToTop()} />
              <Button label="Let the window pass" variant="ghost" onPress={() => setPhase('forfeit')} />
            </View>
            <Text style={[sub, { marginTop: 10 }]}>If you’re called and don’t pay, the ₹49 isn’t refunded — the seat was held for you.</Text>
            <Tag label="Reset this state" tone="neutral" style={{ marginTop: 10 }} />
          </Card>
        )}

        {phase === 'forfeit' && (
          <Card title="The seat went to the next person">
            <Text style={sub}>You were called and the 24 hours passed. The ₹49 isn’t returned — the seat was held out of the queue for you while others waited.</Text>
            <Text style={[sub, { marginTop: 8 }]}>You can still join the queue again, or take an empty seat on the day if one opens.</Text>
            <Button label="Reset this state" variant="ghost" onPress={() => setPhase('pending')} />
          </Card>
        )}

        {phase === 'missed' && (
          <Card title="This batch filled without you">
            <Text style={sub}>Your ₹49 went to your Kaafilla wallet. It buys priority on your next trip, ahead of anyone paying cash on the day.</Text>
            <Text style={{ color: t.colors.accentL3, fontSize: t.typography.size.md, fontWeight: '600', marginTop: 10 }}>Wallet · ₹{wallet.balance}</Text>
            <Text style={[sub, { marginTop: 8 }]}>Seats that open up after the final call stay bookable until the bus leaves — pay on the spot.</Text>
            <Button label="Reset this state" variant="ghost" onPress={() => setPhase('pending')} />
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 16, padding: 16, borderWidth: 1 },
  qrow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8 },
});

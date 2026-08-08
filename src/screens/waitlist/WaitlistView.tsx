import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../theme/ThemeProvider';
import { useTrip, useWaitlist, useWallet } from '../../api/hooks';
import { hasBackend } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { Header } from '../../components/molecules/Header';
import { Button } from '../../components/atoms/Button';
import { Tag } from '../../components/atoms/Badges';
import { useWalletStore } from '../../store/walletStore';
import { joinWaitlist, buyPriority, callSeat, paySeat, finalizeBatch, type WlStatus } from '../../api/economy';

// Display phase, derived from the server status when the economy is live, else
// from local toggles (the original simulator, kept as a graceful fallback).
type Phase = 'pending' | 'called' | 'paid' | 'forfeit' | 'missed';
type Priority = 'none' | 'cash' | 'wallet';

const FALLBACK_QUEUE = ['Meera', 'Rohit', 'Priya', 'Karan', 'Ibanri', 'Dev', 'Sana', 'Vikram', 'Nandita', 'Tashi', 'Arjun', 'Ritu', 'You', 'Nikita', 'Stanzin'];
const FALLBACK_POS = 13;
const PRIORITY_CAP = 6;

function Card({ title, children }: any) {
  const t = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: t.colors.surface, borderColor: t.colors.n800, borderRadius: t.radius.lg }]}>
      <Text style={{ color: t.colors.text, fontSize: t.typography.size.md, fontWeight: '600', marginBottom: 6 }}>{title}</Text>
      {children}
    </View>
  );
}

const phaseFromStatus = (s: WlStatus): Phase =>
  s === 'called' ? 'called' : s === 'confirmed' ? 'paid' : s === 'forfeit' ? 'forfeit' : s === 'missed' ? 'missed' : 'pending';

export function WaitlistView({ navigation, route }: any) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const tripId = route.params?.id ?? 'spiti';
  const { data: trip } = useTrip(tripId);
  const verified = useAuthStore((s) => s.isVerified);
  const qc = useQueryClient();

  const wl = useWaitlist(tripId);
  const walletQ = useWallet();
  const store = useWalletStore(); // fallback wallet
  const live = wl.isSuccess; // economy schema/function deployed & reachable

  // Fallback (simulator) state, used only when the economy isn't live.
  const [localPri, setLocalPri] = useState<Priority>('none');
  const [localPhase, setLocalPhase] = useState<Phase>('pending');
  const [busy, setBusy] = useState(false);

  // Join the queue once, on entry (best-effort; no-op if already in or not live).
  useEffect(() => {
    if (!hasBackend || !verified) return;
    joinWaitlist(tripId)
      .then(() => qc.invalidateQueries({ queryKey: ['waitlist', tripId] }))
      .catch(() => {
        /* economy not deployed → simulator fallback */
      });
  }, [tripId, verified, qc]);

  if (!trip) return <View style={{ flex: 1, backgroundColor: t.colors.bg }} />;

  const seats = trip.groupSize;
  const me = wl.data?.me ?? null;
  const rows = wl.data?.rows ?? [];
  const balance = walletQ.isSuccess ? walletQ.data.balance : store.balance;

  const myPos = me?.position ?? FALLBACK_POS;
  const inSeats = myPos <= seats;
  const phase: Phase = live && me ? phaseFromStatus(me.status) : localPhase;
  const priorityActive = live && me ? me.hasPriority : localPri !== 'none';
  const priorityCount = rows.filter((r) => r.hasPriority).length;
  const soldOut = live ? priorityCount >= PRIORITY_CAP && !me?.hasPriority : trip.waitlist > 15;

  const sub = { color: t.colors.textMuted, fontSize: t.typography.size.body2, lineHeight: t.typography.size.body2 * t.typography.lineHeight.relaxed };

  // Run a server action when live; otherwise apply the local simulator fallback.
  const act = async (fn: () => Promise<any>, fallback: () => void) => {
    if (!live) return fallback();
    try {
      setBusy(true);
      await fn();
      await qc.invalidateQueries({ queryKey: ['waitlist', tripId] });
      await qc.invalidateQueries({ queryKey: ['wallet'] });
    } catch (e: any) {
      Alert.alert('Try again', e?.message ?? 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const buyCash = () => act(() => buyPriority(tripId, 'cash'), () => setLocalPri('cash'));
  const buyWallet = () =>
    act(() => buyPriority(tripId, 'wallet'), () => {
      if (store.spend(49)) setLocalPri('wallet');
    });

  const displayQueue = live
    ? rows.map((r) => ({ name: r.name, pos: r.position, inSeats: r.position <= seats }))
    : FALLBACK_QUEUE.map((name, i) => ({ name, pos: i + 1, inSeats: i + 1 <= seats }));

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20 }}>
        <Header title="Trip" onBack={() => navigation.goBack()} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={{ color: t.colors.text, fontSize: t.typography.size['3xl'], fontWeight: '500', marginTop: 8 }}>You’re #{myPos} in the queue</Text>
        <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.body2, marginTop: 6 }}>{seats} seats left · {trip.waitlist} in the queue</Text>
        <Text style={[sub, { marginTop: 4 }]}>{inSeats ? 'You’re inside the seats as it stands.' : `${myPos - seats} people ahead of you would have to drop out.`}</Text>

        <Card title="Final call on Sep 10">
          <Text style={sub}>Two days before the trip.</Text>
        </Card>

        {/* Priority */}
        {!priorityActive && soldOut ? (
          <Card title="Priority sold out">
            <Text style={sub}>Priority is sold out for this batch — only {PRIORITY_CAP} are ever sold, so it stays worth something.</Text>
          </Card>
        ) : !priorityActive ? (
          <Card title="Move up the queue">
            <Text style={sub}>₹49 puts you above everyone who hasn’t paid. It never displaces someone who has already paid for their seat.</Text>
            <Text style={[sub, { marginTop: 8 }]}>{live ? `${PRIORITY_CAP - priorityCount} of ${PRIORITY_CAP} priority places left on this batch` : `Nobody ahead of you has paid for priority · ${PRIORITY_CAP - 2} of ${PRIORITY_CAP} priority places left on this batch`}</Text>
            <View style={{ marginTop: 12, gap: 8 }}>
              <Button label={busy ? 'Working…' : 'Pay ₹49 for priority'} disabled={busy} onPress={buyCash} />
              {balance >= 49 && <Button label={`Use ₹49 from your wallet (₹${balance})`} variant="ghost" disabled={busy} onPress={buyWallet} />}
            </View>
          </Card>
        ) : (
          <Card title="Priority active">
            <Text style={sub}>₹49 paid · it carries to your wallet as next-trip priority if this batch doesn’t confirm you. It never displaces a seat already paid for.</Text>
          </Card>
        )}

        {/* Queue */}
        <Text style={{ color: t.colors.textFaint, fontSize: t.typography.size.kicker, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 24, marginBottom: 8 }}>The queue, in order</Text>
        {displayQueue.map((row, i) => {
          const you = row.name === 'You';
          return (
            <View key={i} style={[styles.qrow, you && { backgroundColor: t.colors.surfaceRaised, borderRadius: t.radius.md }]}>
              <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.body2, width: 30 }}>#{row.pos}</Text>
              <Text style={{ color: you ? t.colors.accentL3 : t.colors.text, fontSize: t.typography.size.md, flex: 1, fontWeight: you ? '600' : '400' }}>{row.name}</Text>
              <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs }}>{row.inSeats ? 'In the seats' : 'Below the line'}</Text>
            </View>
          );
        })}
        <Text style={[sub, { marginTop: 12 }]}>Nobody pays for the trip until the seats are called. Priority is the only thing you pay for now.</Text>

        {/* Seat lifecycle */}
        <Text style={{ color: t.colors.textFaint, fontSize: t.typography.size.kicker, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 24, marginBottom: 8 }}>What happens next</Text>

        {phase === 'pending' && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Button label="If you’re called" variant="ghost" disabled={busy} onPress={() => act(() => callSeat(tripId), () => setLocalPhase('called'))} />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="If you’re not" variant="ghost" disabled={busy} onPress={() => act(() => finalizeBatch(tripId), () => { setLocalPhase('missed'); store.credit(49); })} />
            </View>
          </View>
        )}

        {phase === 'called' && (
          <Card title="Your seat is called">
            <Text style={sub}>Pay within 24 hours to lock it. Miss the window and it passes to the next person in the queue.</Text>
            <Text style={{ color: t.colors.text, fontSize: t.typography.size.md, fontWeight: '600', marginTop: 10 }}>Trip cost ₹{trip.price.toLocaleString('en-IN')}</Text>
            <View style={{ marginTop: 12, gap: 8 }}>
              <Button label={busy ? 'Working…' : 'Pay and confirm'} disabled={busy} onPress={() => act(async () => { await paySeat(tripId); navigation.popToTop(); }, () => navigation.popToTop())} />
              <Button label="Let the window pass" variant="ghost" disabled={busy} onPress={() => setLocalPhase('forfeit')} />
            </View>
            <Text style={[sub, { marginTop: 10 }]}>If you’re called and don’t pay, the ₹49 isn’t refunded — the seat was held for you.</Text>
          </Card>
        )}

        {phase === 'paid' && (
          <Card title="You’re confirmed">
            <Text style={sub}>Your seat is locked. See you on the trip.</Text>
          </Card>
        )}

        {phase === 'forfeit' && (
          <Card title="The seat went to the next person">
            <Text style={sub}>You were called and the 24 hours passed. The ₹49 isn’t returned — the seat was held out of the queue for you while others waited.</Text>
            <Text style={[sub, { marginTop: 8 }]}>You can still join the queue again, or take an empty seat on the day if one opens.</Text>
            {!live && <Button label="Reset this state" variant="ghost" onPress={() => setLocalPhase('pending')} />}
          </Card>
        )}

        {phase === 'missed' && (
          <Card title="This batch filled without you">
            <Text style={sub}>Your ₹49 went to your Kaafilla wallet. It buys priority on your next trip, ahead of anyone paying cash on the day.</Text>
            <Text style={{ color: t.colors.accentL3, fontSize: t.typography.size.md, fontWeight: '600', marginTop: 10 }}>Wallet · ₹{balance}</Text>
            <Text style={[sub, { marginTop: 8 }]}>Seats that open up after the final call stay bookable until the bus leaves — pay on the spot.</Text>
            {!live && <Button label="Reset this state" variant="ghost" onPress={() => setLocalPhase('pending')} />}
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

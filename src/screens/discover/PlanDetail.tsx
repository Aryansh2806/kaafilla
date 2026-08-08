import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { usePlan } from '../../api/hooks';
import { useAuthStore } from '../../store/authStore';
import { Header } from '../../components/molecules/Header';
import { Button } from '../../components/atoms/Button';
import { LeadBadge, Tag } from '../../components/atoms/Badges';
import { ProgressBar } from '../../components/atoms/Progress';
import { Avatar } from '../../components/atoms/Avatar';
import { PhotoCarousel } from '../../components/molecules/PhotoCarousel';
import { heroImages } from '../../data/tripImages';

export function PlanDetail({ navigation, route }: any) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const id = route.params?.id ?? 'tirthan';
  const { data: plan } = usePlan(id);
  const verified = useAuthStore((s) => s.isVerified);
  const [asked, setAsked] = useState(false);

  if (!plan) return <View style={{ flex: 1, backgroundColor: t.colors.bg }} />;

  const imgs = heroImages(id, plan.region);
  const ask = () => {
    if (!verified) return navigation.navigate('VerifyGate', { id, gateFrom: 'ask' });
    setAsked(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {imgs.length ? (
          <View>
            <PhotoCarousel images={imgs} height={260} />
            <View style={{ position: 'absolute', top: insets.top, left: 0, right: 0, paddingHorizontal: 20 }}>
              <Header onBack={() => navigation.goBack()} right={<LeadBadge lead="plan" />} />
            </View>
          </View>
        ) : null}
        <View style={{ paddingTop: imgs.length ? 12 : insets.top, paddingHorizontal: 20 }}>
          {!imgs.length && <Header onBack={() => navigation.goBack()} right={<LeadBadge lead="plan" />} />}
          <Text style={{ color: t.colors.text, fontSize: t.typography.size['3xl'], fontWeight: '500', marginTop: 12 }}>{plan.name}</Text>
          <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.sm, marginTop: 6 }}>
            {plan.month} · {plan.days} days · {plan.place} · {plan.stay}
          </Text>
          <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.sm }}>Meeting at {plan.cities}</Text>

          <View style={[styles.host, { backgroundColor: t.colors.surface, borderColor: t.colors.n800, borderRadius: t.radius.lg }]}>
            <Avatar name={plan.hostName} size={44} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: t.colors.text, fontSize: t.typography.size.lg, fontWeight: '600' }}>{plan.hostName}</Text>
              <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.body2 }}>
                {plan.lead === 'women' ? 'Woman' : 'Man'} · host · {plan.hostTrips} trips with Kaafilla · ★ {plan.hostRating}
              </Text>
            </View>
            <LeadBadge lead={plan.lead} />
          </View>

          <Text style={{ color: t.colors.text, fontSize: t.typography.size.md, marginTop: 16, lineHeight: t.typography.size.md * t.typography.lineHeight.relaxed }}>
            {plan.note}
          </Text>

          {/* Cost block */}
          <View style={[styles.cost, { backgroundColor: t.colors.sectionBg, borderRadius: t.radius.lg }]}>
            <Text style={{ color: t.colors.accentL2, fontSize: t.typography.size.kicker, letterSpacing: 1.2, textTransform: 'uppercase' }}>Rough cost, split between you</Text>
            <Text style={{ color: t.colors.accentL1, fontSize: t.typography.size['3xl'], fontWeight: '600', marginTop: 6 }}>₹{(plan.costEach ?? 0).toLocaleString('en-IN')} each</Text>
            <Text style={{ color: t.colors.accentL3, fontSize: t.typography.size.body2, marginTop: 8, lineHeight: t.typography.size.body2 * t.typography.lineHeight.relaxed }}>
              Nobody pays Kaafilla for this. You settle between yourselves in the app as you go — we only keep the ledger.
            </Text>
          </View>

          {/* Spots */}
          <View style={{ marginTop: 20 }}>
            <Text style={{ color: t.colors.text, fontSize: t.typography.size.md, fontWeight: '600' }}>
              {plan.joined} of {plan.groupSize} joined · {plan.groupSize - plan.joined} spots left
            </Text>
            <View style={{ marginTop: 10 }}>
              <ProgressBar value={plan.joined / plan.groupSize} />
            </View>
            <View style={{ marginTop: 12 }}>
              <Tag label={plan.dates === 'flexible' ? '🕑 Dates are flexible by a few days' : '✓ Dates are fixed'} tone="neutral" />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.cta, { backgroundColor: t.colors.bg, borderTopColor: t.colors.n800, paddingBottom: insets.bottom + 12 }]}>
        {asked ? (
          <View>
            <Text style={{ color: t.colors.accentL3, fontSize: t.typography.size.md, fontWeight: '600' }}>● Request sent to {plan.hostName}</Text>
            <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.body2, marginTop: 2 }}>You’ll see their answer in Chats.</Text>
          </View>
        ) : (
          <>
            <Button label={`Ask ${plan.hostName} to join`} onPress={ask} />
            <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: 8, textAlign: 'center' }}>
              The host chooses who comes. You’ll see their answer in Chats.
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 1, marginTop: 20 },
  cost: { padding: 16, marginTop: 20 },
  cta: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1 },
});

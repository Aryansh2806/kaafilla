import { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../theme/ThemeProvider';
import { Header } from '../../components/molecules/Header';
import { Input, TextArea } from '../../components/atoms/Input';
import { Button } from '../../components/atoms/Button';
import { useAuthStore } from '../../store/authStore';
import { hasBackend } from '../../api/client';
import { createPlan } from '../../api/writes';

export function CreatePlan({ navigation }: any) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const verified = useAuthStore((s) => s.isVerified);
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [where, setWhere] = useState('');
  const [cost, setCost] = useState('');
  const [what, setWhat] = useState('');
  const [posting, setPosting] = useState(false);

  const post = async () => {
    if (!verified) return navigation.navigate('VerifyGate', { gateFrom: 'host' });
    if (!hasBackend || !user) return navigation.goBack();
    try {
      setPosting(true);
      await createPlan({
        place: where.trim(),
        costEach: Number(cost.replace(/[^\d]/g, '')) || 0,
        note: what.trim(),
        hostName: user.firstName,
        hostId: user.id,
        lead: user.lead,
      });
      await qc.invalidateQueries({ queryKey: ['plans'] });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Could not post plan', e?.message ?? 'Please try again.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20 }}><Header onBack={() => navigation.goBack()} /></View>
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        <Text style={{ color: t.colors.text, fontSize: t.typography.size['3xl'], fontWeight: '500', marginTop: 8, lineHeight: t.typography.size['3xl'] * 1.1 }}>Plan your own,{'\n'}find your kaafila</Text>
        <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.md, marginTop: 8, lineHeight: t.typography.size.md * t.typography.lineHeight.relaxed }}>
          Post where you’re going. Verified travellers ask to join, and you choose who comes.
        </Text>

        <View style={{ gap: 16, marginTop: 24 }}>
          <Input label="Where" value={where} onChangeText={setWhere} placeholder="Tirthan Valley, Himachal" />
          <Input label="Rough cost each" value={cost} onChangeText={setCost} keyboardType="number-pad" placeholder="₹14,000" />
          <TextArea label="What the trip is" value={what} onChangeText={setWhat} placeholder="A cabin by the river, no fixed plan beyond trout and a lot of nothing." />
        </View>

        <View style={{ backgroundColor: t.colors.sectionBg, borderRadius: t.radius.lg, padding: 14, marginTop: 16 }}>
          <Text style={{ color: t.colors.accentL1, fontSize: t.typography.size.md, fontWeight: '600' }}>₹49 to host · charged later</Text>
          <Text style={{ color: t.colors.accentL3, fontSize: t.typography.size.xs, marginTop: 4, lineHeight: t.typography.size.xs * t.typography.lineHeight.relaxed }}>
            Listing is free. The ₹49 is charged only when your first traveller joins — so an empty plan never costs you anything. It’s the only money Kaafilla takes from a traveller plan.
          </Text>
        </View>

        <View style={{ marginTop: 'auto', paddingBottom: insets.bottom + 16 }}>
          <Button label={posting ? 'Posting…' : 'Post this plan'} disabled={!where.trim() || !what.trim() || posting} onPress={post} />
          <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: 8, textAlign: 'center' }}>
            Hosting needs Aadhaar verification. Your name and rating are shown to everyone who asks to join.
          </Text>
        </View>
      </View>
    </View>
  );
}

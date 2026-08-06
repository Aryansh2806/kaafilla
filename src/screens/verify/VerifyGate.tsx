import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { Input } from '../../components/atoms/Input';
import { Button } from '../../components/atoms/Button';
import { gate } from '../../data/copy';

export function VerifyGate({ navigation, route }: any) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [consent, setConsent] = useState(false);
  const [aadhaar, setAadhaar] = useState('•••• •••• 4182');
  const gateFrom = route.params?.gateFrom;

  return (
    <View style={styles.backdrop}>
      <Pressable style={{ flex: 1 }} onPress={() => navigation.goBack()} accessibilityLabel="Dismiss" />
      <View style={[styles.sheet, { backgroundColor: t.colors.surface, paddingBottom: insets.bottom + 20 }]}>
        <View style={[styles.grabber, { backgroundColor: t.colors.n700 }]} />
        <Text style={{ color: t.colors.text, fontSize: t.typography.size['2xl'], fontWeight: '500' }}>{gate.title}</Text>
        <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.md, marginTop: 8, lineHeight: t.typography.size.md * t.typography.lineHeight.relaxed }}>{gate.sub}</Text>

        <View style={{ marginTop: 20, gap: 14 }}>
          {gate.steps.map((s, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: t.colors.accentD3, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: t.colors.accentL2, fontSize: t.typography.size.body2, fontWeight: '700' }}>{i + 1}</Text>
              </View>
              <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.body2, flex: 1, lineHeight: t.typography.size.body2 * t.typography.lineHeight.relaxed }}>{s}</Text>
            </View>
          ))}
        </View>

        <Pressable onPress={() => setConsent((c) => !c)} style={{ flexDirection: 'row', gap: 10, marginTop: 20 }} accessibilityRole="checkbox" accessibilityState={{ checked: consent }}>
          <View style={{ width: 20, height: 20, borderRadius: 5, borderWidth: 1, borderColor: consent ? t.colors.accent : t.colors.n700, backgroundColor: consent ? t.colors.accentL3 : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
            {consent && <Text style={{ color: t.colors.accentD4, fontSize: 12 }}>✓</Text>}
          </View>
          <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, flex: 1, lineHeight: t.typography.size.xs * t.typography.lineHeight.relaxed, fontStyle: 'italic' }}>{gate.consent}</Text>
        </Pressable>

        <View style={{ marginTop: 16 }}>
          <Input label={gate.aadhaarLabel} value={aadhaar} onChangeText={setAadhaar} keyboardType="number-pad" />
        </View>

        <View style={{ marginTop: 16 }}>
          <Button label={gate.cta} disabled={!consent} onPress={() => navigation.navigate('AadhaarOTP', { gateFrom })} />
        </View>
        <Pressable onPress={() => navigation.goBack()} style={{ marginTop: 12, alignItems: 'center' }} accessibilityRole="button">
          <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.body2 }}>{gate.ghost}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(22,24,38,0.72)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 20, paddingTop: 12 },
  grabber: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
});

import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Screen } from '../../components/layout/Screen';
import { Input } from '../../components/atoms/Input';
import { Button } from '../../components/atoms/Button';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuthStore } from '../../store/authStore';
import { brand } from '../../data/copy';

export function PhoneEntry({ navigation }: any) {
  const t = useTheme();
  const [num, setNum] = useState('98204 41823');
  const setReturning = useAuthStore((s) => s.setReturning);
  const patchDraft = useAuthStore((s) => s.patchDraft);
  const returning = useAuthStore((s) => s.returning);

  const digits = num.replace(/\D/g, '');
  const valid = digits.length >= 10;

  const branch = (isReturning: boolean) => setReturning(isReturning);

  const cont = () => {
    patchDraft({ phone: `+91 ${num}` });
    navigation.navigate('OTPVerify');
  };

  return (
    <Screen>
      <View style={styles.flex}>
        <Text style={{ color: t.colors.textFaint, fontSize: t.typography.size.kicker, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: t.spacing[6] }}>
          {brand.name}
        </Text>
        <Text style={{ color: t.colors.text, fontSize: t.typography.size['4xl'], fontWeight: '500', marginTop: t.spacing[4], lineHeight: t.typography.size['4xl'] * 1.1 }}>
          What’s your{'\n'}number?
        </Text>
        <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.md, marginTop: t.spacing[3], lineHeight: t.typography.size.md * t.typography.lineHeight.relaxed }}>
          Your kaafila starts with a verified phone. We never show it to other travellers.
        </Text>

        <View style={{ flexDirection: 'row', gap: t.spacing[2], marginTop: t.spacing[6] }}>
          <View style={[styles.prefix, { backgroundColor: t.colors.surface, borderColor: t.colors.border, borderRadius: t.radius.md }]}>
            <Text style={{ color: t.colors.text, fontSize: t.typography.size.md }}>🇮🇳 +91</Text>
          </View>
          <Input value={num} onChangeText={setNum} keyboardType="number-pad" containerStyle={{ flex: 1 }} label={undefined} />
        </View>

        <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: t.spacing[3], lineHeight: t.typography.size.xs * t.typography.lineHeight.relaxed }}>
          🔒 One account per number. Getting removed for harassment means the number is gone too.
        </Text>

        {/* Prototype-only branch selector */}
        <Text style={{ color: t.colors.textFaint, fontSize: t.typography.size.kicker, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: t.spacing[8] }}>
          Prototype only · which number is this?
        </Text>
        <View style={{ gap: t.spacing[3], marginTop: t.spacing[3] }}>
          {[
            { r: false, a: 'New number', b: '→ build a profile' },
            { r: true, a: 'Already has an account', b: '→ straight to trips' },
          ].map((o) => (
            <Pressable
              key={String(o.r)}
              onPress={() => branch(o.r)}
              accessibilityRole="button"
              accessibilityState={{ selected: returning === o.r }}
              style={[styles.branch, { backgroundColor: t.colors.surface, borderRadius: t.radius.lg, borderColor: returning === o.r ? t.colors.accent : t.colors.n800 }]}
            >
              <Text style={{ color: t.colors.text, fontSize: t.typography.size.lg, fontWeight: '600' }}>{o.a}</Text>
              <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.body2 }}>{o.b}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ marginTop: 'auto', paddingVertical: t.spacing[4] }}>
          <Button label={returning ? 'Send code' : 'Send code'} onPress={cont} disabled={!valid} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  prefix: { justifyContent: 'center', paddingHorizontal: 14, minHeight: 44, borderWidth: 1 },
  branch: { padding: 15, borderWidth: 1 },
});

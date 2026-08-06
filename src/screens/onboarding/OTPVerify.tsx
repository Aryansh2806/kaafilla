import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Screen } from '../../components/layout/Screen';
import { Button } from '../../components/atoms/Button';
import { OTPInput, KeyPad } from '../../components/atoms/OTP';
import { SignupTopBar } from '../../components/molecules/Header';
import { useTheme } from '../../theme/ThemeProvider';
import { useOTPTimer } from '../../hooks/useOTPTimer';
import { useAuthStore } from '../../store/authStore';

export function OTPVerify({ navigation }: any) {
  const t = useTheme();
  const [code, setCode] = useState('');
  const { mmss, expired, reset } = useOTPTimer(60);
  const returning = useAuthStore((s) => s.returning);
  const signIn = useAuthStore((s) => s.signIn);
  const phone = useAuthStore((s) => s.draft.phone) ?? '+91 98204 41 82';

  const onKey = (d: string) => setCode((c) => (c.length < 6 ? c + d : c));
  const onDelete = () => setCode((c) => c.slice(0, -1));

  const verify = () => {
    if (returning) {
      // Returning user lands verified, on the feed (prototype branch).
      signIn({ id: 'me', firstName: 'Aanya', age: 24, city: 'Mumbai', isVerified: true, verificationStatus: 'verified', lead: 'women' });
    } else {
      navigation.navigate('PhotoUpload');
    }
  };

  return (
    <Screen>
      <SignupTopBar step={1} total={5} onBack={() => navigation.goBack()} />
      <View style={styles.flex}>
        <Text style={{ color: t.colors.text, fontSize: t.typography.size['3xl'], fontWeight: '500', marginTop: t.spacing[6] }}>
          {returning ? 'Welcome back' : 'Enter the code'}
        </Text>
        <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.md, marginTop: t.spacing[2] }}>
          {returning ? `Code sent to ${phone} — the number on your account.` : `Sent by SMS to ${phone}`}
        </Text>

        <View style={{ marginTop: t.spacing[6] }}>
          <OTPInput value={code} />
        </View>

        <Pressable onPress={expired ? reset : undefined} disabled={!expired} style={{ marginTop: t.spacing[4] }}>
          <Text style={{ color: expired ? t.colors.accent : t.colors.textMuted, fontSize: t.typography.size.body2 }}>
            {expired ? 'Code expired — resend SMS' : `⏱ Code expires in ${mmss}`}
          </Text>
        </Pressable>

        <View style={{ marginTop: 'auto', gap: t.spacing[4], paddingBottom: t.spacing[4] }}>
          <KeyPad onKey={onKey} onDelete={onDelete} />
          <Button label={returning ? 'Verify & continue' : 'Verify number'} onPress={verify} disabled={code.length < 6} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });

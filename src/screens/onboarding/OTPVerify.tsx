import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { Screen } from '../../components/layout/Screen';
import { Button } from '../../components/atoms/Button';
import { OTPInput, KeyPad } from '../../components/atoms/OTP';
import { SignupTopBar } from '../../components/molecules/Header';
import { useTheme } from '../../theme/ThemeProvider';
import { useOTPTimer } from '../../hooks/useOTPTimer';
import { useAuthStore } from '../../store/authStore';
import { hasBackend } from '../../api/client';
import { sendEmailCode, verifyEmailCode, getCurrentProfile } from '../../api/auth';

export function OTPVerify({ navigation }: any) {
  const t = useTheme();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const { mmss, expired, reset } = useOTPTimer(60);
  const signIn = useAuthStore((s) => s.signIn);
  const email = useAuthStore((s) => s.draft.email) ?? '';

  const onKey = (d: string) => setCode((c) => (c.length < 6 ? c + d : c));
  const onDelete = () => setCode((c) => c.slice(0, -1));

  const verify = async () => {
    if (!hasBackend) {
      // Seed mode: no real auth — just continue onboarding.
      navigation.navigate('PhotoUpload');
      return;
    }
    try {
      setBusy(true);
      await verifyEmailCode(email, code);
      const res = await getCurrentProfile();
      if (res && res.complete) {
        signIn(res.profile); // returning user with a profile → straight to the app
      } else {
        navigation.navigate('PhotoUpload'); // new user → build the profile
      }
    } catch (e: any) {
      Alert.alert('Wrong or expired code', e?.message ?? 'Check the code and try again.');
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    reset();
    setCode('');
    if (hasBackend && email) {
      try {
        await sendEmailCode(email);
      } catch {
        // surfaced on next verify attempt
      }
    }
  };

  return (
    <Screen>
      <SignupTopBar step={1} total={5} onBack={() => navigation.goBack()} />
      <View style={styles.flex}>
        <Text style={{ color: t.colors.text, fontSize: t.typography.size['3xl'], fontWeight: '500', marginTop: t.spacing[6] }}>
          Enter the code
        </Text>
        <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.md, marginTop: t.spacing[2] }}>
          Sent by email to {email || 'your inbox'}
        </Text>

        <View style={{ marginTop: t.spacing[6] }}>
          <OTPInput value={code} />
        </View>

        <Pressable onPress={expired ? resend : undefined} disabled={!expired} style={{ marginTop: t.spacing[4] }}>
          <Text style={{ color: expired ? t.colors.accent : t.colors.textMuted, fontSize: t.typography.size.body2 }}>
            {expired ? 'Code expired — resend email' : `⏱ Code expires in ${mmss}`}
          </Text>
        </Pressable>

        <View style={{ marginTop: 'auto', gap: t.spacing[4], paddingBottom: t.spacing[4] }}>
          <KeyPad onKey={onKey} onDelete={onDelete} />
          <Button label={busy ? 'Verifying…' : 'Verify & continue'} onPress={verify} disabled={code.length < 6 || busy} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });

import { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Screen } from '../../components/layout/Screen';
import { Input } from '../../components/atoms/Input';
import { Button } from '../../components/atoms/Button';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuthStore } from '../../store/authStore';
import { brand } from '../../data/copy';
import { hasBackend } from '../../api/client';
import { signInOrSignUp, getCurrentProfile } from '../../api/auth';

// Email + password sign-in (no email delivery needed). One form for new and
// returning users: signInOrSignUp creates the account if it doesn't exist. New
// users continue to profile build; returning users with a profile go to the app.
export function PhoneEntry({ navigation }: any) {
  const t = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const patchDraft = useAuthStore((s) => s.patchDraft);
  const signIn = useAuthStore((s) => s.signIn);

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const valid = emailOk && password.length >= 6;

  const cont = async () => {
    const addr = email.trim().toLowerCase();
    patchDraft({ email: addr });
    if (!hasBackend) {
      navigation.navigate('PhotoUpload');
      return;
    }
    try {
      setBusy(true);
      await signInOrSignUp(addr, password);
      const res = await getCurrentProfile();
      if (res && res.complete) {
        signIn(res.profile); // returning user with a profile → straight to the app
      } else {
        navigation.navigate('PhotoUpload'); // new user → build the profile
      }
    } catch (e: any) {
      Alert.alert('Could not sign in', e?.message ?? 'Check your details and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <View style={styles.flex}>
        <Text style={{ color: t.colors.textFaint, fontSize: t.typography.size.kicker, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: t.spacing[6] }}>
          {brand.name}
        </Text>
        <Text style={{ color: t.colors.text, fontSize: t.typography.size['4xl'], fontWeight: '500', marginTop: t.spacing[4], lineHeight: t.typography.size['4xl'] * 1.1 }}>
          Sign in or{'\n'}sign up
        </Text>
        <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.md, marginTop: t.spacing[3], lineHeight: t.typography.size.md * t.typography.lineHeight.relaxed }}>
          Use your email and a password. New here? We’ll create your account. We never show your email to other travellers.
        </Text>

        <View style={{ marginTop: t.spacing[6], gap: t.spacing[3] }}>
          <Input
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="emailAddress"
            placeholder="you@example.com"
            label={undefined}
          />
          <Input
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
            placeholder="Password (6+ characters)"
            label={undefined}
          />
        </View>

        <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: t.spacing[3], lineHeight: t.typography.size.xs * t.typography.lineHeight.relaxed }}>
          🔒 One account per email. Getting removed for harassment means the account is gone too.
        </Text>

        <View style={{ marginTop: 'auto', paddingVertical: t.spacing[4] }}>
          <Button label={busy ? 'Please wait…' : 'Continue'} onPress={cont} disabled={!valid || busy} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });

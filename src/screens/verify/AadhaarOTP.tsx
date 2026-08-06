import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { OTPInput, KeyPad } from '../../components/atoms/OTP';
import { Button } from '../../components/atoms/Button';
import { useOTPTimer } from '../../hooks/useOTPTimer';

export function AadhaarOTP({ navigation, route }: any) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState('');
  const { mmss, expired, reset } = useOTPTimer(60);

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg, paddingTop: insets.top, paddingHorizontal: 20 }}>
      <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={{ height: 44, justifyContent: 'center' }} accessibilityRole="button" accessibilityLabel="Close">
        <Text style={{ color: t.colors.text, fontSize: 22 }}>✕</Text>
      </Pressable>
      <Text style={{ color: t.colors.text, fontSize: t.typography.size['3xl'], fontWeight: '500', marginTop: 8 }}>Aadhaar OTP</Text>
      <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.md, marginTop: 8 }}>UIDAI sent a code to the number registered with your Aadhaar.</Text>

      <View style={{ marginTop: 24 }}>
        <OTPInput value={code} warm />
      </View>
      <Pressable onPress={expired ? reset : undefined} disabled={!expired} style={{ marginTop: 16 }}>
        <Text style={{ color: expired ? t.colors.accent : t.colors.textMuted, fontSize: t.typography.size.body2 }}>
          {expired ? 'Expired — request a new code' : `Expires in ${mmss}`}
        </Text>
      </Pressable>

      <View style={{ marginTop: 'auto', gap: 16, paddingBottom: insets.bottom + 16 }}>
        <KeyPad onKey={(d) => setCode((c) => (c.length < 6 ? c + d : c))} onDelete={() => setCode((c) => c.slice(0, -1))} />
        <Button label="Continue to selfie" disabled={code.length < 6} onPress={() => navigation.navigate('SelfieCapture', { gateFrom: route.params?.gateFrom })} />
      </View>
    </View>
  );
}

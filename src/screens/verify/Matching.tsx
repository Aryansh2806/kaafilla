import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeProvider';
import { usePulse } from '../../theme/animations';
import { Avatar } from '../../components/atoms/Avatar';
import { useAuthStore } from '../../store/authStore';
import { kyc } from '../../verification';

export function Matching({ navigation, route }: any) {
  const t = useTheme();
  const setVerified = useAuthStore((s) => s.setVerified);
  const dot = usePulse();

  useEffect(() => {
    let alive = true;
    (async () => {
      const record = await kyc.matchSelfie('selfie.jpg');
      if (!alive) return;
      setVerified(record);
      navigation.replace('VerifySuccess', { gateFrom: route.params?.gateFrom });
    })();
    return () => {
      alive = false;
    };
  }, [navigation, route.params?.gateFrom, setVerified]);

  return (
    <View style={[styles.root, { backgroundColor: t.colors.bg }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
        <Avatar name="You" size={72} />
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {[0, 1, 2].map((i) => (
            <Animated.View key={i} style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.colors.accent }, dot]} />
          ))}
        </View>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: t.colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: t.colors.textMuted, fontSize: 24 }}>🪪</Text>
        </View>
      </View>
      <Text style={{ color: t.colors.text, fontSize: t.typography.size.xl, fontWeight: '600', marginTop: 32 }}>Matching your face</Text>
      <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.body2, marginTop: 6 }}>Comparing with the Aadhaar photo</Text>
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 } });

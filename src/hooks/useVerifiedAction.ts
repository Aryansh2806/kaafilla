import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';

// Gate any verified-only action. If verified, run it now; otherwise route to the
// VerifyGate modal (recording where it came from). Used by join/ask/connect/etc.
export function useVerifiedAction() {
  const navigation = useNavigation<any>();
  const isVerified = useAuthStore((s) => s.isVerified);
  return (action: () => void, gateFrom: string) => {
    if (isVerified) action();
    else navigation.navigate('VerifyGate', { gateFrom });
  };
}

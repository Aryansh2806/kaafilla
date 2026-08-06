import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Button } from '../atoms/Button';

type Props = {
  title: string;
  body: string;
  footnote?: string;
  count?: number;
  countSuffix?: string;
  cta: string;
  onVerify: () => void;
};

// Full-screen gate shown to unverified users on people/chats/looking, with
// skeleton cards behind the message and a "Verify with Aadhaar" CTA.
export function LockGate({ title, body, footnote, count, countSuffix, cta, onVerify }: Props) {
  const t = useTheme();
  return (
    <View style={styles.wrap}>
      <Text style={{ color: t.colors.text, fontSize: t.typography.size['3xl'], fontWeight: '600' }}>{title}</Text>
      <Text
        style={{
          color: t.colors.textSub,
          fontSize: t.typography.size.md,
          marginTop: t.spacing[3],
          lineHeight: t.typography.size.md * t.typography.lineHeight.relaxed,
        }}
      >
        {body}
      </Text>

      <View style={{ marginTop: t.spacing[6], gap: t.spacing[3] }}>
        {[0, 1].map((i) => (
          <View key={i} style={[styles.skeleton, { backgroundColor: t.colors.surface, borderRadius: t.radius.lg, borderColor: t.colors.n800 }]} />
        ))}
      </View>

      {count != null && countSuffix && (
        <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.body2, marginTop: t.spacing[4] }}>
          {count} {countSuffix}
        </Text>
      )}

      <View style={{ marginTop: t.spacing[5] }}>
        <Button label={cta} onPress={onVerify} />
      </View>

      {footnote && (
        <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: t.spacing[4], textAlign: 'center' }}>
          {footnote}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingTop: 24 },
  skeleton: { height: 84, borderWidth: 1, opacity: 0.5 },
});

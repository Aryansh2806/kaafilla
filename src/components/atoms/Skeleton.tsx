import { useEffect } from 'react';
import { View, StyleSheet, type ViewStyle, type DimensionValue } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeProvider';

// Pulsing placeholder block. Opacity breathes 0.4→1 so loading surfaces read as
// "content coming" rather than broken. Colors from tokens (n900 over surface).
export function Skeleton({
  width = '100%',
  height = 14,
  radius,
  style,
}: {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}) {
  const t = useTheme();
  const p = useSharedValue(0.4);
  useEffect(() => {
    p.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [p]);
  const anim = useAnimatedStyle(() => ({ opacity: p.value }));
  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius ?? t.radius.md, backgroundColor: t.colors.n900 },
        anim,
        style,
      ]}
    />
  );
}

// A feed-card-shaped skeleton so the list keeps its rhythm while trips load.
export function FeedCardSkeleton() {
  const t = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: t.colors.surface, borderRadius: t.radius.lg, borderColor: t.colors.n800 }]}>
      <Skeleton width="100%" height={120} radius={0} />
      <View style={{ padding: 14 }}>
        <Skeleton width="70%" height={18} />
        <Skeleton width="35%" height={22} style={{ marginTop: 8 }} />
        <Skeleton width="85%" height={12} style={{ marginTop: 10 }} />
        <Skeleton width="60%" height={12} style={{ marginTop: 6 }} />
        <View style={styles.footer}>
          <Skeleton width={80} height={11} />
          <Skeleton width={110} height={11} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, overflow: 'hidden' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
});

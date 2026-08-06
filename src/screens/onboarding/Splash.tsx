import { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { HeroGradient } from '../../components/HeroGradient';
import { useTheme } from '../../theme/ThemeProvider';
import { brand } from '../../data/copy';

const DOT_COLORS = ['#f5f4ff', '#d2cefd', '#b5abfc', '#9184d9', '#796cbf', '#5d5294', '#b5abfc', '#d2cefd'];

function Dot({ index, color }: { index: number; color: string }) {
  const angle = (index / DOT_COLORS.length) * Math.PI * 2;
  const dx = Math.cos(angle) * 120;
  const dy = Math.sin(angle) * 120;
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(index * 80, withTiming(1, { duration: 1400, easing: Easing.bezier(0.4, 0, 0.2, 1) }));
  }, [index, p]);
  const style = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ translateX: (1 - p.value) * dx }, { translateY: (1 - p.value) * dy }, { scale: 0.7 + p.value * 0.3 }],
  }));
  const size = 8 + (index % 4) * 2;
  return <Animated.View style={[{ position: 'absolute', width: size, height: size, borderRadius: size, backgroundColor: color }, style]} />;
}

export function Splash({ navigation }: any) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const word = useSharedValue(0);

  useEffect(() => {
    word.value = withDelay(1200, withTiming(1, { duration: 1000, easing: Easing.out(Easing.ease) }));
    const to = setTimeout(() => navigation.replace('ValueProp'), 3000);
    return () => clearTimeout(to);
  }, [navigation, word]);

  const wordStyle = useAnimatedStyle(() => ({
    opacity: word.value,
    letterSpacing: 8 + (1 - word.value) * 8,
  }));

  return (
    <Pressable style={styles.root} onPress={() => navigation.replace('ValueProp')} accessibilityRole="button" accessibilityLabel="Continue">
      <View style={{ backgroundColor: t.colors.bg, flex: 1 }}>
        <HeroGradient />
        <View style={styles.center}>
          <View style={[styles.dots, { width, alignItems: 'center', justifyContent: 'center' }]}>
            {DOT_COLORS.map((c, i) => (
              <Dot key={i} index={i} color={c} />
            ))}
          </View>
          <Animated.Text style={[{ color: t.colors.accentL1, fontSize: t.typography.size['5xl'], fontWeight: '500' }, wordStyle]}>
            {brand.wordmark}
          </Animated.Text>
          <Text style={{ color: t.colors.accentL3, fontSize: t.typography.size['2xl'], marginTop: t.spacing[2], fontFamily: t.typography.fontDev }}>
            {brand.devanagari}
          </Text>
          <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.md, marginTop: t.spacing[3] }}>{brand.tagline}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dots: { position: 'absolute', top: '38%', height: 40 },
});

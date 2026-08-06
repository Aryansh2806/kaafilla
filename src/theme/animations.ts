import { useEffect } from 'react';
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type WithTimingConfig,
} from 'react-native-reanimated';

// Durations / easings mirrored from the prototype's @keyframes.
export const durations = { fast: 150, base: 220, entrance: 300, sheet: 300, pulse: 2000 } as const;
export const easing = {
  standard: Easing.bezier(0.4, 0, 0.2, 1),
  out: Easing.out(Easing.ease),
  sheet: Easing.bezier(0.2, 0.8, 0.2, 1),
} as const;

const upConfig: WithTimingConfig = { duration: durations.entrance, easing: easing.out };

// `up` — translateY(10)+fade → 0. The prototype's standard mount entrance (~37 uses).
export function useEntrance(delay = 0) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withTiming(1, upConfig));
  }, [delay, p]);
  return useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ translateY: (1 - p.value) * 10 }],
  }));
}

// `pulse` — opacity .35→.9, scale 1→1.3. Live/typing dots; optional stagger delay.
export function usePulse(delay = 0) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: durations.pulse / 2, easing: easing.standard }),
          withTiming(0, { duration: durations.pulse / 2, easing: easing.standard }),
        ),
        -1,
      ),
    );
  }, [delay, p]);
  return useAnimatedStyle(() => ({
    opacity: 0.35 + p.value * 0.55,
    transform: [{ scale: 1 + p.value * 0.3 }],
  }));
}

// Press feedback — scale 1 → 0.96/0.98. Use on cards/keys via a shared value the caller drives.
export const pressScale = { card: 0.98, key: 0.94, tag: 0.96 } as const;

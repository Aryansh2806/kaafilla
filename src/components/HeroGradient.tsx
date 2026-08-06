import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { gradients } from '../theme/tokens';

// Full-bleed radial hero (splash / verify success). Absolute-fills its parent.
export function HeroGradient({ style }: { style?: ViewStyle }) {
  return (
    <View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="hero" cx="50%" cy="34%" rx="115%" ry="70%">
            {gradients.hero.stops.map((s, i) => (
              <Stop key={i} offset={s.offset} stopColor={s.color} />
            ))}
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill="url(#hero)" />
      </Svg>
    </View>
  );
}

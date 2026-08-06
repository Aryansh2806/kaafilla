import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme/ThemeProvider';

// 20px stroke-1.8 line icons matching the prototype tab set.
function TabIcon({ name, color }: { name: string; color: string }) {
  const p = { stroke: color, strokeWidth: 1.8, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      {name === 'Discover' && (
        <>
          <Circle cx={12} cy={12} r={9} {...p} />
          <Path d="M16 8l-2.5 5.5L8 16l2.5-5.5L16 8z" {...p} />
        </>
      )}
      {name === 'Travellers' && (
        <>
          <Circle cx={9} cy={8} r={3} {...p} />
          <Path d="M3.5 19a5.5 5.5 0 0 1 11 0" {...p} />
          <Path d="M16 6.5a3 3 0 0 1 0 5.8M17 19a5.5 5.5 0 0 0-2.5-4.6" {...p} />
        </>
      )}
      {name === 'Chats' && <Path d="M4 5h16v11H9l-4 3v-3H4z" {...p} />}
      {name === 'You' && (
        <>
          <Circle cx={12} cy={8} r={3.5} {...p} />
          <Path d="M5 20a7 7 0 0 1 14 0" {...p} />
        </>
      )}
    </Svg>
  );
}

export function BottomTabBar({ state, navigation }: BottomTabBarProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.bar,
        { backgroundColor: t.colors.surfaceRaised, borderTopColor: t.roles.hairline, paddingBottom: insets.bottom, height: 74 + insets.bottom },
      ]}
    >
      {state.routes.map((route, i) => {
        const focused = state.index === i;
        const color = focused ? t.roles.tabActive : t.roles.tabInactive;
        const onPress = () => {
          const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
        };
        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={route.name}
            style={styles.tab}
          >
            <TabIcon name={route.name} color={color} />
            <Text style={{ color, fontSize: t.typography.size['2xs'], marginTop: 4 }}>{route.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', borderTopWidth: 1 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 10 },
});

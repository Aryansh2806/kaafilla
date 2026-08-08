import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '../../theme/ThemeProvider';

type Props = { uri?: string | null; name?: string; size?: number };

// Circular avatar; falls back to the initial on a neutral disc.
export function Avatar({ uri, name, size = 44 }: Props) {
  const t = useTheme();
  const radius = size / 2;
  if (uri) {
    return (
      <Image
        source={uri}
        style={{ width: size, height: size, borderRadius: radius, backgroundColor: t.colors.n800 }}
        contentFit="cover"
        transition={200}
        cachePolicy="memory-disk"
      />
    );
  }
  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: radius, backgroundColor: t.colors.n800 },
      ]}
    >
      <Text style={{ color: t.colors.n200, fontSize: size * 0.4, fontWeight: '600' }}>
        {(name || '?').trim().charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

// Overlapping avatar stack (waitlist "who's going").
export function AvatarStack({ names, size = 28 }: { names: string[]; size?: number }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {names.slice(0, 5).map((n, i) => (
        <View key={i} style={{ marginLeft: i === 0 ? 0 : -size * 0.35 }}>
          <Avatar name={n} size={size} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({ fallback: { alignItems: 'center', justifyContent: 'center' } });

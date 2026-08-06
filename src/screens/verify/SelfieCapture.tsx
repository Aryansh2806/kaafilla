import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme } from '../../theme/ThemeProvider';

export function SelfieCapture({ navigation, route }: any) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [perm, requestPerm] = useCameraPermissions();
  const gateFrom = route.params?.gateFrom;

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20 }}>
        <Text style={{ color: t.colors.text, fontSize: t.typography.size['3xl'], fontWeight: '500' }}>One selfie</Text>
        <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.md, marginTop: 8, lineHeight: t.typography.size.md * t.typography.lineHeight.relaxed }}>
          Matched against the photo on your Aadhaar. An older photo is fine — we only need your face to be recognisable.
        </Text>
      </View>

      <View style={styles.viewfinder}>
        {perm?.granted ? (
          <CameraView style={StyleSheet.absoluteFill} facing="front" />
        ) : (
          <Pressable onPress={requestPerm} style={styles.permView}>
            <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.md }}>{perm ? 'Tap to enable camera' : 'Camera'}</Text>
          </Pressable>
        )}
        <View style={[styles.ovalGuide, { borderColor: t.colors.accentL4 }]} pointerEvents="none" />
      </View>

      <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.body2, textAlign: 'center', marginTop: 12 }}>
        Good light · no sunglasses · face the camera
      </Text>

      <View style={{ alignItems: 'center', marginTop: 'auto', paddingBottom: insets.bottom + 20, gap: 16 }}>
        <Pressable
          onPress={() => navigation.navigate('Matching', { gateFrom })}
          accessibilityRole="button"
          accessibilityLabel="Take selfie"
          style={[styles.shutter, { borderColor: t.colors.accentL3 }]}
        >
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: t.colors.accentL3 }} />
        </Pressable>
        <Pressable onPress={() => navigation.goBack()} accessibilityRole="button">
          <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.body2 }}>Do this later</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewfinder: { marginTop: 24, marginHorizontal: 20, height: 380, borderRadius: 20, overflow: 'hidden', backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  permView: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  ovalGuide: { position: 'absolute', width: 200, height: 260, borderRadius: 130, borderWidth: 2, borderStyle: 'dashed' },
  shutter: { width: 76, height: 76, borderRadius: 38, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
});

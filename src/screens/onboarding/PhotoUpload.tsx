import { useState } from 'react';
import { View, Text, Pressable, Image, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Screen } from '../../components/layout/Screen';
import { Button } from '../../components/atoms/Button';
import { SignupTopBar } from '../../components/molecules/Header';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuthStore } from '../../store/authStore';

const SLOTS = [
  { label: '1 · Your face, clearly', hint: 'Tap to add and crop' },
  { label: '2 · On a trip', hint: 'On a trip' },
  { label: '3 · Anything', hint: 'Anything' },
];

export function PhotoUpload({ navigation }: any) {
  const t = useTheme();
  const [photos, setPhotos] = useState<(string | null)[]>([null, null, null]);
  const patchDraft = useAuthStore((s) => s.patchDraft);
  const count = photos.filter(Boolean).length;

  const pick = async (i: number) => {
    try {
      // Ask for gallery access first — a denied/undetermined permission is the
      // usual cause of a silent blank on tap.
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Photo access needed', 'Allow photo access to add your pictures.');
        return;
      }
      // allowsEditing opens a native crop; some devices/emulators have no crop
      // activity and would blank out — fall back to no-crop if it throws.
      let res: ImagePicker.ImagePickerResult;
      try {
        res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 5], quality: 0.8 });
      } catch {
        res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
      }
      if (!res.canceled && res.assets?.[0]?.uri) {
        const uri = res.assets[0].uri;
        setPhotos((p) => p.map((v, idx) => (idx === i ? uri : v)));
      }
    } catch (e: any) {
      Alert.alert('Could not open photos', e?.message ?? 'Please try again.');
    }
  };

  const cont = () => {
    patchDraft({ photos: photos.filter(Boolean) as string[] });
    navigation.navigate('ProfileBuild');
  };

  return (
    <Screen scroll>
      <SignupTopBar step={2} total={5} onBack={() => navigation.goBack()} />
      <Text style={{ color: t.colors.text, fontSize: t.typography.size['3xl'], fontWeight: '500', marginTop: t.spacing[6] }}>Three photos</Text>
      <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.md, marginTop: t.spacing[2], lineHeight: t.typography.size.md * t.typography.lineHeight.relaxed }}>
        Each one opens a crop tool first — check it looks right before it goes on your profile.
      </Text>
      <Text style={{ color: count === 3 ? t.colors.accent : t.colors.textMuted, fontSize: t.typography.size.body2, marginTop: t.spacing[3] }}>
        {count} of 3 · all required
      </Text>

      <View style={{ gap: t.spacing[3], marginTop: t.spacing[5] }}>
        {SLOTS.map((s, i) => (
          <Pressable
            key={i}
            onPress={() => pick(i)}
            accessibilityRole="button"
            accessibilityLabel={s.label}
            style={[styles.slot, { backgroundColor: t.colors.surface, borderRadius: t.radius.lg, borderColor: t.colors.n800, height: i === 0 ? 220 : 120 }]}
          >
            {photos[i] ? (
              <Image source={{ uri: photos[i]! }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : (
              <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.body2 }}>{s.hint}</Text>
            )}
            <View style={styles.slotLabel}>
              <Text style={{ color: t.colors.text, fontSize: t.typography.size.body2, fontWeight: '600' }}>{s.label}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: t.spacing[4] }}>
        No group shots as your first photo, no photos of only scenery.
      </Text>

      <View style={{ marginTop: t.spacing[6], paddingBottom: t.spacing[4] }}>
        <Button label="Continue" onPress={cont} disabled={count < 3} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  slot: { borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  slotLabel: { position: 'absolute', left: 12, bottom: 12 },
});

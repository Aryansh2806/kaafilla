import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { Header } from '../../components/molecules/Header';
import { Input, TextArea } from '../../components/atoms/Input';
import { Button } from '../../components/atoms/Button';
import { useAuthStore } from '../../store/authStore';
import { hasBackend } from '../../api/client';
import { saveProfile, getCurrentProfile } from '../../api/auth';

export function EditProfile({ navigation }: any) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const signIn = useAuthStore((s) => s.signIn);

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [city, setCity] = useState(user?.city ?? '');
  const [work, setWork] = useState(user?.work ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [instagram, setInstagram] = useState(user?.instagram ?? '');
  const [photos, setPhotos] = useState<(string | null)[]>([
    user?.photos?.[0] ?? null,
    user?.photos?.[1] ?? null,
    user?.photos?.[2] ?? null,
  ]);
  const [saving, setSaving] = useState(false);

  const pick = async (i: number) => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Photo access needed', 'Allow photo access to add your pictures.');
        return;
      }
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

  const save = async () => {
    const photoList = photos.filter(Boolean) as string[];
    const patch = { firstName, city, work, bio, instagram, photos: photoList };
    if (!hasBackend) {
      updateProfile(patch);
      navigation.goBack();
      return;
    }
    try {
      setSaving(true);
      await saveProfile(patch); // writes fields + uploads any new local photos to Storage
      const res = await getCurrentProfile();
      if (res) signIn(res.profile); // refresh local user with stored (public) photo URLs
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Could not save', e?.message ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20 }}><Header title="Edit profile" onBack={() => navigation.goBack()} /></View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        <Text style={{ color: t.colors.textFaint, fontSize: t.typography.size.kicker, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 12 }}>Photos</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
          {photos.map((uri, i) => (
            <Pressable
              key={i}
              onPress={() => pick(i)}
              accessibilityRole="button"
              accessibilityLabel={uri ? `Replace photo ${i + 1}` : `Add photo ${i + 1}`}
              style={[styles.slot, { backgroundColor: t.colors.surface, borderColor: t.colors.n800, borderRadius: t.radius.lg }]}
            >
              {uri ? (
                <Image source={uri} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
              ) : (
                <Text style={{ color: t.colors.textMuted, fontSize: 24 }}>＋</Text>
              )}
              {i === 0 && (
                <View style={[styles.mainTag, { backgroundColor: t.colors.accentD4 }]}>
                  <Text style={{ color: t.colors.accentL2, fontSize: t.typography.size['2xs'], fontWeight: '700' }}>MAIN</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
        <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: 8 }}>
          Tap a slot to add or replace. Your first photo is what other travellers see first.
        </Text>

        <View style={{ gap: 16, marginTop: 22 }}>
          <Input label="First name" value={firstName} onChangeText={setFirstName} />
          <Input label="Home city" value={city} onChangeText={setCity} />
          <Input label="What you do" value={work} onChangeText={setWork} />
          <TextArea label="Bio" value={bio} onChangeText={setBio} min={40} placeholder="Where you've been, what you're looking for, how you travel." />
          <Input label="Instagram handle" value={instagram} onChangeText={setInstagram} placeholder="@yourhandle" autoCapitalize="none" />
        </View>
        <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: 12 }}>
          Trips, languages, interests and room habits are edited from the sign-up preferences — everything here shows on your profile.
        </Text>
        <View style={{ marginTop: 20 }}>
          <Button label={saving ? 'Saving…' : 'Save'} onPress={save} disabled={!firstName.trim() || bio.length < 40 || saving} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { flex: 1, aspectRatio: 0.82, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  mainTag: { position: 'absolute', top: 6, left: 6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
});

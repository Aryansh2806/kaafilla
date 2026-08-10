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
import { saveProfile, getCurrentProfile, runGenderCheck } from '../../api/auth';
import type { Lead, Profile } from '../../types';

export function EditProfile({ navigation }: any) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const signIn = useAuthStore((s) => s.signIn);

  const underReview = user?.genderCheck === 'needs_review'; // let mistakes self-correct
  const genderLocked = !!user?.lead && !underReview; // locked once confirmed, editable while under review
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [city, setCity] = useState(user?.city ?? '');
  const [work, setWork] = useState(user?.work ?? '');
  const [gender, setGender] = useState<Lead | null>(user?.lead ?? null);
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
    const patch: Partial<Profile> = { firstName, city, work, bio, instagram, photos: photoList };
    if (!genderLocked && gender) patch.lead = gender; // first-time set only; locked thereafter
    if (!hasBackend) {
      updateProfile(patch);
      navigation.goBack();
      return;
    }
    try {
      setSaving(true);
      await saveProfile(patch); // writes fields + uploads any new local photos to Storage
      const res = await getCurrentProfile();
      if (res) {
        let profile = res.profile;
        // Soft photo/gender check when gender is set here — server-side Edge
        // Function (best-effort, non-blocking).
        if (patch.lead && profile.photos?.[0]) {
          const r = await runGenderCheck();
          if (r) profile = { ...profile, genderCheck: r.check, detectedGender: r.detected ?? undefined };
        }
        signIn(profile); // refresh local user with stored (public) photo URLs
      }
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

          {/* Gender: locked once set (immutable server-side), otherwise a one-time choice. */}
          <View>
            <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.sm, marginBottom: 8 }}>Gender</Text>
            {genderLocked ? (
              <View style={[styles.locked, { backgroundColor: t.colors.surface, borderColor: t.colors.n800, borderRadius: t.radius.md }]}>
                <Text style={{ color: t.colors.text, fontSize: t.typography.size.md, fontWeight: '600' }}>{user?.lead === 'women' ? 'Woman' : 'Man'}</Text>
                <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.body2 }}>🔒 Locked</Text>
              </View>
            ) : (
              <>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  {([['women', 'Woman'], ['men', 'Man']] as [Lead, string][]).map(([v, label]) => {
                    const on = gender === v;
                    return (
                      <Pressable
                        key={v}
                        onPress={() => setGender(v)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: on }}
                        style={{ flex: 1, minHeight: 50, borderRadius: t.radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? t.colors.accentL3 : t.colors.surface, borderWidth: 1, borderColor: on ? t.colors.accent : t.colors.n800 }}
                      >
                        <Text style={{ color: on ? t.colors.accentD4 : t.colors.text, fontSize: t.typography.size.md, fontWeight: '600' }}>{label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Text style={{ color: underReview ? t.colors.warning : t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: 8, lineHeight: t.typography.size.xs * t.typography.lineHeight.relaxed }}>
                  {underReview
                    ? '⚠️ Under review. Picked the wrong one by mistake? Change it and save — it re-checks against your photo. If your choice is right, appeal from your profile instead.'
                    : '🔒 You can set this once. After it saves it locks — changing it later needs a support review.'}
                </Text>
              </>
            )}
          </View>

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
  locked: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 50, paddingHorizontal: 15, borderWidth: 1 },
});

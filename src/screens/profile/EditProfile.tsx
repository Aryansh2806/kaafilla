import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { Header } from '../../components/molecules/Header';
import { Input, TextArea } from '../../components/atoms/Input';
import { Button } from '../../components/atoms/Button';
import { useAuthStore } from '../../store/authStore';

export function EditProfile({ navigation }: any) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [city, setCity] = useState(user?.city ?? '');
  const [work, setWork] = useState(user?.work ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [instagram, setInstagram] = useState(user?.instagram ?? '');

  const save = () => {
    updateProfile({ firstName, city, work, bio, instagram });
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20 }}><Header title="Edit profile" onBack={() => navigation.goBack()} /></View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        <View style={{ gap: 16, marginTop: 12 }}>
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
          <Button label="Save" onPress={save} disabled={!firstName.trim() || bio.length < 40} />
        </View>
      </ScrollView>
    </View>
  );
}

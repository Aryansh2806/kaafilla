import { useState } from 'react';
import { View, Text } from 'react-native';
import { Screen } from '../../components/layout/Screen';
import { Input, TextArea } from '../../components/atoms/Input';
import { Button } from '../../components/atoms/Button';
import { SignupTopBar } from '../../components/molecules/Header';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuthStore } from '../../store/authStore';

export function ProfileBuild({ navigation }: any) {
  const t = useTheme();
  const patchDraft = useAuthStore((s) => s.patchDraft);
  const [firstName, setFirstName] = useState('Aanya');
  const [age, setAge] = useState('24');
  const [city, setCity] = useState('Mumbai');
  const [work, setWork] = useState('Product designer');
  const [bio, setBio] = useState('');
  const [instagram, setInstagram] = useState('');

  const valid = firstName.trim() && age.trim() && city.trim() && bio.length >= 40;

  const cont = () => {
    patchDraft({ firstName, age, city, work, bio, instagram });
    navigation.navigate('TravelPrefs');
  };

  return (
    <Screen scroll>
      <SignupTopBar step={3} total={5} onBack={() => navigation.goBack()} />
      <Text style={{ color: t.colors.text, fontSize: t.typography.size['3xl'], fontWeight: '500', marginTop: t.spacing[6] }}>About you</Text>
      <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.md, marginTop: t.spacing[2] }}>
        Enough that someone can decide whether to share a room with you.
      </Text>

      <View style={{ gap: t.spacing[4], marginTop: t.spacing[5] }}>
        <Input label="First name" value={firstName} onChangeText={setFirstName} />
        <Input label="Age" value={age} onChangeText={setAge} keyboardType="number-pad" />
        <Input label="Home city" value={city} onChangeText={setCity} />
        <Input label="What you do" value={work} onChangeText={setWork} />
        <TextArea
          label="Bio — required"
          value={bio}
          onChangeText={setBio}
          min={40}
          placeholder="Where you've been, what you're looking for, how you travel."
        />
        <View>
          <Input label="Instagram handle — optional" value={instagram} onChangeText={setInstagram} placeholder="@yourhandle" autoCapitalize="none" />
          <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: t.spacing[2] }}>
            🔒 Leave it blank and nothing changes. If you fill it, it stays locked until you accept a connect.
          </Text>
        </View>
      </View>

      <View style={{ marginTop: t.spacing[6], paddingBottom: t.spacing[4] }}>
        <Button label="Continue" onPress={cont} disabled={!valid} />
      </View>
    </Screen>
  );
}

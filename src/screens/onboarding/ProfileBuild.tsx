import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Screen } from '../../components/layout/Screen';
import { Input, TextArea } from '../../components/atoms/Input';
import { Button } from '../../components/atoms/Button';
import { SignupTopBar } from '../../components/molecules/Header';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuthStore } from '../../store/authStore';
import type { Lead } from '../../types';

// Self-declared gender selector. It's locked once verified (server-enforced), so
// the copy sets that expectation here rather than after the fact.
function GenderPicker({ value, onChange }: { value: Lead | null; onChange: (g: Lead) => void }) {
  const t = useTheme();
  const opts: { v: Lead; label: string }[] = [
    { v: 'women', label: 'Woman' },
    { v: 'men', label: 'Man' },
  ];
  return (
    <View>
      <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.sm, marginBottom: t.spacing[2] }}>Gender — required</Text>
      <View style={{ flexDirection: 'row', gap: t.spacing[3] }}>
        {opts.map((o) => {
          const on = value === o.v;
          return (
            <Pressable
              key={o.v}
              onPress={() => onChange(o.v)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={{
                flex: 1,
                minHeight: 50,
                borderRadius: t.radius.md,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: on ? t.colors.accentL3 : t.colors.surface,
                borderWidth: 1,
                borderColor: on ? t.colors.accent : t.colors.n800,
              }}
            >
              <Text style={{ color: on ? t.colors.accentD4 : t.colors.text, fontSize: t.typography.size.md, fontWeight: '600' }}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: t.spacing[2], lineHeight: t.typography.size.xs * t.typography.lineHeight.relaxed }}>
        🔒 Locks after you verify. We check it against your photos to keep women-only spaces honest — if they don't line up it goes to a person for review, never an automatic rejection.
      </Text>
    </View>
  );
}

export function ProfileBuild({ navigation }: any) {
  const t = useTheme();
  const patchDraft = useAuthStore((s) => s.patchDraft);
  const [firstName, setFirstName] = useState('Aanya');
  const [age, setAge] = useState('24');
  const [city, setCity] = useState('Mumbai');
  const [work, setWork] = useState('Product designer');
  const [gender, setGender] = useState<Lead | null>(null);
  const [bio, setBio] = useState('');
  const [instagram, setInstagram] = useState('');

  const valid = firstName.trim() && age.trim() && city.trim() && !!gender && bio.length >= 40;

  const cont = () => {
    patchDraft({ firstName, age, city, work, gender: gender ?? undefined, bio, instagram });
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
        <GenderPicker value={gender} onChange={setGender} />
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

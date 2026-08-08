import { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { Screen } from '../../components/layout/Screen';
import { Chip } from '../../components/atoms/Chip';
import { Button } from '../../components/atoms/Button';
import { SignupTopBar } from '../../components/molecules/Header';
import { OtherAdder } from '../../components/molecules/OtherAdder';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuthStore } from '../../store/authStore';

const TRIPS = ['Mountains', 'Beaches', 'Treks', 'Road trips', 'Deserts', 'Backwaters', 'Cities', 'Wildlife', 'Spiritual', 'Festivals'];
const BEEN = ['Himachal', 'Ladakh', 'Uttarakhand', 'Kashmir', 'Sikkim', 'Northeast', 'Rajasthan', 'Goa', 'Kerala', 'Karnataka', 'Andamans', 'Gujarat'];
const LANGS = ['Hindi', 'English', 'Marathi', 'Bengali', 'Tamil', 'Telugu', 'Kannada', 'Punjabi', 'Gujarati', 'Malayalam', 'Assamese', 'Urdu'];
const HOBBIES = ['Singing', 'Dancing', 'Photography', 'Cooking', 'Guitar', 'Writing', 'Sketching', 'Reading', 'Football', 'Yoga', 'Gaming', 'Birding'];
const HABITS: { key: string; opts: string[] }[] = [
  { key: 'Smoking', opts: ['No', 'Occasionally', 'Yes'] },
  { key: 'Drinking', opts: ['No', 'Socially', 'Often'] },
  { key: 'Food', opts: ['Vegetarian', 'Non-veg', 'Vegan', 'Jain'] },
  { key: 'Body clock', opts: ['Early riser', 'Night owl'] },
  { key: 'On the road', opts: ['Plan everything', 'Wing it'] },
  { key: 'Where you sleep', opts: ['Hostel dorms', 'Homestays', 'Budget hotels', "Whatever's going"] },
];

function ChipGroup({ title, counter, options, selected, onToggle, otherPlaceholder, onAddOther }: {
  title: string; counter: string; options: string[]; selected: string[]; onToggle: (v: string) => void;
  otherPlaceholder?: string; onAddOther?: (v: string) => void;
}) {
  const t = useTheme();
  return (
    <View style={{ marginTop: t.spacing[6] }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: t.colors.text, fontSize: t.typography.size.lg, fontWeight: '600' }}>{title}</Text>
        <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs }}>{counter}</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing[2], marginTop: t.spacing[3] }}>
        {options.map((o) => (
          <Chip key={o} label={o} selected={selected.includes(o)} onPress={() => onToggle(o)} />
        ))}
        {onAddOther && <OtherAdder placeholder={otherPlaceholder ?? 'Your own answer'} onAdd={onAddOther} />}
      </View>
    </View>
  );
}

export function TravelPrefs({ navigation }: any) {
  const t = useTheme();
  const patchDraft = useAuthStore((s) => s.patchDraft);
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);

  const [trips, setTrips] = useState<string[]>([]);
  const [been, setBeen] = useState<string[]>([]);
  const [langs, setLangs] = useState<string[]>([]);
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [habits, setHabits] = useState<Record<string, string>>({});
  const [customs, setCustoms] = useState<Record<string, string[]>>({ trips: [], been: [], langs: [], hobbies: [] });

  const toggle = (list: string[], set: (v: string[]) => void) => (v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const addOther = (group: string, setSel: React.Dispatch<React.SetStateAction<string[]>>) => (v: string) => {
    setCustoms((c) => ({ ...c, [group]: [...(c[group] ?? []), v] }));
    setSel((prev) => (prev.includes(v) ? prev : [...prev, v]));
  };

  const answered = Object.keys(habits).length;
  const valid = trips.length >= 1 && hobbies.length >= 2 && langs.length >= 1 && answered === HABITS.length;

  const [creating, setCreating] = useState(false);
  const create = async () => {
    patchDraft({ trips, been, languages: langs, hobbies, habits });
    try {
      setCreating(true);
      await completeOnboarding(); // writes the profile to Supabase, then sets user → MainTabs
    } catch (e: any) {
      Alert.alert('Could not save profile', e?.message ?? 'Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Screen scroll>
      <SignupTopBar step={5} total={5} onBack={() => navigation.goBack()} />
      <Text style={{ color: t.colors.text, fontSize: t.typography.size['3xl'], fontWeight: '500', marginTop: t.spacing[6] }}>What you’re like</Text>
      <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.md, marginTop: t.spacing[2], lineHeight: t.typography.size.md * t.typography.lineHeight.relaxed }}>
        The things people actually want to know before saying yes to six days in a shared jeep.
      </Text>

      <ChipGroup title="Trips you’re drawn to" counter={trips.length ? `${trips.length} picked` : 'pick at least 1'} options={[...TRIPS, ...customs.trips]} selected={trips} onToggle={toggle(trips, setTrips)} otherPlaceholder="Type a trip type" onAddOther={addOther('trips', setTrips)} />
      <ChipGroup title="Where you’ve already been" counter={been.length ? `${been.length} so far` : 'optional'} options={[...BEEN, ...customs.been]} selected={been} onToggle={toggle(been, setBeen)} otherPlaceholder="Where else have you been?" onAddOther={addOther('been', setBeen)} />
      <ChipGroup title="Languages you speak" counter={langs.length ? `${langs.length} picked` : 'pick at least 1'} options={[...LANGS, ...customs.langs]} selected={langs} onToggle={toggle(langs, setLangs)} otherPlaceholder="Another language" onAddOther={addOther('langs', setLangs)} />
      <ChipGroup title="Things you’re into" counter={hobbies.length ? `${hobbies.length} picked` : 'pick at least 2'} options={[...HOBBIES, ...customs.hobbies]} selected={hobbies} onToggle={toggle(hobbies, setHobbies)} otherPlaceholder="Something you’re into" onAddOther={addOther('hobbies', setHobbies)} />

      <View style={{ marginTop: t.spacing[6] }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: t.colors.text, fontSize: t.typography.size.lg, fontWeight: '600' }}>Sharing a room with you</Text>
          <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs }}>{answered} of {HABITS.length} answered</Text>
        </View>
        {HABITS.map((g) => (
          <View key={g.key} style={{ marginTop: t.spacing[4] }}>
            <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.body2, marginBottom: t.spacing[2] }}>{g.key}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing[2] }}>
              {g.opts.map((o) => (
                <Chip key={o} label={o} selected={habits[g.key] === o} onPress={() => setHabits((h) => ({ ...h, [g.key]: o }))} />
              ))}
            </View>
          </View>
        ))}
      </View>

      <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: t.spacing[6] }}>
        All of this shows on your profile. You can change any of it later from the You tab.
      </Text>

      <View style={{ marginTop: t.spacing[4], paddingBottom: t.spacing[4] }}>
        <Button label={creating ? 'Creating…' : 'Create profile'} onPress={create} disabled={!valid || creating} />
      </View>
    </Screen>
  );
}

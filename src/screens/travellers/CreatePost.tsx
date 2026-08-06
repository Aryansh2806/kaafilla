import { useState } from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { Header } from '../../components/molecules/Header';
import { Input, TextArea } from '../../components/atoms/Input';
import { Button } from '../../components/atoms/Button';

export function CreatePost({ navigation }: any) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [where, setWhere] = useState('');
  const [when, setWhen] = useState('');
  const [line, setLine] = useState('');

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20 }}><Header onBack={() => navigation.goBack()} /></View>
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        <Text style={{ color: t.colors.text, fontSize: t.typography.size['3xl'], fontWeight: '500', marginTop: 8, lineHeight: t.typography.size['3xl'] * 1.1 }}>Where do you{'\n'}want to go?</Text>
        <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.md, marginTop: 8, lineHeight: t.typography.size.md * t.typography.lineHeight.relaxed }}>
          You don’t need a plan. Say the place and roughly when, and people going the same way will find you.
        </Text>

        <View style={{ gap: 16, marginTop: 24 }}>
          <Input label="Where" value={where} onChangeText={setWhere} placeholder="Spiti, or anywhere in the hills" />
          <Input label="When" value={when} onChangeText={setWhen} placeholder="Any weekend in October" />
          <TextArea label="One line about what you’re after" value={line} onChangeText={setLine} placeholder="Have a car, need two more to split fuel and drive shifts." />
        </View>

        <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: 16, lineHeight: t.typography.size.xs * t.typography.lineHeight.relaxed }}>
          Posts expire after 30 days so the board stays honest. Only verified travellers can see it or reply.
        </Text>

        <View style={{ marginTop: 'auto', paddingBottom: insets.bottom + 16 }}>
          <Button label="Post it" disabled={!where.trim() || !line.trim()} onPress={() => navigation.goBack()} />
        </View>
      </View>
    </View>
  );
}

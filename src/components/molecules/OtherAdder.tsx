import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

// Fuzzy "did you mean" corrections for common typos.
const CORRECTIONS: Record<string, string> = {
  mountians: 'Mountains', mountian: 'Mountains', treking: 'Trekking', trekking: 'Treks',
  beach: 'Beaches', desert: 'Deserts', roadtrip: 'Road trips', photgraphy: 'Photography',
};
const BLOCK = ['contact', 'whatsapp', 'telegram', 'snapchat', 'insta']; // no sneaking handles in

// Returns an error string (verbatim from the prototype) or null if valid.
function validate(raw: string): string | null {
  const v = raw.trim();
  if (/https?:|www\.|\.\w{2,}/i.test(v)) return 'Links aren’t allowed here.';
  if (/[0-9@]/.test(v)) return 'No numbers or handles — use the Instagram field.';
  if (BLOCK.some((b) => v.toLowerCase().includes(b))) return 'That won’t pass review. Try describing it differently.';
  if (!/^[a-zA-Z ]+$/.test(v)) return 'Letters and spaces only.';
  if (v.replace(/\s/g, '').length < 2) return 'Too short — type at least two letters.';
  if (v.length > 24) return 'Keep it under 24 characters.';
  return null;
}

export function OtherAdder({ placeholder, onAdd }: { placeholder: string; onAdd: (value: string) => void }) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const suggestion = CORRECTIONS[text.trim().toLowerCase()];

  const submit = (value: string) => {
    const e = validate(value);
    if (e) return setErr(e);
    onAdd(value.trim());
    setText('');
    setErr(null);
    setOpen(false);
  };

  if (!open) {
    return (
      <Pressable onPress={() => setOpen(true)} style={[styles.other, { borderColor: t.colors.n700, borderRadius: t.radius.md }]}>
        <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.body2 }}>+ Other</Text>
      </Pressable>
    );
  }

  return (
    <View style={{ width: '100%', marginTop: 8 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          value={text}
          onChangeText={(v) => { setText(v); setErr(null); }}
          placeholder={placeholder}
          placeholderTextColor={t.colors.textMuted}
          autoFocus
          style={{ flex: 1, color: t.colors.text, backgroundColor: t.colors.surface, borderRadius: t.radius.md, borderWidth: 1, borderColor: err ? t.colors.danger : t.colors.border, paddingHorizontal: 12, paddingVertical: 8, fontSize: t.typography.size.md }}
        />
        <Pressable onPress={() => submit(text)} style={{ paddingHorizontal: 14, justifyContent: 'center', backgroundColor: t.colors.accentL3, borderRadius: t.radius.md }}>
          <Text style={{ color: t.colors.accentD4, fontWeight: '600' }}>Add</Text>
        </Pressable>
        <Pressable onPress={() => { setOpen(false); setText(''); setErr(null); }} style={{ paddingHorizontal: 10, justifyContent: 'center' }}>
          <Text style={{ color: t.colors.textMuted }}>Cancel</Text>
        </Pressable>
      </View>
      {err && <Text style={{ color: t.colors.danger, fontSize: t.typography.size.xs, marginTop: 6 }}>{err}</Text>}
      {suggestion && !err && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
          <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.body2 }}>Did you mean <Text style={{ fontWeight: '700', color: t.colors.text }}>{suggestion}</Text>?</Text>
          <Pressable onPress={() => submit(suggestion)}><Text style={{ color: t.colors.accentL3, fontSize: t.typography.size.body2 }}>Yes, use it</Text></Pressable>
          <Pressable onPress={() => submit(text)}><Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.body2 }}>Keep “{text.trim()}”</Text></Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  other: { paddingVertical: 6, paddingHorizontal: 11, borderWidth: 1, borderStyle: 'dashed' },
});

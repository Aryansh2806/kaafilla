import { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../theme/ThemeProvider';
import { Header } from '../../components/molecules/Header';
import { Input, TextArea } from '../../components/atoms/Input';
import { Button } from '../../components/atoms/Button';
import { useAuthStore } from '../../store/authStore';
import { hasBackend } from '../../api/client';
import { createPlan } from '../../api/writes';

const MAX_PHOTOS = 5;

export function CreatePlan({ navigation }: any) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const verified = useAuthStore((s) => s.isVerified);
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [where, setWhere] = useState('');
  const [cost, setCost] = useState('');
  const [what, setWhat] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);

  const addPhotos = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Photo access needed', 'Allow photo access to add trip photos.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: MAX_PHOTOS - photos.length,
        quality: 0.8,
      });
      if (!res.canceled && res.assets?.length) {
        const uris = res.assets.map((a) => a.uri);
        setPhotos((p) => [...p, ...uris].slice(0, MAX_PHOTOS));
      }
    } catch (e: any) {
      Alert.alert('Could not open photos', e?.message ?? 'Please try again.');
    }
  };

  const removePhoto = (uri: string) => setPhotos((p) => p.filter((u) => u !== uri));

  const post = async () => {
    if (!verified) return navigation.navigate('VerifyGate', { gateFrom: 'host' });
    if (!hasBackend || !user) return navigation.goBack();
    try {
      setPosting(true);
      await createPlan({
        place: where.trim(),
        costEach: Number(cost.replace(/[^\d]/g, '')) || 0,
        note: what.trim(),
        hostName: user.firstName,
        hostId: user.id,
        lead: user.lead,
        photos,
      });
      await qc.invalidateQueries({ queryKey: ['plans'] });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Could not post plan', e?.message ?? 'Please try again.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20 }}><Header onBack={() => navigation.goBack()} /></View>
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        <Text style={{ color: t.colors.text, fontSize: t.typography.size['3xl'], fontWeight: '500', marginTop: 8, lineHeight: t.typography.size['3xl'] * 1.1 }}>Plan your own,{'\n'}find your kaafila</Text>
        <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.md, marginTop: 8, lineHeight: t.typography.size.md * t.typography.lineHeight.relaxed }}>
          Post where you’re going. Verified travellers ask to join, and you choose who comes.
        </Text>

        <View style={{ gap: 16, marginTop: 24 }}>
          <Input label="Where" value={where} onChangeText={setWhere} placeholder="Tirthan Valley, Himachal" />
          <Input label="Rough cost each" value={cost} onChangeText={setCost} keyboardType="number-pad" placeholder="₹14,000" />
          <TextArea label="What the trip is" value={what} onChangeText={setWhat} placeholder="A cabin by the river, no fixed plan beyond trout and a lot of nothing." />

          {/* Listing photos */}
          <View>
            <Text style={{ color: t.colors.textFaint, fontSize: t.typography.size.kicker, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: t.spacing[2] }}>
              Photos {photos.length ? `· ${photos.length}/${MAX_PHOTOS}` : '· optional'}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {photos.map((uri, i) => (
                <View key={uri} style={[styles.thumb, { borderColor: t.colors.n800, borderRadius: t.radius.md }]}>
                  <Image source={uri} style={StyleSheet.absoluteFill} contentFit="cover" />
                  {i === 0 && (
                    <View style={[styles.coverTag, { backgroundColor: t.colors.accentD4 }]}>
                      <Text style={{ color: t.colors.accentL2, fontSize: t.typography.size['2xs'], fontWeight: '700' }}>COVER</Text>
                    </View>
                  )}
                  <Pressable onPress={() => removePhoto(uri)} accessibilityRole="button" accessibilityLabel="Remove photo" style={styles.remove}>
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>×</Text>
                  </Pressable>
                </View>
              ))}
              {photos.length < MAX_PHOTOS && (
                <Pressable onPress={addPhotos} accessibilityRole="button" accessibilityLabel="Add photos"
                  style={[styles.addTile, { backgroundColor: t.colors.surface, borderColor: t.colors.n800, borderRadius: t.radius.md }]}>
                  <Text style={{ color: t.colors.textSub, fontSize: t.typography.size['2xl'] }}>+</Text>
                  <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs }}>Add</Text>
                </Pressable>
              )}
            </ScrollView>
            <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: 6 }}>
              The first photo is the cover. Skip this and we’ll use a placeholder for the region.
            </Text>
          </View>
        </View>

        <View style={{ backgroundColor: t.colors.sectionBg, borderRadius: t.radius.lg, padding: 14, marginTop: 16 }}>
          <Text style={{ color: t.colors.accentL1, fontSize: t.typography.size.md, fontWeight: '600' }}>₹49 to host · charged later</Text>
          <Text style={{ color: t.colors.accentL3, fontSize: t.typography.size.xs, marginTop: 4, lineHeight: t.typography.size.xs * t.typography.lineHeight.relaxed }}>
            Listing is free. The ₹49 is charged only when your first traveller joins — so an empty plan never costs you anything. It’s the only money Kaafilla takes from a traveller plan.
          </Text>
        </View>

        <View style={{ marginTop: 'auto', paddingBottom: insets.bottom + 16 }}>
          <Button label={posting ? 'Posting…' : 'Post this plan'} disabled={!where.trim() || !what.trim() || posting} onPress={post} />
          <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, marginTop: 8, textAlign: 'center' }}>
            Hosting needs Aadhaar verification. Your name and rating are shown to everyone who asks to join.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  thumb: { width: 88, height: 88, overflow: 'hidden', borderWidth: 1 },
  addTile: { width: 88, height: 88, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  coverTag: { position: 'absolute', left: 4, bottom: 4, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  remove: { position: 'absolute', top: 2, right: 2, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
});

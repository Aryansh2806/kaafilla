import { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { Header } from '../../components/molecules/Header';
import { Button } from '../../components/atoms/Button';
import { Input } from '../../components/atoms/Input';
import {
  meshSupported,
  getMeshState,
  requestMeshPermissions,
  startMesh,
  stopMesh,
  sendOverMesh,
  joinChannel,
  leaveChannel,
  addMeshMessageListener,
  addMeshStateListener,
  type MeshState,
  type MeshMessagePayload,
} from '../../mesh';

const TEST_CHAT = 'mesh-test';
const rid = () => Math.random().toString(36).slice(2, 10);

// Dev-only panel to exercise the BLE mesh transport across two phones: enable it
// on both, and a broadcast from one should appear on the other (peers > 0).
export function MeshDebug({ navigation }: any) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<MeshState>(getMeshState());
  const [on, setOn] = useState(false);
  const [text, setText] = useState('');
  const [secret, setSecret] = useState('');
  const [joined, setJoined] = useState(false);
  const [log, setLog] = useState<{ id: string; who: string; body: string }[]>([]);
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const msgSub = addMeshMessageListener((m: MeshMessagePayload) => {
      setLog((l) => [{ id: m.clientId || rid(), who: m.senderMeshId.slice(0, 6), body: m.body }, ...l].slice(0, 50));
    });
    const stSub = addMeshStateListener((s) => setState(s));
    // getState is a snapshot; poll while running so peers/advertising stay fresh.
    poll.current = setInterval(() => setState(getMeshState()), 1500);
    return () => {
      msgSub?.remove();
      stSub?.remove();
      if (poll.current) clearInterval(poll.current);
    };
  }, []);

  const enable = async () => {
    const ok = await requestMeshPermissions();
    if (!ok) {
      setLog((l) => [{ id: rid(), who: '—', body: 'Bluetooth permission denied' }, ...l]);
      return;
    }
    await startMesh();
    setOn(true);
    setState(getMeshState());
  };
  const disable = async () => {
    await stopMesh();
    setOn(false);
    setState(getMeshState());
  };
  const joinCh = async () => {
    const s = secret.trim();
    if (!s) return;
    await joinChannel(TEST_CHAT, s);
    setJoined(true);
  };
  const leaveCh = async () => {
    await leaveChannel(TEST_CHAT);
    setJoined(false);
  };
  const broadcast = async () => {
    const body = text.trim();
    if (!body) return;
    await sendOverMesh(TEST_CHAT, rid(), body); // native encrypts if a channel is joined
    setLog((l) => [{ id: rid(), who: joined ? 'me🔒' : 'me', body }, ...l].slice(0, 50));
    setText('');
  };

  const Stat = ({ k, v }: { k: string; v: string }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
      <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.body2 }}>{k}</Text>
      <Text style={{ color: t.colors.text, fontSize: t.typography.size.body2, fontWeight: '600' }}>{v}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20 }}><Header title="Bluetooth mesh (dev)" onBack={() => navigation.goBack()} /></View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: t.colors.surface, borderColor: t.colors.n800, borderRadius: t.radius.lg }]}>
          <Stat k="Native module" v={meshSupported() || getMeshState().supported ? 'present' : 'not in build'} />
          <Stat k="BLE supported" v={state.supported ? 'yes' : 'no'} />
          <Stat k="Advertising" v={state.advertising ? 'yes' : 'no'} />
          <Stat k="Scanning" v={state.scanning ? 'yes' : 'no'} />
          <Stat k="Mesh peers" v={String(state.peers)} />
        </View>

        <View style={{ marginTop: 16 }}>
          {on ? (
            <Button label="Stop mesh" variant="ghost" onPress={disable} />
          ) : (
            <Button label="Enable Bluetooth mesh" onPress={enable} />
          )}
        </View>

        <View style={{ marginTop: 16, gap: 10 }}>
          <Input label="Channel passphrase (optional)" value={secret} onChangeText={setSecret} placeholder="same word on both phones" autoCapitalize="none" />
          {joined ? (
            <Button label="Leave channel (broadcast in the clear)" variant="ghost" onPress={leaveCh} />
          ) : (
            <Button label="Join encrypted channel" variant="ghost" disabled={!secret.trim()} onPress={joinCh} />
          )}
          <Text style={{ color: joined ? t.colors.success : t.colors.textMuted, fontSize: t.typography.size.xs }}>
            {joined
              ? '🔒 Messages are encrypted — only phones with the same passphrase can read them.'
              : 'No channel joined — broadcasts are plaintext to every mesh peer.'}
          </Text>
        </View>

        <View style={{ marginTop: 16, gap: 10 }}>
          <Input label="Broadcast a test message" value={text} onChangeText={setText} placeholder="hello from this phone" />
          <Button label="Broadcast to mesh" disabled={!on || !text.trim()} onPress={broadcast} />
        </View>

        <Text style={{ color: t.colors.textFaint, fontSize: t.typography.size.kicker, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 24, marginBottom: 8 }}>Received</Text>
        {log.length === 0 ? (
          <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.body2 }}>Nothing yet. Enable mesh on both phones, then broadcast.</Text>
        ) : (
          log.map((m) => (
            <View key={m.id} style={[styles.row, { borderBottomColor: t.colors.n900 }]}>
              <Text style={{ color: t.colors.accentL3, fontSize: t.typography.size.xs, width: 54 }}>{m.who}</Text>
              <Text style={{ color: t.colors.text, fontSize: t.typography.size.md, flex: 1 }}>{m.body}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 14, borderWidth: 1, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderBottomWidth: 1 },
});

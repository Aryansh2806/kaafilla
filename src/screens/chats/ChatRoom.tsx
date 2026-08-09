import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, Linking, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../theme/ThemeProvider';
import { Header } from '../../components/molecules/Header';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { getMeshStatus, getMeshState, requestMeshPermissions, acquireMesh, releaseMesh, joinChannel, leaveChannel, sendOverMesh, addMeshMessageListener } from '../../mesh';
import { hasBackend, supabase } from '../../api/client';
import { getOrCreateSoloChat, getMessages, getOrCreateMeshSecret, sendMessage as apiSendMessage } from '../../api/social';

type Row = { id: string; fromMe: boolean; body: string; sender?: string; relayHops?: number };
// Locally-known messages (optimistic sends + mesh-received) keyed by clientId,
// merged with the Supabase thread and deduped so nothing shows twice.
type Extra = { clientId: string; fromMe: boolean; body: string; sender?: string; needsPersist: boolean };

const rid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export function ChatRoom({ navigation, route }: any) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { chatId: paramChatId = 'group', peerId, name = 'Chat', kind = 'group', handle, archived = false } = route.params ?? {};
  const myId = useAuthStore((s) => s.user?.id);
  const useBackend = hasBackend && kind === 'solo' && !!peerId;

  // Group / seed path.
  const storeMessages = useChatStore((s) => s.messages[paramChatId] ?? []);
  const storeSend = useChatStore((s) => s.sendMessage);

  // Backend 1:1 path: resolve (create if needed) the chat, then load its messages.
  const qc = useQueryClient();
  const { data: chatId } = useQuery({
    queryKey: ['solo-chat', peerId],
    queryFn: () => getOrCreateSoloChat(peerId),
    enabled: useBackend,
  });
  const { data: beMessages = [] } = useQuery({
    queryKey: ['messages', chatId],
    queryFn: () => getMessages(chatId as string),
    enabled: useBackend && !!chatId,
  });

  const [extra, setExtra] = useState<Extra[]>([]);
  const [meshPeers, setMeshPeers] = useState(0);

  // Realtime: new messages in this chat refresh the thread live.
  useEffect(() => {
    const client = supabase;
    if (!useBackend || !chatId || !client) return;
    const ch = client
      .channel(`messages-${chatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        () => {
          void qc.invalidateQueries({ queryKey: ['messages', chatId] });
        },
      )
      .subscribe();
    return () => {
      void client.removeChannel(ch);
    };
  }, [useBackend, chatId, qc]);

  // Mesh: while this 1:1 chat is open, run BLE, join its member-only channel, and
  // surface messages that arrive over the mesh. Cleans up on leave.
  useEffect(() => {
    if (!useBackend || !chatId) return;
    let alive = true;
    let joined = false;
    (async () => {
      const secret = await getOrCreateMeshSecret(chatId as string);
      if (!alive || !secret) return;
      await requestMeshPermissions();
      await joinChannel(chatId as string, secret);
      await acquireMesh();
      joined = true;
    })();
    const sub = addMeshMessageListener((m) => {
      if (m.chatId !== chatId) return;
      setExtra((prev) => (prev.some((e) => e.clientId === m.clientId) ? prev : [...prev, { clientId: m.clientId || rid(), fromMe: false, body: m.body, sender: name, needsPersist: false }]));
    });
    const poll = setInterval(() => {
      setMeshPeers(getMeshState().peers);
      // Best-effort reconnect flush: retry persisting anything that failed offline.
      setExtra((prev) => {
        prev.filter((e) => e.needsPersist).forEach((e) => {
          apiSendMessage(chatId as string, e.body, e.clientId)
            .then(() => {
              setExtra((cur) => cur.map((x) => (x.clientId === e.clientId ? { ...x, needsPersist: false } : x)));
              void qc.invalidateQueries({ queryKey: ['messages', chatId] });
            })
            .catch(() => {});
        });
        return prev;
      });
    }, 3000);
    return () => {
      alive = false;
      sub?.remove();
      clearInterval(poll);
      if (joined) void leaveChannel(chatId as string);
      void releaseMesh();
    };
  }, [useBackend, chatId, name, qc]);

  const [text, setText] = useState('');
  const groupMesh = kind === 'group' && !archived ? getMeshStatus() : null;
  const openInstagram = () => handle && Linking.openURL(`https://instagram.com/${handle.replace(/^@/, '')}`);

  // Merge Supabase thread + local (mesh/optimistic), deduped by clientId.
  const beClientIds = new Set(beMessages.map((m) => m.clientId).filter(Boolean) as string[]);
  const messages: Row[] = useBackend
    ? [
        ...beMessages.map((m) => ({ id: m.id, fromMe: m.senderId === myId, body: m.body, sender: m.senderId === myId ? undefined : name })),
        ...extra.filter((e) => !beClientIds.has(e.clientId)).map((e) => ({ id: e.clientId, fromMe: e.fromMe, body: e.body, sender: e.fromMe ? undefined : e.sender })),
      ]
    : storeMessages;

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    if (useBackend) {
      if (!chatId) {
        Alert.alert('Chat still opening', 'Give it a second to open, then send again.');
        return;
      }
      setText('');
      const clientId = rid();
      // Show it immediately + push over the mesh so nearby members get it offline.
      setExtra((prev) => [...prev, { clientId, fromMe: true, body, needsPersist: true }]);
      void sendOverMesh(chatId as string, clientId, body);
      try {
        await apiSendMessage(chatId as string, body, clientId);
        setExtra((prev) => prev.map((e) => (e.clientId === clientId ? { ...e, needsPersist: false } : e)));
        await qc.invalidateQueries({ queryKey: ['messages', chatId] });
      } catch {
        // Offline: the mesh copy is out; the poll retries persistence on reconnect.
      }
    } else {
      setText('');
      storeSend(paramChatId, body);
    }
  };

  const showMeshBanner = groupMesh ? !groupMesh.online : useBackend && meshPeers > 0;
  const meshLabel = groupMesh
    ? `● No network — messaging over Bluetooth mesh · ${groupMesh.hops} hops`
    : `● Bluetooth mesh active · ${meshPeers} nearby`;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ paddingTop: insets.top, paddingHorizontal: 20 }}>
        <Header title={name} onBack={() => navigation.goBack()} />
        {kind === 'solo' && handle && (
          <Pressable onPress={openInstagram} accessibilityRole="link" accessibilityLabel={`Open ${handle} in Instagram`}>
            <Text style={{ color: t.colors.accentL3, fontSize: t.typography.size.body2, marginBottom: 8 }}>{handle} · Open in Instagram ↗</Text>
          </Pressable>
        )}
        {showMeshBanner && (
          <View style={[styles.mesh, { backgroundColor: t.colors.accentD4, borderRadius: t.radius.md }]}>
            <Text style={{ color: t.colors.accentL2, fontSize: t.typography.size.xs }}>{meshLabel}</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12, gap: 10 }}>
        {messages.map((m) => (
          <View key={m.id} style={{ alignItems: m.fromMe ? 'flex-end' : 'flex-start' }}>
            {!m.fromMe && m.sender && <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size['2xs'], marginBottom: 2 }}>{m.sender}</Text>}
            <View style={{ maxWidth: '80%', backgroundColor: m.fromMe ? t.colors.accentL3 : t.colors.surface, borderRadius: 14, borderBottomRightRadius: m.fromMe ? 4 : 14, borderBottomLeftRadius: m.fromMe ? 14 : 4, paddingVertical: 8, paddingHorizontal: 12 }}>
              <Text style={{ color: m.fromMe ? t.colors.accentD4 : t.colors.text, fontSize: t.typography.size.md }}>{m.body}</Text>
            </View>
            {m.relayHops ? <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size['2xs'], marginTop: 2 }}>Relayed via {m.relayHops} devices</Text> : null}
          </View>
        ))}
      </ScrollView>

      {archived ? (
        <View style={[styles.composer, { borderTopColor: t.colors.n800, paddingBottom: insets.bottom + 8, flexDirection: 'column', alignItems: 'flex-start' }]}>
          <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs, lineHeight: t.typography.size.xs * t.typography.lineHeight.relaxed }}>
            Archived three days after the trip. You can still read it — message anyone you connected with directly.
          </Text>
        </View>
      ) : (
        <View style={[styles.composer, { borderTopColor: t.colors.n800, paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Write a message…"
            placeholderTextColor={t.colors.textMuted}
            style={{ flex: 1, color: t.colors.text, backgroundColor: t.colors.surface, borderRadius: t.radius.full, paddingHorizontal: 16, paddingVertical: 10, fontSize: t.typography.size.md }}
          />
          <Pressable onPress={send} accessibilityRole="button" accessibilityLabel="Send" style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.colors.accentL3, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: t.colors.accentD4, fontSize: 18 }}>↑</Text>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mesh: { paddingVertical: 8, paddingHorizontal: 12, marginBottom: 8 },
  composer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingTop: 8, borderTopWidth: 1 },
});

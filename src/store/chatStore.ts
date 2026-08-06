import { create } from 'zustand';

// Client-side connects + chat state. Supabase Realtime wiring lands with auth
// sessions; the prototype itself simulates this locally.
export type ConnectStatus = 'none' | 'sent' | 'accepted';

export interface ChatMessage {
  id: string;
  fromMe: boolean;
  sender?: string;
  body: string;
  relayHops?: number;
}
export interface IncomingRequest {
  id: string;
  name: string;
  city: string;
  note: string;
}

export type GroupState = 'locked' | 'live' | 'archived';

interface ChatState {
  connects: Record<string, ConnectStatus>;
  incoming: IncomingRequest[];
  messages: Record<string, ChatMessage[]>;
  groupState: GroupState;
  connectStatus: (personId: string) => ConnectStatus;
  sendConnect: (personId: string) => void;
  cancelConnect: (personId: string) => void;
  accept: (id: string) => void;
  decline: (id: string) => void;
  sendMessage: (chatId: string, body: string) => void;
  setGroupState: (s: GroupState) => void;
}

const seededMessages: Record<string, ChatMessage[]> = {
  group: [
    { id: 'g1', fromMe: false, sender: 'Meera', body: 'Anyone flying into Chandigarh on the 11th?' },
    { id: 'g2', fromMe: false, sender: 'Dev', body: 'Driving up from Delhi, happy to pick up on the way.' },
    { id: 'g3', fromMe: true, body: 'I land at 9am — a lift would be perfect.', relayHops: 2 },
  ],
  meera: [
    { id: 'm1', fromMe: false, sender: 'Meera', body: 'Waitlisted for Spiti too — still looking to split a homestay room?' },
    { id: 'm2', fromMe: true, body: 'Yes! Early nights, slow mornings — sounds like we’d get along.' },
  ],
};

export const useChatStore = create<ChatState>((set, get) => ({
  connects: {},
  incoming: [
    { id: 'nikita', name: 'Nikita', city: 'Pune · first solo trip', note: 'Also waitlisted for Sep 12. Would rather join a group that already has women in it — is your room share still open?' },
    { id: 'ritu', name: 'Ritu', city: 'Delhi · same batch', note: 'Same batch. Two weeks free and no plan beyond this.' },
  ],
  messages: seededMessages,
  groupState: 'live',
  connectStatus: (personId) => get().connects[personId] ?? 'none',
  setGroupState: (s) => set({ groupState: s }),
  sendConnect: (personId) => set((s) => ({ connects: { ...s.connects, [personId]: 'sent' } })),
  cancelConnect: (personId) => set((s) => ({ connects: { ...s.connects, [personId]: 'none' } })),
  accept: (id) =>
    set((s) => ({
      connects: { ...s.connects, [id]: 'accepted' },
      incoming: s.incoming.filter((r) => r.id !== id),
      messages: { ...s.messages, [id]: s.messages[id] ?? [] },
    })),
  decline: (id) => set((s) => ({ incoming: s.incoming.filter((r) => r.id !== id) })),
  sendMessage: (chatId, body) =>
    set((s) => ({
      messages: { ...s.messages, [chatId]: [...(s.messages[chatId] ?? []), { id: `${Date.now()}`, fromMe: true, body }] },
    })),
}));

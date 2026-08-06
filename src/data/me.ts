// Current-user mock data (waitlists, hosted plans, history, activity). Replaces
// with real queries once auth sessions exist.

export const MY_WAITLISTS = [
  { id: 'spiti', name: 'Spiti Valley Circuit', dates: 'Sep 12–17', pos: 13, need: 2, joined: 13, size: 15 },
];

export const MY_HOSTED = [
  { id: 'tirthan', name: 'Tirthan Valley cabin week', joined: 4, size: 6, asking: 2 },
];

export const MY_HISTORY = [
  { name: 'Hampta Pass Trek', when: 'Jun 2026 · Operator · Voyage Valley', amount: '₹11,900', settled: true },
  { name: 'Tirthan Valley cabin week', when: 'Apr 2026 · Traveller plan · Arjun', amount: '₹7,150', settled: true },
  { name: 'Kasol long weekend', when: 'Feb 2026 · Traveller plan · Ritu', amount: '₹5,400', settled: false },
];

export const ACTIVITY = [
  { id: 'a1', icon: '👋', text: 'Nikita asked to join your Tirthan Valley cabin week', when: '2h ago' },
  { id: 'a2', icon: '✓', text: 'Meera accepted your connect — the chat is open', when: 'Yesterday' },
  { id: 'a3', icon: '🎟', text: 'You moved to #13 in the Spiti Valley Circuit queue', when: '2 days ago' },
  { id: 'a4', icon: '💬', text: 'New messages in Spiti Sep 12–17', when: '3 days ago' },
  { id: 'a5', icon: '💰', text: 'A batch filled without you — ₹49 credited to your wallet', when: '1 week ago' },
];

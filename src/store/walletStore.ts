import { create } from 'zustand';

export interface LedgerEntry {
  id: string;
  amount: number; // +credit / -spend
  reason: string;
}

// Kaafilla wallet. Credited ₹49 when a batch fills without you; spent on priority.
interface WalletState {
  balance: number;
  ledger: LedgerEntry[];
  credit: (amount: number, reason?: string) => void;
  spend: (amount: number, reason?: string) => boolean;
}

let seq = 0;
const entry = (amount: number, reason: string): LedgerEntry => ({ id: `l${seq++}`, amount, reason });

export const useWalletStore = create<WalletState>((set, get) => ({
  balance: 0,
  ledger: [],
  credit: (amount, reason = 'Batch filled without you') =>
    set((s) => ({ balance: s.balance + amount, ledger: [entry(amount, reason), ...s.ledger] })),
  spend: (amount, reason = 'Priority placement') => {
    if (get().balance < amount) return false;
    set((s) => ({ balance: s.balance - amount, ledger: [entry(-amount, reason), ...s.ledger] }));
    return true;
  },
}));

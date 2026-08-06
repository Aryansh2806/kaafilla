import { Linking } from 'react-native';

// UPI settlement seam. Kaafilla never holds money — it builds a UPI intent link
// and records "mark paid → both confirm". Swap the opener for a real PSP later.

export interface UpiRequest {
  payeeVpa: string; // e.g. "arjun@upi"
  payeeName: string;
  amount: number;
  note?: string;
}

export function buildUpiUri({ payeeVpa, payeeName, amount, note }: UpiRequest): string {
  const q = new URLSearchParams({
    pa: payeeVpa,
    pn: payeeName,
    am: String(amount),
    cu: 'INR',
    ...(note ? { tn: note } : {}),
  });
  return `upi://pay?${q.toString()}`;
}

// Opens the user's UPI app. On simulator there's none, so this resolves false.
export async function payByUpi(req: UpiRequest): Promise<boolean> {
  const uri = buildUpiUri(req);
  try {
    const ok = await Linking.canOpenURL(uri);
    if (ok) await Linking.openURL(uri);
    return ok;
  } catch {
    return false;
  }
}

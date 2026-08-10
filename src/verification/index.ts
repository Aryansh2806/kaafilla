// Aadhaar KYC seam. Screens call these; the simulated impl reproduces the
// prototype's OTP → selfie → match flow. Swap for UIDAI/DigiLocker later.

export interface VerificationRecord {
  name: string;
  gender: string; // e.g. "FEMALE"
  age: number;
  faceMatch: 'Confident' | 'Likely' | 'Low';
}

export interface AadhaarKyc {
  sendOtp(aadhaar: string): Promise<void>;
  verifyOtp(code: string): Promise<void>;
  matchSelfie(photoUri: string): Promise<VerificationRecord>;
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ── photo gender signal (soft; flags mismatches for review, never hard-blocks) ──
// Calls the gender-detect microservice (services/gender-detect) if configured.
// Returns null when unconfigured, unreachable, or no face is found — all of which
// the caller treats as "unchecked", so onboarding is never blocked by it.
export type GenderDetection = { gender: 'women' | 'men'; label: string; confidence: number };

export async function detectGender(imageUrl: string): Promise<GenderDetection | null> {
  const base = process.env.EXPO_PUBLIC_GENDER_API_URL;
  if (!base || !imageUrl) return null;
  try {
    const res = await fetch(`${base.replace(/\/+$/, '')}/detect-gender`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.EXPO_PUBLIC_GENDER_API_KEY ? { 'X-Api-Key': process.env.EXPO_PUBLIC_GENDER_API_KEY } : {}),
      },
      body: JSON.stringify({ image_url: imageUrl }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || (data.gender !== 'women' && data.gender !== 'men')) return null; // no_face / error
    return { gender: data.gender, label: String(data.label ?? ''), confidence: Number(data.confidence ?? 0) };
  } catch {
    return null; // unreachable → non-blocking
  }
}

// Simulated: accepts any input, returns the prototype's record card.
export const kyc: AadhaarKyc = {
  async sendOtp() {
    await wait(600);
  },
  async verifyOtp() {
    await wait(600);
  },
  async matchSelfie() {
    await wait(2100); // matches the prototype "Matching your face" beat
    return { name: 'Aanya Sharma', gender: 'FEMALE', age: 24, faceMatch: 'Confident' };
  },
};

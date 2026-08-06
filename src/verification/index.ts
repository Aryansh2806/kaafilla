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

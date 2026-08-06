import { create } from 'zustand';
import type { Profile, VerificationStatus } from '../types';
import type { VerificationRecord } from '../verification';

// Session + onboarding state. Auth transport (Supabase phone OTP vs simulated)
// is wired in the OTP screen; this store holds the resulting user + draft.

export interface OnboardingDraft {
  phone?: string;
  firstName?: string;
  age?: string;
  city?: string;
  work?: string;
  bio?: string;
  instagram?: string;
  photos?: string[];
  trips?: string[];
  been?: string[];
  languages?: string[];
  hobbies?: string[];
  habits?: Record<string, string>;
}

interface AuthState {
  user: Profile | null;
  isVerified: boolean;
  verificationStatus: VerificationStatus;
  returning: boolean; // chosen on the phone screen; returning users skip profile build
  record: VerificationRecord | null;
  draft: OnboardingDraft;

  setReturning: (v: boolean) => void;
  patchDraft: (p: Partial<OnboardingDraft>) => void;
  signIn: (user: Profile) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  completeOnboarding: () => void; // promote draft → user
  setVerified: (record: VerificationRecord) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isVerified: false,
  verificationStatus: 'none',
  returning: false,
  record: null,
  draft: {},

  setReturning: (returning) => set({ returning }),
  patchDraft: (p) => set((s) => ({ draft: { ...s.draft, ...p } })),
  signIn: (user) => set({ user, isVerified: user.isVerified }),
  updateProfile: (patch) => set((s) => ({ user: s.user ? { ...s.user, ...patch } : s.user })),
  completeOnboarding: () => {
    const d = get().draft;
    set({
      user: {
        id: 'me',
        firstName: d.firstName ?? 'You',
        age: d.age ? Number(d.age) : undefined,
        city: d.city,
        work: d.work,
        bio: d.bio,
        instagram: d.instagram,
        photos: d.photos,
        isVerified: false,
        verificationStatus: 'none',
      },
    });
  },
  setVerified: (record) =>
    set({ isVerified: true, verificationStatus: 'verified', record }),
  signOut: () =>
    set({ user: null, isVerified: false, verificationStatus: 'none', returning: false, record: null, draft: {} }),
}));

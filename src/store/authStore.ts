import { create } from 'zustand';
import type { Profile, VerificationStatus } from '../types';
import type { VerificationRecord } from '../verification';
import { hasBackend } from '../api/client';
import { getCurrentProfile, saveProfile, signOutSupabase, markVerified } from '../api/auth';
import { removePushToken } from '../notifications/push';

// Session + onboarding state. With a backend configured, the real Supabase
// session drives this (bootstrap on launch, DB writes on onboarding). Without
// one, it falls back to a local in-memory user so the app still runs on seed.

export interface OnboardingDraft {
  email?: string;
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
  booting: boolean; // true until the persisted session is checked on launch

  bootstrap: () => Promise<void>;
  setReturning: (v: boolean) => void;
  patchDraft: (p: Partial<OnboardingDraft>) => void;
  signIn: (user: Profile) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  completeOnboarding: () => Promise<void>; // draft → DB profile (or local in seed mode)
  setVerified: (record: VerificationRecord) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isVerified: false,
  verificationStatus: 'none',
  returning: false,
  record: null,
  draft: {},
  booting: true,

  // On launch: if a Supabase session with a completed profile exists, restore it
  // and skip onboarding. Otherwise land on the onboarding stack.
  bootstrap: async () => {
    if (!hasBackend) {
      set({ booting: false });
      return;
    }
    try {
      const res = await getCurrentProfile();
      if (res && res.complete) {
        set({
          user: res.profile,
          isVerified: res.profile.isVerified,
          verificationStatus: res.profile.verificationStatus,
        });
      }
    } catch {
      // No/invalid session → stay on onboarding.
    } finally {
      set({ booting: false });
    }
  },

  setReturning: (returning) => set({ returning }),
  patchDraft: (p) => set((s) => ({ draft: { ...s.draft, ...p } })),
  signIn: (user) => set({ user, isVerified: user.isVerified }),
  updateProfile: (patch) => set((s) => ({ user: s.user ? { ...s.user, ...patch } : s.user })),

  completeOnboarding: async () => {
    const d = get().draft;
    const patch: Partial<Profile> = {
      firstName: d.firstName ?? 'You',
      age: d.age ? Number(d.age) : undefined,
      city: d.city,
      work: d.work,
      bio: d.bio,
      instagram: d.instagram,
      photos: d.photos,
    };

    if (hasBackend) {
      // The signup trigger already created the row; fill it in and read it back.
      await saveProfile(patch);
      const res = await getCurrentProfile();
      if (res) {
        set({
          user: res.profile,
          isVerified: res.profile.isVerified,
          verificationStatus: res.profile.verificationStatus,
        });
      }
    } else {
      set({
        user: {
          id: 'me',
          firstName: patch.firstName!,
          age: patch.age,
          city: patch.city,
          work: patch.work,
          bio: patch.bio,
          instagram: patch.instagram,
          photos: patch.photos,
          isVerified: false,
          verificationStatus: 'none',
        },
      });
    }
  },

  setVerified: (record) => {
    set((s) => ({
      isVerified: true,
      verificationStatus: 'verified',
      record,
      user: s.user ? { ...s.user, isVerified: true, verificationStatus: 'verified' } : s.user,
    }));
    // Persist the flag so RLS-gated tables unlock (fire-and-forget).
    if (hasBackend) void markVerified();
  },

  signOut: async () => {
    if (hasBackend) {
      await removePushToken(); // stop this device receiving the signed-out user's pushes
      await signOutSupabase();
    }
    set({
      user: null,
      isVerified: false,
      verificationStatus: 'none',
      returning: false,
      record: null,
      draft: {},
    });
  },
}));

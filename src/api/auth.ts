import { supabase } from './client';
import type { Profile } from '../types';

// Email OTP (6-digit code) auth over Supabase. The app's existing OTP keypad
// screen enters the code, so no magic-link deep-linking is needed on native.
// Same Supabase email auth under the hood — just the code form instead of a link.

export async function sendEmailCode(email: string): Promise<void> {
  if (!supabase) throw new Error('Backend not configured');
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { shouldCreateUser: true },
  });
  if (error) throw error;
}

export async function verifyEmailCode(email: string, token: string): Promise<void> {
  if (!supabase) throw new Error('Backend not configured');
  const { error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: token.trim(),
    type: 'email',
  });
  if (error) throw error;
}

// Email + password, no email delivery required (set Supabase "Confirm email" OFF).
// One entry point for both new and returning users: try to sign in; if the
// account doesn't exist yet, create it. Either way a session is established.
export async function signInOrSignUp(email: string, password: string): Promise<void> {
  if (!supabase) throw new Error('Backend not configured');
  const addr = email.trim().toLowerCase();
  const { error } = await supabase.auth.signInWithPassword({ email: addr, password });
  if (!error) return;
  if (/invalid login credentials/i.test(error.message)) {
    // No such account → create it (auto-confirmed when "Confirm email" is off).
    const { data, error: signUpError } = await supabase.auth.signUp({ email: addr, password });
    if (signUpError) throw signUpError;
    if (!data.session) {
      throw new Error(
        'Account created but not signed in — turn off "Confirm email" in Supabase (Authentication → Providers → Email).',
      );
    }
    return;
  }
  throw error;
}

export async function signOutSupabase(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

// Flip the profile's verification flag (simulated KYC for now). RLS-gated tables
// check profiles.is_verified via is_verified(me()); real KYC will move this
// server-side behind an Edge Function so users can't self-verify.
export async function markVerified(): Promise<void> {
  if (!supabase) return;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return;
  const { error } = await supabase
    .from('profiles')
    .update({ is_verified: true, verification_status: 'verified' })
    .eq('id', session.user.id);
  if (error) throw error;
}

interface ProfileRow {
  id: string;
  first_name: string | null;
  age: number | null;
  city: string | null;
  work: string | null;
  bio: string | null;
  instagram: string | null;
  lead: 'women' | 'men' | null;
  is_verified: boolean;
  verification_status: 'none' | 'pending' | 'verified';
}

function rowToProfile(row: ProfileRow, photos: string[]): Profile {
  return {
    id: row.id,
    firstName: row.first_name ?? '',
    age: row.age ?? undefined,
    city: row.city ?? undefined,
    work: row.work ?? undefined,
    bio: row.bio ?? undefined,
    instagram: row.instagram ?? undefined,
    photos: photos.length ? photos : undefined,
    lead: row.lead ?? undefined,
    isVerified: row.is_verified,
    verificationStatus: row.verification_status,
  };
}

// The signed-in user's profile, or null if there is no session. `complete` is
// false until onboarding has written a first name into the auto-created row.
export async function getCurrentProfile(): Promise<{ profile: Profile; complete: boolean } | null> {
  if (!supabase) return null;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;
  const uid = session.user.id;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).single();
  if (error) throw error;
  const row = data as ProfileRow;
  const { data: photoRows } = await supabase
    .from('photos')
    .select('url')
    .eq('profile_id', uid)
    .order('slot');
  const photos = (photoRows ?? []).map((p: { url: string }) => p.url);
  return { profile: rowToProfile(row, photos), complete: Boolean(row.first_name) };
}

// Onboarding write: persist the draft into the profiles row (+ photos, slots 1–3).
// Only provided fields are touched; the row already exists via the signup trigger.
export async function saveProfile(patch: Partial<Profile>): Promise<void> {
  if (!supabase) throw new Error('Backend not configured');
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not signed in');
  const uid = session.user.id;

  const row: Record<string, unknown> = {};
  if (patch.firstName !== undefined) row.first_name = patch.firstName;
  if (patch.age !== undefined) row.age = patch.age;
  if (patch.city !== undefined) row.city = patch.city;
  if (patch.work !== undefined) row.work = patch.work;
  if (patch.bio !== undefined) row.bio = patch.bio;
  if (patch.instagram !== undefined) row.instagram = patch.instagram;
  if (patch.lead !== undefined) row.lead = patch.lead;
  if (Object.keys(row).length) {
    const { error } = await supabase.from('profiles').update(row).eq('id', uid);
    if (error) throw error;
  }

  if (patch.photos) {
    await supabase.from('photos').delete().eq('profile_id', uid);
    const rows = patch.photos.slice(0, 3).map((url, i) => ({ profile_id: uid, url, slot: i + 1 }));
    if (rows.length) {
      const { error } = await supabase.from('photos').insert(rows);
      if (error) throw error;
    }
  }
}

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Supabase is used when configured via env; otherwise the app runs on the local
// seed (same data that seeds Postgres) so screens are backend-shaped either way.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const hasBackend = Boolean(url && anonKey);

// Real email-OTP auth: persist the session in AsyncStorage (already linked into
// the dev build) so returning users skip onboarding, and auto-refresh the token.
// detectSessionInUrl stays off — this is native, not web.
export const supabase: SupabaseClient | null = hasBackend
  ? createClient(url!, anonKey!, {
      auth: {
        storage: AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;

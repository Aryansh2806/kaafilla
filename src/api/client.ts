import 'react-native-url-polyfill/auto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Supabase is used when configured via env; otherwise the app runs on the local
// seed (same data that seeds Postgres) so screens are backend-shaped either way.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const hasBackend = Boolean(url && anonKey);

// No AsyncStorage here: auth is simulated for now and catalog reads use the anon
// key, so we don't persist a session. When real phone-OTP auth is wired, add
// AsyncStorage as `auth.storage` and rebuild the dev client to link the module.
export const supabase: SupabaseClient | null = hasBackend
  ? createClient(url!, anonKey!, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
  : null;

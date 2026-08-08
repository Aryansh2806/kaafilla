import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase, hasBackend } from '../api/client';
import type { PushData } from './navigation';

// expo-notifications / expo-device are NATIVE modules that aren't in the binary
// until the app is rebuilt. A top-level `import` of them evaluates the native
// lookup eagerly and crashes the current build ("Cannot find native module
// ExpoDevice"). So we lazy-require them behind a guard: until the rebuild lands,
// every entry point here simply no-ops. This is the "inert, never crashes" path.
let Notif: any;
let Device: any;
let loadState: 'unloaded' | 'ok' | 'absent' = 'unloaded';

// Probe for the native modules WITHOUT importing expo-notifications: requiring
// it when the native side is missing makes Metro surface a red dev-error box
// every launch. requireOptionalNativeModule returns null instead of throwing, so
// we can detect the pre-rebuild state cleanly and stay fully silent.
function nativePresent(): boolean {
  try {
    const { requireOptionalNativeModule } = require('expo-modules-core');
    return (
      !!requireOptionalNativeModule('ExpoPushTokenManager') &&
      !!requireOptionalNativeModule('ExpoDevice')
    );
  } catch {
    return false;
  }
}

function load(): boolean {
  if (loadState !== 'unloaded') return loadState === 'ok';
  if (!nativePresent()) {
    console.warn('[push] native module not in build yet — push inert until rebuild');
    loadState = 'absent';
    return false;
  }
  try {
    Notif = require('expo-notifications');
    Device = require('expo-device');
    // Foreground behaviour: show the banner + sound even when the app is open.
    Notif.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    loadState = 'ok';
  } catch (e) {
    console.warn('[push] native module not in build yet — push inert until rebuild:', e);
    loadState = 'absent';
  }
  return loadState === 'ok';
}

// Android requires an explicit channel or notifications are dropped silently.
async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notif.setNotificationChannelAsync('default', {
    name: 'Connects & messages',
    importance: Notif.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#9184d9',
  });
}

// The EAS project id is required to mint an Expo push token. It's absent until
// FCM/EAS is set up, so registration returns null (feature stays inert).
function projectId(): string | undefined {
  const c: any = Constants;
  return c?.expoConfig?.extra?.eas?.projectId ?? c?.easConfig?.projectId ?? undefined;
}

// Ask permission and mint the device's Expo push token. Returns null on any
// missing piece (native module absent, simulator, denied permission, no
// projectId) — all expected states, none fatal.
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!load()) return null;
  try {
    if (!Device.isDevice) return null; // no push on simulators/emulators
    await ensureAndroidChannel();

    let status = (await Notif.getPermissionsAsync()).status;
    if (status !== 'granted') status = (await Notif.requestPermissionsAsync()).status;
    if (status !== 'granted') return null;

    const pid = projectId();
    if (!pid) {
      console.warn('[push] no EAS projectId yet — token skipped (set it up to enable remote push)');
      return null;
    }
    const { data } = await Notif.getExpoPushTokenAsync({ projectId: pid });
    return data;
  } catch (e) {
    console.warn('[push] registration skipped:', e);
    return null;
  }
}

// Persist the token so the server can target this device. Unique on token.
export async function savePushToken(token: string): Promise<void> {
  if (!hasBackend || !supabase) return;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return;
  const { error } = await supabase
    .from('device_push_tokens')
    .upsert({ profile_id: session.user.id, token, platform: Platform.OS }, { onConflict: 'token' });
  if (error) console.warn('[push] token save failed:', error.message);
}

// Best-effort removal on sign-out so a shared device stops receiving pushes.
export async function removePushToken(): Promise<void> {
  if (!hasBackend || !supabase || !load()) return;
  try {
    const pid = projectId();
    if (!pid) return;
    const { data } = await Notif.getExpoPushTokenAsync({ projectId: pid });
    if (data) await supabase.from('device_push_tokens').delete().eq('token', data);
  } catch {
    // token unavailable → nothing to remove
  }
}

// Subscribe to notification taps. Returns an unsubscribe fn (no-op if inert).
export function addPushResponseListener(cb: (data: PushData) => void): () => void {
  if (!load()) return () => {};
  try {
    const sub = Notif.addNotificationResponseReceivedListener((res: any) =>
      cb(res?.notification?.request?.content?.data as PushData),
    );
    return () => sub.remove();
  } catch {
    return () => {};
  }
}

// The tap that cold-started the app (killed → opened via a notification), if any.
export async function getInitialPushData(): Promise<PushData | null> {
  if (!load()) return null;
  try {
    const res = await Notif.getLastNotificationResponseAsync();
    return res ? (res.notification.request.content.data as PushData) : null;
  } catch {
    return null;
  }
}

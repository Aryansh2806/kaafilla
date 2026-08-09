import { Platform, PermissionsAndroid } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';
import type { EventSubscription } from 'expo-modules-core';
import type { MeshState, MeshMessagePayload } from '../../modules/kaafilla-mesh/src/KaafillaMesh.types';

// App-facing Bluetooth-mesh seam. Binds to the `kaafilla-mesh` native module when
// it's in the build, and stays inert otherwise — requireOptionalNativeModule
// returns null instead of throwing, so a JS-only build (pre native rebuild) keeps
// working (mesh simply reports "unsupported"), exactly like the push seam.
const Native = requireOptionalNativeModule('KaafillaMesh') as any | null;

export type { MeshState, MeshMessagePayload } from '../../modules/kaafilla-mesh/src/KaafillaMesh.types';

export function meshSupported(): boolean {
  return !!Native && (Native.getState()?.supported ?? false);
}

export function getMeshState(): MeshState {
  if (!Native) return { supported: false, advertising: false, scanning: false, peers: 0 };
  try {
    return Native.getState();
  } catch {
    return { supported: false, advertising: false, scanning: false, peers: 0 };
  }
}

// Backwards-compatible status for the ChatRoom banner ("messaging over Bluetooth
// mesh · N hops"). `hops` maps to reachable peers until real hop counts land.
export interface MeshStatus {
  online: boolean; // reachable over the internet path (Supabase); false = mesh-only
  hops: number;
}
export function getMeshStatus(): MeshStatus {
  const s = getMeshState();
  return { online: false, hops: s.peers };
}

// Runtime BLE permissions. Android 12+ needs SCAN/ADVERTISE/CONNECT; ≤11 needs
// fine location to scan. Call this before startMesh().
export async function requestMeshPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  const api = typeof Platform.Version === 'number' ? Platform.Version : parseInt(String(Platform.Version), 10);
  const perms =
    api >= 31
      ? [
          'android.permission.BLUETOOTH_SCAN',
          'android.permission.BLUETOOTH_ADVERTISE',
          'android.permission.BLUETOOTH_CONNECT',
        ]
      : ['android.permission.ACCESS_FINE_LOCATION'];
  try {
    const res = (await PermissionsAndroid.requestMultiple(perms as any)) as Record<string, string>;
    return perms.every((p) => res[p] === PermissionsAndroid.RESULTS.GRANTED);
  } catch {
    return false;
  }
}

// ── real transport API (no-ops until the native module ships in a rebuild) ──
export async function initIdentity(): Promise<string | null> {
  if (!Native) return null;
  try {
    return await Native.initIdentity();
  } catch {
    return null;
  }
}
export async function startMesh(): Promise<void> {
  if (Native) try { await Native.start(); } catch { /* inert */ }
}
export async function stopMesh(): Promise<void> {
  if (Native) try { await Native.stop(); } catch { /* inert */ }
}

// Ref-counted lifecycle so BLE runs only while ≥1 screen needs it (e.g. an open
// ChatRoom): start on the first acquire, stop on the last release.
let meshRefs = 0;
export async function acquireMesh(): Promise<void> {
  meshRefs += 1;
  if (meshRefs === 1) await startMesh();
}
export async function releaseMesh(): Promise<void> {
  meshRefs = Math.max(0, meshRefs - 1);
  if (meshRefs === 0) await stopMesh();
}
// `secret` is a member-only shared string (a per-chat key in real use, a passphrase
// for the dev test); the channel key is SHA-256(secret). Only members can decrypt.
export async function joinChannel(chatId: string, secret: string): Promise<void> {
  if (Native) try { await Native.joinChannel(chatId, secret); } catch { /* inert */ }
}
export async function leaveChannel(chatId: string): Promise<void> {
  if (Native) try { await Native.leaveChannel(chatId); } catch { /* inert */ }
}
export async function sendOverMesh(chatId: string, clientId: string, body: string): Promise<void> {
  if (Native) try { await Native.sendMessage(chatId, clientId, body); } catch { /* inert */ }
}

export function addMeshMessageListener(cb: (m: MeshMessagePayload) => void): EventSubscription | null {
  if (!Native) return null;
  try {
    return Native.addListener('onMessage', cb);
  } catch {
    return null;
  }
}
export function addMeshStateListener(cb: (s: MeshState) => void): EventSubscription | null {
  if (!Native) return null;
  try {
    return Native.addListener('onState', cb);
  } catch {
    return null;
  }
}

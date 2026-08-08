import { NativeModule, requireNativeModule } from 'expo';

import { KaafillaMeshModuleEvents, MeshState } from './KaafillaMesh.types';

declare class KaafillaMeshModule extends NativeModule<KaafillaMeshModuleEvents> {
  // Generate (once) / return this device's Curve25519 static public key, base64.
  // Bound to the Kaafilla profile so peers can be recognised as chat members.
  initIdentity(): Promise<string>;
  start(): Promise<void>;
  stop(): Promise<void>;
  getState(): MeshState;
  // Join a chat's mesh channel with a member-only symmetric key (base64).
  joinChannel(chatId: string, keyBase64: string): Promise<void>;
  leaveChannel(chatId: string): Promise<void>;
  sendMessage(chatId: string, clientId: string, body: string): Promise<void>;
}

export default requireNativeModule<KaafillaMeshModule>('KaafillaMesh');

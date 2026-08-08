// Types for the Kaafilla Bluetooth-mesh transport.

// Live transport state. `supported` is false on a build without the native
// module (pre-rebuild) or a device without BLE — callers fall back then.
export type MeshState = {
  supported: boolean;
  advertising: boolean; // acting as a BLE peripheral (relays for others)
  scanning: boolean; // acting as a BLE central (finds peers)
  peers: number; // mesh peers reachable right now
};

// A message received off the mesh and already decrypted for a channel we're in.
export type MeshMessagePayload = {
  chatId: string; // Kaafilla chat this belongs to
  clientId: string; // stable id for cross-transport (mesh ↔ Supabase) dedup
  senderMeshId: string; // 8-byte mesh peer id (hex)
  body: string;
  sentAt: number; // sender clock, epoch ms
};

export type KaafillaMeshModuleEvents = {
  onMessage: (payload: MeshMessagePayload) => void;
  onState: (state: MeshState) => void;
};

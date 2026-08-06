// Bluetooth-mesh seam for offline group chat. The simulated impl reports an
// offline state + relay hop count so the ChatRoom banner renders. Swap for a
// real react-native-ble mesh transport later.

export interface MeshStatus {
  online: boolean;
  hops: number; // relay hops when offline
}

// Simulated: pretend we're offline in a group with 3 hops (matches the prototype).
export function getMeshStatus(): MeshStatus {
  return { online: false, hops: 3 };
}

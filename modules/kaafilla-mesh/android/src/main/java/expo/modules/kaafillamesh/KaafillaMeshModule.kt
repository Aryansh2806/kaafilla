package expo.modules.kaafillamesh

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Kaafilla Bluetooth-mesh transport (Android).
//
// PHASE 1 (this file): the JS↔native bridge only. Every function is a safe stub
// so the app can bind to a real native module and report an inert state; getState
// returns supported=false until the BLE stack lands. This is a clean-room design
// inspired by the bitchat protocol (public-domain whitepaper) — no GPL code.
//
// PHASE 2 (next): each device runs as BLE central + peripheral, relays packets
// with a TTL, dedupes, fragments to the MTU, and runs Noise for E2E. See
// MESH_PLAN.md. The function signatures below are the contract we build to.
class KaafillaMeshModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("KaafillaMesh")

    Events("onMessage", "onState")

    // Identity: generate/return this device's Curve25519 static public key (base64).
    // TODO(phase2): persist the keypair in the Android Keystore.
    AsyncFunction("initIdentity") {
      ""
    }

    // TODO(phase2): start BLE advertising (peripheral/GATT server) + scanning
    // (central) + the relay loop, behind a foreground service.
    AsyncFunction("start") {
    }

    AsyncFunction("stop") {
    }

    // Sync snapshot of transport state for the ChatRoom banner.
    Function("getState") {
      mapOf(
        "supported" to false,
        "advertising" to false,
        "scanning" to false,
        "peers" to 0,
      )
    }

    // Membership-scoped channels: only members hold `keyBase64`, so a device only
    // decrypts/surfaces messages for chats it belongs to (it still relays others'
    // opaque ciphertext, as a mesh must).
    AsyncFunction("joinChannel") { _: String, _: String ->
    }

    AsyncFunction("leaveChannel") { _: String ->
    }

    // TODO(phase2): encode → encrypt (channel key or Noise) → enqueue for relay,
    // and dedupe by clientId across mesh/Supabase.
    AsyncFunction("sendMessage") { _: String, _: String, _: String ->
    }
  }
}

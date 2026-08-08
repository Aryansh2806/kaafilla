# Bluetooth mesh chat — engineering plan

Clean-room BLE mesh transport for Kaafilla chats, **inspired by the bitchat
protocol** (public-domain whitepaper) but our own code — **no GPL** (the
bitchat-android repo is GPL-3.0; we do not copy it). **Android-first.**

Goal: when travellers on the same trip (a group chat) or two connected users (a
1:1 chat) are offline but in Bluetooth range, messages flow **peer-to-peer over a
BLE mesh**, scoped to that chat's members only — not to everyone nearby.

## How scoping works (the key difference from bitchat)

bitchat broadcasts to everyone in range. We add a Kaafilla layer:

1. **Identity binding** — each device generates a Curve25519 static keypair
   (`initIdentity`) and registers the public key on its profile
   (`profiles.mesh_pubkey`). A BLE peer's key → a known Kaafilla user.
2. **Membership-gated crypto** — a group chat has a per-chat symmetric key held
   only by its members (distributed via Supabase; see backend). 1:1 uses a Noise
   session between the two members' static keys. The mesh still **relays everyone's
   opaque ciphertext** (that's how a mesh works), but a device only **decrypts /
   surfaces** messages for chats it's a member of.
3. **Transport selection** — online → Supabase Realtime (already live); offline →
   mesh. Both carry a stable `clientId`; on reconnect, mesh-sent messages flush to
   Postgres and dedupe, so offline members get them later.

## Protocol subset (from the bitchat whitepaper)

- **Packet**: version, type, TTL (start 7), timestamp, flags, 8-byte senderId
  (first 8 bytes of SHA-256 of the Noise static key), optional 8-byte recipientId,
  payload, optional Ed25519 signature (excludes TTL so relays can decrement).
- **Types**: announce (signed: nickname + static pubkey + signing pubkey),
  channelMessage (encrypted to a chat key), noiseEncrypted / noiseHandshake (1:1),
  fragment, ack.
- **Relay**: decrement TTL, drop at 0, dedupe by (senderId, packetId). Flood;
  source-route later.
- **Fragmentation**: split > MTU into ~469-byte fragments (8-byte fragment id +
  index/total), reassemble per hop.
- **Discovery**: signed announce every ~4 s isolated → ~15–30 s jittered when
  connected; peer reachable 60 s after last announce.
- **Crypto**: Noise **XX** (Curve25519 / ChaCha20-Poly1305 / SHA-256) for 1:1;
  per-chat ChaCha20-Poly1305 with the shared channel key for groups.

## Native module: `modules/kaafilla-mesh` (Expo local module, tracked)

Lives outside the gitignored `android/`, so prebuild-safe. JS↔native contract
(see `src/KaafillaMeshModule.ts`), all bound through the guarded seam `src/mesh`:

| API | Purpose |
|---|---|
| `initIdentity(): string` | generate/return this device's static pubkey (base64) |
| `start()` / `stop()` | run/stop BLE central + peripheral + relay (foreground service) |
| `getState(): MeshState` | `{supported, advertising, scanning, peers}` for the banner |
| `joinChannel(chatId, keyB64)` / `leaveChannel(chatId)` | (de)register a chat's key |
| `sendMessage(chatId, clientId, body)` | encode → encrypt → relay |
| events `onMessage`, `onState` | inbound decrypted messages + state changes |

Android BLE: each device is **central (scan)** + **peripheral (GATT server /
advertise)** so it can relay. Permissions declared in the module manifest
(`BLUETOOTH_SCAN` w/ `neverForLocation`, `_ADVERTISE`, `_CONNECT`, legacy + location
≤ API 30, `FOREGROUND_SERVICE[_CONNECTED_DEVICE]`).

## Backend (small; new stage SQL)

- `profiles.mesh_pubkey text` — identity binding (RLS: self-write, members-read).
- Per-chat mesh key distribution — a `chat_mesh_keys` row per (chat, member) or a
  key derived from the chat id + a member-shared secret; RLS: members only.
- `messages.client_id text` (unique per chat) — cross-transport dedup; mesh-received
  messages upsert on reconnect.

## Phases

1. **Bridge + scaffold** ✅ (this commit) — Expo local module, permissions, guarded
   `src/mesh` seam, inert until rebuild. `getState().supported === false` for now.
2. **BLE transport** — central+peripheral discovery, packet codec, TTL relay,
   dedup, fragmentation, foreground service. Two devices see each other + exchange
   plaintext test packets.
3. **Scoping + crypto** — identity binding, per-chat keys, Noise 1:1 → only chat
   members decrypt.
4. **Reconciliation** — Supabase online path + `clientId` dedup + offline flush;
   ChatRoom/ChatList send via mesh when offline; real banner (peers/hops).
5. **UX + hardening** — nearby-permission prompt, Safety mesh toggle, battery/
   background tuning.

## Constraints / testing

- Native + rebuild required (`npx expo run:android`, JDK 17) — no JS hot-reload for
  the Kotlin. Expo Go won't work; the dev build already does.
- **Two physical BLE devices** to test — emulators have no Bluetooth.
- Android 12+ needs the runtime BLE permission prompt; background relay needs the
  foreground service. iOS (later) has stricter background-BLE limits.

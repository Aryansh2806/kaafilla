package expo.modules.kaafillamesh

import android.bluetooth.BluetoothManager
import android.content.Context
import android.content.SharedPreferences
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.security.SecureRandom

// Kaafilla Bluetooth-mesh transport (Android).
//
// PHASE 2 (this file): real BLE mesh. Each device runs as central + peripheral,
// discovers peers, and floods TTL-limited packets with dedup. Messages are
// plaintext and delivered to everyone in the mesh — membership scoping + Noise
// encryption land in PHASE 3. Clean-room design inspired by the bitchat
// whitepaper (public domain); no GPL code. See MESH_PLAN.md.
//
// Payload framing (Phase 2): "chatId\nclientId\nbody" so a message keeps its
// Kaafilla ids across the mesh (clientId dedupes vs the Supabase path later).
class KaafillaMeshModule : Module() {
  private var service: MeshService? = null
  private var senderId: ByteArray = ByteArray(0)

  private val context: Context
    get() = requireNotNull(appContext.reactContext) { "React context unavailable" }.applicationContext

  private fun prefs(): SharedPreferences =
    context.getSharedPreferences("kaafilla_mesh", Context.MODE_PRIVATE)

  // Stable 8-byte device id, persisted. (Phase 3 replaces this with the Curve25519
  // static-key fingerprint bound to the Kaafilla profile.)
  private fun ensureIdentity(): ByteArray {
    if (senderId.size == 8) return senderId
    val stored = prefs().getString("sender_id", null)
    senderId = if (stored != null && stored.length == 16) {
      stored.hexToBytes()
    } else {
      ByteArray(8).also {
        SecureRandom().nextBytes(it)
        prefs().edit().putString("sender_id", it.toHex()).apply()
      }
    }
    return senderId
  }

  override fun definition() = ModuleDefinition {
    Name("KaafillaMesh")

    Events("onMessage", "onState")

    AsyncFunction("initIdentity") { ensureIdentity().toHex() }

    AsyncFunction("start") {
      ensureService().start()
      emitState()
    }

    AsyncFunction("stop") {
      service?.stop()
      emitState()
    }

    Function("getState") { stateMap() }

    // Register/unregister a chat's channel key (scoping). `secret` is a shared
    // string all members hold; the 32-byte key is SHA-256(secret). Works before
    // start() too — the service persists channel keys across start/stop.
    AsyncFunction("joinChannel") { chatId: String, secret: String -> ensureService().joinChannel(chatId, secret) }
    AsyncFunction("leaveChannel") { chatId: String -> service?.leaveChannel(chatId) }

    AsyncFunction("sendMessage") { chatId: String, clientId: String, body: String ->
      ensureService().send(chatId, clientId, body)
    }
  }

  // The mesh node lives for the whole app session; start()/stop() only toggle BLE.
  private fun ensureService(): MeshService {
    ensureIdentity()
    return service ?: MeshService(
      context,
      senderId,
      onMessage = { chatId, clientId, fromHex, body ->
        sendEvent(
          "onMessage",
          mapOf(
            "chatId" to chatId,
            "clientId" to clientId,
            "senderMeshId" to fromHex,
            "body" to body,
            "sentAt" to 0.0,
          ),
        )
      },
      onStateChanged = { emitState() },
    ).also { service = it }
  }

  private fun stateMap(): Map<String, Any> {
    val s = service
    val hasBle = try {
      (context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager).adapter != null
    } catch (_: Exception) {
      false
    }
    return mapOf(
      "supported" to hasBle,
      "advertising" to (s?.advertising() ?: false),
      "scanning" to (s?.scanning() ?: false),
      "peers" to (s?.peers() ?: 0),
    )
  }

  private fun emitState() {
    sendEvent("onState", stateMap())
  }
}

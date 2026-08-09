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
      ensureIdentity()
      if (service == null) {
        service = MeshService(
          context,
          senderId,
          onMessage = { payload, fromHex -> emitMessage(payload, fromHex) },
          onStateChanged = { emitState() },
        )
      }
      service?.start()
      emitState()
    }

    AsyncFunction("stop") {
      service?.stop()
      emitState()
    }

    Function("getState") { stateMap() }

    // Phase 3: register/unregister a chat's channel key (scoping).
    AsyncFunction("joinChannel") { _: String, _: String -> }
    AsyncFunction("leaveChannel") { _: String -> }

    AsyncFunction("sendMessage") { chatId: String, clientId: String, body: String ->
      val framed = "$chatId\n$clientId\n$body".toByteArray(Charsets.UTF_8)
      service?.send(framed)
    }
  }

  private fun emitMessage(payload: ByteArray, fromHex: String) {
    val parts = String(payload, Charsets.UTF_8).split("\n", limit = 3)
    sendEvent(
      "onMessage",
      mapOf(
        "chatId" to (parts.getOrNull(0) ?: ""),
        "clientId" to (parts.getOrNull(1) ?: ""),
        "senderMeshId" to fromHex,
        "body" to (parts.getOrNull(2) ?: ""),
        "sentAt" to 0.0,
      ),
    )
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

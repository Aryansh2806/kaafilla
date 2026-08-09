package expo.modules.kaafillamesh

import android.content.Context
import java.util.concurrent.ConcurrentHashMap

// Ties the BLE peripheral + central into one mesh node: receives packets from
// either side, dedupes, delivers ours locally, and relays the rest (TTL-decremented)
// to every other connected peer — classic flood mesh.
//
// Scoping (Phase 3): a message for a joined channel is AES-GCM encrypted with that
// channel's key. On receive we try every channel key we hold; only a member can
// decrypt, so a device only surfaces messages for chats it belongs to — it still
// relays everyone else's opaque ciphertext, as a mesh must.
class MeshService(
  private val context: Context,
  private val senderId: ByteArray, // 8 bytes
  // (chatId, clientId, senderMeshHex, body)
  private val onMessage: (chatId: String, clientId: String, fromSenderHex: String, body: String) -> Unit,
  private val onStateChanged: () -> Unit,
) {
  private val seen = object {
    private val set = LinkedHashSet<String>()
    @Synchronized fun addNew(key: String): Boolean {
      if (!set.add(key)) return false
      if (set.size > 1024) { val it = set.iterator(); it.next(); it.remove() }
      return true
    }
  }

  // chatId → 32-byte channel key (SHA-256 of the shared secret).
  private val channelKeys = ConcurrentHashMap<String, ByteArray>()

  private val peripheral = BlePeripheral(context, ::onPacket, onStateChanged)
  private val central = BleCentral(context, ::onPacket, onStateChanged)

  @Volatile var running = false
    private set

  fun start() { peripheral.start(); central.start(); running = true; onStateChanged() }
  fun stop() { peripheral.stop(); central.stop(); running = false; onStateChanged() }

  fun peers(): Int = peripheral.subscriberCount() + central.connectionCount()
  fun advertising(): Boolean = peripheral.advertising
  fun scanning(): Boolean = central.scanning

  fun joinChannel(chatId: String, secret: String) { channelKeys[chatId] = Crypto.deriveKey(secret) }
  fun leaveChannel(chatId: String) { channelKeys.remove(chatId) }

  private fun onPacket(fromAddress: String, bytes: ByteArray) {
    val pkt = Packet.decode(bytes) ?: return
    if (!seen.addNew(pkt.dedupKey())) return // already handled → drop
    val mine = pkt.senderId.contentEquals(senderId)

    if (!mine) {
      when (pkt.type) {
        PacketType.MESSAGE -> {
          val parts = String(pkt.payload, Charsets.UTF_8).split("\n", limit = 3)
          if (parts.size == 3) onMessage(parts[0], parts[1], pkt.senderId.toHex(), parts[2])
        }
        PacketType.CHANNEL -> {
          // Try each channel we're a member of; first that decrypts is the chat.
          for ((chatId, key) in channelKeys) {
            val clear = Crypto.decrypt(key, pkt.payload) ?: continue
            val parts = String(clear, Charsets.UTF_8).split("\n", limit = 2)
            if (parts.size == 2) onMessage(chatId, parts[0], pkt.senderId.toHex(), parts[1])
            break
          }
          // no key matched → not our channel → relay only (below)
        }
      }
    }

    val nextTtl = pkt.ttl.toInt() - 1
    if (nextTtl > 0) {
      pkt.ttl = nextTtl.toByte()
      val out = pkt.encode()
      peripheral.notifyAll(out, fromAddress)
      central.writeAll(out, fromAddress)
    }
  }

  // Originate a message. Encrypted (CHANNEL) if we hold the chat's key, else
  // plaintext (MESSAGE, dev/unscoped). Floods it to every connected peer.
  fun send(chatId: String, clientId: String, body: String) {
    val key = channelKeys[chatId]
    val pkt = if (key != null) {
      val blob = Crypto.encrypt(key, "$clientId\n$body".toByteArray(Charsets.UTF_8))
      Packet(PacketType.CHANNEL, Mesh.DEFAULT_TTL, senderId, Packet.newMsgId(), blob)
    } else {
      val payload = "$chatId\n$clientId\n$body".toByteArray(Charsets.UTF_8)
      Packet(PacketType.MESSAGE, Mesh.DEFAULT_TTL, senderId, Packet.newMsgId(), payload)
    }
    seen.addNew(pkt.dedupKey())
    val out = pkt.encode()
    peripheral.notifyAll(out, null)
    central.writeAll(out, null)
  }
}

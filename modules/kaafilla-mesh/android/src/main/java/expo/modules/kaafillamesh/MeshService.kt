package expo.modules.kaafillamesh

import android.content.Context

// Ties the BLE peripheral + central into one mesh node: receives packets from
// either side, dedupes, delivers ours locally, and relays the rest (TTL-decremented)
// to every other connected peer — classic flood mesh.
class MeshService(
  private val context: Context,
  private val senderId: ByteArray, // 8 bytes
  private val onMessage: (payload: ByteArray, fromSenderHex: String) -> Unit,
  private val onStateChanged: () -> Unit,
) {
  // Bounded LRU of (senderId, msgId) we've already handled, so a packet flooding
  // the mesh isn't processed or relayed twice.
  private val seen = object {
    private val set = LinkedHashSet<String>()
    @Synchronized fun addNew(key: String): Boolean {
      if (!set.add(key)) return false
      if (set.size > 1024) {
        val it = set.iterator(); it.next(); it.remove()
      }
      return true
    }
  }

  private val peripheral = BlePeripheral(context, ::onPacket, onStateChanged)
  private val central = BleCentral(context, ::onPacket, onStateChanged)

  @Volatile var running = false
    private set

  fun start() {
    peripheral.start()
    central.start()
    running = true
    onStateChanged()
  }

  fun stop() {
    peripheral.stop()
    central.stop()
    running = false
    onStateChanged()
  }

  fun peers(): Int = peripheral.subscriberCount() + central.connectionCount()
  fun advertising(): Boolean = peripheral.advertising
  fun scanning(): Boolean = central.scanning

  private fun onPacket(fromAddress: String, bytes: ByteArray) {
    val pkt = Packet.decode(bytes) ?: return
    if (!seen.addNew(pkt.dedupKey())) return // already handled → drop

    // Deliver locally (skip our own echoes).
    if (pkt.type == PacketType.MESSAGE && !pkt.senderId.contentEquals(senderId)) {
      onMessage(pkt.payload, pkt.senderId.toHex())
    }

    // Relay onward, minus this hop.
    val nextTtl = pkt.ttl.toInt() - 1
    if (nextTtl > 0) {
      pkt.ttl = nextTtl.toByte()
      val out = pkt.encode()
      peripheral.notifyAll(out, fromAddress)
      central.writeAll(out, fromAddress)
    }
  }

  // Originate a message: flood it to every connected peer.
  fun send(payload: ByteArray) {
    val pkt = Packet(PacketType.MESSAGE, Mesh.DEFAULT_TTL, senderId, Packet.newMsgId(), payload)
    seen.addNew(pkt.dedupKey()) // don't re-handle our own echo
    val out = pkt.encode()
    peripheral.notifyAll(out, null)
    central.writeAll(out, null)
  }
}

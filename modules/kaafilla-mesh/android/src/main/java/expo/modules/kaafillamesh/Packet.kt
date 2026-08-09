package expo.modules.kaafillamesh

import java.security.SecureRandom

object PacketType {
  const val ANNOUNCE: Byte = 1
  const val MESSAGE: Byte = 2
}

// Wire format (Phase 2, plaintext — encryption arrives in Phase 3):
//   [version:1][type:1][ttl:1][flags:1][senderId:8][msgId:8][payloadLen:2 BE][payload]
// senderId identifies the origin device; (senderId, msgId) dedupes relays.
class Packet(
  val type: Byte,
  var ttl: Byte,
  val senderId: ByteArray, // 8 bytes
  val msgId: ByteArray, // 8 bytes
  val payload: ByteArray,
) {
  fun dedupKey(): String = senderId.toHex() + ":" + msgId.toHex()

  fun encode(): ByteArray {
    val len = payload.size
    val out = ByteArray(HEADER + len)
    out[0] = VERSION
    out[1] = type
    out[2] = ttl
    out[3] = 0 // flags
    System.arraycopy(senderId, 0, out, 4, 8)
    System.arraycopy(msgId, 0, out, 12, 8)
    out[20] = ((len ushr 8) and 0xFF).toByte()
    out[21] = (len and 0xFF).toByte()
    System.arraycopy(payload, 0, out, HEADER, len)
    return out
  }

  companion object {
    const val VERSION: Byte = 1
    const val HEADER = 22
    private val rng = SecureRandom()

    fun decode(b: ByteArray): Packet? {
      if (b.size < HEADER || b[0] != VERSION) return null
      val len = ((b[20].toInt() and 0xFF) shl 8) or (b[21].toInt() and 0xFF)
      if (b.size < HEADER + len) return null
      return Packet(
        type = b[1],
        ttl = b[2],
        senderId = b.copyOfRange(4, 12),
        msgId = b.copyOfRange(12, 20),
        payload = b.copyOfRange(HEADER, HEADER + len),
      )
    }

    fun newMsgId(): ByteArray = ByteArray(8).also { rng.nextBytes(it) }
  }
}

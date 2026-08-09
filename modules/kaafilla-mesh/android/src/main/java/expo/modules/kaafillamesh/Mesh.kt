package expo.modules.kaafillamesh

import java.util.UUID

// Shared BLE identifiers + constants for the Kaafilla mesh. Custom 128-bit UUIDs
// (ASCII "kaaf..." prefixed) so we only ever talk to other Kaafilla devices.
object Mesh {
  val SERVICE_UUID: UUID = UUID.fromString("6b616166-696c-6c61-6d65-736801000001")
  val CHAR_UUID: UUID = UUID.fromString("6b616166-696c-6c61-6d65-736801000002")
  val CCCD_UUID: UUID = UUID.fromString("00002902-0000-1000-8000-00805f9b34fb")
  const val DEFAULT_TTL: Byte = 7
  const val TAG = "KaafillaMesh"
}

fun ByteArray.toHex(): String = joinToString("") { "%02x".format(it) }

fun String.hexToBytes(): ByteArray =
  ByteArray(length / 2) { ((this[it * 2].digitToInt(16) shl 4) or this[it * 2 + 1].digitToInt(16)).toByte() }

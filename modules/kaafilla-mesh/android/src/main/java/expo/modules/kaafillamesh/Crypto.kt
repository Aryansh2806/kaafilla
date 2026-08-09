package expo.modules.kaafillamesh

import java.security.MessageDigest
import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec

// Channel encryption for scoped mesh messages. A channel key is SHA-256 of a
// shared secret (a per-chat key string from Supabase in real use; a passphrase
// for the dev test), so all members of a chat derive the same 32-byte key.
// Messages are AES-256-GCM: only a holder of the key can decrypt (the GCM tag
// authenticates), everyone else just relays the opaque ciphertext.
object Crypto {
  private const val NONCE_LEN = 12
  private const val TAG_BITS = 128
  private val rng = SecureRandom()

  fun deriveKey(secret: String): ByteArray =
    MessageDigest.getInstance("SHA-256").digest(secret.toByteArray(Charsets.UTF_8))

  // → [nonce:12][ciphertext+tag]
  fun encrypt(key: ByteArray, plaintext: ByteArray): ByteArray {
    val nonce = ByteArray(NONCE_LEN).also { rng.nextBytes(it) }
    val cipher = Cipher.getInstance("AES/GCM/NoPadding")
    cipher.init(Cipher.ENCRYPT_MODE, SecretKeySpec(key, "AES"), GCMParameterSpec(TAG_BITS, nonce))
    return nonce + cipher.doFinal(plaintext)
  }

  // Returns null if the key is wrong (GCM tag mismatch) or the blob is malformed.
  fun decrypt(key: ByteArray, blob: ByteArray): ByteArray? {
    if (blob.size < NONCE_LEN + 16) return null
    return try {
      val nonce = blob.copyOfRange(0, NONCE_LEN)
      val ct = blob.copyOfRange(NONCE_LEN, blob.size)
      val cipher = Cipher.getInstance("AES/GCM/NoPadding")
      cipher.init(Cipher.DECRYPT_MODE, SecretKeySpec(key, "AES"), GCMParameterSpec(TAG_BITS, nonce))
      cipher.doFinal(ct)
    } catch (_: Exception) {
      null
    }
  }
}

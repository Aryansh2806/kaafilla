package expo.modules.kaafillamesh

import android.annotation.SuppressLint
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattCallback
import android.bluetooth.BluetoothGattCharacteristic
import android.bluetooth.BluetoothGattDescriptor
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothProfile
import android.bluetooth.le.BluetoothLeScanner
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanFilter
import android.bluetooth.le.ScanResult
import android.bluetooth.le.ScanSettings
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.os.ParcelUuid
import android.util.Log
import java.util.concurrent.ConcurrentHashMap

// This device as a BLE central: it scans for the mesh service, connects to peers,
// subscribes to their characteristic to receive packets, and writes to send.
@SuppressLint("MissingPermission")
class BleCentral(
  private val context: Context,
  private val onPacket: (fromAddress: String, bytes: ByteArray) -> Unit,
  private val onPeerChange: () -> Unit,
) {
  private val manager = context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
  private var scanner: BluetoothLeScanner? = null
  private val gatts = ConcurrentHashMap<String, BluetoothGatt>() // ready connections
  private val txChar = ConcurrentHashMap<String, BluetoothGattCharacteristic>()
  private val connecting = ConcurrentHashMap<String, Boolean>()
  private val main = Handler(Looper.getMainLooper())

  @Volatile var scanning = false
    private set

  fun start() {
    val adapter = manager.adapter ?: return
    if (!adapter.isEnabled) return
    val s = adapter.bluetoothLeScanner ?: return
    scanner = s
    val filter = ScanFilter.Builder().setServiceUuid(ParcelUuid(Mesh.SERVICE_UUID)).build()
    val settings = ScanSettings.Builder().setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY).build()
    s.startScan(listOf(filter), settings, scanCallback)
    scanning = true
  }

  fun stop() {
    try { scanner?.stopScan(scanCallback) } catch (_: Exception) {}
    scanning = false
    for (g in gatts.values) try { g.close() } catch (_: Exception) {}
    gatts.clear(); txChar.clear(); connecting.clear()
  }

  fun connectionCount(): Int = gatts.size

  private val scanCallback = object : ScanCallback() {
    override fun onScanResult(callbackType: Int, result: ScanResult) {
      val device = result.device
      val addr = device.address
      if (gatts.containsKey(addr) || connecting.containsKey(addr)) return
      connecting[addr] = true
      main.post { device.connectGatt(context, false, gattCallback, BluetoothDevice.TRANSPORT_LE) }
    }

    override fun onScanFailed(errorCode: Int) {
      scanning = false
      Log.w(Mesh.TAG, "scan failed: $errorCode")
    }
  }

  private val gattCallback = object : BluetoothGattCallback() {
    override fun onConnectionStateChange(gatt: BluetoothGatt, status: Int, newState: Int) {
      val addr = gatt.device.address
      when (newState) {
        BluetoothProfile.STATE_CONNECTED -> gatt.requestMtu(512)
        BluetoothProfile.STATE_DISCONNECTED -> {
          connecting.remove(addr); gatts.remove(addr); txChar.remove(addr)
          try { gatt.close() } catch (_: Exception) {}
          onPeerChange()
        }
      }
    }

    override fun onMtuChanged(gatt: BluetoothGatt, mtu: Int, status: Int) {
      gatt.discoverServices()
    }

    override fun onServicesDiscovered(gatt: BluetoothGatt, status: Int) {
      val addr = gatt.device.address
      val ch = gatt.getService(Mesh.SERVICE_UUID)?.getCharacteristic(Mesh.CHAR_UUID)
      if (ch == null) {
        connecting.remove(addr)
        try { gatt.disconnect() } catch (_: Exception) {}
        return
      }
      gatt.setCharacteristicNotification(ch, true)
      ch.getDescriptor(Mesh.CCCD_UUID)?.let { cccd ->
        @Suppress("DEPRECATION")
        run {
          cccd.value = BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE
          gatt.writeDescriptor(cccd)
        }
      }
      txChar[addr] = ch
      gatts[addr] = gatt
      connecting.remove(addr)
      onPeerChange()
    }

    // API 33+ delivers notification payload directly.
    override fun onCharacteristicChanged(gatt: BluetoothGatt, ch: BluetoothGattCharacteristic, value: ByteArray) {
      if (ch.uuid == Mesh.CHAR_UUID) onPacket(gatt.device.address, value)
    }

    // Pre-33 fallback (reads ch.value).
    @Deprecated("Deprecated in Java")
    override fun onCharacteristicChanged(gatt: BluetoothGatt, ch: BluetoothGattCharacteristic) {
      if (ch.uuid == Mesh.CHAR_UUID) {
        @Suppress("DEPRECATION")
        val v = ch.value ?: return
        onPacket(gatt.device.address, v)
      }
    }
  }

  fun writeAll(bytes: ByteArray, except: String?) {
    for ((addr, gatt) in gatts) {
      if (addr == except) continue
      val ch = txChar[addr] ?: continue
      try {
        ch.writeType = BluetoothGattCharacteristic.WRITE_TYPE_NO_RESPONSE
        @Suppress("DEPRECATION")
        run {
          ch.value = bytes
          gatt.writeCharacteristic(ch)
        }
      } catch (_: Exception) {}
    }
  }
}

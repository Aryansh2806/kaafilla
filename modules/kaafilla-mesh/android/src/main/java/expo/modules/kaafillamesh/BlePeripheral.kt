package expo.modules.kaafillamesh

import android.annotation.SuppressLint
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattCharacteristic
import android.bluetooth.BluetoothGattDescriptor
import android.bluetooth.BluetoothGattServer
import android.bluetooth.BluetoothGattServerCallback
import android.bluetooth.BluetoothGattService
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothProfile
import android.bluetooth.le.AdvertiseCallback
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.AdvertiseSettings
import android.bluetooth.le.BluetoothLeAdvertiser
import android.content.Context
import android.os.ParcelUuid
import android.util.Log
import java.util.concurrent.ConcurrentHashMap

// This device as a BLE peripheral: it advertises the mesh service and runs a GATT
// server. Peers (centrals) connect, subscribe to the characteristic, write their
// packets to us, and receive our packets via notifications.
@SuppressLint("MissingPermission")
class BlePeripheral(
  private val context: Context,
  private val onPacket: (fromAddress: String, bytes: ByteArray) -> Unit,
  private val onPeerChange: () -> Unit,
) {
  private val manager = context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
  private var advertiser: BluetoothLeAdvertiser? = null
  private var gattServer: BluetoothGattServer? = null
  private var characteristic: BluetoothGattCharacteristic? = null
  private val subscribers = ConcurrentHashMap<String, BluetoothDevice>() // centrals that enabled notify

  @Volatile var advertising = false
    private set

  fun start() {
    val adapter = manager.adapter ?: return
    if (!adapter.isEnabled) return
    startGattServer()
    startAdvertising()
  }

  fun stop() {
    try { advertiser?.stopAdvertising(advCallback) } catch (_: Exception) {}
    advertising = false
    try { gattServer?.close() } catch (_: Exception) {}
    gattServer = null
    characteristic = null
    subscribers.clear()
  }

  fun subscriberCount(): Int = subscribers.size

  private fun startGattServer() {
    val server = manager.openGattServer(context, serverCallback) ?: return
    val service = BluetoothGattService(Mesh.SERVICE_UUID, BluetoothGattService.SERVICE_TYPE_PRIMARY)
    val ch = BluetoothGattCharacteristic(
      Mesh.CHAR_UUID,
      BluetoothGattCharacteristic.PROPERTY_WRITE or
        BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE or
        BluetoothGattCharacteristic.PROPERTY_NOTIFY,
      BluetoothGattCharacteristic.PERMISSION_WRITE,
    )
    ch.addDescriptor(
      BluetoothGattDescriptor(
        Mesh.CCCD_UUID,
        BluetoothGattDescriptor.PERMISSION_READ or BluetoothGattDescriptor.PERMISSION_WRITE,
      ),
    )
    service.addCharacteristic(ch)
    server.addService(service)
    gattServer = server
    characteristic = ch
  }

  private fun startAdvertising() {
    val adv = manager.adapter?.bluetoothLeAdvertiser ?: run {
      Log.w(Mesh.TAG, "BLE advertising not supported on this device")
      return
    }
    val settings = AdvertiseSettings.Builder()
      .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
      .setConnectable(true)
      .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
      .build()
    val data = AdvertiseData.Builder()
      .setIncludeDeviceName(false)
      .addServiceUuid(ParcelUuid(Mesh.SERVICE_UUID))
      .build()
    advertiser = adv
    adv.startAdvertising(settings, data, advCallback)
  }

  private val advCallback = object : AdvertiseCallback() {
    override fun onStartSuccess(settingsInEffect: AdvertiseSettings) { advertising = true; onPeerChange() }
    override fun onStartFailure(errorCode: Int) {
      advertising = false
      Log.w(Mesh.TAG, "advertise failed: $errorCode")
    }
  }

  // Push bytes to all subscribed centrals, optionally skipping the source.
  fun notifyAll(bytes: ByteArray, except: String?) {
    val ch = characteristic ?: return
    val server = gattServer ?: return
    @Suppress("DEPRECATION")
    run { ch.value = bytes }
    for ((addr, device) in subscribers) {
      if (addr == except) continue
      try {
        @Suppress("DEPRECATION")
        server.notifyCharacteristicChanged(device, ch, false)
      } catch (_: Exception) {}
    }
  }

  private val serverCallback = object : BluetoothGattServerCallback() {
    override fun onConnectionStateChange(device: BluetoothDevice, status: Int, newState: Int) {
      if (newState == BluetoothProfile.STATE_DISCONNECTED) {
        subscribers.remove(device.address)
        onPeerChange()
      }
    }

    override fun onCharacteristicWriteRequest(
      device: BluetoothDevice,
      requestId: Int,
      ch: BluetoothGattCharacteristic,
      preparedWrite: Boolean,
      responseNeeded: Boolean,
      offset: Int,
      value: ByteArray,
    ) {
      if (ch.uuid == Mesh.CHAR_UUID) onPacket(device.address, value)
      if (responseNeeded) gattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, null)
    }

    override fun onDescriptorWriteRequest(
      device: BluetoothDevice,
      requestId: Int,
      descriptor: BluetoothGattDescriptor,
      preparedWrite: Boolean,
      responseNeeded: Boolean,
      offset: Int,
      value: ByteArray,
    ) {
      if (descriptor.uuid == Mesh.CCCD_UUID) {
        val enable = value.isNotEmpty() && value[0].toInt() != 0
        if (enable) subscribers[device.address] = device else subscribers.remove(device.address)
        onPeerChange()
      }
      if (responseNeeded) gattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, null)
    }
  }
}

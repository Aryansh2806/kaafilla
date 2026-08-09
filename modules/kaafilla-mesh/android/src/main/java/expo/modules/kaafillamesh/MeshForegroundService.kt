package expo.modules.kaafillamesh

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder

// A foreground service whose only job is to keep the app process alive (with an
// ongoing notification) while the mesh is running, so Android doesn't kill BLE
// advertising/scanning/relay when the app is backgrounded. The mesh itself lives
// in the module's MeshService; this just holds the process foreground.
class MeshForegroundService : Service() {
  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    startForeground(NOTIF_ID, buildNotification())
    return START_NOT_STICKY // don't resurrect without the app's mesh behind it
  }

  private fun buildNotification(): Notification {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val mgr = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      val channel = NotificationChannel(CHANNEL_ID, "Bluetooth mesh", NotificationManager.IMPORTANCE_LOW)
      channel.setShowBadge(false)
      mgr.createNotificationChannel(channel)
    }
    @Suppress("DEPRECATION")
    val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification.Builder(this, CHANNEL_ID)
    } else {
      Notification.Builder(this)
    }
    return builder
      .setContentTitle("Kaafilla mesh active")
      .setContentText("Relaying nearby messages over Bluetooth")
      .setSmallIcon(android.R.drawable.stat_sys_data_bluetooth)
      .setOngoing(true)
      .build()
  }

  companion object {
    private const val CHANNEL_ID = "kaafilla_mesh"
    private const val NOTIF_ID = 4917

    fun start(context: Context) {
      val intent = Intent(context, MeshForegroundService::class.java)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(intent)
      } else {
        context.startService(intent)
      }
    }

    fun stop(context: Context) {
      context.stopService(Intent(context, MeshForegroundService::class.java))
    }
  }
}

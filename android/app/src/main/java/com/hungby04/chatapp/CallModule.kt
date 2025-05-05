package com.hungby04.chatapp

import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import android.os.Build
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import androidx.core.app.NotificationCompat

class CallModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val reactApplicationContext: ReactApplicationContext = reactContext

    override fun getName(): String {
        return "CallModule"
    }

    @ReactMethod
    fun showIncomingCall(callerName: String, callerNumber: String) {
        // Tạo Notification Channel
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                "call_channel",
                "Incoming Call",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                setSound(android.provider.Settings.System.DEFAULT_NOTIFICATION_URI, null)
                enableVibration(true)
                enableLights(true)
                lightColor = android.graphics.Color.GREEN
            }
            val manager = reactApplicationContext.getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }

        // Tạo Intent cho Activity
        val intent = Intent(reactApplicationContext, IncomingCallActivity::class.java).apply {
            putExtra("caller_name", callerName)
            putExtra("caller_number", callerNumber)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }

        // Tạo PendingIntent
        val pendingIntent = PendingIntent.getActivity(
            reactApplicationContext,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Tạo thông báo
        val notification = NotificationCompat.Builder(reactApplicationContext, "call_channel")
            .setContentTitle("Incoming Call")
            .setContentText(callerName)
            .setSmallIcon(R.drawable.notifications_active_black_24)
            .setFullScreenIntent(pendingIntent, true)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .build()

        // Hiển thị thông báo
        val notificationManager = reactApplicationContext.getSystemService(NotificationManager::class.java)
        notificationManager.notify(1, notification)

        // Vẫn khởi chạy Activity trực tiếp
        // reactApplicationContext.startActivity(intent)
    }
}
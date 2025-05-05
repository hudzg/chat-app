package com.hungby04.chatapp

import android.app.Activity
import android.app.Application
import android.content.Intent
import android.net.Uri
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactNativeHost
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.util.HashMap
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import android.app.Notification

/**
 * Expose Java to JavaScript. Methods annotated with [ReactMethod] are exposed.
 */
class ActivityStarterModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val reactContext: ReactApplicationContext = reactContext
    private val notificationManager by lazy { NotificationManagerCompat.from(reactContext) }

    init {
        instance = this
        createNotificationChannel()
    }

    override fun initialize() {
        super.initialize()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

        val channel = NotificationChannel(
            CHANNEL_ID, CHANNEL_NAME, NotificationManager.IMPORTANCE_HIGH
        ).apply {
            lockscreenVisibility = Notification.VISIBILITY_PUBLIC
        }

        notificationManager.createNotificationChannel(channel)
    }

    private fun createNotification(): Notification {
        // val contentIntent = Intent(reactContext, MainActivity::class.java)
        // val contentPendingIntent =
        //     PendingIntent.getActivity(reactContext, 0, contentIntent, PendingIntent.FLAG_IMMUTABLE)

        val fullScreenIntent = Intent(reactContext, MyActivity::class.java)
        val fullScreenPendingIntent =
            PendingIntent.getActivity(reactContext, 1, fullScreenIntent, PendingIntent.FLAG_IMMUTABLE)

        return NotificationCompat.Builder(reactContext, CHANNEL_ID)
            .setSmallIcon(R.drawable.notifications_active_black_24)
            .setContentTitle("Heads Up Notification")
            .setContentText("Incoming call...")
            .setAutoCancel(true)
            // .setContentIntent(contentPendingIntent)
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .build()
    }

    /**
     * @return the name of this module. This will be the name used to `require()` this module
     * from JavaScript.
     */
    override fun getName(): String {
        return "ActivityStarter"
    }

    override fun getConstants(): Map<String, Any>? {
        val constants = HashMap<String, Any>()
        constants["MyEventName"] = "MyEventValue"
        return constants
    }

    @ReactMethod
    fun navigateToExample() {
        // val myIntent = Intent(reactContext.applicationContext as Application, MyActivity::class.java)
        // myIntent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or 
        //                 Intent.FLAG_ACTIVITY_SINGLE_TOP or
        //                 Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
        // (reactContext.applicationContext as Application).startActivity(myIntent)
        notificationManager.notify(1, createNotification())
    }

    @ReactMethod
    fun dialNumber(number: String) {
        val activity = currentActivity
        if (activity != null) {
            val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$number"))
            activity.startActivity(intent)
        }
    }

    @ReactMethod
    fun getActivityName(callback: Callback) {
        val activity = currentActivity
        if (activity != null) {
            callback.invoke(activity.javaClass.simpleName)
        } else {
            callback.invoke("No current activity")
        }
    }

    @ReactMethod
    fun getActivityNameAsPromise(promise: Promise) {
        val activity = currentActivity
        if (activity != null) {
            promise.resolve(activity.javaClass.simpleName)
        } else {
            promise.reject("NO_ACTIVITY", "No current activity")
        }
    }

    @ReactMethod
    fun callJavaScript() {
        val activity = currentActivity
        if (activity != null) {
            val application = activity.application as MainApplication
            val reactNativeHost: ReactNativeHost = application.reactNativeHost
            val reactInstanceManager: ReactInstanceManager = reactNativeHost.reactInstanceManager
            val reactContext = reactInstanceManager.currentReactContext
            if (reactContext != null) {
                val catalystInstance = reactContext.catalystInstance
                val params = WritableNativeArray()
                params.pushString("Hello, JavaScript!")
                catalystInstance.callFunction("JavaScriptVisibleToJava", "alert", params)
            }
        }
    }

    private fun sendEvent(message: String) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            ?.emit("MyEventValue", message)
    }

    companion object {
        private var instance: ActivityStarterModule? = null
        const val CHANNEL_ID = "call_channel"
        const val CHANNEL_NAME = "Call Channel"
        
        fun triggerAlert(message: String) {
            instance?.sendEvent(message)
        }
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        instance = null
    }
}
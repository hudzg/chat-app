package com.hungby04.chatapp

import android.app.Activity
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
import android.os.Build
import android.view.WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
import android.app.KeyguardManager
import androidx.activity.OnBackPressedCallback

class MyActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        

        val keyguardManager = getSystemService(KEYGUARD_SERVICE) as KeyguardManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
            keyguardManager.requestDismissKeyguard(this, null)
        } else {
            window.addFlags(
                FLAG_KEEP_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                FLAG_TURN_SCREEN_ON
            )
        }

        setContentView(R.layout.my_activity)

        findViewById<View>(R.id.trigger_alert_button).isEnabled = true
        findViewById<View>(R.id.go_back_button).setOnClickListener {
            finish()
        }
        findViewById<View>(R.id.trigger_alert_button).setOnClickListener {
            ActivityStarterModule.triggerAlert("Hello from ${MyActivity::class.java.simpleName}")
        }
    }
}
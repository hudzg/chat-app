package com.hungby04.chatapp

import android.os.Bundle
import android.widget.Button
import android.widget.ImageView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.media.RingtoneManager
import android.app.KeyguardManager
import android.view.WindowManager
import android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
import android.view.WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON

class IncomingCallActivity : AppCompatActivity() {
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

        setContentView(R.layout.activity_incoming_call)

        // Lấy thông tin từ Intent
        val callerName = intent.getStringExtra("caller_name") ?: "Unknown Caller"
        val callerNumber = intent.getStringExtra("caller_number") ?: "Unknown Number"

        // Ánh xạ giao diện
        val callerNameTextView = findViewById<TextView>(R.id.caller_name)
        val callerImage = findViewById<ImageView>(R.id.caller_image)
        val acceptButton = findViewById<Button>(R.id.accept_button)
        val declineButton = findViewById<Button>(R.id.decline_button)

        // Hiển thị thông tin
        callerNameTextView.text = callerName

        // Kích hoạt rung và chuông
        triggerRingtoneAndVibration()

        // Xử lý nút Chấp nhận
        acceptButton.setOnClickListener {
            // Logic chấp nhận cuộc gọi (kết nối VoIP hoặc chuyển hướng)
            finish()
        }

        // Xử lý nút Từ chối
        declineButton.setOnClickListener {
            // Logic từ chối cuộc gọi
            finish()
        }
    }

    private fun triggerRingtoneAndVibration() {
        // Rung
        val vibrator = getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createOneShot(500, VibrationEffect.DEFAULT_AMPLITUDE))
        } else {
            vibrator.vibrate(500)
        }

        // Chuông
        val ringtone = RingtoneManager.getRingtone(this, RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE))
        ringtone.play()
    }
}
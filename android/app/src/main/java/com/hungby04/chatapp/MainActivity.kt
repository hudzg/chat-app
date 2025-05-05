package com.hungby04.chatapp

import android.app.AlertDialog
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import expo.modules.ReactActivityDelegateWrapper
import expo.modules.splashscreen.SplashScreenManager

class MainActivity : ReactActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        // Set the theme to AppTheme BEFORE onCreate to support
        // coloring the background, status bar, and navigation bar.
        // This is required for expo-splash-screen.
        // setTheme(R.style.AppTheme);
        // @generated begin expo-splashscreen - expo prebuild (DO NOT MODIFY)
        // sync-f3ff59a738c56c9a6119210cb55f0b613eb8b6af
        SplashScreenManager.registerOnActivity(this)
        // @generated end expo-splashscreen
        super.onCreate(null)
        checkAndRequestFullScreenIntentPermission(this)
    }

    /**
     * Returns the name of the main component registered from JavaScript. This is used to schedule
     * rendering of the component.
     */
    override fun getMainComponentName(): String = "main"

    /**
     * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
     * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
     */
    override fun createReactActivityDelegate(): ReactActivityDelegate {
        return ReactActivityDelegateWrapper(
                this,
                BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
                object : DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled) {}
        )
    }

    /**
     * Align the back button behavior with Android S where moving root activities to background
     * instead of finishing activities.
     * @see <a
     * href="https://developer.android.com/reference/android/app/Activity#onBackPressed()">onBackPressed</a>
     */
    override fun invokeDefaultOnBackPressed() {
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
            if (!moveTaskToBack(false)) {
                // For non-root activities, use the default implementation to finish them.
                super.invokeDefaultOnBackPressed()
            }
            return
        }

        // Use the default back button implementation on Android S
        // because it's doing more than [Activity.moveTaskToBack] in fact.
        super.invokeDefaultOnBackPressed()
    }

    private fun checkAndRequestFullScreenIntentPermission(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            val notificationManager =
                    context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            if (!notificationManager.canUseFullScreenIntent()) {
                // Hiển thị dialog giải thích và dẫn đến cài đặt
                AlertDialog.Builder(context)
                        .setTitle("Cần cấp quyền")
                        .setMessage(
                                "Vui lòng bật quyền thông báo toàn màn hình để sử dụng tính năng thông báo quan trọng."
                        )
                        .setPositiveButton("Đi đến cài đặt") { _, _ ->
                            openFullScreenIntentSettings(context)
                        }
                        .setNegativeButton("Hủy", null)
                        .show()
            }
        }
    }

    private fun openFullScreenIntentSettings(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            val intent = Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT)
            intent.putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
            try {
                startActivity(intent)
            } catch (e: Exception) {
                // Xử lý trường hợp intent không khả dụng
                AlertDialog.Builder(context)
                        .setTitle("Lỗi")
                        .setMessage(
                                "Không thể mở cài đặt. Vui lòng kiểm tra quyền trong Cài đặt hệ thống."
                        )
                        .setPositiveButton("OK", null)
                        .show()
            }
        }
    }
}

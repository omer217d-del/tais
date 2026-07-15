package com.tais.app

import android.content.Intent
import android.os.Bundle
import com.getcapacitor.BridgeActivity
import com.tais.app.capacitor.TaisBridgePlugin
import com.tais.app.service.TaisService
import com.tais.app.util.CrashLogger

private const val TAG = "MainActivity"

/**
 * MainActivity — TAIS application entry point.
 *
 * Extends BridgeActivity to integrate Capacitor's web-to-native bridge.
 * Registers all native Capacitor plugins and starts the background service.
 */
class MainActivity : BridgeActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        CrashLogger.install(this)
        CrashLogger.log(this, TAG, "onCreate: start")

        try {
            registerPlugin(TaisBridgePlugin::class.java)
            CrashLogger.log(this, TAG, "onCreate: plugin registered")
        } catch (e: Exception) {
            CrashLogger.logError(this, TAG, "onCreate: plugin registration failed", e)
        }

        super.onCreate(savedInstanceState)
        CrashLogger.log(this, TAG, "onCreate: super.onCreate finished")

        startTaisService()
        CrashLogger.log(this, TAG, "onCreate: end")
    }

    override fun onDestroy() {
        super.onDestroy()
        // Service continues running — stopped explicitly by user from Settings
    }

    private fun startTaisService() {
        try {
            val serviceIntent = Intent(this, TaisService::class.java)
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent)
            } else {
                startService(serviceIntent)
            }
            CrashLogger.log(this, TAG, "startTaisService: service start requested")
        } catch (e: Exception) {
            CrashLogger.logError(this, TAG, "startTaisService: failed to start service", e)
        }
    }
}

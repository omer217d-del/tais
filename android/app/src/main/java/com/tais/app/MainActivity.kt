package com.tais.app

import android.content.Intent
import android.os.Bundle
import com.getcapacitor.BridgeActivity
import com.tais.app.capacitor.TaisBridgePlugin
import com.tais.app.service.TaisService

/**
 * MainActivity — TAIS application entry point.
 *
 * Extends BridgeActivity to integrate Capacitor's web-to-native bridge.
 * Registers all native Capacitor plugins and starts the background service.
 */
class MainActivity : BridgeActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(TaisBridgePlugin::class.java)
        super.onCreate(savedInstanceState)
        startTaisService()
    }

    override fun onDestroy() {
        super.onDestroy()
        // Service continues running — stopped explicitly by user from Settings
    }

    private fun startTaisService() {
        val serviceIntent = Intent(this, TaisService::class.java)
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent)
        } else {
            startService(serviceIntent)
        }
    }
}

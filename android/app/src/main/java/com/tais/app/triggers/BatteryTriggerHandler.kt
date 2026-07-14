package com.tais.app.triggers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import android.util.Log
import com.tais.app.model.TriggerConfig
import com.tais.app.model.TriggerType

private const val TAG = "BatteryTrigger"

data class BatteryTriggerHandle(
    val receiver: BroadcastReceiver,
    val lastLevel: Int = -1
)

/**
 * BatteryTriggerHandler — Monitors battery level and charging state changes.
 * Uses Android's sticky broadcast system for efficient battery monitoring.
 */
class BatteryTriggerHandler(private val context: Context) {

    fun register(config: TriggerConfig, onFired: () -> Unit): BatteryTriggerHandle {
        val receiver = object : BroadcastReceiver() {
            override fun onReceive(ctx: Context, intent: Intent) {
                when (config.type) {
                    TriggerType.BATTERY -> handleBatteryLevel(intent, config, onFired)
                    TriggerType.CHARGING -> handleChargingState(intent, config, onFired)
                    else -> {}
                }
            }
        }

        val filter = IntentFilter().apply {
            addAction(Intent.ACTION_BATTERY_CHANGED)
            addAction(Intent.ACTION_POWER_CONNECTED)
            addAction(Intent.ACTION_POWER_DISCONNECTED)
        }

        context.registerReceiver(receiver, filter)
        Log.d(TAG, "Battery trigger registered (type=${config.type})")

        return BatteryTriggerHandle(receiver)
    }

    fun unregister(handle: Any) {
        if (handle !is BatteryTriggerHandle) return
        try {
            context.unregisterReceiver(handle.receiver)
            Log.d(TAG, "Battery trigger unregistered")
        } catch (e: IllegalArgumentException) {
            Log.w(TAG, "Battery receiver was already unregistered")
        }
    }

    private fun handleBatteryLevel(
        intent: Intent,
        config: TriggerConfig,
        onFired: () -> Unit
    ) {
        val level = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
        val scale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, 100)
        val batteryPct = (level * 100 / scale)

        val targetLevel = (config.parameters["level"] as? Number)?.toInt() ?: return
        val comparison = config.parameters["comparison"] as? String ?: "lte"

        val triggered = when (comparison) {
            "lte" -> batteryPct <= targetLevel
            "gte" -> batteryPct >= targetLevel
            "eq" -> batteryPct == targetLevel
            else -> batteryPct <= targetLevel
        }

        if (triggered) {
            Log.i(TAG, "Battery trigger fired: ${batteryPct}% $comparison $targetLevel%")
            onFired()
        }
    }

    private fun handleChargingState(
        intent: Intent,
        config: TriggerConfig,
        onFired: () -> Unit
    ) {
        val targetState = config.parameters["state"] as? String ?: "charging"
        val isChargingIntent = intent.action == Intent.ACTION_POWER_CONNECTED

        val triggered = when (targetState) {
            "charging" -> isChargingIntent
            "discharging" -> !isChargingIntent
            else -> isChargingIntent
        }

        if (triggered) {
            Log.i(TAG, "Charging trigger fired: ${intent.action}")
            onFired()
        }
    }
}

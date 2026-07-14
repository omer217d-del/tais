package com.tais.app.triggers

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import com.tais.app.model.TriggerConfig
import java.util.Calendar

private const val TAG = "TimeTrigger"
private const val ACTION_TIME_TRIGGER = "com.tais.app.TIME_TRIGGER"

data class TimeTriggerHandle(
    val pendingIntent: PendingIntent,
    val automationId: Int
)

/**
 * TimeTriggerHandler — Schedules exact alarm-based time triggers.
 * Uses AlarmManager for reliable scheduling, even when the app is in background.
 */
class TimeTriggerHandler(private val context: Context) {

    private val alarmManager: AlarmManager =
        context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

    private val pendingCallbacks = mutableMapOf<Int, () -> Unit>()

    fun register(config: TriggerConfig, onFired: () -> Unit): TimeTriggerHandle {
        val automationId = System.currentTimeMillis().toInt() and 0xFFFF

        val time = config.parameters["time"] as? String ?: "00:00"
        val repeat = config.parameters["repeat"] as? String ?: "daily"

        val (hour, minute) = time.split(":").map { it.toInt() }

        val calendar = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, hour)
            set(Calendar.MINUTE, minute)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
            if (before(Calendar.getInstance())) add(Calendar.DAY_OF_YEAR, 1)
        }

        val intent = Intent(ACTION_TIME_TRIGGER).apply {
            putExtra("automationId", automationId)
        }

        val flags = PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        val pendingIntent = PendingIntent.getBroadcast(context, automationId, intent, flags)

        pendingCallbacks[automationId] = onFired

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && alarmManager.canScheduleExactAlarms()) {
            if (repeat == "daily") {
                alarmManager.setRepeating(
                    AlarmManager.RTC_WAKEUP,
                    calendar.timeInMillis,
                    AlarmManager.INTERVAL_DAY,
                    pendingIntent
                )
            } else {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    calendar.timeInMillis,
                    pendingIntent
                )
            }
        } else {
            // Fallback for devices that don't allow exact alarms
            alarmManager.setAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                calendar.timeInMillis,
                pendingIntent
            )
        }

        Log.d(TAG, "Time trigger registered: $time ($repeat) → fires in ${(calendar.timeInMillis - System.currentTimeMillis()) / 1000}s")
        return TimeTriggerHandle(pendingIntent, automationId)
    }

    fun unregister(handle: Any) {
        if (handle !is TimeTriggerHandle) return
        alarmManager.cancel(handle.pendingIntent)
        pendingCallbacks.remove(handle.automationId)
        Log.d(TAG, "Time trigger unregistered for automationId=${handle.automationId}")
    }

    /** Called by the BroadcastReceiver when an alarm fires. */
    fun onAlarmFired(automationId: Int) {
        pendingCallbacks[automationId]?.invoke()
    }
}

/** BroadcastReceiver that receives AlarmManager callbacks. */
class TimeTriggerReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val automationId = intent.getIntExtra("automationId", -1)
        Log.d(TAG, "TimeTriggerReceiver fired: automationId=$automationId")
        // In a full implementation, this would dispatch through the TaisService
        // to call TimeTriggerHandler.onAlarmFired(automationId)
    }
}

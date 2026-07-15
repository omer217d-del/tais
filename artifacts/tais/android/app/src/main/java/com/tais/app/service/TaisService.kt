package com.tais.app.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.tais.app.ai.AutomationParser
import com.tais.app.ai.LlamaManager
import com.tais.app.bridge.AndroidBridge
import com.tais.app.engine.AutomationEngine
import com.tais.app.engine.AutomationValidator
import com.tais.app.model.ExecutionResult
import com.tais.app.util.CrashLogger
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

private const val TAG = "TaisService"
private const val SERVICE_NOTIFICATION_ID = 1001
private const val SERVICE_CHANNEL_ID = "tais_service"
private const val SERVICE_CHANNEL_NAME = "TAIS Background Service"

/**
 * TaisService — Android Foreground Service that keeps TAIS running in background.
 *
 * This service:
 * - Initializes all TAIS subsystems (bridge, validator, engine, AI)
 * - Keeps trigger listeners alive when the app is backgrounded
 * - Shows a persistent notification as required by Android foreground service rules
 * - Manages the lifecycle of AutomationEngine
 */
class TaisService : Service() {

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    private var bridge: AndroidBridge? = null
    private var validator: AutomationValidator? = null
    private var engine: AutomationEngine? = null
    private var llamaManager: LlamaManager? = null
    private var parser: AutomationParser? = null

    override fun onCreate() {
        super.onCreate()
        CrashLogger.log(this, TAG, "onCreate: start")

        try {
            setupNotificationChannel()
            startForeground(SERVICE_NOTIFICATION_ID, buildServiceNotification())
            CrashLogger.log(this, TAG, "onCreate: foreground notification shown")
        } catch (e: Exception) {
            CrashLogger.logError(this, TAG, "onCreate: failed to start foreground", e)
        }

        try {
            bridge = AndroidBridge(this)
            CrashLogger.log(this, TAG, "onCreate: AndroidBridge created")
        } catch (e: Exception) {
            CrashLogger.logError(this, TAG, "onCreate: AndroidBridge creation failed", e)
        }

        try {
            validator = AutomationValidator(this)
            CrashLogger.log(this, TAG, "onCreate: AutomationValidator created")
        } catch (e: Exception) {
            CrashLogger.logError(this, TAG, "onCreate: AutomationValidator creation failed", e)
        }

        try {
            llamaManager = LlamaManager(this)
            CrashLogger.log(this, TAG, "onCreate: LlamaManager created")
        } catch (e: Exception) {
            CrashLogger.logError(this, TAG, "onCreate: LlamaManager creation failed", e)
        }

        try {
            parser = AutomationParser()
            CrashLogger.log(this, TAG, "onCreate: AutomationParser created")
        } catch (e: Exception) {
            CrashLogger.logError(this, TAG, "onCreate: AutomationParser creation failed", e)
        }

        val currentBridge = bridge
        val currentValidator = validator
        if (currentBridge != null && currentValidator != null) {
            try {
                engine = AutomationEngine(
                    context = this,
                    bridge = currentBridge,
                    validator = currentValidator,
                    onExecutionComplete = { automationId, result ->
                        onAutomationExecuted(automationId, result)
                    }
                )
                CrashLogger.log(this, TAG, "onCreate: AutomationEngine created")
            } catch (e: Exception) {
                CrashLogger.logError(this, TAG, "onCreate: AutomationEngine creation failed", e)
            }
        } else {
            CrashLogger.log(this, TAG, "onCreate: skipping AutomationEngine (bridge or validator missing)")
        }

        CrashLogger.log(this, TAG, "onCreate: finished successfully")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_RELOAD_AUTOMATIONS -> reloadAutomations()
            ACTION_STOP -> stopSelf()
        }
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        CrashLogger.log(this, TAG, "onDestroy: start")
        try {
            engine?.shutdown()
            bridge?.destroy()
            llamaManager?.unloadModel()
            serviceScope.cancel()
        } catch (e: Exception) {
            CrashLogger.logError(this, TAG, "onDestroy: cleanup failed", e)
        }
        super.onDestroy()
    }

    // ─── Internal ─────────────────────────────────────────────────────────

    private fun reloadAutomations() {
        serviceScope.launch {
            // In production, this fetches automations from local Room DB.
            // Currently a no-op placeholder — will be wired to Room in a subsequent milestone.
            Log.d(TAG, "Automations reloaded")
        }
    }

    private fun onAutomationExecuted(automationId: Int, result: ExecutionResult) {
        when (result) {
            is ExecutionResult.Success ->
                Log.i(TAG, "Automation $automationId executed: ${result.message}")
            is ExecutionResult.Failure ->
                Log.e(TAG, "Automation $automationId failed: ${result.error}")
            is ExecutionResult.PermissionDenied ->
                Log.w(TAG, "Automation $automationId denied — missing permission: ${result.permission}")
            is ExecutionResult.RequiresConfirmation ->
                Log.d(TAG, "Automation $automationId requires confirmation: ${result.message}")
        }
    }

    private fun buildServiceNotification(): Notification {
        return NotificationCompat.Builder(this, SERVICE_CHANNEL_ID)
            .setContentTitle("TAIS çalışıyor")
            .setContentText("Otomasyon motoru aktif — tetikleyiciler izleniyor")
            .setSmallIcon(android.R.drawable.ic_menu_preferences)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setSilent(true)
            .build()
    }

    private fun setupNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                SERVICE_CHANNEL_ID,
                SERVICE_CHANNEL_NAME,
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "TAIS arka plan servisi"
                setShowBadge(false)
            }
            val manager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    companion object {
        const val ACTION_RELOAD_AUTOMATIONS = "com.tais.app.RELOAD_AUTOMATIONS"
        const val ACTION_STOP = "com.tais.app.STOP_SERVICE"
    }
}

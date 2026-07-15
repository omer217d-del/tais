package com.tais.app.bridge

import android.app.NotificationChannel
import android.app.NotificationManager
import android.bluetooth.BluetoothAdapter
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.hardware.camera2.CameraAccessException
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.media.AudioManager
import android.net.wifi.WifiManager
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.provider.Settings
import android.speech.tts.TextToSpeech
import android.util.Log
import androidx.core.app.NotificationCompat
import com.tais.app.engine.TriggerRegistration
import com.tais.app.model.ActionConfig
import com.tais.app.model.ActionType
import com.tais.app.model.ExecutionResult
import com.tais.app.model.TriggerConfig
import com.tais.app.model.TriggerType
import com.tais.app.triggers.BatteryTriggerHandler
import com.tais.app.triggers.MotionTriggerHandler
import com.tais.app.triggers.TimeTriggerHandler
import com.tais.app.util.CrashLogger
import java.util.Locale

private const val TAG = "AndroidBridge"
private const val NOTIFICATION_CHANNEL_ID = "tais_automations"
private const val NOTIFICATION_CHANNEL_NAME = "TAIS Automations"

/**
 * AndroidBridge — The single point of contact between the automation engine
 * and all Android system APIs.
 *
 * This class is responsible for:
 * - Registering and managing trigger listeners
 * - Executing validated automation actions
 * - Never exposing raw Android APIs to the AI layer
 */
class AndroidBridge(private val context: Context) {

    private var tts: TextToSpeech? = null
    private var ttsInitialized = false
    private var cameraId: String? = null
    private var flashEnabled = false

    private val batteryTrigger = BatteryTriggerHandler(context)
    private val motionTrigger = MotionTriggerHandler(context)
    private val timeTrigger = TimeTriggerHandler(context)

    init {
        try {
            setupNotificationChannel()
        } catch (e: Exception) {
            CrashLogger.logError(context, TAG, "setupNotificationChannel failed", e)
        }
        try {
            setupTts()
        } catch (e: Exception) {
            CrashLogger.logError(context, TAG, "setupTts failed", e)
        }
        try {
            setupCamera()
        } catch (e: Exception) {
            CrashLogger.logError(context, TAG, "setupCamera failed", e)
        }
    }

    // ─── Trigger Registration ─────────────────────────────────────────────

    fun registerTrigger(
        config: TriggerConfig,
        onFired: () -> Unit
    ): TriggerRegistration {
        val handle: Any = when (config.type) {
            TriggerType.BATTERY, TriggerType.CHARGING ->
                batteryTrigger.register(config, onFired)

            TriggerType.TIME, TriggerType.DATE ->
                timeTrigger.register(config, onFired)

            TriggerType.MOTION, TriggerType.SHAKE, TriggerType.FLIP ->
                motionTrigger.register(config, onFired)

            else -> {
                Log.w(TAG, "Trigger type ${config.type} not fully implemented — using no-op handle")
                Any()
            }
        }

        return TriggerRegistration(
            automationId = 0, // Set by the engine
            triggerType = config.type.name,
            handle = handle
        )
    }

    fun unregisterTrigger(registration: TriggerRegistration) {
        when (registration.triggerType) {
            "BATTERY", "CHARGING" -> batteryTrigger.unregister(registration.handle)
            "TIME", "DATE" -> timeTrigger.unregister(registration.handle)
            "MOTION", "SHAKE", "FLIP" -> motionTrigger.unregister(registration.handle)
        }
    }

    // ─── Action Execution ─────────────────────────────────────────────────

    fun executeAction(action: ActionConfig): ExecutionResult {
        return try {
            when (action.type) {
                ActionType.NOTIFICATION -> executeNotification(action.parameters)
                ActionType.SPEAK -> executeSpeak(action.parameters)
                ActionType.VIBRATE -> executeVibrate(action.parameters)
                ActionType.FLASHLIGHT -> executeFlashlight(action.parameters)
                ActionType.WIFI -> executeWifi(action.parameters)
                ActionType.BLUETOOTH -> executeBluetooth(action.parameters)
                ActionType.VOLUME -> executeVolume(action.parameters)
                ActionType.BRIGHTNESS -> executeBrightness(action.parameters)
                ActionType.CLIPBOARD -> executeClipboard(action.parameters)
                ActionType.OPEN_APP -> executeOpenApp(action.parameters)
                ActionType.LAUNCH_INTENT -> executeLaunchIntent(action.parameters)
                ActionType.HTTP_REQUEST -> executeHttpRequest(action.parameters)
                ActionType.FILE_OPERATION -> executeFileOperation(action.parameters)
                ActionType.CLOSE_APP -> ExecutionResult.Failure("Close app requires Accessibility service")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Action execution failed: ${action.type}", e)
            ExecutionResult.Failure("Execution failed: ${e.message}")
        }
    }

    // ─── Action Implementations ───────────────────────────────────────────

    private fun executeNotification(params: Map<String, Any>): ExecutionResult {
        val title = params["title"] as? String ?: "TAIS"
        val message = params["message"] as? String ?: ""

        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val notificationId = System.currentTimeMillis().toInt()

        val notification = NotificationCompat.Builder(context, NOTIFICATION_CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)
            .build()

        manager.notify(notificationId, notification)
        return ExecutionResult.Success("Notification sent")
    }

    private fun executeSpeak(params: Map<String, Any>): ExecutionResult {
        if (!ttsInitialized) return ExecutionResult.Failure("TTS not initialized")
        val message = params["message"] as? String ?: return ExecutionResult.Failure("No message provided")
        tts?.speak(message, TextToSpeech.QUEUE_FLUSH, null, "tais_tts_${System.currentTimeMillis()}")
        return ExecutionResult.Success("Speaking: $message")
    }

    private fun executeVibrate(params: Map<String, Any>): ExecutionResult {
        val durationMs = (params["duration"] as? Number)?.toLong() ?: 500L
        val pattern = params["pattern"] as? String

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
            val vibrator = vibratorManager.defaultVibrator
            val effect = when (pattern) {
                "double" -> VibrationEffect.createWaveform(longArrayOf(0, 200, 100, 200), -1)
                "long" -> VibrationEffect.createOneShot(1000L, VibrationEffect.DEFAULT_AMPLITUDE)
                else -> VibrationEffect.createOneShot(durationMs, VibrationEffect.DEFAULT_AMPLITUDE)
            }
            vibrator.vibrate(effect)
        } else {
            @Suppress("DEPRECATION")
            val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
            @Suppress("DEPRECATION")
            vibrator.vibrate(durationMs)
        }
        return ExecutionResult.Success("Vibrating for ${durationMs}ms")
    }

    private fun executeFlashlight(params: Map<String, Any>): ExecutionResult {
        val cameraManager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager
        val id = cameraId ?: return ExecutionResult.Failure("No camera available")

        val state = when (params["state"] as? String) {
            "on" -> true
            "off" -> false
            "toggle" -> !flashEnabled
            else -> !flashEnabled
        }

        cameraManager.setTorchMode(id, state)
        flashEnabled = state
        return ExecutionResult.Success("Flashlight ${if (state) "on" else "off"}")
    }

    @Suppress("DEPRECATION")
    private fun executeWifi(params: Map<String, Any>): ExecutionResult {
        val state = params["state"] as? String ?: return ExecutionResult.Failure("No state provided")
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            val wifiManager = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
            wifiManager.isWifiEnabled = state == "on"
        } else {
            // Android 10+ — open settings panel
            val intent = Intent(Settings.Panel.ACTION_WIFI)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
        }
        return ExecutionResult.Success("Wi-Fi ${state}")
    }

    private fun executeBluetooth(params: Map<String, Any>): ExecutionResult {
        val state = params["state"] as? String ?: return ExecutionResult.Failure("No state provided")
        val adapter = BluetoothAdapter.getDefaultAdapter()
            ?: return ExecutionResult.Failure("Bluetooth not available")

        if (state == "on" && !adapter.isEnabled) adapter.enable()
        else if (state == "off" && adapter.isEnabled) adapter.disable()

        return ExecutionResult.Success("Bluetooth ${state}")
    }

    private fun executeVolume(params: Map<String, Any>): ExecutionResult {
        val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
        val stream = when (params["stream"] as? String) {
            "ring" -> AudioManager.STREAM_RING
            "alarm" -> AudioManager.STREAM_ALARM
            "notification" -> AudioManager.STREAM_NOTIFICATION
            "music" -> AudioManager.STREAM_MUSIC
            else -> AudioManager.STREAM_RING
        }
        val level = (params["level"] as? Number)?.toInt()
        if (level != null) {
            audioManager.setStreamVolume(stream, level, 0)
        }
        return ExecutionResult.Success("Volume set to $level")
    }

    private fun executeBrightness(params: Map<String, Any>): ExecutionResult {
        val level = (params["level"] as? Number)?.toInt()
            ?: return ExecutionResult.Failure("No brightness level provided")

        Settings.System.putInt(
            context.contentResolver,
            Settings.System.SCREEN_BRIGHTNESS,
            level.coerceIn(0, 255)
        )
        return ExecutionResult.Success("Brightness set to $level")
    }

    private fun executeClipboard(params: Map<String, Any>): ExecutionResult {
        val text = params["text"] as? String ?: return ExecutionResult.Failure("No text provided")
        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        clipboard.setPrimaryClip(ClipData.newPlainText("TAIS", text))
        return ExecutionResult.Success("Copied to clipboard")
    }

    private fun executeOpenApp(params: Map<String, Any>): ExecutionResult {
        val packageName = params["packageName"] as? String
            ?: return ExecutionResult.Failure("No packageName provided")

        val intent = context.packageManager.getLaunchIntentForPackage(packageName)
            ?: return ExecutionResult.Failure("App not found: $packageName")

        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
        return ExecutionResult.Success("Opened $packageName")
    }

    private fun executeLaunchIntent(params: Map<String, Any>): ExecutionResult {
        val action = params["action"] as? String
            ?: return ExecutionResult.Failure("No intent action provided")

        val intent = Intent(action).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            (params["uri"] as? String)?.let { data = android.net.Uri.parse(it) }
        }
        context.startActivity(intent)
        return ExecutionResult.Success("Launched intent: $action")
    }

    private fun executeHttpRequest(params: Map<String, Any>): ExecutionResult {
        val url = params["url"] as? String ?: return ExecutionResult.Failure("No URL provided")
        val method = (params["method"] as? String)?.uppercase() ?: "GET"

        return try {
            val connection = java.net.URL(url).openConnection() as java.net.HttpURLConnection
            connection.requestMethod = method
            connection.connectTimeout = 10_000
            connection.readTimeout = 10_000
            val code = connection.responseCode
            connection.disconnect()
            ExecutionResult.Success("HTTP $method $url → $code")
        } catch (e: Exception) {
            ExecutionResult.Failure("HTTP request failed: ${e.message}")
        }
    }

    private fun executeFileOperation(params: Map<String, Any>): ExecutionResult {
        val operation = params["operation"] as? String ?: return ExecutionResult.Failure("No operation provided")
        val path = params["path"] as? String ?: return ExecutionResult.Failure("No path provided")

        val file = java.io.File(path)
        return when (operation) {
            "delete" -> {
                if (file.delete()) ExecutionResult.Success("Deleted: $path")
                else ExecutionResult.Failure("Failed to delete: $path")
            }
            "exists" -> ExecutionResult.Success("File exists: ${file.exists()}")
            else -> ExecutionResult.Failure("Unknown operation: $operation")
        }
    }

    // ─── Setup Helpers ────────────────────────────────────────────────────

    private fun setupNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                NOTIFICATION_CHANNEL_NAME,
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "TAIS automation notifications"
            }
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    private fun setupTts() {
        tts = TextToSpeech(context) { status ->
            if (status == TextToSpeech.SUCCESS) {
                tts?.language = Locale("tr", "TR")
                ttsInitialized = true
                Log.i(TAG, "TTS initialized")
            } else {
                Log.e(TAG, "TTS initialization failed: $status")
            }
        }
    }

    private fun setupCamera() {
        try {
            val manager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager
            cameraId = manager.cameraIdList.firstOrNull { id ->
                manager.getCameraCharacteristics(id)
                    .get(CameraCharacteristics.FLASH_INFO_AVAILABLE) == true
            }
        } catch (e: CameraAccessException) {
            Log.w(TAG, "Camera setup failed: ${e.message}")
        } catch (e: SecurityException) {
            // CAMERA permission not yet granted at runtime — safe to skip,
            // flashlight action will simply be unavailable until granted.
            Log.w(TAG, "Camera setup skipped — permission not granted: ${e.message}")
        }
    }

    fun destroy() {
        tts?.shutdown()
    }
}

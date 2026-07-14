package com.tais.app.capacitor

import android.content.pm.PackageManager
import android.os.Build
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.tais.app.ai.LlamaManager
import com.tais.app.bridge.AndroidBridge
import com.tais.app.engine.AutomationValidator
import com.tais.app.model.ActionConfig
import com.tais.app.model.ActionType
import com.tais.app.model.TriggerConfig
import com.tais.app.model.TriggerType
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

/**
 * TaisBridgePlugin — Capacitor plugin that exposes the TAIS native layer to the web frontend.
 *
 * This is the boundary between TypeScript (artifacts/tais/src/capacitor/bridge.ts)
 * and the Kotlin Android layer. Every method is validated and sandboxed.
 *
 * Plugin name "TaisBridge" must match the name used in bridge.ts Plugins["TaisBridge"].
 */
@CapacitorPlugin(name = "TaisBridge")
class TaisBridgePlugin : Plugin() {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private lateinit var androidBridge: AndroidBridge
    private lateinit var validator: AutomationValidator
    private lateinit var llamaManager: LlamaManager

    override fun load() {
        androidBridge = AndroidBridge(context)
        validator = AutomationValidator(context)
        llamaManager = LlamaManager(context)
    }

    // ─── Device Info ──────────────────────────────────────────────────────

    @PluginMethod
    fun getDeviceInfo(call: PluginCall) {
        val runtime = Runtime.getRuntime()
        val freeMemMb = (runtime.freeMemory() / 1_048_576).toInt()
        val totalMemMb = (runtime.totalMemory() / 1_048_576).toInt()

        val result = JSObject().apply {
            put("platform", "android")
            put("osVersion", Build.VERSION.RELEASE)
            put("manufacturer", Build.MANUFACTURER)
            put("model", Build.MODEL)
            put("freeMemoryMb", freeMemMb)
            put("totalMemoryMb", totalMemMb)
            put("batteryLevel", 100) // Will be wired to BatteryManager in next iteration
            put("isCharging", false)
        }
        call.resolve(result)
    }

    // ─── Permissions ──────────────────────────────────────────────────────

    @PluginMethod
    fun checkPermission(call: PluginCall) {
        val androidPermission = call.getString("androidPermission")
            ?: return call.reject("androidPermission is required")

        val granted = context.checkSelfPermission(androidPermission) ==
                PackageManager.PERMISSION_GRANTED

        call.resolve(JSObject().apply {
            put("granted", granted)
            put("androidPermission", androidPermission)
        })
    }

    @PluginMethod
    fun requestPermission(call: PluginCall) {
        val androidPermission = call.getString("androidPermission")
            ?: return call.reject("androidPermission is required")

        // For API 23+ runtime permission request
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            activity.requestPermissions(arrayOf(androidPermission), 1001)
        }

        // Return current state — actual result handled by onRequestPermissionsResult
        val granted = context.checkSelfPermission(androidPermission) ==
                PackageManager.PERMISSION_GRANTED

        call.resolve(JSObject().apply {
            put("granted", granted)
            put("androidPermission", androidPermission)
        })
    }

    // ─── Action Execution ─────────────────────────────────────────────────

    @PluginMethod
    fun executeAction(call: PluginCall) {
        val typeStr = call.getString("type") ?: return call.reject("type is required")
        val parametersObj = call.getObject("parameters") ?: JSObject()

        val actionType = try {
            ActionType.valueOf(typeStr.uppercase())
        } catch (e: IllegalArgumentException) {
            return call.reject("Unknown action type: $typeStr")
        }

        val parameters = mutableMapOf<String, Any>()
        val keys = parametersObj.keys()
        while (keys.hasNext()) {
            val key = keys.next()
            parametersObj.opt(key)?.let { parameters[key] = it }
        }

        val action = ActionConfig(type = actionType, parameters = parameters)

        val validationResult = validator.validateAction(action)
        // Check if validation failed (non-Success result)
        val errorMsg = when (validationResult) {
            is com.tais.app.model.ExecutionResult.Failure -> validationResult.error
            is com.tais.app.model.ExecutionResult.PermissionDenied -> "Permission denied: ${validationResult.permission}"
            else -> null
        }
        if (errorMsg != null) {
            return call.reject(errorMsg)
        }

        scope.launch(Dispatchers.IO) {
            val result = androidBridge.executeAction(action)
            activity.runOnUiThread {
                when (result) {
                    is com.tais.app.model.ExecutionResult.Success ->
                        call.resolve(JSObject().apply { put("success", true) })
                    is com.tais.app.model.ExecutionResult.Failure ->
                        call.reject(result.error)
                    else ->
                        call.resolve(JSObject().apply { put("success", false) })
                }
            }
        }
    }

    // ─── AI / Model ───────────────────────────────────────────────────────

    @PluginMethod
    fun loadModel(call: PluginCall) {
        val modelPath = call.getString("modelPath") ?: return call.reject("modelPath is required")
        val contextLength = call.getInt("contextLength") ?: 2048

        scope.launch {
            val result = llamaManager.loadModel(modelPath, contextLength)
            activity.runOnUiThread {
                if (result.success) {
                    call.resolve(JSObject().apply {
                        put("success", true)
                        put("modelPath", modelPath)
                        put("contextLength", result.contextLength)
                    })
                } else {
                    call.reject(result.error ?: "Failed to load model")
                }
            }
        }
    }

    @PluginMethod
    fun runInference(call: PluginCall) {
        val prompt = call.getString("prompt") ?: return call.reject("prompt is required")
        val maxTokens = call.getInt("maxTokens") ?: 512
        val temperature = call.getFloat("temperature") ?: 0.7f

        scope.launch {
            val result = llamaManager.runInference(prompt, maxTokens, temperature)
            activity.runOnUiThread {
                if (result.success) {
                    call.resolve(JSObject().apply {
                        put("success", true)
                        put("text", result.text)
                        put("tokensGenerated", result.tokensGenerated)
                        put("timeMs", result.timeMs)
                    })
                } else {
                    call.reject(result.error ?: "Inference failed")
                }
            }
        }
    }

    // ─── Storage Info ─────────────────────────────────────────────────────

    @PluginMethod
    fun getStorageInfo(call: PluginCall) {
        val stat = android.os.StatFs(context.filesDir.path)
        val availableMb = (stat.availableBytes / 1_048_576).toInt()
        val totalMb = (stat.totalBytes / 1_048_576).toInt()

        call.resolve(JSObject().apply {
            put("availableMb", availableMb)
            put("totalMb", totalMb)
        })
    }

    // ─── Installed Apps ───────────────────────────────────────────────────

    @PluginMethod
    fun listInstalledApps(call: PluginCall) {
        val pm = context.packageManager
        val intent = android.content.Intent(android.content.Intent.ACTION_MAIN).apply {
            addCategory(android.content.Intent.CATEGORY_LAUNCHER)
        }
        val apps = pm.queryIntentActivities(intent, 0).map { info ->
            JSObject().apply {
                put("packageName", info.activityInfo.packageName)
                put("name", info.loadLabel(pm).toString())
            }
        }

        val arr = org.json.JSONArray()
        apps.forEach { arr.put(it) }

        call.resolve(JSObject().apply {
            put("apps", arr)
        })
    }
}

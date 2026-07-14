package com.tais.app.engine

import android.content.Context
import com.tais.app.model.ActionConfig
import com.tais.app.model.ActionType
import com.tais.app.model.ExecutionResult
import com.tais.app.model.TriggerConfig
import com.tais.app.model.TriggerType

/**
 * AutomationValidator — Security boundary between the AI layer and Android APIs.
 *
 * The AI NEVER calls Android APIs directly. All automation requests pass through
 * this validator before reaching the AutomationEngine. Risky operations require
 * user confirmation; destructive operations are blocked entirely.
 */
class AutomationValidator(private val context: Context) {

    // Actions that require user confirmation before execution
    private val confirmationRequired: Set<ActionType> = setOf(
        ActionType.CLOSE_APP,
        ActionType.LAUNCH_INTENT,
        ActionType.FILE_OPERATION,
        ActionType.HTTP_REQUEST
    )

    // Actions that are blocked entirely for safety
    private val blockedActions: Set<ActionType> = setOf(
        // None currently blocked — all pass through confirmation
    )

    // Required Android permissions per action type
    private val actionPermissions: Map<ActionType, List<String>> = mapOf(
        ActionType.NOTIFICATION to listOf("android.permission.POST_NOTIFICATIONS"),
        ActionType.SPEAK to listOf("android.permission.RECORD_AUDIO"),
        ActionType.VIBRATE to listOf("android.permission.VIBRATE"),
        ActionType.FLASHLIGHT to listOf("android.permission.CAMERA"),
        ActionType.WIFI to listOf("android.permission.CHANGE_WIFI_STATE"),
        ActionType.BLUETOOTH to listOf("android.permission.BLUETOOTH_CONNECT"),
        ActionType.CLIPBOARD to emptyList(),
        ActionType.VOLUME to emptyList(),
        ActionType.BRIGHTNESS to emptyList(),
        ActionType.HTTP_REQUEST to listOf("android.permission.INTERNET"),
        ActionType.FILE_OPERATION to listOf("android.permission.WRITE_EXTERNAL_STORAGE"),
        ActionType.OPEN_APP to emptyList(),
        ActionType.CLOSE_APP to emptyList(),
        ActionType.LAUNCH_INTENT to emptyList()
    )

    private val triggerPermissions: Map<TriggerType, List<String>> = mapOf(
        TriggerType.LOCATION to listOf(
            "android.permission.ACCESS_FINE_LOCATION",
            "android.permission.ACCESS_BACKGROUND_LOCATION"
        ),
        TriggerType.BLUETOOTH to listOf("android.permission.BLUETOOTH_CONNECT"),
        TriggerType.NFC to listOf("android.permission.NFC"),
        TriggerType.MOTION to listOf("android.permission.BODY_SENSORS"),
        TriggerType.SHAKE to listOf("android.permission.BODY_SENSORS"),
        TriggerType.NOTIFICATION to emptyList(),
        TriggerType.BATTERY to emptyList(),
        TriggerType.CHARGING to emptyList(),
        TriggerType.TIME to emptyList(),
        TriggerType.DATE to emptyList(),
        TriggerType.WIFI to listOf("android.permission.ACCESS_WIFI_STATE"),
        TriggerType.HEADSET to emptyList(),
        TriggerType.FLIP to emptyList(),
        TriggerType.APP_OPEN to emptyList(),
        TriggerType.APP_CLOSE to emptyList()
    )

    /**
     * Validate a trigger configuration before registering it.
     * Returns null on success, or an error string on failure.
     */
    fun validateTrigger(trigger: TriggerConfig): String? {
        val requiredPermissions = triggerPermissions[trigger.type] ?: emptyList()
        for (permission in requiredPermissions) {
            if (!hasPermission(permission)) {
                return "Permission required: $permission"
            }
        }
        return validateTriggerParameters(trigger)
    }

    /**
     * Validate an action configuration before executing it.
     */
    fun validateAction(action: ActionConfig): ExecutionResult {
        if (action.type in blockedActions) {
            return ExecutionResult.Failure("Action type '${action.type}' is not permitted.", recoverable = false)
        }

        val requiredPermissions = actionPermissions[action.type] ?: emptyList()
        for (permission in requiredPermissions) {
            if (!hasPermission(permission)) {
                return ExecutionResult.PermissionDenied(permission)
            }
        }

        val paramError = validateActionParameters(action)
        if (paramError != null) {
            return ExecutionResult.Failure(paramError)
        }

        return ExecutionResult.Success()
    }

    /**
     * Check whether an action requires user confirmation.
     */
    fun requiresConfirmation(action: ActionConfig): Boolean =
        action.type in confirmationRequired

    // ─── Parameter Validation ─────────────────────────────────────────────

    private fun validateTriggerParameters(trigger: TriggerConfig): String? {
        return when (trigger.type) {
            TriggerType.BATTERY -> {
                val level = trigger.parameters["level"]
                if (level == null) return "Battery trigger requires 'level' parameter"
                val levelInt = (level as? Number)?.toInt() ?: return "Battery level must be a number"
                if (levelInt !in 1..100) return "Battery level must be between 1 and 100"
                null
            }
            TriggerType.TIME -> {
                val time = trigger.parameters["time"] as? String
                    ?: return "Time trigger requires 'time' parameter (HH:mm)"
                if (!time.matches(Regex("\\d{2}:\\d{2}"))) return "Time must be in HH:mm format"
                null
            }
            else -> null
        }
    }

    private fun validateActionParameters(action: ActionConfig): String? {
        return when (action.type) {
            ActionType.VOLUME -> {
                val level = action.parameters["level"]
                if (level != null) {
                    val levelInt = (level as? Number)?.toInt() ?: return "Volume level must be a number"
                    if (levelInt !in 0..15) return "Volume level must be between 0 and 15"
                }
                null
            }
            ActionType.BRIGHTNESS -> {
                val level = action.parameters["level"]
                if (level != null) {
                    val levelInt = (level as? Number)?.toInt() ?: return "Brightness level must be a number"
                    if (levelInt !in 0..255) return "Brightness level must be between 0 and 255"
                }
                null
            }
            ActionType.HTTP_REQUEST -> {
                val url = action.parameters["url"] as? String
                    ?: return "HTTP request action requires 'url' parameter"
                if (!url.startsWith("https://")) return "HTTP request URL must use HTTPS"
                null
            }
            else -> null
        }
    }

    private fun hasPermission(permission: String): Boolean {
        val result = context.checkSelfPermission(permission)
        return result == android.content.pm.PackageManager.PERMISSION_GRANTED
    }
}

package com.tais.app.model

import com.google.gson.annotations.SerializedName

// ─── Trigger Configuration ─────────────────────────────────────────────────

enum class TriggerType {
    @SerializedName("battery")      BATTERY,
    @SerializedName("charging")     CHARGING,
    @SerializedName("time")         TIME,
    @SerializedName("date")         DATE,
    @SerializedName("location")     LOCATION,
    @SerializedName("bluetooth")    BLUETOOTH,
    @SerializedName("wifi")         WIFI,
    @SerializedName("headset")      HEADSET,
    @SerializedName("motion")       MOTION,
    @SerializedName("shake")        SHAKE,
    @SerializedName("flip")         FLIP,
    @SerializedName("app_open")     APP_OPEN,
    @SerializedName("app_close")    APP_CLOSE,
    @SerializedName("notification") NOTIFICATION,
    @SerializedName("nfc")          NFC
}

enum class ActionType {
    @SerializedName("notification")   NOTIFICATION,
    @SerializedName("speak")          SPEAK,
    @SerializedName("vibrate")        VIBRATE,
    @SerializedName("flashlight")     FLASHLIGHT,
    @SerializedName("open_app")       OPEN_APP,
    @SerializedName("close_app")      CLOSE_APP,
    @SerializedName("volume")         VOLUME,
    @SerializedName("brightness")     BRIGHTNESS,
    @SerializedName("wifi")           WIFI,
    @SerializedName("bluetooth")      BLUETOOTH,
    @SerializedName("clipboard")      CLIPBOARD,
    @SerializedName("launch_intent")  LAUNCH_INTENT,
    @SerializedName("http_request")   HTTP_REQUEST,
    @SerializedName("file_operation") FILE_OPERATION
}

data class TriggerConfig(
    val type: TriggerType,
    val parameters: Map<String, Any> = emptyMap()
)

data class ActionConfig(
    val type: ActionType,
    val parameters: Map<String, Any> = emptyMap()
)

// ─── Automation ────────────────────────────────────────────────────────────

data class Automation(
    val id: Int,
    val name: String,
    val description: String?,
    val naturalLanguageInput: String,
    val trigger: TriggerConfig,
    val action: ActionConfig,
    val enabled: Boolean,
    val executionCount: Int,
    val lastExecutedAt: String?,
    val createdAt: String,
    val updatedAt: String
)

// ─── Plugin Manifest ───────────────────────────────────────────────────────

data class PluginManifest(
    val id: String,
    val name: String,
    val version: String,
    val description: String,
    val author: String?,
    val permissions: List<String> = emptyList(),
    val triggers: List<String> = emptyList(),
    val actions: List<String> = emptyList(),
    val minAppVersion: String?,
    val homepage: String?
)

// ─── Execution Result ──────────────────────────────────────────────────────

sealed class ExecutionResult {
    data class Success(val message: String = "OK") : ExecutionResult()
    data class Failure(val error: String, val recoverable: Boolean = true) : ExecutionResult()
    data class PermissionDenied(val permission: String) : ExecutionResult()
    data class RequiresConfirmation(val message: String, val automationId: Int) : ExecutionResult()
}

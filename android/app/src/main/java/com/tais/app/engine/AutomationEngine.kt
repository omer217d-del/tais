package com.tais.app.engine

import android.content.Context
import android.util.Log
import com.tais.app.bridge.AndroidBridge
import com.tais.app.model.ActionConfig
import com.tais.app.model.Automation
import com.tais.app.model.ExecutionResult
import com.tais.app.model.TriggerConfig
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

private const val TAG = "AutomationEngine"

/**
 * AutomationEngine — Core orchestrator for TAIS automation execution.
 *
 * Architecture:
 *   AI Output → AutomationValidator → AutomationEngine → AndroidBridge → Android APIs
 *
 * The engine never receives raw AI output; it only receives validated
 * Automation objects. All permission checks and parameter validation
 * are performed by AutomationValidator before reaching this layer.
 */
class AutomationEngine(
    private val context: Context,
    private val bridge: AndroidBridge,
    private val validator: AutomationValidator,
    private val onExecutionComplete: (automationId: Int, result: ExecutionResult) -> Unit
) {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private val registeredTriggers = mutableMapOf<Int, TriggerRegistration>()

    // ─── Public API ───────────────────────────────────────────────────────

    /** Register trigger listeners for all enabled automations. */
    fun registerAutomations(automations: List<Automation>) {
        automations.filter { it.enabled }.forEach { automation ->
            registerAutomation(automation)
        }
        Log.i(TAG, "Registered ${automations.count { it.enabled }} automations")
    }

    /** Register a single automation's trigger. */
    fun registerAutomation(automation: Automation) {
        val validationError = validator.validateTrigger(automation.trigger)
        if (validationError != null) {
            Log.w(TAG, "Trigger validation failed for automation ${automation.id}: $validationError")
            return
        }

        val registration = bridge.registerTrigger(automation.trigger) {
            onTriggerFired(automation)
        }

        registeredTriggers[automation.id] = registration
        Log.d(TAG, "Registered trigger for automation '${automation.name}' (id=${automation.id})")
    }

    /** Unregister a specific automation's trigger. */
    fun unregisterAutomation(automationId: Int) {
        registeredTriggers.remove(automationId)?.let { registration ->
            bridge.unregisterTrigger(registration)
            Log.d(TAG, "Unregistered trigger for automation id=$automationId")
        }
    }

    /** Execute an action immediately (for testing). */
    suspend fun executeActionNow(action: ActionConfig): ExecutionResult {
        val validationResult = validator.validateAction(action)
        if (validationResult !is ExecutionResult.Success) {
            return validationResult
        }
        return withContext(Dispatchers.IO) {
            bridge.executeAction(action)
        }
    }

    /** Unregister all triggers and stop the engine. */
    fun shutdown() {
        registeredTriggers.values.forEach { bridge.unregisterTrigger(it) }
        registeredTriggers.clear()
        Log.i(TAG, "AutomationEngine shut down")
    }

    // ─── Internal ─────────────────────────────────────────────────────────

    private fun onTriggerFired(automation: Automation) {
        Log.d(TAG, "Trigger fired for '${automation.name}' (id=${automation.id})")

        scope.launch {
            val result = executeAction(automation)
            withContext(Dispatchers.Main) {
                onExecutionComplete(automation.id, result)
            }
        }
    }

    private suspend fun executeAction(automation: Automation): ExecutionResult {
        val validationResult = validator.validateAction(automation.action)
        if (validationResult !is ExecutionResult.Success) {
            Log.w(TAG, "Action validation failed: $validationResult")
            return validationResult
        }

        if (validator.requiresConfirmation(automation.action)) {
            return ExecutionResult.RequiresConfirmation(
                "Bu işlemi onaylamak ister misiniz? Otomasyon: ${automation.name}",
                automation.id
            )
        }

        return withContext(Dispatchers.IO) {
            bridge.executeAction(automation.action)
        }
    }
}

/** Opaque handle for a registered trigger listener. */
data class TriggerRegistration(
    val automationId: Int,
    val triggerType: String,
    val handle: Any
)

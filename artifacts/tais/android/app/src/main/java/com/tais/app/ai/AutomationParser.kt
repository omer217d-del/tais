package com.tais.app.ai

import android.util.Log
import com.google.gson.Gson
import com.google.gson.JsonObject
import com.google.gson.JsonSyntaxException
import com.tais.app.model.ActionConfig
import com.tais.app.model.ActionType
import com.tais.app.model.TriggerConfig
import com.tais.app.model.TriggerType

private const val TAG = "AutomationParser"

/**
 * AutomationParser — Converts LLM inference output into structured ActionConfig / TriggerConfig.
 *
 * The parser operates in two modes:
 * 1. JSON mode: The LLM produces a structured JSON object (preferred, set via system prompt).
 * 2. Heuristic mode: Fallback regex/keyword-based parsing when JSON cannot be extracted.
 *
 * Output feeds into AutomationValidator before reaching AutomationEngine.
 * The parser never accesses Android APIs.
 */
class AutomationParser {

    private val gson = Gson()

    data class ParsedAutomation(
        val name: String,
        val trigger: TriggerConfig,
        val action: ActionConfig,
        val confidence: Float,
        val rawInput: String
    )

    data class ParseResult(
        val success: Boolean,
        val automation: ParsedAutomation? = null,
        val error: String? = null,
        val rawLlmOutput: String = ""
    )

    /**
     * Parse LLM output into a structured automation.
     * Tries JSON parsing first, falls back to heuristic parsing.
     */
    fun parse(llmOutput: String, originalInput: String): ParseResult {
        Log.d(TAG, "Parsing LLM output (${llmOutput.length} chars)")

        // Try JSON extraction first
        val jsonResult = tryParseJson(llmOutput, originalInput)
        if (jsonResult.success) return jsonResult

        // Fall back to heuristic parsing
        val heuristicResult = parseHeuristic(originalInput)
        return heuristicResult.copy(rawLlmOutput = llmOutput)
    }

    // ─── JSON Parsing ─────────────────────────────────────────────────────

    private fun tryParseJson(llmOutput: String, originalInput: String): ParseResult {
        // Extract JSON object from LLM output (may be surrounded by other text)
        val jsonString = extractJsonBlock(llmOutput)
            ?: return ParseResult(success = false, error = "No JSON block found in LLM output")

        return try {
            val json = gson.fromJson(jsonString, JsonObject::class.java)

            val name = json.get("name")?.asString ?: "Unnamed Automation"
            val confidence = json.get("confidence")?.asFloat ?: 0.8f

            val triggerJson = json.getAsJsonObject("trigger")
                ?: return ParseResult(success = false, error = "Missing 'trigger' in JSON")

            val actionJson = json.getAsJsonObject("action")
                ?: return ParseResult(success = false, error = "Missing 'action' in JSON")

            val trigger = parseTriggerJson(triggerJson)
                ?: return ParseResult(success = false, error = "Invalid trigger type")

            val action = parseActionJson(actionJson)
                ?: return ParseResult(success = false, error = "Invalid action type")

            ParseResult(
                success = true,
                automation = ParsedAutomation(
                    name = name,
                    trigger = trigger,
                    action = action,
                    confidence = confidence,
                    rawInput = originalInput
                ),
                rawLlmOutput = llmOutput
            )
        } catch (e: JsonSyntaxException) {
            Log.d(TAG, "JSON parse failed: ${e.message}")
            ParseResult(success = false, error = "JSON parse error: ${e.message}")
        }
    }

    private fun parseTriggerJson(json: JsonObject): TriggerConfig? {
        val typeStr = json.get("type")?.asString ?: return null
        val triggerType = parseTriggerType(typeStr) ?: return null
        val parameters = mutableMapOf<String, Any>()

        json.getAsJsonObject("parameters")?.entrySet()?.forEach { (key, value) ->
            parameters[key] = when {
                value.isJsonPrimitive -> {
                    val prim = value.asJsonPrimitive
                    when {
                        prim.isBoolean -> prim.asBoolean
                        prim.isNumber -> prim.asNumber
                        else -> prim.asString
                    }
                }
                else -> value.toString()
            }
        }

        return TriggerConfig(type = triggerType, parameters = parameters)
    }

    private fun parseActionJson(json: JsonObject): ActionConfig? {
        val typeStr = json.get("type")?.asString ?: return null
        val actionType = parseActionType(typeStr) ?: return null
        val parameters = mutableMapOf<String, Any>()

        json.getAsJsonObject("parameters")?.entrySet()?.forEach { (key, value) ->
            parameters[key] = when {
                value.isJsonPrimitive -> {
                    val prim = value.asJsonPrimitive
                    when {
                        prim.isBoolean -> prim.asBoolean
                        prim.isNumber -> prim.asNumber
                        else -> prim.asString
                    }
                }
                else -> value.toString()
            }
        }

        return ActionConfig(type = actionType, parameters = parameters)
    }

    // ─── Heuristic Parsing ────────────────────────────────────────────────

    private fun parseHeuristic(input: String): ParseResult {
        val lower = input.lowercase()

        val trigger = detectTriggerHeuristic(lower)
        val action = detectActionHeuristic(lower)

        if (trigger == null || action == null) {
            return ParseResult(
                success = false,
                error = "Could not determine trigger or action from: \"$input\""
            )
        }

        val name = buildAutomationName(trigger.type, action.type)

        return ParseResult(
            success = true,
            automation = ParsedAutomation(
                name = name,
                trigger = trigger,
                action = action,
                confidence = 0.6f,
                rawInput = input
            )
        )
    }

    private fun detectTriggerHeuristic(lower: String): TriggerConfig? {
        return when {
            lower.contains("şarj") && (lower.contains("takıl") || lower.contains("bağlan")) ->
                TriggerConfig(TriggerType.CHARGING, mapOf("state" to "charging"))
            lower.contains("şarj") || lower.contains("batarya") || lower.contains("pil") -> {
                val level = Regex("%(\\d+)|(\\d+)%").find(lower)?.let {
                    (it.groupValues[1].toIntOrNull() ?: it.groupValues[2].toIntOrNull()) ?: 20
                } ?: 20
                TriggerConfig(TriggerType.BATTERY, mapOf("level" to level, "comparison" to "lte"))
            }
            lower.contains("salla") || lower.contains("shake") ->
                TriggerConfig(TriggerType.SHAKE, mapOf("sensitivity" to "medium"))
            lower.contains("ters çevir") || lower.contains("flip") ->
                TriggerConfig(TriggerType.FLIP, mapOf("direction" to "face_down"))
            lower.contains("saat") -> {
                val timeMatch = Regex("(\\d{1,2})[:\\.]?(\\d{2})?").find(lower)
                val hour = timeMatch?.groupValues?.get(1) ?: "22"
                val minute = timeMatch?.groupValues?.get(2)?.takeIf { it.isNotEmpty() } ?: "00"
                TriggerConfig(TriggerType.TIME, mapOf("time" to "${hour.padStart(2,'0')}:$minute", "repeat" to "daily"))
            }
            lower.contains("eve gel") || lower.contains("konuma gel") ->
                TriggerConfig(TriggerType.LOCATION, mapOf("label" to "Ev", "radius" to 100))
            lower.contains("wifi") || lower.contains("wi-fi") ->
                TriggerConfig(TriggerType.WIFI, mapOf("state" to "connected"))
            lower.contains("bluetooth") && lower.contains("bağlan") ->
                TriggerConfig(TriggerType.BLUETOOTH, mapOf("state" to "connected"))
            lower.contains("kulaklık") ->
                TriggerConfig(TriggerType.HEADSET, mapOf("state" to "connected"))
            else -> null
        }
    }

    private fun detectActionHeuristic(lower: String): ActionConfig? {
        return when {
            lower.contains("sesli") || lower.contains("konuş") || lower.contains("söyle") ->
                ActionConfig(ActionType.SPEAK, mapOf("message" to "TAIS bildirimi"))
            lower.contains("fener") || lower.contains("flashlight") ->
                ActionConfig(ActionType.FLASHLIGHT, mapOf("state" to "toggle"))
            lower.contains("titreş") || lower.contains("vibr") ->
                ActionConfig(ActionType.VIBRATE, mapOf("duration" to 500))
            lower.contains("wifi") && (lower.contains("aç") || lower.contains("kapat")) ->
                ActionConfig(ActionType.WIFI, mapOf("state" to if (lower.contains("kapat")) "off" else "on"))
            lower.contains("bluetooth") && (lower.contains("aç") || lower.contains("kapat")) ->
                ActionConfig(ActionType.BLUETOOTH, mapOf("state" to if (lower.contains("kapat")) "off" else "on"))
            lower.contains("bildirim") || lower.contains("haber ver") ->
                ActionConfig(ActionType.NOTIFICATION, mapOf("title" to "TAIS", "message" to "Otomasyon tetiklendi"))
            lower.contains("ses") && lower.contains("kapat") ->
                ActionConfig(ActionType.VOLUME, mapOf("stream" to "ring", "level" to 0))
            else -> ActionConfig(ActionType.NOTIFICATION, mapOf("title" to "TAIS", "message" to "Otomasyon çalıştı"))
        }
    }

    // ─── Utilities ────────────────────────────────────────────────────────

    private fun extractJsonBlock(text: String): String? {
        val start = text.indexOf('{')
        if (start < 0) return null
        var depth = 0
        for (i in start until text.length) {
            when (text[i]) {
                '{' -> depth++
                '}' -> {
                    depth--
                    if (depth == 0) return text.substring(start, i + 1)
                }
            }
        }
        return null
    }

    private fun parseTriggerType(s: String): TriggerType? = try {
        TriggerType.valueOf(s.uppercase())
    } catch (e: IllegalArgumentException) { null }

    private fun parseActionType(s: String): ActionType? = try {
        ActionType.valueOf(s.uppercase())
    } catch (e: IllegalArgumentException) { null }

    private fun buildAutomationName(trigger: TriggerType, action: ActionType): String {
        val triggerLabel = when (trigger) {
            TriggerType.BATTERY -> "Batarya"
            TriggerType.CHARGING -> "Şarj"
            TriggerType.TIME -> "Zaman"
            TriggerType.SHAKE -> "Sarsıntı"
            TriggerType.FLIP -> "Ters Çevirme"
            TriggerType.LOCATION -> "Konum"
            TriggerType.WIFI -> "Wi-Fi"
            TriggerType.BLUETOOTH -> "Bluetooth"
            else -> trigger.name
        }
        val actionLabel = when (action) {
            ActionType.NOTIFICATION -> "Bildirim"
            ActionType.SPEAK -> "Sesli Bildirim"
            ActionType.FLASHLIGHT -> "El Feneri"
            ActionType.VIBRATE -> "Titreşim"
            ActionType.WIFI -> "Wi-Fi"
            ActionType.BLUETOOTH -> "Bluetooth"
            else -> action.name
        }
        return "$triggerLabel → $actionLabel"
    }

    /** Build the system prompt that instructs the LLM to return JSON. */
    fun buildSystemPrompt(): String = """
        Sen TAIS (Terminal AI System) için çalışan bir otomasyon dönüştürücüsüsün.
        
        Görevin: Kullanıcının doğal dil komutunu SADECE aşağıdaki JSON formatına dönüştürmek.
        Başka hiçbir metin yazma. Sadece JSON döndür.
        
        JSON Formatı:
        {
          "name": "Otomasyon adı",
          "trigger": {
            "type": "battery|charging|time|date|location|bluetooth|wifi|headset|motion|shake|flip|app_open|app_close|notification|nfc",
            "parameters": {}
          },
          "action": {
            "type": "notification|speak|vibrate|flashlight|open_app|volume|brightness|wifi|bluetooth|clipboard|launch_intent|http_request|file_operation",
            "parameters": {}
          },
          "confidence": 0.0-1.0
        }
        
        Kullanıcı komutu anlamsızsa: {"intent": "unknown", "confidence": 0.0}
    """.trimIndent()
}

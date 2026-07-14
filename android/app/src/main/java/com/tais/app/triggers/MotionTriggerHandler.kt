package com.tais.app.triggers

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.util.Log
import com.tais.app.model.TriggerConfig
import com.tais.app.model.TriggerType
import kotlin.math.sqrt

private const val TAG = "MotionTrigger"

// Shake detection thresholds
private const val SHAKE_THRESHOLD_GRAVITY = 2.7f
private const val SHAKE_SLOP_TIME_MS = 500L
private const val SHAKE_COUNT_RESET_TIME_MS = 3000L
private const val MIN_SHAKE_COUNT = 2

// Flip detection threshold (z-axis)
private const val FLIP_GRAVITY_THRESHOLD = 9.0f

data class MotionTriggerHandle(
    val listener: SensorEventListener,
    val sensorType: Int
)

/**
 * MotionTriggerHandler — Detects device motion events (shake, flip).
 * Uses the accelerometer sensor for efficient detection.
 */
class MotionTriggerHandler(private val context: Context) {

    private val sensorManager: SensorManager =
        context.getSystemService(Context.SENSOR_SERVICE) as SensorManager

    fun register(config: TriggerConfig, onFired: () -> Unit): MotionTriggerHandle {
        val listener = when (config.type) {
            TriggerType.SHAKE -> buildShakeListener(config, onFired)
            TriggerType.FLIP -> buildFlipListener(config, onFired)
            TriggerType.MOTION -> buildMotionListener(config, onFired)
            else -> throw IllegalArgumentException("Unsupported motion trigger: ${config.type}")
        }

        val sensor = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
        if (sensor != null) {
            sensorManager.registerListener(
                listener,
                sensor,
                SensorManager.SENSOR_DELAY_UI
            )
            Log.d(TAG, "Motion trigger registered: ${config.type}")
        } else {
            Log.w(TAG, "Accelerometer not available on this device")
        }

        return MotionTriggerHandle(listener, Sensor.TYPE_ACCELEROMETER)
    }

    fun unregister(handle: Any) {
        if (handle !is MotionTriggerHandle) return
        sensorManager.unregisterListener(handle.listener)
        Log.d(TAG, "Motion trigger unregistered")
    }

    private fun buildShakeListener(
        config: TriggerConfig,
        onFired: () -> Unit
    ): SensorEventListener {
        val sensitivity = when (config.parameters["sensitivity"] as? String) {
            "low" -> 3.5f
            "high" -> 2.0f
            else -> SHAKE_THRESHOLD_GRAVITY
        }

        var shakeCount = 0
        var lastShakeTime = 0L
        var lastResetTime = 0L
        var firedThisCycle = false

        return object : SensorEventListener {
            override fun onSensorChanged(event: SensorEvent) {
                val gX = event.values[0] / SensorManager.GRAVITY_EARTH
                val gY = event.values[1] / SensorManager.GRAVITY_EARTH
                val gZ = event.values[2] / SensorManager.GRAVITY_EARTH

                val gForce = sqrt(gX * gX + gY * gY + gZ * gZ)
                val now = System.currentTimeMillis()

                if (gForce > sensitivity) {
                    if (now - lastShakeTime > SHAKE_SLOP_TIME_MS) {
                        shakeCount++
                        lastShakeTime = now

                        if (now - lastResetTime > SHAKE_COUNT_RESET_TIME_MS) {
                            shakeCount = 1
                            firedThisCycle = false
                        }
                        lastResetTime = now

                        if (shakeCount >= MIN_SHAKE_COUNT && !firedThisCycle) {
                            firedThisCycle = true
                            Log.i(TAG, "Shake detected (count=$shakeCount, gForce=$gForce)")
                            onFired()
                        }
                    }
                }
            }

            override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
        }
    }

    private fun buildFlipListener(
        config: TriggerConfig,
        onFired: () -> Unit
    ): SensorEventListener {
        val targetDirection = config.parameters["direction"] as? String ?: "face_down"
        var lastFired = 0L

        return object : SensorEventListener {
            override fun onSensorChanged(event: SensorEvent) {
                val z = event.values[2]
                val now = System.currentTimeMillis()

                val isFaceDown = z < -FLIP_GRAVITY_THRESHOLD
                val isFaceUp = z > FLIP_GRAVITY_THRESHOLD

                val triggered = when (targetDirection) {
                    "face_down" -> isFaceDown
                    "face_up" -> isFaceUp
                    else -> isFaceDown
                }

                if (triggered && now - lastFired > 2000L) {
                    lastFired = now
                    Log.i(TAG, "Flip detected: $targetDirection (z=$z)")
                    onFired()
                }
            }

            override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
        }
    }

    private fun buildMotionListener(
        config: TriggerConfig,
        onFired: () -> Unit
    ): SensorEventListener {
        var lastFired = 0L

        return object : SensorEventListener {
            override fun onSensorChanged(event: SensorEvent) {
                val now = System.currentTimeMillis()
                val gX = event.values[0] / SensorManager.GRAVITY_EARTH
                val gY = event.values[1] / SensorManager.GRAVITY_EARTH
                val gZ = event.values[2] / SensorManager.GRAVITY_EARTH
                val gForce = sqrt(gX * gX + gY * gY + gZ * gZ)

                if (gForce > 1.5f && now - lastFired > 1000L) {
                    lastFired = now
                    Log.i(TAG, "Motion detected (gForce=$gForce)")
                    onFired()
                }
            }

            override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
        }
    }
}

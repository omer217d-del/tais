package com.tais.app.util

import android.content.Context
import android.util.Log
import java.io.File
import java.io.FileWriter
import java.io.PrintWriter
import java.io.StringWriter
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * CrashLogger — writes timestamped log lines and uncaught exceptions to a
 * plain text file in the app's external files directory, so behaviour can
 * be inspected from a file manager even when adb/logcat is not available.
 *
 * File location: Android/data/com.tais.app(.debug)/files/tais_debug.log
 */
object CrashLogger {

    private const val FILE_NAME = "tais_debug.log"
    private val dateFormat = SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS", Locale.US)

    private fun logFile(context: Context): File {
        val dir = context.getExternalFilesDir(null) ?: context.filesDir
        return File(dir, FILE_NAME)
    }

    fun log(context: Context, tag: String, message: String) {
        try {
            Log.i(tag, message)
            val line = "${dateFormat.format(Date())} [$tag] $message\n"
            FileWriter(logFile(context), true).use { it.write(line) }
        } catch (e: Exception) {
            // Never let logging itself crash the app.
        }
    }

    fun logError(context: Context, tag: String, message: String, throwable: Throwable) {
        try {
            Log.e(tag, message, throwable)
            val sw = StringWriter()
            throwable.printStackTrace(PrintWriter(sw))
            val line = "${dateFormat.format(Date())} [$tag] ERROR: $message\n$sw\n"
            FileWriter(logFile(context), true).use { it.write(line) }
        } catch (e: Exception) {
            // Never let logging itself crash the app.
        }
    }

    /**
     * Installs a global uncaught exception handler that logs the crash to
     * the debug file before delegating to the previous default handler
     * (so normal Android crash behaviour is unchanged).
     */
    fun install(context: Context) {
        val appContext = context.applicationContext
        val previousHandler = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
            logError(appContext, "UncaughtException", "Thread '${thread.name}' crashed", throwable)
            previousHandler?.uncaughtException(thread, throwable)
        }
        log(appContext, "CrashLogger", "Uncaught exception handler installed")
    }
}

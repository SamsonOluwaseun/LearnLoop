package com.samlytics.learnloop

import android.Manifest
import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Process
import android.provider.Settings
import android.speech.tts.TextToSpeech
import android.webkit.JavascriptInterface
import androidx.core.app.NotificationManagerCompat
import java.io.File

/**
 * What the LearnLoop screens (JavaScript) may ask Android to do. Only LearnLoop's own pages, served from the app itself,
 * can reach this: links to other sites leave the app instead of loading inside it.
 */
class Bridge(private val activity: MainActivity) {
    private val ctx: Context get() = activity.applicationContext
    private val dbFile: File get() = File(ctx.filesDir, "learnloop-db.json")

    // ---- the family's data (children, results, PIN hash), private to this app ----
    @JavascriptInterface fun loadDb(): String? = if (dbFile.exists()) dbFile.readText() else null

    @JavascriptInterface fun saveDb(json: String) {
        synchronized(this) {
            val tmp = File(ctx.filesDir, "learnloop-db.json.tmp")
            tmp.writeText(json)
            if (!tmp.renameTo(dbFile)) { dbFile.writeText(json); tmp.delete() } // write then swap, so a crash never leaves half a file
        }
    }

    // ---- permissions ----
    @Suppress("DEPRECATION")
    @JavascriptInterface fun hasUsageAccess(): Boolean {
        val ops = ctx.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = if (Build.VERSION.SDK_INT >= 29) ops.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), ctx.packageName)
        else ops.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), ctx.packageName)
        return mode == AppOpsManager.MODE_ALLOWED
    }
    @JavascriptInterface fun canDrawOverlays(): Boolean = Settings.canDrawOverlays(ctx)
    @JavascriptInterface fun notificationsAllowed(): Boolean = NotificationManagerCompat.from(ctx).areNotificationsEnabled()

    @JavascriptInterface fun openUsageAccess() = activity.runOnUiThread { activity.startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)) }
    @JavascriptInterface fun openOverlaySettings() = activity.runOnUiThread {
        activity.startActivity(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + ctx.packageName)))
    }
    @JavascriptInterface fun requestNotifications() = activity.runOnUiThread {
        if (Build.VERSION.SDK_INT >= 33) activity.requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 1)
        else activity.startActivity(Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, ctx.packageName))
    }

    // ---- the counter ----
    @JavascriptInterface fun configure(json: String) = synchronized(MonitorState.LOCK) { MonitorState(ctx).apply { configure(json); save() }; Unit }
    @JavascriptInterface fun getState(): String = synchronized(MonitorState.LOCK) { MonitorState(ctx).apply { rollDay() }.stateJson() }
    @JavascriptInterface fun getActivity(): String = synchronized(MonitorState.LOCK) { MonitorState(ctx).activityJson() }

    @JavascriptInterface fun startMonitor() {
        synchronized(MonitorState.LOCK) { MonitorState(ctx).apply { monitoring = true; save() } }
        MonitorService.start(ctx)
    }
    @JavascriptInterface fun stopMonitor() {
        synchronized(MonitorState.LOCK) { MonitorState(ctx).apply { monitoring = false; save() } }
        ctx.stopService(Intent(ctx, MonitorService::class.java))
    }
    @JavascriptInterface fun finishLearning(): String = synchronized(MonitorState.LOCK) {
        val st = MonitorState(ctx); val next = st.finishLearning(); st.save()
        "{\"state\":\"$next\"}"
    }
    @JavascriptInterface fun skipLearning() = synchronized(MonitorState.LOCK) { MonitorState(ctx).apply { finishLearning(); save() }; Unit }
    @JavascriptInterface fun resetToday() = synchronized(MonitorState.LOCK) { MonitorState(ctx).apply { resetToday(); save() }; Unit }

    // ---- speech and navigation ----
    @JavascriptInterface fun speak(text: String) {
        activity.tts?.speak(text.take(400), TextToSpeech.QUEUE_FLUSH, null, "learnloop")
    }
    @JavascriptInterface fun goHome() = activity.runOnUiThread { activity.loadPage("app.html") }
    @JavascriptInterface fun returnToVideo() = activity.runOnUiThread { activity.moveTaskToBack(true) }
    @JavascriptInterface fun appVersion(): String = BuildConfigInfo.VERSION
}

package com.samlytics.learnloop

import android.app.KeyguardManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.os.SystemClock
import android.provider.Settings
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat

/**
 * Counts the time the chosen video apps are on screen while the phone is unlocked, every 5 seconds.
 * It cannot see what is playing: Android only tells it which app is in front.
 * When the time is up it opens LearnLoop at the countdown. During learning, opening YouTube brings LearnLoop back.
 */
class MonitorService : Service() {
    private val handler = Handler(Looper.getMainLooper())
    private var lastTick = 0L
    private var lastEventTime = 0L
    private var foreground: String? = null
    private var lastOpen = 0L

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createChannels(this)
        val type = if (Build.VERSION.SDK_INT >= 34) ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE else 0
        ServiceCompat.startForeground(this, ONGOING_ID, ongoing(MonitorState(this)), type)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        lastTick = SystemClock.elapsedRealtime()
        lastEventTime = System.currentTimeMillis() - 30 * 60 * 1000L // find out which app is in front right now
        handler.removeCallbacks(tick)
        handler.post(tick)
        return START_STICKY
    }

    override fun onDestroy() {
        handler.removeCallbacks(tick)
        super.onDestroy()
    }

    private val tick = object : Runnable {
        override fun run() {
            try { synchronized(MonitorState.LOCK) { step() } } catch (e: Exception) { Log.w(TAG, "tick failed", e) }
            handler.postDelayed(this, TICK_MS)
        }
    }

    private fun step() {
        val st = MonitorState(this)
        if (!st.monitoring) { stopSelf(); return }
        val now = SystemClock.elapsedRealtime()
        var dt = (now - lastTick) / 1000.0
        lastTick = now
        if (dt < 0 || dt > MAX_GAP_SEC) dt = 0.0 // the phone slept or the service was paused: count nothing for the gap
        st.rollDay()

        val power = getSystemService(Context.POWER_SERVICE) as PowerManager
        val keyguard = getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
        val unlocked = power.isInteractive && !keyguard.isKeyguardLocked
        updateForeground()
        val inVideoApp = unlocked && foreground != null && st.packages.contains(foreground)

        when (st.state) {
            "watching" -> if (inVideoApp && st.childId != null) {
                st.add(dt)
                if (st.capSec > 0 && st.daySec >= st.capSec) { st.state = "rest"; open("rest") }
                else if (st.entSec > 0 && st.balanceSec >= st.entSec) { st.state = "learning"; open("countdown") }
            }
            "learning" -> if (inVideoApp) open("learn")
            "rest" -> if (inVideoApp) open("rest")
        }
        st.save()
        (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).notify(ONGOING_ID, ongoing(st))
    }

    /** Which app is in front, from Android's usage events since the last check. */
    @Suppress("DEPRECATION")
    private fun updateForeground() {
        val usm = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val end = System.currentTimeMillis()
        val events = usm.queryEvents(lastEventTime, end) ?: return
        val e = UsageEvents.Event()
        while (events.hasNextEvent()) {
            events.getNextEvent(e)
            when (e.eventType) {
                UsageEvents.Event.MOVE_TO_FOREGROUND -> foreground = e.packageName
                UsageEvents.Event.MOVE_TO_BACKGROUND, ACTIVITY_STOPPED -> if (e.packageName == foreground) foreground = null
            }
        }
        lastEventTime = end
    }

    /** Bring LearnLoop to the front. Android allows this because the parent granted "Display over other apps". */
    private fun open(mode: String) {
        val now = SystemClock.elapsedRealtime()
        if (now - lastOpen < 3000) return
        lastOpen = now
        val intent = Intent(this, MainActivity::class.java)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
            .putExtra(MainActivity.EXTRA_MODE, mode)
        if (Settings.canDrawOverlays(this)) {
            try { startActivity(intent); return } catch (e: Exception) { Log.w(TAG, "could not open LearnLoop", e) }
        }
        // Without that permission Android blocks the switch, so ask with a notification instead
        val pi = PendingIntent.getActivity(this, 1, intent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        val n = NotificationCompat.Builder(this, CHANNEL_LEARN)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(if (mode == "rest") "That's all the video for today" else "Time to learn")
            .setContentText("Tap to open LearnLoop")
            .setContentIntent(pi).setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()
        (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).notify(LEARN_ID, n)
    }

    private fun ongoing(st: MonitorState): Notification {
        val pi = PendingIntent.getActivity(this, 0, Intent(this, MainActivity::class.java), PendingIntent.FLAG_IMMUTABLE)
        val text = when (st.state) {
            "learning" -> "Learning time for ${st.childName}"
            "rest" -> "Video finished for today"
            else -> "${st.childName}: ${(st.balanceSec / 60).toInt()} of ${(st.entSec / 60).toInt()} min before learning"
        }
        return NotificationCompat.Builder(this, CHANNEL_ON)
            .setSmallIcon(android.R.drawable.ic_menu_recent_history)
            .setContentTitle("LearnLoop is on")
            .setContentText(text)
            .setOngoing(true).setOnlyAlertOnce(true).setSilent(true)
            .setContentIntent(pi)
            .build()
    }

    companion object {
        private const val TAG = "LearnLoop"
        private const val TICK_MS = 5000L
        private const val MAX_GAP_SEC = 15.0
        private const val ACTIVITY_STOPPED = 23 // UsageEvents.Event.ACTIVITY_STOPPED, added in Android 10
        const val CHANNEL_ON = "learnloop-on"
        const val CHANNEL_LEARN = "learnloop-learn"
        private const val ONGOING_ID = 1
        private const val LEARN_ID = 2

        fun createChannels(context: Context) {
            val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            nm.createNotificationChannel(NotificationChannel(CHANNEL_ON, context.getString(R.string.channel_on), NotificationManager.IMPORTANCE_LOW))
            nm.createNotificationChannel(NotificationChannel(CHANNEL_LEARN, context.getString(R.string.channel_learn), NotificationManager.IMPORTANCE_HIGH))
        }

        fun start(context: Context) {
            context.startForegroundService(Intent(context, MonitorService::class.java))
        }
    }
}

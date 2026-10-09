package com.samlytics.learnloop

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** After the phone restarts, carry on counting if a parent had turned counting on. */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED && MonitorState(context).monitoring) {
            runCatching { MonitorService.start(context) }
        }
    }
}

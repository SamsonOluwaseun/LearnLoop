package com.samlytics.learnloop

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.time.LocalDate

/**
 * What the counter knows, kept in the app's private settings so it survives the app closing, a crash or a restart.
 * States: "watching" (time counts), "learning" (a learning session is due), "rest" (the daily limit is reached).
 */
class MonitorState(context: Context) {
    private val prefs = context.getSharedPreferences("learnloop-monitor", Context.MODE_PRIVATE)

    var monitoring: Boolean = prefs.getBoolean("monitoring", false)
    var state: String = prefs.getString("state", "watching") ?: "watching"
    var balanceSec: Double = prefs.getFloat("balance", 0f).toDouble()
    var daySec: Double = prefs.getFloat("daySec", 0f).toDouble()
    var day: String = prefs.getString("day", today()) ?: today()
    private var activity: JSONObject = runCatching { JSONObject(prefs.getString("activity", "{}") ?: "{}") }.getOrDefault(JSONObject())
    private var cfg: JSONObject = runCatching { JSONObject(prefs.getString("cfg", "{}") ?: "{}") }.getOrDefault(JSONObject())

    val childId: String? get() = cfg.optString("childId").takeIf { it.isNotEmpty() && it != "null" }
    val childName: String get() = cfg.optString("name", "")
    val entSec: Double get() = cfg.optDouble("entSec", 0.0)
    val capSec: Double get() = cfg.optDouble("capSec", 0.0)
    val packages: Set<String>
        get() {
            val a: JSONArray = cfg.optJSONArray("packages") ?: return emptySet()
            return (0 until a.length()).map { a.optString(it) }.toSet()
        }

    fun configure(json: String) {
        val next = runCatching { JSONObject(json) }.getOrNull() ?: return
        if (next.optString("childId") != cfg.optString("childId")) { balanceSec = 0.0; state = "watching"; daySec = todaySecFor(next.optString("childId")) }
        cfg = next
    }

    /** A new day starts with a fresh daily total. Learning that was due stays due. */
    fun rollDay() {
        val t = today()
        if (t != day) { day = t; daySec = 0.0; if (state == "rest") state = "watching" }
    }

    fun add(sec: Double) {
        balanceSec += sec; daySec += sec
        val id = childId ?: return
        val d = activity.optJSONObject(day) ?: JSONObject().also { activity.put(day, it) }
        d.put(id, d.optDouble(id, 0.0) + sec)
    }

    fun finishLearning(): String {
        balanceSec = 0.0
        state = if (capSec > 0 && daySec >= capSec) "rest" else "watching"
        return state
    }

    fun resetToday() {
        daySec = 0.0; balanceSec = 0.0
        childId?.let { id -> activity.optJSONObject(day)?.put(id, 0.0) }
        if (state == "rest") state = "watching"
    }

    private fun todaySecFor(id: String?): Double = if (id.isNullOrEmpty()) 0.0 else activity.optJSONObject(today())?.optDouble(id, 0.0) ?: 0.0

    fun activityJson(): String = activity.toString()

    fun stateJson(): String = JSONObject()
        .put("state", state).put("balanceSec", balanceSec).put("daySec", daySec)
        .put("entSec", entSec).put("capSec", capSec).put("monitoring", monitoring).put("name", childName)
        .toString()

    fun save() {
        // keep about four months of daily totals, like the Chrome extension
        val keys = activity.keys().asSequence().toList().sorted()
        if (keys.size > 120) keys.take(keys.size - 120).forEach { activity.remove(it) }
        prefs.edit()
            .putBoolean("monitoring", monitoring).putString("state", state)
            .putFloat("balance", balanceSec.toFloat()).putFloat("daySec", daySec.toFloat()).putString("day", day)
            .putString("activity", activity.toString()).putString("cfg", cfg.toString())
            .apply()
    }

    companion object {
        /** The counter and the app both change this state, so every read-change-save holds this lock. */
        val LOCK = Any()
        fun today(): String = LocalDate.now().toString()
    }
}

package com.samlytics.learnloop

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.webkit.WebViewAssetLoader
import java.util.Locale

/** Shows the LearnLoop screens. They are web pages packaged inside the app and work without the internet. */
class MainActivity : Activity() {
    lateinit var web: WebView
    var tts: TextToSpeech? = null

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        MonitorService.createChannels(this)
        web = WebView(this)
        setContentView(web)
        // Serving the pages from an https address inside the app gives them a secure context, which the PIN hashing needs
        val loader = WebViewAssetLoader.Builder().addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this)).build()
        web.settings.javaScriptEnabled = true
        web.settings.domStorageEnabled = true
        web.settings.allowFileAccess = false
        web.settings.allowContentAccess = false
        web.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? = loader.shouldInterceptRequest(request.url)
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                if (request.url.host == HOST) return false
                // "Back to my video" and any other outside link: leave LearnLoop, so the child is back in the app they came from
                if (request.url.host?.endsWith("youtube.com") == true) moveTaskToBack(true)
                else startActivity(Intent(Intent.ACTION_VIEW, request.url))
                return true
            }
        }
        web.addJavascriptInterface(Bridge(this), "LLAndroid")
        tts = TextToSpeech(this) { status -> if (status == TextToSpeech.SUCCESS) tts?.language = Locale.UK }
        open(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        open(intent)
    }

    private fun open(intent: Intent?) {
        val mode = intent?.getStringExtra(EXTRA_MODE)
        val current = web.url ?: ""
        // A learning session already on screen carries on rather than starting again
        if ((mode == "learn" || mode == "countdown") && current.contains("learn.html") && !current.contains("practice")) return
        if (mode == "learn") return loadPage("learn.html")
        loadPage("app.html" + if (mode != null) "#$mode" else "")
    }

    fun loadPage(page: String) = web.loadUrl(BASE + page)

    @Deprecated("Kept for Android versions before 13")
    override fun onBackPressed() {
        if (web.canGoBack()) web.goBack() else @Suppress("DEPRECATION") super.onBackPressed()
    }

    override fun onDestroy() {
        tts?.shutdown()
        web.destroy()
        super.onDestroy()
    }

    companion object {
        const val EXTRA_MODE = "mode"
        const val HOST = "appassets.androidplatform.net"
        const val BASE = "https://$HOST/assets/www/"
    }
}

object BuildConfigInfo { const val VERSION = "0.1.0-preview" }

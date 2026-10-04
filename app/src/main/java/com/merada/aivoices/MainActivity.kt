package com.merada.aivoices

import android.annotation.SuppressLint
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import java.util.Locale

class MainActivity : AppCompatActivity(), TextToSpeech.OnInitListener {
    private lateinit var webView: WebView
    private lateinit var tts: TextToSpeech
    private var ready = false

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        tts = TextToSpeech(this, this)
        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.mediaPlaybackRequiresUserGesture = false
            addJavascriptInterface(AndroidTtsBridge(), "AndroidTts")
            webViewClient = WebViewClient()
            loadUrl("file:///android_asset/index.html")
        }
        setContentView(webView)
    }

    override fun onInit(status: Int) {
        ready = status == TextToSpeech.SUCCESS
        if (ready) {
            tts.language = Locale("ar")
            tts.setSpeechRate(1.0f)
            tts.setPitch(1.0f)
        }
        webView.post {
            webView.evaluateJavascript("window.androidTtsReady && window.androidTtsReady($ready);", null)
        }
    }

    inner class AndroidTtsBridge {
        @JavascriptInterface
        fun speak(text: String, rate: Float, pitch: Float, volume: Float) {
            if (!ready || text.isBlank()) return
            tts.setSpeechRate(rate.coerceIn(0.5f, 2.0f))
            tts.setPitch(pitch.coerceIn(0.0f, 2.0f))
            val params = Bundle().apply {
                putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, volume.coerceIn(0f, 1f))
            }
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, params, "ai-voices")
        }

        @JavascriptInterface
        fun stop() {
            tts.stop()
        }
    }

    override fun onDestroy() {
        if (::tts.isInitialized) {
            tts.stop()
            tts.shutdown()
        }
        super.onDestroy()
    }
}
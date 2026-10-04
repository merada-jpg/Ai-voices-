package com.merada.aivoices

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.mediaPlaybackRequiresUserGesture = false
            webViewClient = WebViewClient()
            loadUrl("https://merada-jpg.github.io/Ai-voices-/")
        }
        setContentView(webView)
    }

    override fun onBackPressed() {
        val webView = (window.decorView.rootView as? android.view.ViewGroup)?.findViewWithTag<WebView>("")
        if (webView?.canGoBack() == true) webView.goBack() else super.onBackPressed()
    }
}

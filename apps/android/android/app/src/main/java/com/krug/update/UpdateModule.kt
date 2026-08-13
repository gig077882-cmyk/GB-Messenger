package com.krug.update

import android.content.Intent
import android.net.Uri
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.krug.BuildConfig

class UpdateModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "KrugUpdate"

  override fun getConstants() = mapOf(
    "versionCode" to BuildConfig.KRUG_VERSION_CODE,
    "versionName" to BuildConfig.KRUG_VERSION_NAME,
  )

  @ReactMethod
  fun openDownload(url: String, promise: Promise) {
    try {
      val uri = Uri.parse(url)
      if (uri.scheme != "https") throw IllegalArgumentException("Only HTTPS update URLs are allowed")
      val intent = Intent(Intent.ACTION_VIEW, uri).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      reactApplicationContext.startActivity(intent)
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("UPDATE_LINK_ERROR", error)
    }
  }
}

package com.journifyioreactnativesdk


import java.util.Arrays
import java.util.Collections

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.facebook.react.bridge.JavaScriptModule



class JournifyioReactNativeSdkPackage : ReactPackage {

  private var isInitialized = false
  private var anonymousId: String? = null
  private var module: JournifyioReactNativeSdkModule? = null

  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    module = JournifyioReactNativeSdkModule(reactContext)
    module?.onInitialized = {
        isInitialized = true
        anonymousId?.let { anonId ->
            module?.setAnonymousId(anonId)
        }
    }
    return listOf(module as NativeModule)
  }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    return emptyList<ViewManager<*, *>>()
}

fun setAnonymousId(nativeAnonymousId: String) {
  if (isInitialized) {
      anonymousId = nativeAnonymousId;
      anonymousId?.let { anonId ->
        module?.setAnonymousId(anonId)
      }
  } else {
      anonymousId = nativeAnonymousId
  }
}

}

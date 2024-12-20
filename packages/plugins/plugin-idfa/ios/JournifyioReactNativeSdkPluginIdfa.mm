#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(JournifyioReactNativeSdkPluginIdfa, RCTEventEmitter)

RCT_EXTERN_METHOD(
                  getTrackingAuthorizationStatus: (RCTPromiseResolveBlock)resolve
                  rejecter: (RCTPromiseRejectBlock)reject
                  )

@end

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(JournifyioReactNativeSdk, NSObject)

RCT_EXTERN_METHOD(getContextInfo: (NSDictionary)configuration resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

@end

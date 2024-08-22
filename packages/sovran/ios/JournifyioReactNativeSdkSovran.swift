import React

struct Action {
    var action: String
    var payload: Any!
}

@objc(JournifyioReactNativeSdkSovran)
public class JournifyioReactNativeSdkSovran: RCTEventEmitter {

    @objc public static var emitter: RCTEventEmitter?
    
    private static var isInitialized = false
    
    private static var queue: [Action] = []

    private static let onStoreActionEvent = "onStoreAction"

    @objc override init() {
        super.init()
        JournifyioReactNativeSdkSovran.emitter = self
    }
    
    @objc public override func constantsToExport() -> [AnyHashable : Any]! {
        return ["ON_STORE_ACTION": JournifyioReactNativeSdkSovran.onStoreActionEvent]
    }

    override public static func requiresMainQueueSetup() -> Bool {
        return true
    }

    @objc open override func supportedEvents() -> [String] {
        [JournifyioReactNativeSdkSovran.onStoreActionEvent]
    }
    
    private static func sendStoreAction(_ action: Action) -> Void {
        if let emitter = self.emitter {
            emitter.sendEvent(withName: onStoreActionEvent, body: [
                "type": action.action,
                "payload": action.payload
            ])
        }
    }

    @objc public static func dispatch(action: String, payload: Any!) -> Void {
        let actionObj = Action(action: action, payload: payload)
        if isInitialized {
            self.sendStoreAction(actionObj)
        } else {
            self.queue.append(actionObj)
        }
    }
    
    @objc public override func startObserving() -> Void {
        // Replay event queue
        JournifyioReactNativeSdkSovran.isInitialized = true
        for event in JournifyioReactNativeSdkSovran.queue {
            JournifyioReactNativeSdkSovran.sendStoreAction(event)
        }
        JournifyioReactNativeSdkSovran.queue = []
    }
    
    @objc public override func stopObserving() -> Void {
        JournifyioReactNativeSdkSovran.isInitialized = false
    }
}


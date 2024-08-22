import type { Action, Store } from './store';
type ActionCreator<P, S> = (payload: P) => Action<S>;
interface BridgeStore<T extends object> {
    store: Store<T>;
    actions: {
        [key: string]: ActionCreator<unknown, T>;
    };
}
export declare const registerBridgeStore: <T extends object>(...stores: BridgeStore<T>[]) => void;
export declare const onStoreAction: <T>(event: string, payload: T) => Promise<void>;
export {};
//# sourceMappingURL=bridge.d.ts.map
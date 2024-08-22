import { type PersistenceConfig } from './persistor';
export type Notify<V> = (value: V) => void;
export type Unsubscribe = () => void;
export type Action<T> = (state: T) => T | Promise<T>;
interface getStateFunc<T> {
    (): T;
    (safe: true): Promise<T>;
}
/**
 * Sovran State Store
 */
export interface Store<T extends object> {
    /**
     * Register a callback for changes to the store
     * @param {Notify<T>} callback - callback to be called when the store changes
     * @returns {Unsubscribe} - function to unsubscribe from the store
     */
    subscribe: (callback: Notify<T>) => Unsubscribe;
    /**
     * Dispatch an action to update the store values
     * @param {T | Promise<T>} action - action to dispatch
     * @returns {T} new state
     */
    dispatch: (action: Action<T>) => Promise<T>;
    /**
     * Get the current state of the store
     * @param {boolean} safe - if true it will execute the get async in the queue of the reducers guaranteeing that all the actions are executed before retrieving state
     * @returns {T | Promise<T>} state, or a promise for the state if executed async in the queue
     */
    getState: getStateFunc<T>;
}
/**
 * Creates a simple state store.
 * @param initialState initial store values
 * @param storeId store instance id
 * @returns {Store<T>} object
 */
export interface StoreConfig {
    /**
     * Persistence configuration
     */
    persist?: PersistenceConfig;
}
/**
 * Creates a sovran state management store
 * @param initialState initial state of the store
 * @param config configuration options
 * @returns Sovran Store object
 */
export declare const createStore: <T extends object>(initialState: T, config?: StoreConfig) => Store<T>;
export {};
//# sourceMappingURL=store.d.ts.map
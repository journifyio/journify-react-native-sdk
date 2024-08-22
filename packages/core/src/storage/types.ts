import type { Unsubscribe, Persistor } from '@journifyio/react-native-sdk-sovran';
import {
  DeepPartial,
  JournifyAPIConsentSettings,
  JournifyIntegrations,
} from '../types';
import { Context, JournifyEvent, UserInfoState } from '../events';

export interface getStateFunc<T> {
  (): T;
  (safe: true): Promise<T>;
}

/**
 * Implements a value that can be subscribed for changes
 */
export interface Watchable<T> {
  /**
   * Get current value
   */
  get: getStateFunc<T>;
  /**
   * Register a callback to be called when the value changes
   * @returns a function to unsubscribe
   */
  onChange: (callback: (value: T) => void) => Unsubscribe;
}

/**
 * Implements a value that can be set
 */
export interface Settable<T> {
  set: (value: T | ((state: T) => T)) => T | Promise<T>;
}

/**
 * Implements a map of key value pairs
 */
export interface Dictionary<K, T, R> {
  add: (key: K, value: T) => Promise<R>;
}

/**
 * Implements a queue object
 */
export interface Queue<T, R> {
  add: (value: T) => Promise<R>;
  remove: (value: T) => Promise<R>;
}

/**
 * Interface for interacting with the storage layer of the client data
 */
export interface Storage {
  readonly isReady: Watchable<boolean>;

  readonly context: Watchable<DeepPartial<Context> | undefined> &
    Settable<DeepPartial<Context>>;

  readonly settings: Watchable<JournifyIntegrations | undefined> &
    Settable<JournifyIntegrations>;

  readonly consentSettings: Watchable<JournifyAPIConsentSettings | undefined> &
    Settable<JournifyAPIConsentSettings | undefined>;

  readonly userInfo: Watchable<UserInfoState> & Settable<UserInfoState>;

  readonly pendingEvents: Watchable<JournifyEvent[]> &
    Settable<JournifyEvent[]> &
    Queue<JournifyEvent, JournifyEvent[]>;
}

export type StorageConfig = {
  storeId: string;
  storePersistor?: Persistor;
  storePersistorSaveDelay?: number;
};

export interface ReadinessStore {
  hasRestoredContext: boolean;
  hasRestoredSettings: boolean;
  hasRestoredUserInfo: boolean;
  hasRestoredPendingEvents: boolean;
}

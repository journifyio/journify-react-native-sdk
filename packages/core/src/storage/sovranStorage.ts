import {
  createStore,
  Store,
  Persistor,
} from '@journifyio/react-native-sdk-sovran';
import deepmerge from 'deepmerge';
import {
  getStateFunc,
  Queue,
  ReadinessStore,
  Settable,
  Storage,
  StorageConfig,
  Watchable,
  Dictionary,
} from './types';
import {
  Sync,
  DeepPartial,
  JournifyAPIConsentSettings,
  JournifyIntegrations,
} from '../types';
import { Context, JournifyEvent, UserInfoState } from '../events';
import { createGetter } from './helpers';
import { getUUID } from '../uuid';

type Data = {
  context: DeepPartial<Context>;
  settings: JournifyIntegrations;
  consentSettings: JournifyAPIConsentSettings | undefined;
  userInfo: UserInfoState;
  pendingEvents: JournifyEvent[];
};

const INITIAL_VALUES: Data = {
  context: {},
  settings: {},
  consentSettings: undefined,
  userInfo: {
    anonymousId: getUUID(),
    userId: undefined,
    traits: undefined,
  },
  pendingEvents: [],
};

function createStoreGetter<
  U extends object,
  Z extends keyof U | undefined = undefined,
  V = undefined
>(store: Store<U>, key?: Z): getStateFunc<Z extends keyof U ? V : U> {
  type X = Z extends keyof U ? V : U;
  return createGetter(
    () => {
      const state = store.getState();
      if (key !== undefined) {
        return state[key] as unknown as X;
      }
      return state as X;
    },
    async () => {
      const promise = await store.getState(true);
      if (key !== undefined) {
        return promise[key] as unknown as X;
      }
      return promise as unknown as X;
    }
  );
}

const isEverythingReady = (state: ReadinessStore) =>
  Object.values(state).every((v) => v === true);

export class SovranStorage implements Storage {
  private storeId: string;
  private storePersistor?: Persistor;
  private storePersistorSaveDelay?: number;
  private readinessStore: Store<ReadinessStore>;
  private contextStore: Store<{ context: DeepPartial<Context> }>;
  private settingsStore: Store<{ settings: JournifyIntegrations }>;
  private userInfoStore: Store<{ userInfo: UserInfoState }>;
  private pendingStore: Store<JournifyEvent[]>;
  private consentSettingsStore: Store<{
    consentSettings: JournifyAPIConsentSettings | undefined;
  }>;

  readonly consentSettings: Watchable<JournifyAPIConsentSettings | undefined> &
    Settable<JournifyAPIConsentSettings | undefined>;

  readonly isReady: Watchable<boolean>;

  readonly context: Watchable<DeepPartial<Context> | undefined> &
    Settable<DeepPartial<Context>>;

  readonly settings: Watchable<JournifyIntegrations | undefined> &
    Settable<JournifyIntegrations> &
    Dictionary<string, Sync, JournifyIntegrations>;

  readonly userInfo: Watchable<UserInfoState> & Settable<UserInfoState>;

  readonly pendingEvents: Watchable<JournifyEvent[]> &
    Settable<JournifyEvent[]> &
    Queue<JournifyEvent, JournifyEvent[]>;

  constructor(config: StorageConfig) {
    this.storeId = config.storeId;
    this.storePersistor = config.storePersistor;
    this.storePersistorSaveDelay = config.storePersistorSaveDelay;
    this.readinessStore = createStore<ReadinessStore>({
      hasRestoredContext: false,
      hasRestoredSettings: false,
      hasRestoredUserInfo: false,
      hasRestoredPendingEvents: false,
    });
    const markAsReadyGenerator = (key: keyof ReadinessStore) => () => {
      this.readinessStore.dispatch((state) => ({
        ...state,
        [key]: true,
      }));
    };

    this.isReady = {
      get: createGetter(
        () => {
          const state = this.readinessStore.getState();
          return isEverythingReady(state);
        },
        async () => {
          const promise = await this.readinessStore
            .getState(true)
            .then(isEverythingReady);
          return promise;
        }
      ),
      onChange: (callback: (value: boolean) => void) => {
        return this.readinessStore.subscribe((store) => {
          if (isEverythingReady(store)) {
            callback(true);
          }
        });
      },
    };

    // Context Store

    this.contextStore = createStore(
      { context: INITIAL_VALUES.context },
      {
        persist: {
          storeId: `${this.storeId}-context`,
          persistor: this.storePersistor,
          onInitialized: markAsReadyGenerator('hasRestoredContext'),
        },
      }
    );
    this.context = {
      get: createStoreGetter(this.contextStore, 'context'),
      onChange: (callback: (value?: DeepPartial<Context>) => void) =>
        this.contextStore.subscribe((store) => callback(store.context)),
      set: async (value) => {
        const { context } = await this.contextStore.dispatch((state) => {
          let newState: typeof state.context;
          if (value instanceof Function) {
            newState = value(state.context);
          } else {
            newState = deepmerge(state.context, value);
          }
          return { context: newState };
        });
        return context;
      },
    };

    // Settings Store

    this.settingsStore = createStore(
      { settings: INITIAL_VALUES.settings },
      {
        persist: {
          storeId: `${this.storeId}-settings`,
          persistor: this.storePersistor,
          saveDelay: this.storePersistorSaveDelay,
          onInitialized: markAsReadyGenerator('hasRestoredSettings'),
        },
      }
    );

    this.settings = {
      get: createStoreGetter(this.settingsStore, 'settings'),
      onChange: (
        callback: (value?: JournifyIntegrations | undefined) => void
      ) => this.settingsStore.subscribe((store) => callback(store.settings)),
      set: async (value) => {
        const { settings } = await this.settingsStore.dispatch((state) => {
          let newState: typeof state.settings;
          if (value instanceof Function) {
            newState = value(state.settings);
          } else {
            newState = { ...state.settings, ...value };
          }
          return { settings: newState };
        });
        return settings;
      },
      add: async (key: string, value: Sync) => {
        return this.settingsStore.dispatch((state) => ({
          settings: { ...state.settings, [key]: value },
        }));
      },
    };

    // User Info Store

    this.userInfoStore = createStore(
      { userInfo: INITIAL_VALUES.userInfo },
      {
        persist: {
          storeId: `${this.storeId}-userInfo`,
          persistor: this.storePersistor,
          saveDelay: this.storePersistorSaveDelay,
          onInitialized: markAsReadyGenerator('hasRestoredUserInfo'),
        },
      }
    );

    this.userInfo = {
      get: createStoreGetter(this.userInfoStore, 'userInfo'),
      onChange: (callback: (value: UserInfoState) => void) =>
        this.userInfoStore.subscribe((store) => callback(store.userInfo)),
      set: async (value) => {
        const { userInfo } = await this.userInfoStore.dispatch((state) => {
          let newState: typeof state.userInfo;
          if (value instanceof Function) {
            newState = value(state.userInfo);
          } else {
            newState = deepmerge(state.userInfo, value);
          }
          return { userInfo: newState };
        });
        return userInfo;
      },
    };

    // Pending Events
    this.pendingStore = createStore<JournifyEvent[]>(
      INITIAL_VALUES.pendingEvents,
      {
        persist: {
          storeId: `${this.storeId}-pendingEvents`,
          persistor: this.storePersistor,
          saveDelay: this.storePersistorSaveDelay,
          onInitialized: markAsReadyGenerator('hasRestoredPendingEvents'),
        },
      }
    );

    this.pendingEvents = {
      get: createStoreGetter(this.pendingStore),
      onChange: (callback: (value: JournifyEvent[]) => void) =>
        this.pendingStore.subscribe((store) => callback(store)),
      set: async (value) => {
        return await this.pendingStore.dispatch((state) => {
          let newState: JournifyEvent[];
          if (value instanceof Function) {
            newState = value(state);
          } else {
            newState = [...value];
          }
          return newState;
        });
      },
      add: (event: JournifyEvent) => {
        return this.pendingStore.dispatch((events) => [...events, event]);
      },
      remove: (event: JournifyEvent) => {
        return this.pendingStore.dispatch((events) =>
          events.filter((e) => e.messageId !== event.messageId)
        );
      },
    };

    // Consent settings

    this.consentSettingsStore = createStore(
      { consentSettings: INITIAL_VALUES.consentSettings },
      {
        persist: {
          storeId: `${this.storeId}-consentSettings`,
          persistor: this.storePersistor,
          saveDelay: this.storePersistorSaveDelay,
          onInitialized: markAsReadyGenerator('hasRestoredSettings'),
        },
      }
    );

    this.consentSettings = {
      get: createStoreGetter(this.consentSettingsStore, 'consentSettings'),
      onChange: (
        callback: (value?: JournifyAPIConsentSettings | undefined) => void
      ) =>
        this.consentSettingsStore.subscribe((store) =>
          callback(store.consentSettings)
        ),
      set: async (value) => {
        const { consentSettings } = await this.consentSettingsStore.dispatch(
          (state) => {
            let newState: typeof state.consentSettings;
            if (value instanceof Function) {
              newState = value(state.consentSettings);
            } else {
              newState = Object.assign({}, state.consentSettings, value);
            }
            return { consentSettings: newState };
          }
        );
        return consentSettings;
      },
    };
  }
}

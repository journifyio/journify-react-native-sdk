import {
  AppState,
  AppStateStatus,
  NativeEventSubscription,
} from 'react-native';
import {
  defaultConfig,
  defaultFlushAt,
  defaultFlushInterval,
  WRITE_KEY_PROD_PREFIX,
  WRITE_KEY_TEST_PREFIX,
} from './constants';
import { checkResponseForErrors, translateHTTPError } from './errors';
import {
  createTrackEvent,
  type JournifyEvent,
  type JsonMap,
  type UserInfoState,
  type Context,
  JournifyEventType,
  createScreenEvent,
  Traits,
  createIdentifyEvent,
} from './events';
import { FlushPolicy, Observable } from './flushPolicies/types';
import type { Plugin } from './plugin';
import { JournifyDestination } from './plugins/JournifyDestination';
import { Settable, Storage, Watchable } from './storage/types';
import { Timeline } from './timeline';
import {
  ClientConfig,
  DeepPartial,
  JournifyAPIConsentSettings,
  JournifyIntegrations,
  PluginType,
  Sync,
  WriteKeySettingsResponse,
} from './types';
import {
  allSettled,
  getPluginsWithFlush,
  getPluginsWithReset,
  hashPII,
} from './utils';
import { getUUID } from './uuid';
import { getContext } from './context';
import deepmerge from 'deepmerge';
import { createGetter } from './storage';
import { CountFlushPolicy } from './flushPolicies/count-flush-policy';
import { TimerFlushPolicy } from './flushPolicies/timer-flush-policy';
import { FlushPolicyExecuter } from './flushPolicies/flush-policy-executer';

type OnPluginAddedCallback = (plugin: Plugin) => void;

export class JournifyClient {
  private config: ClientConfig;
  // Storage
  private store: Storage;

  // current app state
  private appState: AppStateStatus | 'unknown' = 'unknown';

  // subscription for propagating changes to appState
  private appStateSubscription?: NativeEventSubscription;

  // whether the user has called cleanup
  private destroyed = false;

  // Watchables
  /**
   * Observable to know when the client is fully initialized and ready to send events to destination
   */
  readonly isReady = new Observable<boolean>(false);
  /**
   * Access or subscribe to client context
   */
  readonly context: Watchable<DeepPartial<Context> | undefined> &
    Settable<DeepPartial<Context>>;

  /**
   * Access or subscribe to integration settings
   */
  readonly consentSettings: Watchable<JournifyAPIConsentSettings | undefined>;

  /**
   * Access or subscribe to adTrackingEnabled (also accesible from context)
   */
  readonly adTrackingEnabled: Watchable<boolean>;

  /**
   * Access or subscribe to integration settings
   */
  readonly settings: Watchable<JournifyIntegrations | undefined>;

  /**
   * Access or subscribe to user info (anonymousId, userId, traits)
   */
  readonly userInfo: Watchable<UserInfoState> & Settable<UserInfoState>;

  private timeline: Timeline;
  private pluginsToAdd: Plugin[] = [];
  private isAddingPlugins = false;
  private onPluginAddedObservers: OnPluginAddedCallback[] = [];

  private flushPolicyExecuter: FlushPolicyExecuter = new FlushPolicyExecuter(
    [],
    () => {
      this.flush();
    }
  );

  constructor(config: ClientConfig, store: Storage) {
    this.config = { ...defaultConfig, ...config };
    this.store = store;
    this.timeline = new Timeline();

    // Initialize the watchables
    this.context = {
      get: this.store.context.get,
      set: this.store.context.set,
      onChange: this.store.context.onChange,
    };

    this.adTrackingEnabled = {
      get: createGetter(
        () => this.store.context.get()?.device?.adTrackingEnabled ?? false,
        async () => {
          const context = await this.store.context.get(true);
          return context?.device?.adTrackingEnabled ?? false;
        }
      ),
      onChange: (callback: (value: boolean) => void) =>
        this.store.context.onChange((context?: DeepPartial<Context>) => {
          callback(context?.device?.adTrackingEnabled ?? false);
        }),
    };

    this.settings = {
      get: this.store.settings.get,
      onChange: this.store.settings.onChange,
    };

    this.consentSettings = {
      get: this.store.consentSettings.get,
      onChange: this.store.consentSettings.onChange,
    };

    this.userInfo = {
      get: this.store.userInfo.get,
      set: this.store.userInfo.set,
      onChange: this.store.userInfo.onChange,
    };
    // Add the JournifyDestination plugin
    this.add({ plugin: new JournifyDestination() });

    // set up tracking for lifecycle events
    this.setupLifecycleEvents();
  }
  /**
   * Returns the plugins currently loaded in the timeline
   * @param ofType Type of plugins, defaults to all
   * @returns List of Plugin objects
   */
  getPlugins(ofType?: PluginType): readonly Plugin[] {
    const plugins = { ...this.timeline.plugins };
    if (ofType !== undefined) {
      return [...(plugins[ofType] ?? [])];
    }
    return (
      [
        ...this.getPlugins(PluginType.before),
        ...this.getPlugins(PluginType.enrichment),
        ...this.getPlugins(PluginType.utility),
        ...this.getPlugins(PluginType.destination),
        ...this.getPlugins(PluginType.after),
      ] ?? []
    );
  }

  public getConfig(): ClientConfig {
    return { ...this.config };
  }

  // Watch for isReady so that we can handle any pending events
  private async storageReady(): Promise<boolean> {
    return new Promise((resolve) => {
      this.store.isReady.onChange((value) => {
        resolve(value);
      });
    });
  }

  public async init() {
    if (this.isReady.value) {
      console.log('JournifyClient have been already initialized');
      return;
    }
    if ((await this.store.isReady.get(true)) === false) {
      await this.storageReady();
    }

    // fetch settings
    await this.fetchSettings();
    await this.checkInstalledVersion();
    await this.onReady();
    this.isReady.value = true;
  }

  /**
   * Executes when everything in the client is ready for sending events
   * @param isReady
   */
  private async onReady() {
    // Add all plugins awaiting store
    if (this.pluginsToAdd.length > 0 && !this.isAddingPlugins) {
      this.isAddingPlugins = true;
      try {
        // start by adding the plugins
        this.pluginsToAdd.forEach((plugin) => {
          this.addPlugin(plugin);
        });

        // now that they're all added, clear the cache
        // this prevents this block running for every update
        this.pluginsToAdd = [];
      } finally {
        this.isAddingPlugins = false;
      }
    }
    // Start flush policies
    // This should be done before any pending events are added to the queue so that any policies that rely on events queued can trigger accordingly
    this.setupFlushPolicies();

    // Send all events in the queue
    const pending = await this.store.pendingEvents.get(true);
    for (const e of pending) {
      await this.startTimelineProcessing(e);
      await this.store.pendingEvents.remove(e);
    }

    this.flushPolicyExecuter.manualFlush();
  }
  /**
   * Called once when the client is first created
   *
   * Detect and save the the currently installed application version
   * Send application lifecycle events if trackAppLifecycleEvents is enabled
   *
   * Exactly one of these events will be sent, depending on the current and previous version:s
   * Application Installed - no information on the previous version, so it's a fresh install
   * Application Updated - the previous detected version is different from the current version
   * Application Opened - the previously detected version is same as the current version
   */
  private async checkInstalledVersion() {
    const context = await getContext(undefined, this.config);

    const previousContext = this.store.context.get();

    // Only overwrite the previous context values to preserve any values that are added by enrichment plugins like IDFA
    await this.store.context.set(deepmerge(previousContext ?? {}, context));

    if (this.config.trackAppLifecycleEvents !== true) {
      return;
    }

    if (previousContext?.app === undefined) {
      const event = createTrackEvent({
        event: 'Application Installed',
        properties: {
          version: context?.app?.version,
          name: context?.app?.name,
        },
      });
      this.process(event);
      console.log('TRACK (Application Installed) event saved', event);
    } else if (context?.app?.version !== previousContext.app.version) {
      const event = createTrackEvent({
        event: 'Application Updated',
        properties: {
          version: context?.app?.version,
          previous_version: previousContext.app.version,
        },
      });
      this.process(event);
      console.log('TRACK (Application Updated) event saved', event);
    }
    const event = createTrackEvent({
      event: 'Application Opened',
      properties: {
        from_background: false,
        version: context?.app?.version,
      },
    });
    this.process(event);
    console.log('TRACK (Application Opened) event saved', event);
  }
  /**
   * AppState event listener. Called whenever the app state changes.
   *
   * Send application lifecycle events if trackAppLifecycleEvents is enabled.
   *
   * Application Opened - only when the app state changes from 'inactive' or 'background' to 'active'
   *   The initial event from 'unknown' to 'active' is handled on launch in checkInstalledVersion
   * Application Backgrounded - when the app state changes from 'inactive' or 'background' to 'active
   *
   * @param nextAppState 'active', 'inactive', 'background' or 'unknown'
   */
  private handleAppStateChange(nextAppState: AppStateStatus) {
    if (this.config.trackAppLifecycleEvents === true) {
      if (
        ['inactive', 'background'].includes(this.appState) &&
        nextAppState === 'active'
      ) {
        const context = this.store.context.get();
        const event = createTrackEvent({
          event: 'Application Opened',
          properties: {
            from_background: true,
            version: context?.app?.version,
          },
        });
        this.process(event);
        console.log('TRACK (Application Opened) event saved', event);
      } else if (
        this.appState === 'active' &&
        ['inactive', 'background'].includes(nextAppState)
      ) {
        const event = createTrackEvent({
          event: 'Application Backgrounded',
        });
        this.process(event);
        console.log('TRACK (Application Backgrounded) event saved', event);
      }
    }
    this.appState = nextAppState;
  }

  /**
   * There is no garbage collection in JS, which means that any listeners, timeouts and subscriptions
   * would run until the application closes
   *
   * This method exists in case the user for some reason needs to recreate the class instance during runtime.
   * In this case, they should run client.cleanup() to destroy the listeners in the old client before creating a new one.
   *
   * There is a Stage 3 EMCAScript proposal to add a user-defined finalizer, which we could potentially switch to if
   * it gets approved: https://github.com/tc39/proposal-weakrefs#finalizers
   */
  cleanup() {
    this.flushPolicyExecuter.cleanup();
    this.appStateSubscription?.remove();

    this.destroyed = true;
  }

  private setupLifecycleEvents() {
    this.appStateSubscription?.remove();

    this.appStateSubscription = AppState.addEventListener(
      'change',
      (nextAppState) => {
        this.handleAppStateChange(nextAppState);
      }
    );
  }

  /**
   * Adds a new plugin to the currently loaded set.
   * @param {{ plugin: Plugin, settings?: IntegrationSettings }} Plugin to be added.
   */
  add<P extends Plugin>({ plugin }: { plugin: P }) {
    if (!this.isReady.value) {
      this.pluginsToAdd.push(plugin);
    } else {
      this.addPlugin(plugin);
    }
  }

  private addPlugin(plugin: Plugin) {
    plugin.configure(this);
    this.timeline.add(plugin);
    this.triggerOnPluginLoaded(plugin);
  }
  private async fetchSettings() {
    try {
      const writeKeysSettingsEndpoint = `${this.config.cdnHost}/write_keys/${this.config.writeKey}.json`;
      const response = await fetch(writeKeysSettingsEndpoint);
      checkResponseForErrors(response);

      const writeKeysSettings: WriteKeySettingsResponse =
        (await response.json()) as WriteKeySettingsResponse;

      const fromattedSettings = writeKeysSettings.syncs.reduce(
        (acc, sync) => ({ ...acc, [sync.destination_app]: sync }),
        {}
      );
      await this.store.settings.set(fromattedSettings);
    } catch (error) {
      console.error(translateHTTPError(error));
    }
  }
  async flush(): Promise<void> {
    try {
      if (this.destroyed) {
        return;
      }

      this.flushPolicyExecuter.reset();

      const promises: (void | Promise<void>)[] = [];
      getPluginsWithFlush(this.timeline).forEach((plugin) => {
        promises.push(plugin.flush());
      });

      const results = await Promise.allSettled(promises);
      for (const r of results) {
        if (r.status === 'rejected') {
          console.error(r.reason);
        }
      }
    } catch (error) {
      console.error(error);
    }
  }
  /**
   * Sets the messageId and timestamp
   * @param event Segment Event
   * @returns event with data injected
   */
  private applyRawEventData = (event: JournifyEvent): JournifyEvent => {
    return {
      ...event,
      ...this.userInfo.get(true),
      writeKey: this.config.writeKey,
      messageId: getUUID(),
      timestamp: new Date().toISOString(),
    } as JournifyEvent;
  };

  /**
   * Starts timeline processing
   * @param incomingEvent Segment Event
   * @returns Segment Event
   */
  private async startTimelineProcessing(
    incomingEvent: JournifyEvent
  ): Promise<JournifyEvent | undefined> {
    const event = await this.applyContextData(incomingEvent);
    this.flushPolicyExecuter.notify(event);
    return await this.timeline.process(event);
  }

  /**
   * Injects context and userInfo data into the event
   * This is handled outside of the timeline to prevent concurrency issues between plugins
   * This is only added after the client is ready to let the client restore values from storage
   * @param event Segment Event
   * @returns event with data injected
   */
  private applyContextData = async (
    event: JournifyEvent
  ): Promise<JournifyEvent> => {
    const userInfo = await this.processUserInfo(event);
    const context = await this.context.get(true);
    return {
      ...event,
      ...userInfo,
      context: {
        ...event.context,
        ...context,
      },
    } as JournifyEvent;
  };

  /**
   * Processes the userInfo to add to an event.
   * For Identify and Alias: it saves the new userId and traits into the storage
   * For all: set the userId and anonymousId from the current values
   * @param event segment event
   * @returns userInfo to inject to an event
   */
  private processUserInfo = async (
    event: JournifyEvent
  ): Promise<Partial<JournifyEvent>> => {
    // Order here is IMPORTANT!
    // Identify and Alias userInfo set operations have to come as soon as possible
    // Do not block the set by doing a safe get first as it might cause a race condition
    // within events procesing in the timeline asyncronously

    if (event.type === JournifyEventType.IDENTIFY) {
      let traits = event.traits ?? {};
      if (this.config.hashPII) {
        traits = await hashPII(traits);
      }
      const userInfo = await this.userInfo.set((state) => ({
        ...state,
        userId: event.userId ?? state.userId,
        traits: {
          ...state.traits,
          ...traits,
        },
      }));

      return {
        anonymousId: userInfo.anonymousId,
        userId: event.userId ?? userInfo.userId,
        traits: {
          ...userInfo.traits,
          ...traits,
        },
      };
    }

    const userInfo = await this.userInfo.get(true);

    return {
      anonymousId: userInfo.anonymousId,
      userId: userInfo.userId,
      traits: userInfo.traits,
    };
  };

  public async reset(resetAnonymousId = true) {
    try {
      const { anonymousId: currentId } = await this.store.userInfo.get(true);
      const anonymousId = resetAnonymousId === true ? getUUID() : currentId;

      await this.store.userInfo.set({
        anonymousId,
        userId: undefined,
        traits: undefined,
      });

      await allSettled(
        getPluginsWithReset(this.timeline).map((plugin) => plugin.reset())
      );

      console.log('Client has been reset');
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Registers a callback for each plugin that gets added to the analytics client.
   * @param callback Function to call
   */
  onPluginLoaded(callback: OnPluginAddedCallback) {
    this.onPluginAddedObservers.push(callback);
  }

  private triggerOnPluginLoaded(plugin: Plugin) {
    this.onPluginAddedObservers.map((f) => f?.(plugin));
  }

  public getIntegrationSettings(integration: string): Sync | undefined {
    return this.store.settings.get()?.[integration] as Sync;
  }

  async process(incomingEvent: JournifyEvent) {
    const event = this.applyRawEventData(incomingEvent);
    if (this.isReady.value) {
      return this.startTimelineProcessing(event);
    }
    this.store.pendingEvents.add(event);
    return event;
  }

  /**
   * Initializes the flush policies from config and subscribes to updates to
   * trigger flush
   */
  private setupFlushPolicies() {
    const flushPolicies = [];

    // If there are zero policies or flushAt/flushInterval use the defaults:
    if (this.config.flushPolicies !== undefined) {
      flushPolicies.push(...this.config.flushPolicies);
    } else {
      if (
        this.config.flushAt === undefined ||
        (this.config.flushAt !== null && this.config.flushAt > 0)
      ) {
        flushPolicies.push(
          new CountFlushPolicy(this.config.flushAt ?? defaultFlushAt)
        );
      }

      if (
        this.config.flushInterval === undefined ||
        (this.config.flushInterval !== null && this.config.flushInterval > 0)
      ) {
        flushPolicies.push(
          new TimerFlushPolicy(
            (this.config.flushInterval ?? defaultFlushInterval) * 1000
          )
        );
      }
    }

    for (const fp of flushPolicies) {
      this.flushPolicyExecuter.add(fp);
    }
  }

  /**
   * Adds a FlushPolicy to the list
   * @param policies policies to add
   */
  addFlushPolicy(...policies: FlushPolicy[]) {
    for (const policy of policies) {
      this.flushPolicyExecuter.add(policy);
    }
  }

  /**
   * Removes a FlushPolicy from the execution
   *
   * @param policies policies to remove
   * @returns true if the value was removed, false if not found
   */
  removeFlushPolicy(...policies: FlushPolicy[]) {
    for (const policy of policies) {
      this.flushPolicyExecuter.remove(policy);
    }
  }

  /**
   * Returns the current enabled flush policies
   */
  getFlushPolicies() {
    return this.flushPolicyExecuter.policies;
  }

  async track(eventName: string, properties?: JsonMap) {
    const event = createTrackEvent({
      event: eventName,
      properties,
    });
    await this.process(event);
  }

  async identify(userId?: string, userTraits?: Traits) {
    if (!userId) {
      throw new Error('userId is required to identify a user');
    }
    const event = createIdentifyEvent({
      userId: userId,
      userTraits: userTraits,
    });

    await this.process(event);
  }

  async screen(screenName: string, properties?: JsonMap) {
    const event = createScreenEvent({ name: screenName, properties });
    await this.process(event);
  }
}

function isTestingWriteKey(writeKey: string): boolean {
  return writeKey?.startsWith(WRITE_KEY_TEST_PREFIX);
}

export function getProductionWriteKey(writeKey: string): string {
  if (isTestingWriteKey(writeKey)) {
    return writeKey?.replace(WRITE_KEY_TEST_PREFIX, WRITE_KEY_PROD_PREFIX);
  }

  return writeKey;
}

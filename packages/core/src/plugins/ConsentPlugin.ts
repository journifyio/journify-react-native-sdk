import { JournifyClient } from '../analytics';
import { JournifyEvent } from '../events';
import { DestinationPlugin, Plugin } from '../plugin';
import {
  JournifyAPIIntegration,
  JournifyIntegrations,
  PluginType,
  Sync,
} from '../types';
import { JOURNIFY_DESTINATION_KEY } from './JournifyDestination';

const CONSENT_PREF_UPDATE_EVENT = 'JOURNIFY Consent Preference';

export interface CategoryConsentStatusProvider {
  setApplicableCategories(categories: string[]): void;
  getConsentStatus(): Promise<Record<string, boolean>>;
  onConsentChange(cb: (updConsent: Record<string, boolean>) => void): void;
  shutdown?(): void;
}

/**
 * This plugin interfaces with the consent provider and it:
 *
 * - stamps all events with the consent metadata.
 * - augments all destinations with a consent filter plugin that prevents events from reaching them if
 * they are not compliant current consent setup
 * - listens for consent change from the provider and notifies Segment
 */
export class ConsentPlugin extends Plugin {
  type = PluginType.before;
  private consentCategoryProvider: CategoryConsentStatusProvider;
  private categories: string[] = [];
  queuedEvents: JournifyEvent[] = [];
  consentStarted = false;

  constructor(consentCategoryProvider: CategoryConsentStatusProvider) {
    super();
    this.consentCategoryProvider = consentCategoryProvider;
  }

  update(_settings: Sync): void {
    const consentSettings = this.analytics?.consentSettings.get();
    this.categories = consentSettings?.allCategories || [];
    this.consentCategoryProvider.setApplicableCategories(this.categories);
  }

  configure(analytics: JournifyClient): void {
    super.configure(analytics);
    analytics.getPlugins().forEach(this.injectConsentFilterIfApplicable);
    analytics.onPluginLoaded(this.injectConsentFilterIfApplicable);
    this.consentCategoryProvider.onConsentChange(() => {
      this.notifyConsentChange();
    });

    let lastDeviceAttrs = analytics.context.get()?.device;
    analytics.context.onChange((c) => {
      const newAttrs = c?.device;
      if (
        newAttrs?.adTrackingEnabled !== lastDeviceAttrs?.adTrackingEnabled ||
        newAttrs?.advertisingId !== lastDeviceAttrs?.advertisingId ||
        newAttrs?.trackingStatus !== lastDeviceAttrs?.trackingStatus
      ) {
        this.notifyConsentChange();
      }
      lastDeviceAttrs = newAttrs;
    });
  }

  private injectConsentFilterIfApplicable = (plugin: Plugin) => {
    if (this.isDestinationPlugin(plugin)) {
      plugin.add(
        new ConsentFilterPlugin((event) => {
          const allCategories =
            this.analytics?.consentSettings.get()?.allCategories || [];
          const settings = this.analytics?.settings.get() || {};
          const preferences = event.context?.consent?.categoryPreferences || {};

          if (plugin.key === JOURNIFY_DESTINATION_KEY) {
            const noneConsented = allCategories.every(
              (category) => !preferences[category]
            );

            return (
              this.isConsentUpdateEvent(event) ||
              !this.isConsentFeatureSetup() ||
              !(noneConsented && !this.hasUnmappedDestinations())
            );
          }

          const integrationSettings = settings?.[
            plugin.key
          ] as JournifyAPIIntegration;
          if (this.containsConsentSettings(integrationSettings)) {
            const categories = integrationSettings.consentSettings.categories;
            return (
              !this.isConsentUpdateEvent(event) &&
              categories.every((category) => preferences?.[category])
            );
          }

          return true;
        })
      );
    }
  };

  private containsConsentSettings = (
    settings: JournifyIntegrations | undefined
  ): settings is Required<Pick<JournifyAPIIntegration, 'consentSettings'>> => {
    return (
      typeof (settings as JournifyAPIIntegration)?.consentSettings
        ?.categories === 'object'
    );
  };

  private hasUnmappedDestinations(): boolean {
    return (
      this.analytics?.consentSettings.get()?.hasUnmappedDestinations === true
    );
  }

  private isConsentFeatureSetup(): boolean {
    return typeof this.analytics?.consentSettings.get() === 'object';
  }

  private isDestinationPlugin(plugin: Plugin): plugin is DestinationPlugin {
    return plugin.type === PluginType.destination;
  }

  private isConsentUpdateEvent(event: JournifyEvent): boolean {
    return (event as JournifyEvent).event === CONSENT_PREF_UPDATE_EVENT;
  }
  async execute(event: JournifyEvent): Promise<JournifyEvent | undefined> {
    if (this.consentStarted === true) {
      event.context = {
        ...event.context,
        consent: {
          categoryPreferences:
            await this.consentCategoryProvider.getConsentStatus(),
        },
      };
      return event;
    }

    if (this.consentStarted === false) {
      // constrain the queue to avoid running out of memory if consent is never started
      if (this.queuedEvents.length <= 1000) {
        this.queuedEvents.push(event);
        return;
      }
      return;
    }
    return;
  }
  public start() {
    this.consentStarted = true;

    this.sendQueuedEvents();
  }
  sendQueuedEvents() {
    this.queuedEvents.forEach((event) => {
      this.analytics?.process(event);
    });
    this.queuedEvents = [];
  }
  shutdown(): void {
    this.consentCategoryProvider.shutdown?.();
  }
  private notifyConsentChange() {
    // actual preferences will be attached in the execute method
    this.analytics?.track(CONSENT_PREF_UPDATE_EVENT).catch((e) => {
      throw e;
    });
  }
}

/**
 * This plugin reads the consent metadata set on the context object and then drops the events
 * if they are going into a destination which violates's set consent preferences
 */
class ConsentFilterPlugin extends Plugin {
  type = PluginType.before;
  private shouldAllowEvent: (event: JournifyEvent) => boolean;

  constructor(shouldAllowEvent: (event: JournifyEvent) => boolean) {
    super();
    this.shouldAllowEvent = shouldAllowEvent;
  }

  execute(event: JournifyEvent): JournifyEvent | undefined {
    return this.shouldAllowEvent(event) ? event : undefined;
  }
}

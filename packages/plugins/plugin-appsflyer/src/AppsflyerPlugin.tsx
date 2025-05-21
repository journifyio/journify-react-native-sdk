import {
  DestinationPlugin,
  JournifyEvent,
  PluginType,
  UpdateType,
  Sync,
} from '@journifyio/react-native-sdk';
import appsFlyer from 'react-native-appsflyer';
import identify from './methods/identify';
import track from './methods/track';

type Settings = {
  DevKey: string;
  AppID: string;
};

export class AppsflyerPlugin extends DestinationPlugin {
  constructor(
    settings: Settings,
    props?: {
      timeToWaitForATTUserAuthorization: number;
      is_adset: boolean;
      is_adset_id: boolean;
      is_ad_id: boolean;
    }
  ) {
    super();
    if (settings === undefined || settings === null) {
      throw new Error('Appsflyer settings are required');
    }
    if (settings.AppID === undefined || settings.AppID === null) {
      throw new Error('Appsflyer AppID is required');
    }
    if (settings.DevKey === undefined || settings.DevKey === null) {
      throw new Error('Appsflyer DevKey is required');
    }
    this.settings = settings;
    if (props != null) {
      this.timeToWaitForATTUserAuthorization =
        props.timeToWaitForATTUserAuthorization;
      this.is_adset = props.is_adset === undefined ? false : props.is_adset;
      this.is_ad_id = props.is_ad_id === undefined ? false : props.is_ad_id;
      this.is_adset_id =
        props.is_adset_id === undefined ? false : props.is_adset_id;
    }
  }
  type = PluginType.destination;
  key = 'appsflyer';
  is_adset = false;
  is_adset_id = false;
  is_ad_id = false;
  private hasRegisteredInstallCallback = false;
  private hasRegisteredDeepLinkCallback = false;
  private hasInitialized = false;
  private settings: Settings;

  timeToWaitForATTUserAuthorization = 60;

  async update(settings: Sync, _: UpdateType): Promise<void> {
    super.update(settings, _);
    const defaultOpts = {
      isDebug: false,
      timeToWaitForATTUserAuthorization: this.timeToWaitForATTUserAuthorization,
      onInstallConversionDataListener: true,
    };
    const appsflyerSettings = settings;

    if (appsflyerSettings === undefined) {
      return;
    }
    const clientConfig = this.analytics?.getConfig();

    if (!this.hasRegisteredInstallCallback) {
      this.registerConversionCallback();
      this.hasRegisteredInstallCallback = true;
    }

    if (
      clientConfig?.trackDeepLinks === true &&
      !this.hasRegisteredDeepLinkCallback
    ) {
      this.registerDeepLinkCallback();
      this.registerUnifiedDeepLinkCallback();

      this.hasRegisteredDeepLinkCallback = true;
    }
    if (!this.hasInitialized) {
      try {
        await appsFlyer.initSdk({
          devKey: this.settings.DevKey,
          appId: this.settings.AppID,
          onDeepLinkListener: clientConfig?.trackDeepLinks === true,
          ...defaultOpts,
        });

        this.hasInitialized = true;
      } catch (error) {
        const message = ' failed to initialize';
        console.warn(`[${this.key}] ${message}: ${JSON.stringify(error)}`);
      }
    }
  }

  identify(event: JournifyEvent) {
    identify(event);
    return event;
  }

  async track(event: JournifyEvent) {
    const clonedEvent = { ...event };
    const mapped = this.fieldMapper?.map(clonedEvent);
    clonedEvent.properties = { ...clonedEvent.properties, ...mapped };
    const dstEventMapping = this.eventMapper?.map(clonedEvent);
    if (!dstEventMapping) {
      console.warn(
        `[${this.key}] event not found. Please check your event mappings.`
      );
      return event;
    }
    clonedEvent.name = dstEventMapping.dstEventName;
    await track(clonedEvent);
    return event;
  }

  registerConversionCallback = () => {
    appsFlyer.onInstallConversionData((res) => {
      const {
        af_status,
        media_source,
        campaign,
        is_first_launch,
        adset_id,
        ad_id,
        adset,
      } = res?.data;
      const properties = {
        provider: this.key,
        campaign: {
          source: media_source,
          name: campaign,
        },
      };
      if (this.is_adset_id) {
        Object.assign(properties, { adset_id: adset_id });
      }
      if (this.is_ad_id) {
        Object.assign(properties, { ad_id: ad_id });
      }
      if (this.is_adset) {
        Object.assign(properties, { adset: adset });
      }
      if (Boolean(is_first_launch) && JSON.parse(is_first_launch) === true) {
        if (af_status === 'Non-organic') {
          this.analytics
            ?.track('Install Attributed', properties)
            .then(() =>
              console.info(
                `[${this.key}] Sent Install Attributed event to Journify`
              )
            );
        } else {
          console.info(`[${this.key}] Sent Organic Install event to Journify`);
          this.analytics
            ?.track('Organic Install', {
              provider: 'AppsFlyer',
            })
            .then(() =>
              console.info(
                `[${this.key}] Sent Organic Install event to Journify`
              )
            );
        }
      }
    });
  };

  registerDeepLinkCallback = () => {
    appsFlyer.onAppOpenAttribution((res) => {
      if (res?.status === 'success') {
        const { campaign, media_source } = res.data;
        const properties = {
          provider: this.key,
          campaign: {
            name: campaign,
            source: media_source,
          },
        };
        void this.analytics?.track('Deep Link Opened', properties);
      }
    });
  };

  registerUnifiedDeepLinkCallback = () => {
    appsFlyer.onDeepLink((res) => {
      if (res.deepLinkStatus !== 'NOT_FOUND') {
        const { DLValue, media_source, campaign } = res.data;
        const properties = {
          deepLink: DLValue as string,
          campaign: {
            name: campaign,
            source: media_source,
          },
        };
        void this.analytics?.track('Deep Link Opened', properties);
      }
    });
  };
  reset(): void | Promise<void> {
    super.reset();
  }
}

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

const SETTINGS_KEYS = {
  appsFlyerDevKey: 'appsflyer_dev_key',
  appleAppID: 'appsflyer_app_id',
};
export class AppsflyerPlugin extends DestinationPlugin {
  constructor(props?: {
    timeToWaitForATTUserAuthorization: number;
    is_adset: boolean;
    is_adset_id: boolean;
    is_ad_id: boolean;
  }) {
    super();
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
  key = 'AppsFlyer';
  is_adset = false;
  is_adset_id = false;
  is_ad_id = false;
  private hasRegisteredInstallCallback = false;
  private hasRegisteredDeepLinkCallback = false;
  private hasInitialized = false;

  timeToWaitForATTUserAuthorization = 60;

  async update(settings: Sync, _: UpdateType): Promise<void> {
    const defaultOpts = {
      isDebug: false,
      timeToWaitForATTUserAuthorization: this.timeToWaitForATTUserAuthorization,
      onInstallConversionDataListener: true,
    };
    const appsflyerSettings = settings;

    if (appsflyerSettings === undefined) {
      return;
    }
    const devKey = appsflyerSettings.settings.find(
      (setting) => setting.key === SETTINGS_KEYS.appsFlyerDevKey
    )?.value;
    const appId = appsflyerSettings.settings.find(
      (setting) => setting.key === SETTINGS_KEYS.appleAppID
    )?.value;
    if (devKey === undefined) {
      console.error(
        'AppsFlyer dev key is required. Please check your settings.'
      );
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
          devKey: devKey as string,
          appId: appId as string,
          onDeepLinkListener: clientConfig?.trackDeepLinks === true,
          ...defaultOpts,
        });
        this.hasInitialized = true;
      } catch (error) {
        const message = 'AppsFlyer failed to initialize';
        console.warn(`${message}: ${JSON.stringify(error)}`);
      }
    }
  }

  identify(event: JournifyEvent) {
    identify(event);
    return event;
  }

  async track(event: JournifyEvent) {
    const mapped = this.fieldMapper?.map(event);
    event.properties = { ...event.properties, ...mapped };
    const dstEventMapping = this.eventMapper?.map(event);
    if (!dstEventMapping) {
      console.warn(
        'AppsFlyer event not found. Please check your event mappings.'
      );
      return event;
    }
    event.name = dstEventMapping.dstEventName;
    await track(event);
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
              console.info('Sent Install Attributed event to Segment')
            );
        } else {
          console.info('Sent Organic Install event to Segment');
          this.analytics
            ?.track('Organic Install', {
              provider: 'AppsFlyer',
            })
            .then(() => console.info('Sent Organic Install event to Segment'));
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
}

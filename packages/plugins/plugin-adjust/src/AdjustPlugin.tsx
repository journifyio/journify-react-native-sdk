import {
  DestinationPlugin,
  JournifyEvent,
  PluginType,
  Sync,
  UpdateType,
} from '@journifyio/react-native-sdk';
import { Adjust, AdjustConfig, Environment } from 'react-native-adjust';
import identify from './methods/identify';
import track from './methods/track';
import reset from './methods/reset';

const SETTINGS_KEYS = {
  environment: 'adjust_environment',
  appToken: 'adjust_app_token',
};

export class AdjustPlugin extends DestinationPlugin {
  type = PluginType.destination;
  key = 'adjust';

  private settings: Sync | null = null;
  private hasRegisteredCallback = false;

  update(adjustSettings: Sync, _: UpdateType) {
    super.update(adjustSettings, _);
    if (adjustSettings === undefined || adjustSettings === null) {
      return;
    }

    this.settings = adjustSettings;
    // Get the environment and app token from the settings
    let environment: Environment = 'production';
    let appToken: string | null = null;
    for (const obj of this.settings.settings) {
      if (obj.key === SETTINGS_KEYS.environment) {
        environment = obj.value as Environment;
      } else if (obj.key === SETTINGS_KEYS.appToken) {
        appToken = obj.value as string;
      }
    }
    if (appToken === null) {
      console.error('Adjust app token is required');
      return;
    }

    const adjustConfig = new AdjustConfig(appToken!, environment);

    if (this.hasRegisteredCallback === false) {
      adjustConfig.setAttributionCallback((attribution) => {
        const trackPayload = {
          provider: 'Adjust',
          trackerToken: attribution.trackerToken,
          trackerName: attribution.trackerName,
          campaign: {
            source: attribution.network,
            name: attribution.campaign,
            content: attribution.clickLabel,
            adCreative: attribution.creative,
            adGroup: attribution.adgroup,
          },
        };
        this.analytics?.track('Install Attributed', trackPayload);
      });
      this.hasRegisteredCallback = true;
    }
    //Removed from react-native-adjust v5 (https://dev.adjust.com/en/sdk/migration/react-native/v4-to-v5)
    //TO DO : Remove commented lines in next release
    // const bufferingEnabled = this.settings.setEventBufferingEnabled;
    // if (bufferingEnabled === true) {
    //   adjustConfig.setEventBufferingEnabled(bufferingEnabled);
    // }

    // const useDelay = this.settings.setDelay;
    // if (useDelay === true) {
    //   const delayTime = this.settings.delayTime;
    //   if (delayTime !== null && delayTime !== undefined) {
    //     adjustConfig.setDelayStart(delayTime);
    //   }
    // }

    //create has been replaced with initSDK in v5
    //TO DO : Remove commented lines in next release
    //Adjust.create(adjustConfig);
    Adjust.initSdk(adjustConfig);
  }
  identify(event: JournifyEvent) {
    identify(event);
    return event;
  }

  track(event: JournifyEvent) {
    const clonedEvent = { ...event };
    const mapped = this.fieldMapper?.map(clonedEvent);
    clonedEvent.properties = { ...clonedEvent.properties, ...mapped };
    const dstEventMapping = this.eventMapper?.map(clonedEvent);
    if (!dstEventMapping) {
      console.warn(
        '[Adjust] event token not found. Please check your event mappings.'
      );
      return event;
    }
    clonedEvent.event = dstEventMapping.dstEventName;
    track(clonedEvent);
    return event;
  }

  reset() {
    reset();
  }
}

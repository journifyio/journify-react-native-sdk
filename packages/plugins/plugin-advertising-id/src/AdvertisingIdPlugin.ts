import {
  Plugin,
  PluginType,
  JournifyClient,
  getNativeModule,
} from 'journifyio-react-native-sdk';

import { Platform, type NativeModule } from 'react-native';

type AdvertisingIDNativeModule = NativeModule & {
  getAdvertisingId: () => Promise<string>;
};

export class AdvertisingIdPlugin extends Plugin {
  type = PluginType.enrichment;

  configure(analytics: JournifyClient): void {
    if (Platform.OS !== 'android') {
      return;
    }

    this.analytics = analytics;
    (
      getNativeModule(
        'JournifyioReactNativeSdkAdvertisingId'
      ) as AdvertisingIDNativeModule
    )
      ?.getAdvertisingId()
      .then((id: string) => {
        console.log('Advertising ID', id);
        if (id === null) {
          void analytics.track(
            'LimitAdTrackingEnabled (Google Play Services) is enabled'
          );
        } else {
          void this.setContext(id);
        }
      })
      .catch((error) => { 
        console.error('Error getting advertising ID', error);
      });
  }

  async setContext(id: string): Promise<void> {
    try {
      console.log('Setting advertising ID context', id);
      await this.analytics?.context.set({
        device: {
          advertisingId: id,
          adTrackingEnabled: true,
        },
      });
    } catch (error) {
      const message = 'AdvertisingID failed to set context';
      console.error(message, error);
    }
  }
}

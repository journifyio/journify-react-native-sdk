import {
  DestinationPlugin,
  JournifyEvent,
  PluginType,
} from '@journifyio/react-native-sdk';
import screen from './methods/screen';
import track from './methods/track';
import reset from './methods/reset';
import firebaseAnalytics from '@react-native-firebase/analytics';

export class FirebasePlugin extends DestinationPlugin {
  type = PluginType.destination;
  key = 'firebase';

  constructor() {
    super();
    firebaseAnalytics().setAnalyticsCollectionEnabled(true);
  }
  async identify(event: JournifyEvent) {
    if (event.userId !== undefined) {
      await firebaseAnalytics().setUserId(event.userId);
    }
    if (event.traits) {
      const eventTraits = event.traits;

      const checkType = (value: unknown) => {
        return typeof value === 'object' && !Array.isArray(value);
      };
      const safeTraits = Object.keys(eventTraits).reduce(
        (acc: Record<string, string>, trait) => {
          if (checkType(eventTraits[trait])) {
            console.warn(
              `[${this.key}] We detected an object or array data type. Firebase does not accept nested traits.`
            );

            return acc;
          }
          if (trait !== undefined) {
            acc[trait] =
              typeof eventTraits[trait] === 'undefined'
                ? ''
                : String(eventTraits[trait]);
          }
          return acc;
        },
        {}
      );

      await firebaseAnalytics().setUserProperties(safeTraits);
    }
    return event;
  }

  async track(event: JournifyEvent) {
    try {
      const clonedEvent = { ...event };
      const mapped = this.fieldMapper?.map(clonedEvent);
      clonedEvent.properties = { ...clonedEvent.properties, ...mapped };
      const dstEventMapping = this.eventMapper?.map(clonedEvent);
      if (!dstEventMapping) {
        console.warn(
          `[${this.key}] Event not found in event mappings. Please check your event mappings.`
        );
        return event;
      }
      clonedEvent.event = dstEventMapping.dstEventName;
      console.log(`[${this.key}] clonedEvent`, clonedEvent);
      await track(clonedEvent);
    } catch (error) {
      console.error(`[${this.key}] Error on Firebase Track`, error);
    }
    return event;
  }

  async screen(event: JournifyEvent) {
    try {
      await screen(event);
    } catch (error) {
      console.error(`[${this.key}] Error on Firebase Screen`, error);
    }
    return event;
  }

  async reset() {
    try {
      await reset();
    } catch (error) {
      console.error(`[${this.key}] Error on Firebase Reset`, error);
    }
  }
}

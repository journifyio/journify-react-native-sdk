import {
  DestinationPlugin,
  JournifyEvent,
  PluginType,
  Sync,
  UpdateType,
  generateMapTransform,
} from '@journifyio/react-native-sdk';
import MoEngage, { MoEProperties } from 'react-native-moengage';
import { mapTraits, transformMap } from './parameterMapping';

const mappedTraits = generateMapTransform(mapTraits, transformMap);

export class MoengagePlugin extends DestinationPlugin {
  type = PluginType.destination;
  key = 'moengage';

  update(settings: Sync, update: UpdateType): void {
    super.update(settings, update);
  }
  identify(event: JournifyEvent) {
    const traits = event.traits as Record<string, unknown>;
    const userId = event.userId ?? event.anonymousId;
    const safeTraits = mappedTraits({ ...traits, userId });

    if (safeTraits.length === 0) {
      console.warn(
        `[${this.key}] No traits found. Please check your traits mappings.`
      );
      return event;
    }
    const stringifiedTraits = Object.entries(safeTraits).reduce(
      (acc, [key, value]) => {
        if (value !== null && value !== undefined) {
          acc[key] = String(value);
        }
        return acc;
      },
      {} as Record<string, string>
    );
    MoEngage.identifyUser(stringifiedTraits);
    return event;
  }

  track(event: JournifyEvent) {
    if (event.event === null || event.event === undefined) {
      return event;
    }

    const eventName = event.event;
    const properties = event.properties as Record<string, unknown>;

    if (Object.keys(properties).length > 0) {
      const moengageProperties = new MoEProperties();
      for (const [key, value] of Object.entries(properties)) {
        moengageProperties.addAttribute(key, String(value));
      }
      MoEngage.trackEvent(eventName, moengageProperties);
    }

    return event;
  }

  reset() {
    // Reset user data in MoEngage
    MoEngage.logout();
  }
}

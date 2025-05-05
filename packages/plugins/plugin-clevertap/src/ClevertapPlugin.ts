import {
  DestinationPlugin,
  JournifyEvent,
  PluginType,
  generateMapTransform,
} from '@journifyio/react-native-sdk';

import { mapTraits, transformMap } from './parameterMapping';
import CleverTap from 'clevertap-react-native';

const mappedTraits = generateMapTransform(mapTraits, transformMap);

export class ClevertapPlugin extends DestinationPlugin {
  type = PluginType.destination;
  key = 'clevertap';

  identify(event: JournifyEvent) {
    const traits = event.traits as Record<string, unknown>;
    const safeTraits = mappedTraits(traits);
    const userId = event.userId ?? event.anonymousId;

    if (
      safeTraits.DOB !== undefined &&
      safeTraits.DOB !== null &&
      !(safeTraits.DOB instanceof Date)
    ) {
      if (
        typeof safeTraits.DOB === 'string' ||
        typeof safeTraits.DOB === 'number'
      ) {
        const birthday = new Date(safeTraits.DOB);
        if (
          birthday !== undefined &&
          birthday !== null &&
          !isNaN(birthday.getTime())
        ) {
          safeTraits.DOB = birthday;
        }
      } else {
        delete safeTraits.DOB;

        console.warn(
          `Birthday found "${event.traits?.birthday}" could not be parsed as a Date. Try converting to ISO format.`
        );
      }
    }
    const clevertapTraits = { ...safeTraits, Identity: userId };
    CleverTap.profileSet(clevertapTraits);
    return event;
  }

  track(event: JournifyEvent) {
    if (event.event === null || event.event === undefined) {
      return event;
    }
    if (event.event.toLowerCase().includes('purchase')) {
      const userId = event.userId ?? event.anonymousId;
      const { items = [], ...props } = event.properties ?? {};
      const chargeDetails = { ...props, Identity: userId };
      const sanitizedProducts = items ?? [];

      CleverTap.recordChargedEvent(chargeDetails, sanitizedProducts);
    } else {
      CleverTap.recordEvent(event.event, event.properties);
    }
    return event;
  }

  screen(event: JournifyEvent) {
    const screenName = event.name ?? 'Screen Viewed';
    const userId = event.userId ?? event.anonymousId;
    const screenProps = { ...event.properties, Identity: userId };

    CleverTap.recordEvent(screenName, screenProps);
    return event;
  }
}

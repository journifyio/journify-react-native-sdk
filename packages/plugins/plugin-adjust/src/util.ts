import type { Sync } from '@journifyio/react-native-sdk';

export const mappedCustomEventToken = (eventName: string, settings: Sync) => {
  if (settings.event_mappings.length === 0) {
    return null;
  }
  const event = settings.event_mappings.find(
    (mapping) => mapping.event_name === eventName
  );
  if (!event) {
    return null;
  }
  const result = event.destination_event_key;
  if (!result) {
    return null;
  }
  return result;
};

export const extract = <T>(
  key: string,
  properties: { [key: string]: unknown },
  defaultValue: T | null = null
) => {
  let result = defaultValue;
  Object.entries(properties).forEach(([propKey, propValue]) => {
    // not sure if this comparison is actually necessary,
    // but existed in the old destination so ...
    if (key.toLowerCase() === propKey.toLowerCase()) {
      result = propValue as T;
    }
  });
  return result;
};

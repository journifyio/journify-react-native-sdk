import firebaseAnalytics from '@react-native-firebase/analytics';
import { JournifyEvent } from '@journifyio/react-native-sdk';

const sanitizeName = (name: string) => {
  return name.replace(/[^a-zA-Z0-9]/g, '_');
};

export default async (event: JournifyEvent) => {
  const safeEvent = event;
  const convertedName = safeEvent.event as string;
  let safeEventName = sanitizeName(convertedName);
  const safeProps = safeEvent.properties as { [key: string]: unknown };
  // Clip the event name if it exceeds 40 characters
  if (safeEventName.length > 40) {
    safeEventName = safeEventName.substring(0, 40);
  }
  await firebaseAnalytics().logEvent(safeEventName, safeProps);
};

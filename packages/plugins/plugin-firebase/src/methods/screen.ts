import firebaseAnalytics from '@react-native-firebase/analytics';
import type { JournifyEvent } from '@journifyio/react-native-sdk';

export default async (event: JournifyEvent) => {
  const screenProps = {
    screen_name: event.name,
    screen_class: event.name,
    ...event.properties,
  };

  await firebaseAnalytics().logScreenView(screenProps);
};

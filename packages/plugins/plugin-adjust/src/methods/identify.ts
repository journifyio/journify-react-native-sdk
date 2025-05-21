import { Adjust } from 'react-native-adjust';
import type { JournifyEvent } from '@journifyio/react-native-sdk';

export default (event: JournifyEvent) => {
  const userId = event.userId;
  if (userId !== undefined && userId !== null && userId.length > 0) {
    Adjust.addGlobalPartnerParameter('user_id', userId);
  }

  const anonId = event.anonymousId;
  if (anonId !== undefined && anonId !== null && anonId.length > 0) {
    Adjust.addGlobalPartnerParameter('anonymous_id', anonId);
  }
};

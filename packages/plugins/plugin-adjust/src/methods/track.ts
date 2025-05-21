import { Adjust, AdjustEvent } from 'react-native-adjust';
import type { JournifyEvent } from '@journifyio/react-native-sdk';
import { extract } from '../util';

export default (event: JournifyEvent) => {
  const anonId = event.anonymousId;
  const eventId = event.messageId;
  if (anonId !== undefined && anonId !== null && anonId.length > 0) {
    //addSessionPartnerParameter has been replaced with addGlobalPartnerParameter in v5
    //TO DO : Remove commented lines in next release
    //Adjust.addSessionPartnerParameter('anonymous_id', anonId);
    Adjust.addGlobalPartnerParameter('anonymous_id', anonId);
  }
  if (
    !event.event ||
    event.event === '' ||
    event.event === undefined ||
    event.event === null
  ) {
    return;
  }

  const adjEvent = new AdjustEvent(event.event);

  const properties = event.properties;
  if (properties !== undefined && properties !== null) {
    Object.entries(properties).forEach(([key, value]) => {
      adjEvent.addCallbackParameter(key, value as string);
    });

    const revenue = extract<number>('revenue', properties);
    const currency = extract<string>('currency', properties, 'USD');
    const orderId = extract<string>('orderId', properties);

    if (
      revenue !== undefined &&
      revenue !== null &&
      currency !== undefined &&
      currency !== null
    ) {
      adjEvent.setRevenue(revenue, currency);
    }

    if (orderId !== undefined && orderId !== null) {
      adjEvent.setTransactionId(orderId);
    }
    if (eventId !== undefined && eventId !== null) {
      adjEvent.setDeduplicationId(eventId);
    }
  }
  Adjust.trackEvent(adjEvent);
};

import appsFlyer from 'react-native-appsflyer';
import { isString, JournifyEvent } from '@journifyio/react-native-sdk';

type Properties = { [key: string]: unknown };

export default async (event: JournifyEvent) => {
  const properties = event.properties || {};
  if (event.name === undefined || event.name === null) {
    return;
  }
  const revenue = extractRevenue('af_revenue', properties);
  const currency = extractCurrency('af_currency', properties, 'USD');

  delete properties.af_revenue;
  delete properties.af_currency;

  await appsFlyer.logEvent(event.name, {
    af_revenue: revenue,
    af_currency: currency,
    ...properties,
  });
};

const extractRevenue = (key: string, properties: Properties): number | null => {
  const value = properties[key];
  if (value === undefined || value === null) {
    return null;
  }

  switch (typeof value) {
    case 'number':
      return value;
    case 'string':
      return parseFloat(value);
    default:
      return null;
  }
};

const extractCurrency = (
  key: string,
  properties: Properties,
  defaultCurrency: string
): string => {
  const value = properties[key];
  if (isString(value)) {
    return value;
  }
  return defaultCurrency;
};

import React, { createContext, useContext } from 'react';
import { JournifyClient } from './analytics';
import type { ClientConfig, ClientMethods } from './types';
import { SovranStorage } from './storage/index';

export function createClient(config: ClientConfig) {
  if (!config.writeKey) {
    throw new Error('writeKey is required');
  }

  const segmentStore = new SovranStorage({
    storeId: config.writeKey,
    storePersistor: config.storePersistor,
    storePersistorSaveDelay: config.storePersistorSaveDelay,
  });

  const client = new JournifyClient(config, segmentStore);
  client.init();
  return client;
}

const Context = createContext<JournifyClient | null>(null);

export const AnalyticsProvider = ({
  client,
  children,
}: {
  client?: JournifyClient;
  children?: React.ReactNode;
}) => {
  if (!client) {
    return null;
  }

  return <Context.Provider value={client}>{children}</Context.Provider>;
};

export const useAnalytics = (): ClientMethods => {
  const client = useContext(Context);
  return React.useMemo(() => {
    if (!client) {
      console.error(
        'Journify client not configured!',
        'To use the useAnalytics() hook, pass an initialized Journify client into the AnalyticsProvider'
      );
    }

    return {
      screen: async (...args) => client?.screen(...args),
      track: async (...args) => client?.track(...args),
      identify: async (...args) => client?.identify(...args),
      flush: async () => client?.flush(),
      reset: async (...args) => client?.reset(...args),
    };
  }, [client]);
};

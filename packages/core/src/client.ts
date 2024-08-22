import { JournifyClient } from './analytics';
import type { ClientConfig } from './types';
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

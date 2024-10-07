import { ClientConfig } from './types';

export const WRITE_KEY_TEST_PREFIX = 'wk_test_';
export const WRITE_KEY_PROD_PREFIX = 'wk_';
const DEFAULT_CDN_HOST = 'https://static.journify.io';
export const DEFAULT_API_HOST = 'https://t.journify.io/v1/batch';

export const defaultConfig: ClientConfig = {
  writeKey: '',
  cdnHost: DEFAULT_CDN_HOST,
  trackAppLifecycleEvents: false,
};

export const defaultFlushAt = 20;
export const defaultFlushInterval = 30;

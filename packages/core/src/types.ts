import { Persistor } from '@journifyio/react-native-sdk-sovran';
import type { NativeModule } from 'react-native';
import { FlushPolicy } from './flushPolicies/types';
import { JsonMap, Traits } from './events';

export type ClientConfig = {
  writeKey: string;
  apiHost?: string;
  cdnHost?: string;
  flushAt?: number;
  flushInterval?: number;
  flushPolicies?: FlushPolicy[];
  collectDeviceId?: boolean;
  trackAppLifecycleEvents?: boolean;
  hashPII?: boolean;
} & StoreConfig;

type StoreConfig = {
  storePersistor?: Persistor;
  storePersistorSaveDelay?: number;
};

export type ClientMethods = {
  screen: (name: string, properties?: JsonMap) => Promise<void>;
  track: (event: string, properties?: JsonMap) => Promise<void>;
  identify: (userId?: string, userTraits?: Traits) => Promise<void>;
  flush: () => Promise<void>;
  reset: (resetAnonymousId?: boolean) => Promise<void>;
};

export type JournifyAPIConsentSettings = {
  allCategories: string[];
  hasUnmappedDestinations: boolean;
};
export type JournifyAPIIntegration<T = object> = {
  consentSettings?: {
    categories: string[];
  };
} & T;

export type JournifyIntegrations =
  | {
      [key: string]: Sync;
    }
  | Record<string, unknown>;

export type WriteKeySettingsResponse = {
  syncs: Sync[];
};

export interface Sync {
  id: string;
  destination_app: string;
  settings: SyncSetting[];
  field_mappings: FieldMapping[];
  event_mappings: EventMapping[];
}

export interface SyncSetting {
  key: string;
  value: string;
}

export interface EventMapping {
  enabled: boolean;
  destination_event_key: string;
  event_type: TrackingEventType;
  event_name?: string;
  filters?: EventFilter[];
}

export interface FieldMapping {
  source: FieldMappingSource;
  target: FieldMappingTarget;
}

export interface FieldMappingSource {
  type: FieldMappingSourceType;
  value: string;
}

export enum FieldMappingSourceType {
  UNSPECIFIED = 0,
  FIELD = 1,
  TEMPLATE = 2,
  CONSTANT = 3,
  VARIABLE = 4,
}

export enum TrackingEventType {
  UNDEFINED = '',
  TRACK_EVENT = 'track',
  PAGE_EVENT = 'page',
  SCREEN_EVENT = 'screen',
  IDENTIFY_EVENT = 'identify',
  GROUP_EVENT = 'group',
}

export interface FieldMappingTarget {
  name: string;
}

export interface EventFilter {
  field: string;
  operator: FilterOperator;
  value: any;
}

export enum FilterOperator {
  UNSPECIFIED = '',
  EQUALS = '==',
  NOT_EQUALS = '!=',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not contains',
  STARTS_WITH = 'starts-with',
  ENDS_WITH = 'ends-with',
  GREATER_THAN = '>',
  GREATER_THAN_OR_EQ = '>=',
  LESS_THAN = '<',
  LESS_THAN_OR_EQ = '<=',
}

export enum PluginType {
  // Executed before event processing begins.
  'before' = 'before',
  // Executed as the first level of event processing.
  'enrichment' = 'enrichment',
  // Executed as events begin to pass off to destinations.
  'destination' = 'destination',
  // Executed after all event processing is completed.  This can be used to perform cleanup operations, etc.
  'after' = 'after',
  // Executed only when called manually, such as Logging.
  'utility' = 'utility',
}

export enum UpdateType {
  'initial' = 'initial',
  'refresh' = 'refresh',
}

/**
 * Makes all the properties in an object optional
 */
export type DeepPartial<T> = {
  [Property in keyof T]?: Property extends object
    ? DeepPartial<T[Property]>
    : Partial<T[Property]>;
};

export type NativeContextInfo = {
  appName: string;
  appVersion: string;
  buildNumber: string;
  bundleId: string;
  locale: string;
  networkType: string;
  osName: string;
  osVersion: string;
  screenHeight: number;
  screenWidth: number;
  screenDensity?: number; // android only
  timezone: string;
  manufacturer: string;
  model: string;
  deviceName: string;
  deviceId?: string;
  deviceType: string;
  adTrackingEnabled?: boolean; // ios only
  advertisingId?: string; // ios only
};

// Native Module types
export interface GetContextConfig {
  collectDeviceId: boolean;
}

export type AnalyticsReactNativeModule = NativeModule & {
  getContextInfo: (config: GetContextConfig) => Promise<NativeContextInfo>;
};

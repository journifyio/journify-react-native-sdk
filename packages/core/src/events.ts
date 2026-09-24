export const createIdentifyEvent = ({
  userId,
  userTraits = {},
  externalIds,
}: {
  userId?: string;
  userTraits?: Traits;
  externalIds?: ExternalIds;
}): JournifyEvent => {
  return {
    type: JournifyEventType.IDENTIFY,
    userId: userId,
    traits: userTraits,
    ...(externalIds === undefined ? {} : { externalIds }),
  };
};

export const createTrackEvent = ({
  event,
  properties = {},
}: {
  event: string;
  properties?: JsonMap;
}): JournifyEvent => ({
  type: JournifyEventType.TRACK,
  event,
  properties,
});

export const createScreenEvent = ({
  name,
  properties = {},
}: {
  name: string;
  properties?: JsonMap;
}): JournifyEvent => ({
  type: JournifyEventType.SCREEN,
  name,
  properties,
});

export type JsonValue =
  | boolean
  | number
  | string
  | null
  | JsonList
  | JsonMap
  | undefined;

export interface JsonMap {
  [key: string]: JsonValue;
  [index: number]: JsonValue;
}
export type JsonList = Array<JsonValue>;

export type Address = {
  city?: string;
  country?: string;
  postalCode?: string;
  state?: string;
  street?: string;
  [k: string]: JsonValue;
};

export type Company = {
  id?: string;
  name?: string;
  industry?: string;
  employee_count?: number;
  plan?: string;
};

export type Traits = object & {
  age?: number;
  birthday?: string;
  city?: string;
  country?: string;
  country_code?: string;
  created_at?: string;
  description?: string;
  email?: string;
  firstname?: string;
  gender?: string;
  lastname?: string;
  id?: string;
  language?: string;
  name?: string;
  phone?: string;
  postal_code?: string;
  state?: string;
  state_code?: string;
  title?: string;
  username?: string;
  website?: string;
  company?: Company;
  address?: Address;
  [k: string]: JsonValue;
};

export const SUPPORTED_EXTERNAL_ID_KEYS = [
  'google_click_id',
  'google_wbraid',
  'google_gbraid',
  'google_ga',
  'facebook_click_id',
  'facebook_browser_id',
  'pinterest_click_id',
  'snapchat_click_id',
  'snapchat_scid',
  'tiktok_click_id',
  'tiktok_ttp',
  'twitter_click_id',
  'microsoft_click_id',
  'linkedin_click_id',
  'openai_click_id',
] as const;

export type ExternalIdKey = (typeof SUPPORTED_EXTERNAL_ID_KEYS)[number];
export type ExternalIds = Partial<Record<ExternalIdKey, string>>;

const supportedExternalIdKeys = new Set<string>(SUPPORTED_EXTERNAL_ID_KEYS);

export const sanitizeExternalIds = (externalIds: unknown): ExternalIds => {
  if (
    externalIds === null ||
    typeof externalIds !== 'object' ||
    Array.isArray(externalIds)
  ) {
    return {};
  }

  return Object.entries(externalIds).reduce<ExternalIds>(
    (sanitized, [key, value]) => {
      if (
        supportedExternalIdKeys.has(key) &&
        typeof value === 'string' &&
        value.length > 0
      ) {
        sanitized[key as ExternalIdKey] = value;
      }
      return sanitized;
    },
    {}
  );
};

export const hasExternalIds = (externalIds?: ExternalIds): boolean =>
  externalIds !== undefined && Object.keys(externalIds).length > 0;

export interface JournifyEvent {
  messageId?: string;
  type: JournifyEventType;
  externalIds?: ExternalIds;
  userId?: string;
  anonymousId?: string;
  event?: string;
  name?: string;
  traits?: Traits;
  timestamp?: Date | string;
  context?: Context;
  session?: Session;
  properties?: object & {
    [k: string]: JsonValue;
  };
}

export enum JournifyEventType {
  TRACK = 'track',
  IDENTIFY = 'identify',
  GROUP = 'group',
  SCREEN = 'screen',
}

export enum JournifyDefaultEvent {
  IDENTIFY = 'IDENTIFY_EVENT_KEY',
  GROUP = 'GROUP_EVENT_KEY',
}

export interface UtmCampaign {
  id?: string;
  name?: string;
  source?: string;
  medium?: string;
  term?: string;
  content?: string;
}

export interface App {
  name?: string;
  version?: string;
  build?: string;
  namespace?: string;
}

export interface Device {
  id?: string;
  manufacturer?: string;
  model?: string;
  name?: string;
  type?: string;

  adTrackingEnabled?: boolean; // ios only
  advertisingId?: string; // ios only
  trackingStatus?: string;
  token?: string;
}

export interface Screen {
  width?: number;
  height?: number;
  density?: number;
}

export interface Context {
  app?: App;
  device?: Device;
  screen?: Screen;
  library?: {
    name: string;
    version: string;
  };
  locale?: string;
  campaign?: UtmCampaign;
  groupId?: string;
  consent?: {
    categoryPreferences: Record<string, boolean>;
  };
  [key: string]: unknown;
}

interface Session {
  id?: string;
}

export type UserInfoState = {
  anonymousId: string;
  userId?: string;
  traits?: Traits;
  externalIds?: ExternalIds;
};

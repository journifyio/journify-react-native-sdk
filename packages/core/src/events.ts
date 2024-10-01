export const createIdentifyEvent = ({
  userId,
  userTraits = {},
}: {
  userId?: string;
  userTraits?: Traits;
}): JournifyEvent => {
  return {
    type: JournifyEventType.IDENTIFY,
    userId: userId,
    traits: userTraits,
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

export type ExternalIds = object & {
  [k: string]: JsonValue;
};
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
  PAGE = 'page',
  IDENTIFY = 'identify',
  GROUP = 'group',
  SCREEN = 'screen',
}

export enum JournifyDefaultEvent {
  PAGE = 'PAGE_EVENT_KEY',
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
  page?: Page;
  campaign?: UtmCampaign;
  groupId?: string;
  consent?: {
    categoryPreferences: Record<string, boolean>;
  };
  [key: string]: unknown;
}

interface Page {
  path?: string;
  referrer?: string;
  search?: string;
  title?: string;
  url?: string;
}

interface Session {
  id?: string;
}

export type UserInfoState = {
  anonymousId: string;
  userId?: string;
  traits?: Traits;
};

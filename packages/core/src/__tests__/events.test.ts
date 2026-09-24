import { JournifyClient } from '../analytics';
import { uploadEvents } from '../api';
import {
  createIdentifyEvent,
  createTrackEvent,
  ExternalIds,
  JournifyEvent,
  JournifyEventType,
  sanitizeExternalIds,
  SUPPORTED_EXTERNAL_ID_KEYS,
  UserInfoState,
} from '../events';
import { Plugin } from '../plugin';
import { QueueFlushingPlugin } from '../plugins/QueueFlushingPlugin';
import { SovranStorage } from '../storage/sovranStorage';
import { Storage } from '../storage/types';
import { PluginType } from '../types';
import { Persistor } from '@journifyio/react-native-sdk-sovran';

const expectedExternalIdKeys = [
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
];

describe('external ID validation', () => {
  it('exports the supported Tracking API keys', () => {
    expect(SUPPORTED_EXTERNAL_ID_KEYS).toEqual(expectedExternalIdKeys);
  });

  it('keeps supported strings and drops all other entries', () => {
    expect(
      sanitizeExternalIds({
        google_click_id: 'gclid_123',
        facebook_browser_id: 'fbp_987',
        unsupported_id: 'unsupported',
        snapchat_click_id: '',
        twitter_click_id: 123,
        tiktok_ttp: null,
      })
    ).toEqual({
      google_click_id: 'gclid_123',
      facebook_browser_id: 'fbp_987',
    });
  });

  it('returns an empty set for invalid inputs', () => {
    expect(sanitizeExternalIds(undefined)).toEqual({});
    expect(sanitizeExternalIds(null)).toEqual({});
    expect(sanitizeExternalIds('gclid_123')).toEqual({});
    expect(sanitizeExternalIds([])).toEqual({});
  });
});

describe('event creation', () => {
  it('keeps the existing track event shape', () => {
    expect(
      createTrackEvent({
        event: 'Purchase',
        properties: { amount: 29.99 },
      })
    ).toEqual({
      type: JournifyEventType.TRACK,
      event: 'Purchase',
      properties: { amount: 29.99 },
    });
  });

  it('places external IDs at the top level of an identify event', () => {
    const event = createIdentifyEvent({
      userId: 'user-123',
      userTraits: { plan: 'premium' },
      externalIds: { google_click_id: 'gclid_123' },
    });

    expect(event.externalIds).toEqual({ google_click_id: 'gclid_123' });
    expect(event.traits).toEqual({ plan: 'premium' });
    expect(event.traits).not.toHaveProperty('externalIds');
  });
});

describe('persisted user external IDs', () => {
  it('includes identify IDs and reuses them on subsequent events', async () => {
    const { client, events } = createReadyClient();

    await client.identify(
      'user-123',
      { plan: 'premium' },
      {
        google_click_id: 'gclid_123',
        facebook_browser_id: 'fbp_987',
      }
    );
    await client.track('Purchase', { amount: 29.99 });
    await client.screen('Checkout');

    expect(events).toHaveLength(3);
    for (const event of events) {
      expect(event.externalIds).toEqual({
        google_click_id: 'gclid_123',
        facebook_browser_id: 'fbp_987',
      });
    }
    expect(events[1].properties).not.toHaveProperty('externalIds');
  });

  it('preserves omitted IDs and replaces an explicitly supplied set', async () => {
    const { client, events, getUserInfo } = createReadyClient();

    await client.identify(
      'user-123',
      {},
      {
        google_click_id: 'gclid_123',
        facebook_browser_id: 'fbp_987',
      }
    );
    await client.identify('user-123');
    expect(events[1].externalIds).toEqual({
      google_click_id: 'gclid_123',
      facebook_browser_id: 'fbp_987',
    });

    await client.identify(
      'user-123',
      {},
      {
        snapchat_scid: 'scid_456',
      }
    );
    expect(getUserInfo().externalIds).toEqual({ snapchat_scid: 'scid_456' });
    expect(events[2].externalIds).toEqual({ snapchat_scid: 'scid_456' });
  });

  it('clears IDs with an empty set and on reset', async () => {
    const { client, events, getUserInfo } = createReadyClient();

    await client.identify('user-123', {}, { google_click_id: 'gclid_123' });
    await client.identify('user-123', {}, {});
    expect(events[1]).not.toHaveProperty('externalIds');
    expect(getUserInfo().externalIds).toBeUndefined();

    await client.identify('user-123', {}, { snapchat_scid: 'scid_456' });
    await client.identify('user-456');
    expect(events[3].externalIds).toEqual({ snapchat_scid: 'scid_456' });
    expect(getUserInfo().externalIds).toEqual({ snapchat_scid: 'scid_456' });

    await client.identify('user-456', {}, { tiktok_ttp: 'ttp_789' });
    await client.reset(false);
    expect(getUserInfo().externalIds).toBeUndefined();
  });

  it('filters invalid entries without dropping the identify event', async () => {
    const { client, events, getUserInfo } = createReadyClient();
    const externalIds = {
      google_click_id: 'gclid_123',
      unsupported_id: 'unsupported',
      snapchat_scid: '',
      tiktok_ttp: 123,
    } as unknown as ExternalIds;

    await client.identify('user-123', {}, externalIds);

    expect(events).toHaveLength(1);
    expect(events[0].externalIds).toEqual({ google_click_id: 'gclid_123' });
    expect(getUserInfo().externalIds).toEqual({
      google_click_id: 'gclid_123',
    });
  });

  it('continues the event and clears the set when every entry is invalid', async () => {
    const { client, events, getUserInfo } = createReadyClient();
    await client.identify(
      'user-123',
      {},
      {
        google_click_id: 'gclid_123',
      }
    );

    await client.identify('user-123', {}, {
      unsupported_id: 'unsupported',
      twitter_click_id: 123,
    } as unknown as ExternalIds);

    expect(events).toHaveLength(2);
    expect(events[1]).not.toHaveProperty('externalIds');
    expect(getUserInfo().externalIds).toBeUndefined();
  });

  it('sanitizes restored user IDs before adding them to an event', async () => {
    const { client, events } = createReadyClient({
      anonymousId: 'anonymous-123',
      externalIds: {
        google_click_id: 'gclid_123',
        unsupported_id: 'unsupported',
        snapchat_scid: 123,
      } as unknown as ExternalIds,
    });

    await client.track('Purchase');

    expect(events[0].externalIds).toEqual({ google_click_id: 'gclid_123' });
  });

  it('retains identify IDs while awaiting client initialization', async () => {
    const { client, events, pendingEvents } = createReadyClient(
      undefined,
      false
    );

    await client.identify(
      'user-123',
      {},
      {
        linkedin_click_id: 'linkedin_123',
      }
    );
    expect(pendingEvents[0].externalIds).toEqual({
      linkedin_click_id: 'linkedin_123',
    });

    client.isReady.value = true;
    await client.process(pendingEvents[0]);
    expect(events[0].externalIds).toEqual({
      linkedin_click_id: 'linkedin_123',
    });
  });

  it('keeps the existing two-argument public APIs compatible', async () => {
    const { client, events } = createReadyClient();

    await client.identify('user-123', { plan: 'premium' });
    await client.track('Purchase', { amount: 29.99 });

    expect(events[0].traits).toEqual({ plan: 'premium' });
    expect(events[1].properties).toEqual({ amount: 29.99 });
  });
});

describe('external ID event lifecycle', () => {
  const event: JournifyEvent = {
    type: JournifyEventType.TRACK,
    event: 'Purchase',
    externalIds: {
      google_click_id: 'gclid_123',
      facebook_browser_id: 'fbp_987',
    },
    properties: { amount: 29.99 },
  };

  it('retains external IDs while queueing and flushing', async () => {
    const onFlush = jest.fn().mockResolvedValue(undefined);
    const plugin = new QueueFlushingPlugin(onFlush);
    plugin.configure({} as JournifyClient);

    await plugin.execute(event);
    await plugin.flush();

    expect(onFlush).toHaveBeenCalledWith([event]);
    expect(onFlush.mock.calls[0][0][0].externalIds).toEqual(event.externalIds);
  });

  it('serializes external IDs as a top-level batch event field', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue({ ok: true } as Response);

    await uploadEvents({
      url: 'https://example.com/v1/batch',
      events: [event],
    });

    const request = fetchMock.mock.calls[0][1];
    const payload = JSON.parse(request?.body as string);
    expect(payload.batch[0].externalIds).toEqual(event.externalIds);
    expect(payload.batch[0].properties).toEqual({ amount: 29.99 });
    expect(payload.batch[0].properties).not.toHaveProperty('externalIds');

    fetchMock.mockRestore();
  });
});

describe('external ID storage persistence', () => {
  it('restores IDs through the configured persistor for later events', async () => {
    const persisted = new Map<string, unknown>();
    const persistor: Persistor = {
      get: async <T>(key: string) => persisted.get(key) as T | undefined,
      set: async <T>(key: string, state: T) => {
        persisted.set(key, state);
      },
    };
    const firstStore = new SovranStorage({
      storeId: 'external-id-test',
      storePersistor: persistor,
      storePersistorSaveDelay: 0,
    });
    await waitForStorage(firstStore);
    await firstStore.userInfo.set((state) => ({
      ...state,
      externalIds: { google_click_id: 'gclid_123' },
    }));
    await new Promise((resolve) => setTimeout(resolve, 0));

    const restoredStore = new SovranStorage({
      storeId: 'external-id-test',
      storePersistor: persistor,
      storePersistorSaveDelay: 0,
    });
    await waitForStorage(restoredStore);
    const client = new JournifyClient({ writeKey: 'test' }, restoredStore);
    client.isReady.value = true;
    const capturePlugin = new CapturePlugin();
    client.add({ plugin: capturePlugin });

    await client.track('Purchase');

    expect(capturePlugin.events[0].externalIds).toEqual({
      google_click_id: 'gclid_123',
    });

    await client.reset(false);
    expect(
      (await restoredStore.userInfo.get(true)).externalIds
    ).toBeUndefined();
  });
});

class CapturePlugin extends Plugin {
  type = PluginType.enrichment;
  events: JournifyEvent[] = [];

  execute(event: JournifyEvent): JournifyEvent {
    this.events.push(event);
    return event;
  }
}

function createReadyClient(initialUserInfo?: UserInfoState, ready = true) {
  let userInfo: UserInfoState = initialUserInfo ?? {
    anonymousId: 'anonymous-123',
  };
  const pendingEvents: JournifyEvent[] = [];
  const getUserInfo = () => userInfo;
  const storage = {
    isReady: {
      get: () => true,
      onChange: jest.fn(),
    },
    context: {
      get: () => ({}),
      set: jest.fn(),
      onChange: jest.fn(),
    },
    settings: {
      get: () => ({}),
      set: jest.fn(),
      onChange: jest.fn(),
    },
    consentSettings: {
      get: () => undefined,
      set: jest.fn(),
      onChange: jest.fn(),
    },
    userInfo: {
      get: () => userInfo,
      set: async (
        value: UserInfoState | ((state: UserInfoState) => UserInfoState)
      ) => {
        userInfo = value instanceof Function ? value(userInfo) : value;
        return userInfo;
      },
      onChange: jest.fn(),
    },
    pendingEvents: {
      get: () => pendingEvents,
      set: jest.fn(),
      add: async (event: JournifyEvent) => {
        pendingEvents.push(event);
        return pendingEvents;
      },
      remove: jest.fn(),
      onChange: jest.fn(),
    },
  } as unknown as Storage;

  const client = new JournifyClient({ writeKey: 'test' }, storage);
  client.isReady.value = true;
  const capturePlugin = new CapturePlugin();
  client.add({ plugin: capturePlugin });
  client.isReady.value = ready;

  return {
    client,
    events: capturePlugin.events,
    getUserInfo,
    pendingEvents,
  };
}

async function waitForStorage(store: SovranStorage): Promise<void> {
  if (store.isReady.get()) {
    return;
  }
  await new Promise<void>((resolve) => {
    const unsubscribe = store.isReady.onChange((isReady) => {
      if (isReady) {
        unsubscribe();
        resolve();
      }
    });
  });
}

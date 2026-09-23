import { JournifyClient } from '../analytics';
import { uploadEvents } from '../api';
import { createTrackEvent, JournifyEvent, JournifyEventType } from '../events';
import { QueueFlushingPlugin } from '../plugins/QueueFlushingPlugin';

describe('track events', () => {
  it('creates a track event without external IDs using the existing shape', () => {
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

  it('creates a track event with one top-level external ID', () => {
    expect(
      createTrackEvent({
        event: 'Purchase',
        externalIds: { order_id: 'order_12345' },
        properties: { amount: 29.99 },
      })
    ).toEqual({
      type: JournifyEventType.TRACK,
      event: 'Purchase',
      externalIds: { order_id: 'order_12345' },
      properties: { amount: 29.99 },
    });
  });

  it('preserves explicitly provided empty external IDs', () => {
    expect(
      createTrackEvent({ event: 'Purchase', externalIds: {} })
    ).toHaveProperty('externalIds', {});
  });

  it('creates a track event with multiple top-level external IDs', () => {
    const event = createTrackEvent({
      event: 'Purchase',
      externalIds: {
        order_id: 'order_12345',
        crm_id: 'crm_987',
      },
      properties: { amount: 29.99 },
    });

    expect(event.externalIds).toEqual({
      order_id: 'order_12345',
      crm_id: 'crm_987',
    });
    expect(event.properties).toEqual({ amount: 29.99 });
    expect(event.properties).not.toHaveProperty('externalIds');
  });

  it('keeps the existing public track API compatible', async () => {
    const process = jest.fn().mockResolvedValue(undefined);
    const client = { process } as unknown as JournifyClient;

    await JournifyClient.prototype.track.call(client, 'Purchase', {
      amount: 29.99,
    });

    expect(process).toHaveBeenCalledWith({
      type: JournifyEventType.TRACK,
      event: 'Purchase',
      properties: { amount: 29.99 },
    });
  });

  it('passes external IDs through the public track API', async () => {
    const process = jest.fn().mockResolvedValue(undefined);
    const client = { process } as unknown as JournifyClient;

    await JournifyClient.prototype.track.call(
      client,
      'Purchase',
      { amount: 29.99 },
      { order_id: 'order_12345' }
    );

    expect(process).toHaveBeenCalledWith({
      type: JournifyEventType.TRACK,
      event: 'Purchase',
      externalIds: { order_id: 'order_12345' },
      properties: { amount: 29.99 },
    });
  });
});

describe('track event lifecycle', () => {
  const event: JournifyEvent = {
    type: JournifyEventType.TRACK,
    event: 'Purchase',
    externalIds: {
      order_id: 'order_12345',
      crm_id: 'crm_987',
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

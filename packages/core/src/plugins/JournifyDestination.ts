import { JournifyClient } from '../analytics';
import { uploadEvents } from '../api';
import { checkResponseForErrors } from '../errors';
import { JournifyEvent } from '../events';
import { DestinationPlugin } from '../plugin';
import { PluginType } from '../types';
import { QueueFlushingPlugin } from './QueueFlushingPlugin';
import { DEFAULT_API_HOST, defaultConfig } from '../constants';
import { chunk, createPromise, backoffRetry } from '../utils';

const BACKOFF_RETRIES = 2;
const BACKOFF_DELAY_MS = 2000; // 2 seconds;
const BACKOFF_MAX_DELAY_MS = 10000; // 10 seconds;
const MAX_EVENTS_PER_BATCH = 100;
const MAX_PAYLOAD_SIZE_IN_KB = 500;
export const JOURNIFY_DESTINATION_KEY = 'journify';

export class JournifyDestination extends DestinationPlugin {
  type = PluginType.destination;
  key = JOURNIFY_DESTINATION_KEY;
  private apiHost?: string;
  private settingsResolve: () => void;
  private settingsPromise: Promise<void>;

  constructor() {
    super();
    // We don't timeout this promise. We strictly need the response from Journify before sending things
    const { promise, resolve } = createPromise<void>();
    this.settingsPromise = promise;
    this.settingsResolve = resolve;
  }
  private getEndpoint = (): string => {
    const config = this.analytics?.getConfig();
    if (config?.apiHost) {
      this.apiHost = `${config.apiHost}/v1/batch`;
    }
    return this.apiHost ?? DEFAULT_API_HOST;
  };
  private sendEvents = async (events: JournifyEvent[]): Promise<void> => {
    if (events.length === 0) {
      return Promise.resolve();
    }
    // We're not sending events until Journify has loaded all settings
    await this.settingsPromise;

    const config = this.analytics?.getConfig() ?? defaultConfig;

    const chunkedEvents: JournifyEvent[][] = chunk(
      events,
      config.maxBatchSize ?? MAX_EVENTS_PER_BATCH,
      MAX_PAYLOAD_SIZE_IN_KB
    );

    let sentEvents: JournifyEvent[] = [];
    let numFailedEvents = 0;

    await Promise.all(
      chunkedEvents.map(async (batch: JournifyEvent[]) => {
        console.log(`Sending ${batch.length} events to ${this.getEndpoint()}`);
        try {
          backoffRetry(
            async () => {
              const res = await uploadEvents({
                url: this.getEndpoint(),
                events: batch,
              });
              checkResponseForErrors(res);
              sentEvents = sentEvents.concat(batch);
            },
            BACKOFF_RETRIES,
            BACKOFF_DELAY_MS,
            BACKOFF_MAX_DELAY_MS
          );
        } catch (e) {
          numFailedEvents += batch.length;
          console.error(e);
        } finally {
          await this.queuePlugin.dequeue(events);
        }
      })
    );

    if (sentEvents.length) {
      if (config.debug === true) {
        console.log(`Sent ${sentEvents.length} events`);
      }
    }

    if (numFailedEvents) {
      console.error(`Failed to send ${numFailedEvents} events.`);
    }
    return Promise.resolve();
  };

  private readonly queuePlugin = new QueueFlushingPlugin(this.sendEvents);

  configure(analytics: JournifyClient): void {
    super.configure(analytics);
    this.settingsResolve();

    this.add(this.queuePlugin);
  }

  execute(event: JournifyEvent): Promise<JournifyEvent | undefined> {
    // Execute the internal timeline here, the queue plugin will pick up the event and add it to the queue automatically
    const enrichedEvent = super.execute(event);
    return enrichedEvent;
  }

  async flush() {
    // Wait until the queue is done restoring before flushing
    return this.queuePlugin.flush();
  }
}

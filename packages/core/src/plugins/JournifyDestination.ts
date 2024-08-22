import { JournifyClient } from '../analytics';
import { uploadEvents } from '../api';
import { checkResponseForErrors } from '../errors';
import { JournifyEvent } from '../events';
import { DestinationPlugin } from '../plugin';
import { PluginType } from '../types';
import { QueueFlushingPlugin } from './QueueFlushingPlugin';

export const JOURNIFY_DESTINATION_KEY = 'journify';

export class JournifyDestination extends DestinationPlugin {
  type = PluginType.destination;
  key = JOURNIFY_DESTINATION_KEY;
  private apiHost?: string;
  //   private readonly queuePlugin = new QueueFlushingPlugin(this.sendEvents);

  constructor() {
    super();
  }
  private getEndpoint = (): string => {
    return this.apiHost || 'https://t.journify.dev/v1/batch';
  };
  private sendEvents = async (events: JournifyEvent[]): Promise<void> => {
    if (events.length === 0) {
      return Promise.resolve();
    }
    try {
      const res = await uploadEvents({
        url: this.getEndpoint(),
        events: events,
      });
      checkResponseForErrors(res);
    } catch (e) {
      console.error(e);
    } finally {
      await this.queuePlugin.dequeue(events);
    }
  };

  private readonly queuePlugin = new QueueFlushingPlugin(this.sendEvents);

  configure(analytics: JournifyClient): void {
    super.configure(analytics);

    // Enrich events with the Destination metadata
    this.add(this.queuePlugin);
  }

  execute(event: JournifyEvent): Promise<JournifyEvent | undefined> {
    // Execute the internal timeline here, the queue plugin will pick up the event and add it to the queue automatically
    const enrichedEvent = super.execute(event);
    console.log('JournifyDestination execute', event.event);
    return enrichedEvent;
  }

  async flush() {
    console.log('JournifyDestination flush');
    // Wait until the queue is done restoring before flushing
    return this.queuePlugin.flush();
  }
}

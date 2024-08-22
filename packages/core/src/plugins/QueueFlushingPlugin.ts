import { JournifyClient } from '../analytics';
import { JournifyEvent } from '../events';
import { UtilityPlugin } from '../plugin';
import { PluginType } from '../types';

/**
 * This plugin manages a queue where all events get added to after timeline processing.
 * It takes a onFlush callback to trigger any action particular to your destination sending events.
 * It can autotrigger a flush of the queue when it reaches the config flushAt limit.
 */
export class QueueFlushingPlugin extends UtilityPlugin {
  // Gets executed last to keep the queue after all timeline processing is done
  type = PluginType.after;
  private isPendingUpload = false;
  private queueStore: JournifyEvent[] | undefined;
  private onFlush: (events: JournifyEvent[]) => Promise<void>;

  /**
   * @param onFlush callback to execute when the queue is flushed (either by reaching the limit or manually) e.g. code to upload events to your destination
   * @param storeKey key to store the queue in the store. Must be unique per destination instance
   * @param restoreTimeout time in ms to wait for the queue to be restored from the store before uploading events (default: 500ms)
   */
  constructor(onFlush: (events: JournifyEvent[]) => Promise<void>) {
    super();
    this.onFlush = onFlush;
  }

  configure(analytics: JournifyClient): void {
    super.configure(analytics);

    // Create its own storage per SegmentDestination instance to support multiple instances
    this.queueStore = [];
  }

  async execute(event: JournifyEvent): Promise<JournifyEvent | undefined> {
    this.queueStore?.push(event);
    console.log('QueueFlushingPlugin execute', this.queueStore?.length);
    return event;
  }

  async flush(): Promise<void> {
    console.log(
      'QueueFlushingPlugin flush, isPendingUpload: ',
      this.isPendingUpload
    );
    if (this.isPendingUpload) {
      return;
    }

    try {
      const events = this.queueStore || [];
      this.isPendingUpload = true;
      console.log('QueueFlushingPlugin flushing: ', events.length);

      await this.onFlush(events);
    } finally {
      this.isPendingUpload = false;
    }
  }

  /**
   * Removes one or multiple events from the queue
   * @param events events to remove
   */
  async dequeue(events: JournifyEvent | JournifyEvent[]) {
    if (!this.queueStore) {
      return;
    }
    if (!Array.isArray(events)) {
      events = [events];
    }
    this.queueStore = this.queueStore.filter((e) => !events.includes(e));
  }
}

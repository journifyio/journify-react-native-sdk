import { JournifyClient } from './analytics';
import { JournifyEventType, type JournifyEvent } from './events';
import { Timeline } from './timeline';
import { PluginType, UpdateType, type Sync } from './types';
import {
  createFieldMapper,
  DefaultFieldMapper,
  IFieldMapper,
} from './mappings/fieldMapper';

export class Plugin {
  // default to utility to avoid automatic processing
  type: PluginType = PluginType.destination;
  analytics?: JournifyClient = undefined;
  key = '';
  configure(analytics: JournifyClient) {
    this.analytics = analytics;
  }

  update(_settings: Sync, _type: UpdateType) {
    // do nothing by default, user can override.
  }

  execute(
    event: JournifyEvent
  ): Promise<JournifyEvent | undefined> | JournifyEvent | undefined {
    // do nothing.
    return event;
  }

  shutdown() {
    // do nothing by default, user can override.
  }
}

export class EventPlugin extends Plugin {
  execute(
    event: JournifyEvent
  ): Promise<JournifyEvent | undefined> | JournifyEvent | undefined {
    if (event === undefined) {
      return event;
    }
    let result: Promise<JournifyEvent | undefined> | JournifyEvent | undefined =
      event;
    switch (result.type) {
      case JournifyEventType.IDENTIFY:
        result = this.identify(result);
        break;
      case JournifyEventType.TRACK:
        result = this.track(result);
        break;
      case JournifyEventType.SCREEN:
        result = this.screen(result);
        break;
      case JournifyEventType.GROUP:
        result = this.group(result);
        break;
    }
    return result;
  }

  // Default implementations that forward the event. This gives plugin
  // implementors the chance to interject on an event.
  identify(
    event: JournifyEvent
  ): Promise<JournifyEvent | undefined> | JournifyEvent | undefined {
    return event;
  }

  track(
    event: JournifyEvent
  ): Promise<JournifyEvent | undefined> | JournifyEvent | undefined {
    return event;
  }

  screen(
    event: JournifyEvent
  ): Promise<JournifyEvent | undefined> | JournifyEvent | undefined {
    return event;
  }

  group(
    event: JournifyEvent
  ): Promise<JournifyEvent | undefined> | JournifyEvent | undefined {
    return event;
  }

  flush(): void | Promise<void> {
    return;
  }

  reset(): void | Promise<void> {
    return;
  }
}

export class DestinationPlugin extends EventPlugin {
  // default to destination
  type = PluginType.destination;

  key = '';

  timeline = new Timeline();
  // @ts-ignore
  fieldMapper?: IFieldMapper = undefined;

  update(settings: Sync, _type: UpdateType): void {
    if (settings === undefined || settings === null) {
      return;
    }
    const fieldMappings = settings.field_mappings;
    if (fieldMappings !== undefined && fieldMappings !== null) {
      this.fieldMapper = createFieldMapper(DefaultFieldMapper, fieldMappings);
    }
  }

  /**
     Adds a new plugin to the currently loaded set.

     - Parameter plugin: The plugin to be added.
     - Returns: Returns the name of the supplied plugin.
  */
  add(plugin: Plugin) {
    const analytics = this.analytics;
    if (analytics) {
      plugin.configure(analytics);
    }
    this.timeline.add(plugin);
    return plugin;
  }

  /**
     Applies the supplied closure to the currently loaded set of plugins.

     - Parameter closure: A closure that takes an plugin to be operated on as a parameter.
  */
  apply(closure: (plugin: Plugin) => void) {
    this.timeline.apply(closure);
  }

  configure(analytics: JournifyClient) {
    this.analytics = analytics;
    this.apply((plugin) => {
      plugin.configure(analytics);
    });
  }

  /**
     Removes and unloads plugins with a matching name from the system.

     - Parameter pluginName: An plugin name.
  */
  remove(plugin: Plugin) {
    this.timeline.remove(plugin);
  }

  async execute(event: JournifyEvent): Promise<JournifyEvent | undefined> {
    // Apply before and enrichment plugins
    const beforeResult = await this.timeline.applyPlugins({
      type: PluginType.before,
      event,
    });

    if (beforeResult === undefined) {
      return;
    }

    const enrichmentResult = await this.timeline.applyPlugins({
      type: PluginType.enrichment,
      event: beforeResult,
    });

    if (enrichmentResult === undefined) {
      return;
    }

    // Now send the event to the destination by executing the normal flow of an EventPlugin
    await super.execute(enrichmentResult);

    // apply .after plugins
    const afterResult = await this.timeline.applyPlugins({
      type: PluginType.after,
      event: enrichmentResult,
    });

    return afterResult;
  }
}

export class UtilityPlugin extends EventPlugin {}

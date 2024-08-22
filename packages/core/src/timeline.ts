import type { JournifyEvent } from './events';
import type { Plugin } from './plugin';
import { PluginType } from './types';
import { getAllPlugins } from './utils';

type TimelinePlugins = {
  [key in PluginType]?: Plugin[];
};

const PLUGIN_ORDER = [
  PluginType.before,
  PluginType.enrichment,
  PluginType.destination,
  PluginType.after,
];

export class Timeline {
  plugins: TimelinePlugins = {};

  add(plugin: Plugin) {
    const { type } = plugin;
    if (this.plugins[type]) {
      this.plugins[type]?.push(plugin);
    } else {
      this.plugins[type] = [plugin];
    }
    const pluginSetting = plugin.analytics?.getIntegrationSettings(plugin.key);
    if (pluginSetting) {
      plugin.update(pluginSetting);
    }
  }

  async process(
    incomingEvent: JournifyEvent
  ): Promise<JournifyEvent | undefined> {
    let result: JournifyEvent | undefined = incomingEvent;
    for (const key of PLUGIN_ORDER) {
      const pluginResult: JournifyEvent | undefined = await this.applyPlugins({
        type: key,
        event: result!,
      });
      if (key !== PluginType.destination) {
        if (result === undefined) {
          return;
        } else {
          result = pluginResult;
        }
      }
    }
    return result;
  }
  apply(closure: (plugin: Plugin) => void) {
    getAllPlugins(this).forEach((plugin) => closure(plugin));
  }
  remove(plugin: Plugin) {
    const plugins = this.plugins[plugin.type];
    if (plugins) {
      const index = plugins.findIndex((f) => f === plugin);
      if (index > -1) {
        plugins.splice(index, 1);
      }
    }
  }

  async applyPlugins({
    type,
    event,
  }: {
    type: PluginType;
    event: JournifyEvent;
  }): Promise<JournifyEvent | undefined> {
    let result: JournifyEvent | undefined = event;
    const plugins = this.plugins[type];
    if (!plugins) {
      return result;
    }
    for (const plugin of plugins) {
      if (!result) {
        continue;
      }
      const pluginResult = plugin.execute(result);
      try {
        if (type !== PluginType.destination) {
          result = await pluginResult;
          if (result === undefined) {
            break;
          }
        } else {
          await pluginResult;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return result;
  }
}

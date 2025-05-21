# @journifyio/react-native-sdk-plugin-advertising-id

`EnrichmentPlugin` to collect advertising ID on Android devices. This plugin collects the device's advertising ID and adds it to event context.

**This plugin only works on Android. iOS calls will result in no-op.**

## Installation

Using NPM:

```bash
npm install --save @journifyio/react-native-sdk-plugin-advertising-id
```

Using Yarn:

```bash
yarn add @journifyio/react-native-sdk-plugin-advertising-id
```

This plugin requires a `compileSdkVersion` of at least 19.

## Usage

Follow the [instructions for adding plugins](https://github.com/journifyio/journifyio-react-native-sdk#adding-plugins) on the main Analytics client:

In your code where you initialize the analytics client, call the `.add(plugin)` method with an `AdvertisingIdPlugin` instance:

```js
import { createClient } from '@journifyio/react-native-sdk';
import { AdvertisingIdPlugin } from '@journifyio/react-native-sdk-plugin-advertising-id';

const journifyClient = createClient({
  writeKey: 'WRITE_KEY',
});

journifyClient.add({ plugin: new AdvertisingIdPlugin() });
```

## License

MIT License

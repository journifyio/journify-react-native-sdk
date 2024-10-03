# @journifyio/react-native-sdk-plugin-advertising-id

`EnrichmentPlugin` to collect advertisingId on Android

## Installation

Add the package

```sh
yarn add @journifyio/react-native-sdk-plugin-advertising-id
```

This plugin requires a `compileSdkVersion` of at least 19. 

## Usage

Follow the instructions for adding plugins on the main Analytics client:

In your code where you initialize the Analytics client call the `.add(plugin)` method with an `AdvertisingId` instance

```js
import { createClient } from '@journifyio/react-native-sdk';
import { AdvertisingIdPlugin } from '@journifyio/react-native-sdk-plugin-advertising-id';

const journifyClient = createClient({
  writeKey: 'WRITE_KEY'
});


//...

journifyClient.add({ plugin: new AdvertisingIdPlugin() });
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

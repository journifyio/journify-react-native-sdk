# @journifyio/react-native-sdk-plugin-idfa

`Plugin` which retrieves IDFA data (iOS only). IDFA data will then be included in `event` payloads under `event.context.device`

**This plugin only works on iOS. Android calls will result in no-op.**

## Installation

Using NPM:
```bash
npm install --save @journifyio/react-native-sdk-plugin-idfa
```

Using Yarn:
```bash
yarn add @journifyio/react-native-sdk-plugin-idfa
```

You also need to ensure you have a description for `NSUserTrackingUsageDescription` in your `Info.plist`, or your app will crash. Have a look at the /example app in the root of this repo.

## Usage

Follow the [instructions for adding plugins](https://github.com/journifyio/journify-react-native-sdk?tab=readme-ov-file#adding-plugins) on the main Analytics client:

In your code where you initialize the analytics client call the `.add(plugin)` method with an `IdfaPlugin` instance:

```ts
import { createClient } from '@journifyio/react-native-sdk';

import { IdfaPlugin } from '@journifyio/react-native-sdk-plugin-idfa';

const journifyClient = createClient({
  writeKey: 'WRITE_KEY'
});

journifyClient.add({ plugin: new IdfaPlugin() });
```

You will need to provide a [NSUserTrackingUsageDescription](https://developer.apple.com/documentation/bundleresources/information_property_list/nsusertrackingusagedescription) key in your `Info.plist` file, for why you wish to track IDFA. An IDFA value of `0000...` will be returned on an iOS simulator.

## Customize IDFA Plugin Initialization

To delay the `IDFA Plugin` initialization (ie. to avoid race condition with push notification prompt) implement the following: 

```ts
import { createClient } from '@journifyio/react-native-sdk';

import { IdfaPlugin } from '@journifyio/react-native-sdk-plugin-idfa';

const journifyClient = createClient({
  writeKey: 'WRITE_API_KEY'
});

...

 /** The IDFA Plugin supports an optional `shouldAskPermission` boolean
 which defaults to true. Setting to false prevents the plugin from 
 requesting permission from the user. If you set the parameter to `false` on
 initialization you **must** call `requestTrackingPermission()` 
 to retrieve the `idfa`  
 */
const idfaPlugin = new IdfaPlugin(false);
journifyClient.add({ plugin: idfaPlugin });


/** `requestTrackingPermission()` will prompt the user for 
tracking permission and returns a promise you can use to 
make additional tracking decisions based on the response 
*/
idfaPlugin.requestTrackingPermission().then((enabled: boolean) => {
  console.log('Tracking Enabled -->', enabled);
});
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

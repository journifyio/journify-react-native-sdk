# @journifyio/react-native-sdk-plugin-appsflyer

`DestinationPlugin` for [Appsflyer](https://www.appsflyer.com). Wraps [`react-native-appsflyer`](https://github.com/AppsFlyerSDK/appsflyer-react-native-plugin).

## Installation

You need to install the `@journifyio/react-native-sdk-plugin-appsflyer` and the `react-native-appsflyer` dependency.

Using NPM:

```bash
npm install --save @journifyio/react-native-sdk-plugin-appsflyer react-native-appsflyer
```

Using Yarn:

```bash
yarn add @journifyio/react-native-sdk-plugin-appsflyer react-native-appsflyer
```

Run `pod install` after the installation to autolink the AppsFlyer SDK.

See [AppsFlyer React Native Plugin](https://github.com/AppsFlyerSDK/appsflyer-react-native-plugin) for more details of this dependency.

## Usage

Follow the [instructions for adding plugins](https://github.com/journifyio/journify-react-native-sdk?tab=readme-ov-file#adding-plugins) on the main Analytics client:

In your code where you initialize the analytics client call the `.add(plugin)` method with an `AppsflyerPlugin` instance:

```ts
import { createClient } from '@journifyio/react-native-sdk';

import { AppsflyerPlugin } from '@journifyio/react-native-sdk-plugin-appsflyer';

const journifyClient = createClient({
  writeKey: 'WRITE_KEY',
});

journifyClient.add({ plugin: new AppsflyerPlugin() });
```

### Constructor Options

The AppsFlyer plugin constructor accepts an optional configuration object with the following properties:

| Property                          | Type    | Default | Description                                                                            |
| --------------------------------- | ------- | ------- | -------------------------------------------------------------------------------------- |
| timeToWaitForATTUserAuthorization | number  | 60      | The time to wait for App Tracking Transparency user authorization in seconds (iOS 14+) |
| is_adset                          | boolean | false   | Whether to include the adset parameter in event properties                             |
| is_adset_id                       | boolean | false   | Whether to include the adset_id parameter in event properties                          |
| is_ad_id                          | boolean | false   | Whether to include the ad_id parameter in event properties                             |

Example with custom options:

```ts
const appsflyerPlugin = new AppsflyerPlugin({
  timeToWaitForATTUserAuthorization: 30,
  is_adset: true,
  is_adset_id: true,
  is_ad_id: true,
});

journifyClient.add({ plugin: appsflyerPlugin });
```

### Tracking Deep Links on iOS

The Analytics React Native SDK [requires additonal setup](https://github.com/segmentio/analytics-react-native#ios-deep-link-tracking-setup) to automatically track deep links. If you are also tracking [Universal Links](https://dev.appsflyer.com/hc/docs/ios-sdk-reference-appsflyerlib#continue), add the following to your `AppDelegate.m` :

```objc
- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity
 restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler
{
  if ([userActivity.activityType isEqualToString: NSUserActivityTypeBrowsingWeb]) {
    NSURL *url = userActivity.webpageURL;
    NSDictionary *options = @{};
    [AnalyticsReactNative trackDeepLink:url withOptions:options];
  }
```

## License

```
MIT License

Copyright (c) 2021 Segment

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

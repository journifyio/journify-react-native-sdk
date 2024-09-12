# @journifyio/react-native-sdk

Journifyio's React Native SDK, a library that allows you to integrate Journifyio's into your React Native app.

### ⚠️ this is still beta version, please report any issues you encounter.

## Installation

Install `@journifyio/react-native-sdk`,  [`@journifyio/react-native-sdk-sovran`](https://github.com/journifyio/journifyio-react-native-sdk/blob/master/packages/sovran) and [`react-native-get-random-values`](https://github.com/LinusU/react-native-get-random-values):


```sh
yarn add @journifyio/react-native-sdk@beta @journifyio/react-native-sdk-sovran@beta react-native-get-random-values @react-native-async-storage/async-storage 
# or
npm install --save @journifyio/react-native-sdk@beta @journifyio/react-native-sdk-sovran@beta react-native-get-random-values @react-native-async-storage/async-storage 
```

*Note: `@react-native-async-storage/async-storage` is an optional dependency. If you wish to use your own persistence layer you can use the `storePersistor` option when initializing the client. Make sure you always have a persistor (either by having AsyncStorage package installed or by explicitly passing a value), else you might get unexpected side-effects like multiple 'Application Installed' events. Read more [Client Options](#client-options)*


For iOS, install native modules with:

```sh
npx pod-install
```

⚠️ For Android, you will have to add some extra permissions to your `AndroidManifest.xml`.

### Permissions

<details>

<summary>Android</summary>
In your app's `AndroidManifest.xml` add the below line between the `<manifest>` tags.

```xml
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

</details>


## Usage

### Setting up the client

The package exposes a method called `createClient` which we can use to create the JournifyioClient. This
central client manages all our tracking events.

```js
import { createClient } from '@journifyio/react-native-sdk';

const journifyClient = createClient({
  writeKey: 'WRITE_API_KEY'
});
```

You must pass at least the `writeKey`. Additional configuration options are listed below:

### Client Options

| Name                       | Default   | Description                                                                                                                                    |
| -------------------------- | --------- | -----------------------------------------------------------------------------------------------------------------------------------------------|
| `writeKey` **(REQUIRED)**  | ''        | Your Journify Write key.                                                                                                                         |
| `cdnHost`                  | 'static.journify.io' | The host of the CDN where the write settings is hosted.                                                                                   |
| `collectDeviceId`          | false    | Set to true to automatically collect the device Id.from the DRM API on Android devices.                                           |
| `flushAt`                  | 20        | How many events to accumulate before sending events to the backend.                                                                            |
| `flushInterval`            | 30        | In seconds, how often to send events to the backend.                                                                                           |
| `flushPolicies`            | undefined | Add more granular control for when to flush, see [Adding or removing policies](#adding-or-removing-policies). **Mutually exclusive with flushAt/flushInterval**                                   |
| `trackAppLifecycleEvents`  | false     | Enable automatic tracking for [app lifecycle events](#automatic-screen-tracking): application installed, opened, updated, backgrounded) |
| `storePersistor`           | undefined | A custom persistor for the store that `@journifyio/react-native-sdk` leverages. Must match [`Persistor`](https://github.com/journifyio/journifyio-react-native-sdk/blob/beta/packages/sovran/src/persistor/persistor.ts#L1-L18) interface exported from [@journifyio/react-native-sdk-sovran](https://github.com/journifyio/journifyio-react-native-sdk/blob/beta/packages/sovran).|



### Usage with hooks

In order to use the `useJournify` hook within the application, we will additionally need to wrap the application in
an JournifyProvider. This uses the [Context API](https://reactjs.org/docs/context.html) and will allow
access to the analytics client anywhere in the application

```js
import {
  createClient,
  JournifyProvider,
} from '@journifyio/react-native-sdk';

const journifyClient = createClient({
  writeKey: 'WRITE_KEY'
});

const App = () => (
  <JournifyProvider client={journifyClient}>
    <Content />
  </JournifyProvider>
);
```

### useJournify()

The client methods will be exposed via the `useJournify()` hook:

```js
import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { useJournify } from '@journifyio/react-native-sdk';

const Button = () => {
  const { track } = useJournify();
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={() => {
        track('Awesome event');
      }}
    >
      <Text style={styles.text}>Press me!</Text>
    </TouchableOpacity>
  );
};
```


### Usage without hooks

The tracking events can also be used without hooks by calling the methods directly on the client:
```js
import {
  createClient,
  JournifyProvider,
} from '@journifyio/react-native-sdk';

// create the client once when the app loads
const journifyClient = createClient({
  writeKey: 'WRITE_KEY'
});

// track an event using the client instance
journifyClient.track('Awesome event');
```

## Client methods

### Track

The [track](https://docs.journify.io/tracking/track-event) method is how you record any actions your users perform, along with any properties that describe the action.

Method signature:

```js
track: (event: string, properties?: JsonMap) => void;
```

Example usage:

```js
journifyClient.track('View Product', {
  productId: 123,
  productName: 'Striped trousers',
});
```

### Screen

The [screen](https://docs.journify.io/tracking/screen-event) call lets you record whenever a user sees a screen in your mobile app, along with any properties about the screen.

Method signature:

```js
screen: (name: string, properties?: JsonMap) => void;
```

Example usage:

```js
journifyClient.screen('ScreenName', {
  productSlug: 'example-product-123',
});
```
For setting up automatic screen tracking, see the [instructions below](#automatic-screen-tracking).


### Identify

The [identify](https://docs.journify.io/tracking/identify-event) call lets you tie a user to their actions and record traits about them. This includes a unique user ID and any optional traits you know about them like their email, name, etc. The traits option can include any information you might want to tie to the user, but when using any of the [reserved user traits](https://docs.journify.io/tracking/identify-event#traits), you should make sure to only use them for their intended meaning.

Method signature:

```js
identify: (userId: string, userTraits?: JsonMap) => void;
```

Example usage:

```js
const { identify } = useJournify();

identify('user-123', {
  username: 'MisterWhiskers',
  email: 'hello@test.com',
  plan: 'premium',
});
```

### Reset

The reset method clears the internal state of the library for the current user and group. This is useful for apps where users can log in and out with different identities over time.

Note: Each time you call reset, a new AnonymousId is generated automatically.

And when false is passed as an argument in reset method, it will skip resetting the anonymousId (but reset the rest of the user date).

Method signature:

```js
reset: (resetAnonymousId = true) => void;
```

Example usage:

```js
journifyClient.reset();

journifyClient.reset(resetAnonymousId = false);
```

### Flush

By default, the analytics will be sent to the API after 30 seconds or when 20 items have accumulated, whatever happens sooner, and whenever the app resumes if the user has closed the app with some events unsent. These values can be modified by the `flushAt` and `flushInterval` config options. You can also trigger a flush event manually.

Method signature:

```js
flush: () => Promise<void>;
```

Example usage:

```js
journifyClient.flush();
```

### (Advanced) Cleanup

You probably don't need this!

In case you need to reinitialize the client, that is, you've called `createClient` more than once for the same client in your application lifecycle, use this method _on the old client_ to clear any subscriptions and timers first.

```js
let client = createClient({
  writeKey: 'KEY'
});

client.cleanup();

client = createClient({
  writeKey: 'KEY'
});
```

If you don't do this, the old client instance would still exist and retain the timers, making all your events fire twice.

Ideally, you shouldn't need this though, and the Journify client should be initialized only once in the application lifecycle.

## Automatic screen tracking

Sending a `screen()` event with each navigation action will get tiresome quick, so you'll probably want to track navigation globally. The implementation will be different depending on which library you use for navigation. The two main navigation libraries for React Native are [React Navigation](https://reactnavigation.org/) and [React Native Navigation](https://wix.github.io/react-native-navigation).

### React Navigation

Our [example app](./example) is set up with screen tracking using React Navigation, so you can use it as a guide.

Essentially what we'll do is find the root level navigation container and call `screen()` whenever user has navigated to a new screen.

Find the file where you've used the `NavigationContainer` - the main top level container for React Navigation. In this component, create 2 new refs to store the `navigation` object and the current route name:

```js
const navigationRef = useRef(null);
const routeNameRef = useRef(null);
```

Next, pass the ref to `NavigationContainer` and a function in the `onReady` prop to store the initial route name. Finally, pass a function in the `onStateChange` prop of your `NavigationContainer` that checks for the active route name and calls `client.screen()` if the route has changes. You can pass in any additional screen parameters as the second argument for screen call as needed.

```js
<NavigationContainer
  ref={navigationRef}
  onReady={() => {
    routeNameRef.current = navigationRef.current.getCurrentRoute().name;
  }}
  onStateChange={() => {
    const previousRouteName = routeNameRef.current;
    const currentRouteName = navigationRef.current?.getCurrentRoute().name;

    if (previousRouteName !== currentRouteName) {
      journifyClient.screen(currentRouteName);
      routeNameRef.current = currentRouteName;
    }
  }}
>
```

### React Native Navigation

In order to setup automatic screen tracking while using [React Native Navigation](https://wix.github.io/react-native-navigation/docs/before-you-start/), you will have to use an [event listener](https://wix.github.io/react-native-navigation/api/events#componentdidappear). That can be done at the point where you are setting up the root of your application (ie. `Navigation.setRoot`). There your will need access to your `JournifyClient`.

```js
// Register the event listener for *registerComponentDidAppearListener*
Navigation.events().registerComponentDidAppearListener(({ componentName }) => {
  journifyClient.screen(componentName);
});
```


## Plugins + Timeline architecture

You have complete control over how the events are processed before being uploaded to the Journify API.

In order to customise what happens after an event is created, you can create and place various Plugins along the processing pipeline that an event goes through. This pipeline is referred to as a Timeline.

### Plugin Types

| Plugin Type  | Description                                                                                             |
|--------------|---------------------------------------------------------------------------------------------------------|
| before       | Executed before event processing begins.                                                                |
| enrichment   | Executed as the first level of event processing.                                                        |
| destination  | Executed as events begin to pass off to destinations.                                                   |
| after        | Executed after all event processing is completed.  This can be used to perform cleanup operations, etc. |
| utility      | Executed only when called manually, such as Logging.                                                    |

Plugins can have their own native code (such as the iOS-only `IdfaPlugin`)

### Destination Plugins

Journify is included as a `DestinationPlugin` out of the box. You can add as many other DestinationPlugins as you like, and upload events and data to them in addition to Journify.


### Adding Plugins

You can add a plugin at any time through the `journifyClient.add()` method.

```js
import { createClient } from '@journifyio/react-native-sdk';

import { FirebasePlugin } from '@journifyio/react-native-sdk-plugin-idfa';

const journifyClient = createClient({
  writeKey: 'WRITE_KEY'
});

journifyClient.add({ plugin: new IdfaPlugin() });
```


## Controlling Upload With Flush Policies

To more granurily control when events are uploaded you can use `FlushPolicies`. **This will override any setting on `flushAt` and `flushInterval`, but you can use `CountFlushPolicy` and `TimerFlushPolicy` to have the same behaviour respectively.**

A Flush Policy defines the strategy for deciding when to flush, this can be on an interval, on a certain time of day, after receiving a certain number of events or even after receiving a particular event. This gives you even more flexibility on when to send event to Journify.

To make use of flush policies you can set them in the configuration of the client:

```ts
const client = createClient({
  // ...
  flushPolicies: [
    new CountFlushPolicy(5),
    new TimerFlushPolicy(500),
    new StartupFlushPolicy(),
  ],
});
```

You can set several policies at a time. Whenever any of them decides it is time for a flush it will trigger an upload of the events. The rest get reset so that their logic restarts after every flush. 

That means only the first policy to reach `shouldFlush` gets to trigger a flush at a time. In the example above either the event count gets to 5 or the timer reaches 500ms, whatever comes first will trigger a flush.

We have several standard FlushPolicies:
- `CountFlushPolicy` triggers whenever a certain number of events is reached
- `TimerFlushPolicy` triggers on an interval of milliseconds
- `StartupFlushPolicy` triggers on client startup only
- `BackgroundFlushPolicy` triggers when the app goes into the background/inactive.

## Adding or removing policies

One of the main advatanges of FlushPolicies is that you can add and remove policies on the fly. This is very powerful when you want to reduce or increase the amount of flushes. 

For example you might want to disable flushes if you detect the user has no network:

```ts

import NetInfo from "@react-native-community/netinfo";

const policiesIfNetworkIsUp = [
  new CountFlushPolicy(5),
  new TimerFlushPolicy(500),
];

// Create our client with our policies by default
const client = createClient({
  // ...
  flushPolicies: policies,
});

// If we detect the user disconnects from the network remove all flush policies, 
// that way we won't keep attempting to send events to Journify but we will still 
// store them for future upload.
// If the network comes back up we add the policies back
const unsubscribe = NetInfo.addEventListener((state) => {
  if (state.isConnected) {
    client.addFlushPolicy(...policiesIfNetworkIsUp);
  } else {
    client.removeFlushPolicy(...policiesIfNetworkIsUp)
  }
});

```

### Creating your own flush policies

You can create a custom FlushPolicy special for your application needs by implementing the  `FlushPolicy` interface. You can also extend the `FlushPolicyBase` class that already creates and handles the `shouldFlush` value reset.

A `FlushPolicy` only needs to implement 2 methods:
- `start()`: Executed when the flush policy is enabled and added to the client. This is a good place to start background operations, make async calls, configure things before execution
- `onEvent(event: JournifyEvent)`: Gets called on every event tracked by your client
- `reset()`: Called after a flush is triggered (either by your policy, by another policy or manually)

They also have a `shouldFlush` observable boolean value. When this is set to true the client will atempt to upload events. Each policy should reset this value to `false` according to its own logic, although it is pretty common to do it inside the `reset` method.

```ts
export class FlushOnScreenEventsPolicy extends FlushPolicyBase {

  onEvent(event: JournifyEvent): void {
    // Only flush when a screen even happens
    if (event.type === EventType.ScreenEvent) {
      this.shouldFlush.value = true;
    }
  }

  reset(): void {
    // Superclass will reset the shouldFlush value so that the next screen event triggers a flush again
    // But you can also reset the value whenever, say another event comes in or after a timeout
    super.reset();
  }
}
```

# @journifyio/react-native-sdk-plugin-adjust

`DestinationPlugin` for [Adjust](http://adjust.com/). Wraps [`react-native-adjust`](https://github.com/adjust/react_native_sdk).

## Installation

You need to install the `@journifyio/react-native-sdk-plugin-adjust` and the `react-native-adjust` dependency.

Using NPM:

```bash
npm install --save @journifyio/react-native-sdk-plugin-adjust react-native-adjust
```

Using Yarn:

```bash
yarn add @journifyio/react-native-sdk-plugin-adjust react-native-adjust
```

Run `pod install` after the installation to autolink the Adjust SDK.

See [React Native SDK of Adjust](https://github.com/adjust/react_native_sdk) for more details of this dependency.

## Usage

Follow the [instructions for adding plugins](https://github.com/journifyio/journify-react-native-sdk?tab=readme-ov-file#adding-plugins) on the main Analytics client:

In your code where you initialize the analytics client call the `.add(plugin)` method with an `AdjustPlugin` instance:

```ts
import { createClient } from '@journifyio/react-native-sdk';

import { AdjustPlugin } from '@journifyio/react-native-sdk-plugin-adjust';

const journifyClient = createClient({
  writeKey: 'WRITE_KEY',
});

journifyClient.add({ plugin: new AdjustPlugin() });
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

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

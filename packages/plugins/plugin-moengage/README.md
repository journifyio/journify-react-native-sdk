# Journify React Native SDK - MoEngage Plugin

MoEngage destination plugin for the Journify React Native SDK.

## Installation

```bash
npm install @journifyio/react-native-sdk-plugin-moengage react-native-moengage
# or
yarn add @journifyio/react-native-sdk-plugin-moengage react-native-moengage
```

## Usage

```typescript
import { MoengagePlugin } from '@journifyio/react-native-sdk-plugin-moengage';
import { Journify } from '@journifyio/react-native-sdk';

// Initialize MoEngage with your app ID according to the react-native-moengage documentation
// ...

// Register the plugin with Journify
Journify.registerPlugins([new MoengagePlugin()]);

// Use Journify as usual - events will be sent to MoEngage
Journify.identify('user-id', {
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+1234567890',
  birthday: '1990-01-01',
  gender: 'male',
});

Journify.track('Button Clicked', {
  buttonName: 'Sign Up',
  page: 'Registration',
});

Journify.screen('Home Screen', {
  source: 'App Launch',
});
```

## Supported Methods

The MoEngage plugin supports the following methods:

- `identify`: Maps user traits to MoEngage user attributes
- `track`: Sends events to MoEngage
- `screen`: Tracks screen views as events in MoEngage
- `reset`: Logs out the current user from MoEngage

## Trait Mapping

The plugin maps standard Journify traits to MoEngage user attributes:

| Journify Trait | MoEngage User Attribute |
| -------------- | ----------------------- |
| userId         | Unique ID               |
| username       | User Name               |
| email          | Email                   |
| firstName      | First Name              |
| lastName       | Last Name               |
| phone          | Phone Number            |
| birthday       | Birth Date              |
| gender         | Gender                  |

Any other traits will be set as custom user attributes in MoEngage.

## License

MIT

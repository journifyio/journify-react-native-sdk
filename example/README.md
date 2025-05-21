# Journifyio React Native SDK Example App

This example app demonstrates how to use the Journifyio React Native SDK in a typical React Native application.

## Installation

Follow these steps to run the example app:

```bash
# Clone the repository (if you haven't already)
git clone https://github.com/journifyio/journifyio-react-native-sdk.git
cd journifyio-react-native-sdk/example

# Install dependencies
yarn install
# or
npm install

# Install iOS pods
cd ios && pod install && cd ..
```

## Usage

### Running the Example App

#### For Android

```bash
# Start Metro bundler
yarn start

# In a new terminal, run the Android app
yarn android
```

#### For iOS

```bash
# Start Metro bundler
yarn start

# In a new terminal, run the iOS app
yarn ios
```

### Example Features

This app demonstrates:

- Basic event tracking with Journifyio SDK
- Screen tracking integration
- User identification
- Using plugins
- Custom flush policies

## Exploring the Code

The main implementation of the Journifyio SDK can be found in:

- `App.tsx` - SDK initialization and main navigation
- `Home.tsx` - Example of event tracking
- `SecondPage.tsx` - Additional tracking examples

## Troubleshooting

If you encounter issues running the example app:

1. Make sure you have followed the [React Native Environment Setup](https://reactnative.dev/docs/environment-setup)
2. Ensure all dependencies are installed properly
3. For iOS, verify that pods are installed correctly

## License

MIT License

import 'react-native-gesture-handler';
import * as React from 'react';
import {useState} from 'react';

import {
  NavigationContainer,
  NavigationState,
  PartialState,
} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';

import {createClient, JournifyProvider} from '@journifyio/react-native-sdk';
import {IdfaPlugin} from '@journifyio/react-native-sdk-plugin-idfa';

import Home from './Home';
import SecondPage from './SecondPage';
import Modal from './Modal';

const config = {
  debug: true,
  writeKey: 'wk_2d4mVF4PZNzNfGzfiLdaMkw9rVf',
  apiHost: 'https://t.journify.dev',
  cdnHost: 'https://static.journify.dev',
  trackAppLifecycleEvents: true,
  flushInterval: 100,
  hashPII: false,
};
const journifyClient = createClient(config);

journifyClient.add({plugin: new IdfaPlugin()});

const MainStack = createStackNavigator();
const RootStack = createStackNavigator();

function MainStackScreen() {
  return (
    <MainStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#e5e7eb',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
      <MainStack.Screen
        name="Home"
        component={Home}
        initialParams={{...config}}
        options={{headerShown: false}}
      />
      <MainStack.Screen
        name="SecondPage"
        component={SecondPage}
        options={{title: 'Second Page'}}
      />
    </MainStack.Navigator>
  );
}

const getActiveRouteName = (
  state: NavigationState | PartialState<NavigationState> | undefined,
): string => {
  if (!state || typeof state.index !== 'number') {
    return 'Unknown';
  }

  const route = state.routes[state.index];

  if (route.state) {
    return getActiveRouteName(route.state);
  }

  return route.name;
};

function App() {
  const [routeName, setRouteName] = useState('Unknown');

  return (
    <JournifyProvider client={journifyClient}>
      <NavigationContainer
        onStateChange={state => {
          const newRouteName = getActiveRouteName(state);

          if (routeName !== newRouteName) {
            void journifyClient.screen(newRouteName);

            setRouteName(newRouteName);
          }
        }}>
        <RootStack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: '#262e4f',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            presentation: 'modal',
          }}>
          <RootStack.Screen
            name="Main"
            component={MainStackScreen}
            options={{headerShown: false}}
          />
          <RootStack.Screen
            name="Modal"
            component={Modal}
            options={{headerBackTitle: 'Go back'}}
          />
        </RootStack.Navigator>
      </NavigationContainer>
    </JournifyProvider>
  );
}

export default App;

/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  useColorScheme,
  View,
} from 'react-native';

import {Colors} from 'react-native/Libraries/NewAppScreen';
import {createClient} from '@journifyio/react-native-sdk';
import CustomButton from './CustomButton';
import {IdfaPlugin} from '@journifyio/react-native-sdk-plugin-idfa';

const client = createClient({
  debug: true,
  writeKey: 'wk_2d4mVF4PZNzNfGzfiLdaMkw9rVf',
  apiHost: 'https://t.journify.dev',
  cdnHost: 'https://static.journify.dev',
  trackAppLifecycleEvents: true,
  flushAt: 100,
  flushInterval: 30,
  hashPII: false,
});

client.add({plugin: new IdfaPlugin()});

function App(): React.JSX.Element {
  const [counter, setCounter] = React.useState(0);
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
            margin: 10,
          }}>
          <CustomButton
            title={'Track Event ' + counter}
            onPress={() => {
              client.track('buttonPressed ' + counter);
              setCounter(counter + 1);
            }}
          />
          <CustomButton
            title="Identity"
            onPress={() =>
              client.identify('user123', {
                phone: '632523723',
                email: 'email@email.com',
              })
            }
          />
          <CustomButton
            title="Crash"
            onPress={() => {
              throw new Error('This is a crash');
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default App;

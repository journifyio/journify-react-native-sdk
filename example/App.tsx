/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import type {PropsWithChildren} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  Touchable,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';
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

type SectionProps = PropsWithChildren<{
  title: string;
}>;

function Section({children, title}: SectionProps): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <View style={styles.sectionContainer}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: isDarkMode ? Colors.white : Colors.black,
          },
        ]}>
        {title}
      </Text>
      <Text
        style={[
          styles.sectionDescription,
          {
            color: isDarkMode ? Colors.light : Colors.dark,
          },
        ]}>
        {children}
      </Text>
    </View>
  );
}

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

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;

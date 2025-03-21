/* eslint-disable react-hooks/exhaustive-deps */
import React, {useMemo} from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import {useJournify} from '@journifyio/react-native-sdk';

const screenWidth = Dimensions.get('screen').width;

const Home = ({navigation}: {navigation: any}) => {
  const {screen, track, identify, reset, flush} = useJournify();
  const analyticsEvents = useMemo(() => {
    return [
      {
        color: colors.purple,
        name: 'Identify',
        testID: 'BUTTON_IDENTIFY',
        onPress: () => {
          void identify('usr_1234', {
            firstname: 'joe',
            lastname: 'smith',
            email: 'joe@smith.com',
            phone: '9665237890',
          });
        },
      },
      {
        color: colors.green,
        name: 'Track',
        testID: 'BUTTON_TRACK',
        onPress: () => {
          void track('add_to_cart', {
            value: 100.32,
            currency: 'USD',
            items: [{id: '123', name: 'Shoes', price: 50.16}],
          });
        },
      },
      {
        color: colors.yellow,
        name: 'Screen',
        testID: 'BUTTON_SCREEN',
        onPress: () => {
          void screen('Home Screen', {from: 'button'});
        },
      },
    ];
  }, []);

  const clientEvents = [
    {
      color: colors.pink,
      name: 'Flush',
      testID: 'BUTTON_FLUSH',
      onPress: () => {
        void flush();
      },
    },
    {
      color: colors.orange,
      name: 'Reset',
      testID: 'BUTTON_RESET',
      onPress: () => {
        void reset();
      },
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.page}>
        <Text style={styles.title}>Journify Events</Text>
        <View style={styles.section}>
          {analyticsEvents.map(item => (
            <TouchableOpacity
              key={item.name}
              style={[styles.button, {backgroundColor: item.color}]}
              onPress={item.onPress}
              testID={item.testID}>
              <Text style={styles.text}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.title}>Client Events</Text>
        <View style={styles.section}>
          {clientEvents.map(item => (
            <TouchableOpacity
              key={item.name}
              style={[styles.trackingButton, {backgroundColor: item.color}]}
              onPress={item.onPress}
              testID={item.testID}>
              <Text style={styles.text}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.title}>Navigation</Text>
        <View style={styles.section}>
          <TouchableOpacity
            style={[
              styles.button,
              {backgroundColor: colors.purple, width: screenWidth / 2 - 40},
            ]}
            onPress={() => {
              navigation.navigate('SecondPage');
            }}>
            <Text style={styles.text}>Page</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              {backgroundColor: colors.acai, width: screenWidth / 2 - 40},
            ]}
            onPress={() => {
              navigation.navigate('Modal');
            }}>
            <Text style={styles.text}>Modal</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const colors = {
  green: 'rgb(219,39,120)',
  darkGreen: '#28a745',
  acai: '#5c4d6b',
  purple: '#6152bd',
  lightPurple: '#6f42c1',
  indigo: '#6610f2',
  pink: '#db2878',
  red: '#dc3545',
  orange: '#fd7e14',
  yellow: '#ffc107',
  darkBlue: '#262e4f',
  grayWhite: '#e5e7eb',
};

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: colors.grayWhite},
  page: {
    flex: 1,
    paddingTop: 30,
  },
  trackingButton: {
    marginVertical: 5,
    marginHorizontal: 5,
    paddingHorizontal: 0,
    paddingVertical: 16,
    backgroundColor: colors.green,
    borderRadius: 8,
    width: screenWidth / 3 - 20,
  },
  button: {
    marginVertical: 8,
    marginHorizontal: 5,
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: colors.green,
    borderRadius: 8,
    width: screenWidth / 1.5,
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 24,
    textAlign: 'center',
  },
  title: {
    color: colors.pink,
    fontWeight: 'bold',
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 10,
  },
  section: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 40,
  },
  mainHeading: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default Home;

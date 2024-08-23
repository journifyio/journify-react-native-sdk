import { Context, Device, Traits } from './events';
import {
  AnalyticsReactNativeModule,
  ClientConfig,
  GetContextConfig,
  NativeContextInfo,
} from './types';
import { getNativeModule } from './utils';
import { getUUID } from './uuid';

const defaultContext = {
  appName: '',
  appVersion: '',
  buildNumber: '',
  bundleId: '',
  locale: '',
  networkType: '',
  osName: '',
  osVersion: '',
  screenHeight: 0,
  screenWidth: 0,
  timezone: '',
  manufacturer: '',
  model: '',
  deviceName: '',
  deviceId: '',
  deviceType: '',
  screenDensity: 0,
};

export const getContext = async (userTraits: Traits = {}, config?: ClientConfig): Promise<Context> => {
  const nativeConfig: GetContextConfig = {
    collectDeviceId: config?.collectDeviceId ?? false,
  };

  const nativeModule = getNativeModule(
    'JournifyioReactNativeSdk'
  ) as AnalyticsReactNativeModule;

  const {
    appName,
    appVersion,
    buildNumber,
    bundleId,
    locale,
    networkType,
    osName,
    osVersion,
    screenHeight,
    screenWidth,
    timezone,
    manufacturer,
    model,
    deviceName,
    deviceId,
    deviceType,
    screenDensity,
  }: NativeContextInfo =
    (await nativeModule.getContextInfo(nativeConfig)) ?? defaultContext;

  const device: Device = {
    id: deviceId,
    manufacturer: manufacturer,
    model: model,
    name: deviceName,
    type: deviceType,
  };

  const ctx = {
    app: {
      build: buildNumber,
      name: appName,
      namespace: bundleId,
      version: appVersion,
    },
    device,
    library: {
      name: 'analytics-react-native',
      version: '1.0.0',
    },
    locale,
    network: {
      cellular: networkType === 'cellular',
      wifi: networkType === 'wifi',
    },
    os: {
      name: osName,
      version: osVersion,
    },
    screen: {
      width: screenWidth,
      height: screenHeight,
      density: screenDensity,
    },
    timezone,
    traits: userTraits,
    instanceId: getUUID(),
  };
  console.log('context', ctx);
  return ctx;
};

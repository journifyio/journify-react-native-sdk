import { NativeModule, NativeModules, Platform } from 'react-native';
import type { EventPlugin } from './plugin';
import type { Timeline } from './timeline';

export const getAllPlugins = (timeline: Timeline) => {
  const allPlugins = Object.values(timeline.plugins);
  if (allPlugins.length) {
    return allPlugins.reduce((prev = [], curr = []) => prev.concat(curr));
  }
  return [];
};

export const getPluginsWithFlush = (timeline: Timeline) => {
  const allPlugins = getAllPlugins(timeline);

  const eventPlugins = allPlugins?.filter(
    (f) => (f as EventPlugin).flush !== undefined
  ) as EventPlugin[];

  return eventPlugins;
};

export const createPromise = <T>(
  timeout: number | undefined = undefined,
  _errorHandler: (err: Error) => void = (_: Error) => {
    //
  }
): { promise: Promise<T>; resolve: (value: T) => void } => {
  let resolver: (value: T) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolver = resolve;
    if (timeout !== undefined) {
      setTimeout(() => {
        reject(new Error('Promise timed out'));
      }, timeout);
    }
  });

  promise.catch(_errorHandler);

  return {
    promise: promise,
    resolve: resolver!,
  };
};

export const warnMissingNativeModule = () => {
  const MISSING_NATIVE_MODULE_WARNING =
    "The package 'analytics-react-native' can't access a custom native module. Make sure: \n\n" +
    Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
    '- You rebuilt the app after installing the package\n' +
    '- You are not using Expo managed workflow\n';
  console.warn(MISSING_NATIVE_MODULE_WARNING);
};

export const getNativeModule = (moduleName: string) => {
  const module = (NativeModules[moduleName] as NativeModule) ?? undefined;
  if (module === undefined) {
    warnMissingNativeModule();
  }
  return module;
};

type PromiseResult<T> =
  | {
      status: 'fulfilled';
      value: T;
    }
  | {
      status: 'rejected';
      reason: unknown;
    };

const settlePromise = async <T>(
  promise: Promise<T> | T
): Promise<PromiseResult<T>> => {
  try {
    const result = await promise;
    return {
      status: 'fulfilled',
      value: result,
    };
  } catch (error) {
    return {
      status: 'rejected',
      reason: error,
    };
  }
};

export const allSettled = async <T>(
  promises: (Promise<T> | T)[]
): Promise<PromiseResult<T>[]> => {
  return Promise.all(promises.map(settlePromise));
};

export const getPluginsWithReset = (timeline: Timeline) => {
  const allPlugins = getAllPlugins(timeline);

  // checking for the existence of .reset()
  const eventPlugins = allPlugins?.filter(
    (f) => (f as EventPlugin).reset !== undefined
  ) as EventPlugin[];

  return eventPlugins;
};

const PII_KEYS = new Set([
  'email',
  'phone',
  'name',
  'firstname',
  'lastname',
  'address',
  'city',
  'state',
  'city_code',
  'state_code',
  'country',
  'country_code',
  'gender',
]);

export async function hashPII(
  obj: Record<string, any>
): Promise<Record<string, any>> {
  let newObj = {};
  for (const key in obj) {
    let value = obj[key];
    if (value && PII_KEYS.has(key)) {
      value = (value + '').toLowerCase();
      newObj = { ...newObj, [key]: await sha256Hash(value) };
    } else {
      newObj = { ...newObj, [key]: value };
    }
  }

  return newObj;
}

export async function sha256Hash(input: string): Promise<string> {
  const sha256 = require('react-native-sha256').sha256;
  if (!input || isSHA256Hash(input)) {
    return input;
  }

  return await sha256(input);
}

function isSHA256Hash(input: string): boolean {
  const sha256Regex = /^[a-f0-9]{64}$/i;
  return sha256Regex.test(input);
}

export const chunk = <T>(array: T[], count: number, maxKB?: number): T[][] => {
  if (!array.length || !count) {
    return [];
  }

  let currentChunk = 0;
  let rollingKBSize = 0;
  const result: T[][] = array.reduce(
    (chunks: T[][], item: T, index: number) => {
      if (maxKB !== undefined) {
        rollingKBSize += sizeOf(item);
        // If we overflow chunk until the previous index, else keep going
        if (rollingKBSize >= maxKB) {
          chunks[++currentChunk] = [item];
          return chunks;
        }
      }

      if (index !== 0 && index % count === 0) {
        chunks[++currentChunk] = [item];
      } else {
        if (chunks[currentChunk] === undefined) {
          chunks[currentChunk] = [];
        }
        chunks[currentChunk].push(item);
      }

      return chunks;
    },
    []
  );

  return result;
};

const sizeOf = (obj: unknown): number => {
  const size = encodeURI(JSON.stringify(obj)).split(/%..|./).length - 1;
  return size / 1024;
};

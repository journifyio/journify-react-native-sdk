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

export function isNumber(x: unknown): x is number {
  return typeof x === 'number';
}

export function isString(x: unknown): x is string {
  return typeof x === 'string';
}

export function isBoolean(x: unknown): x is boolean {
  return typeof x === 'boolean';
}

export function isDate(value: unknown): value is Date {
  return (
    value instanceof Date ||
    (typeof value === 'object' &&
      Object.prototype.toString.call(value) === '[object Date]')
  );
}

export function objectToString(value: object, json = true): string | undefined {
  // If the object has a custom toString we well use that
  if (value.toString !== Object.prototype.toString) {
    return value.toString();
  }
  if (json) {
    return JSON.stringify(value);
  }
  return undefined;
}

export function unknownToString(
  value: unknown,
  stringifyJSON = true,
  replaceNull: string | undefined = '',
  replaceUndefined: string | undefined = ''
): string | undefined {
  if (value === null) {
    if (replaceNull !== undefined) {
      return replaceNull;
    } else {
      return undefined;
    }
  }

  if (value === undefined) {
    if (replaceUndefined !== undefined) {
      return replaceUndefined;
    } else {
      return undefined;
    }
  }

  if (isNumber(value) || isBoolean(value) || isString(value)) {
    return value.toString();
  }

  if (isObject(value)) {
    return objectToString(value, stringifyJSON);
  }

  if (stringifyJSON) {
    return JSON.stringify(value);
  }
  return undefined;
}

/**
 * Checks if value is a dictionary like object
 * @param value unknown object
 * @returns typeguard, value is dicitonary
 */
export const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null &&
  value !== undefined &&
  typeof value === 'object' &&
  !Array.isArray(value);

/**
 * Utility to deeply compare 2 objects
 * @param a unknown object
 * @param b unknown object
 * @returns true if both objects have the same keys and values
 */
export function deepCompare<T>(a: T, b: T): boolean {
  // Shallow compare first, just in case
  if (a === b) {
    return true;
  }

  // If not objects then compare values directly
  if (!isObject(a) || !isObject(b)) {
    return a === b;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (const key of keysA) {
    if (!keysB.includes(key) || !deepCompare(a[key], b[key])) {
      return false;
    }
  }

  return true;
}

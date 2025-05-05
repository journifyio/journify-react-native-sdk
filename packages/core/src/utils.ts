import { NativeModule, NativeModules, Platform } from 'react-native';
import type { EventPlugin } from './plugin';
import type { Timeline } from './timeline';
import _ from 'lodash';

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
 * @param value unknown object to check
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

/**
 * Utility function to retry a function with backoff
 * @param fn Function to retry
 * @param retries Max retries
 * @param delay Initial delay in milliseconds
 * @param maxDelay Max delay in milliseconds
 * @param factor Backoff multiplier
 * @param jitter Add jitter to delay
 */
export async function backoffRetry<T>(
  fn: () => Promise<T>, // Function to retry
  retries: number = 2, // Max retries
  delay: number = 1000, // Initial delay in milliseconds
  maxDelay: number = 16000, // Max delay in milliseconds
  factor: number = 2, // Backoff multiplier
  jitter: boolean = true // Add jitter to delay
): Promise<T> {
  let attempt = 0;

  while (attempt < retries) {
    try {
      return await fn(); // Attempt the function
    } catch (error: any) {
      attempt++;
      if (attempt >= retries) {
        throw new Error(
          `Max retries reached: ${error?.message || 'Unknown error'}`
        );
      }

      // Calculate delay with backoff
      let backoffDelay = delay * Math.pow(factor, attempt - 1);
      backoffDelay = Math.min(backoffDelay, maxDelay);

      // Add jitter
      if (jitter) {
        const jitterAmount = Math.random() * backoffDelay;
        // prettier-ignore
        backoffDelay = (backoffDelay / 2) + jitterAmount;
      }

      console.warn(
        `Retrying in ${backoffDelay.toFixed(2)}ms... (${attempt}/${retries})`
      );
      await new Promise((resolve) => setTimeout(resolve, backoffDelay));
    }
  }

  // Should never reach here
  throw new Error('Unexpected error in back off retry');
}

const ARRAY_PATH_SEPARATOR = '.$';
function isArrayPath(path: string): boolean {
  return path.includes(ARRAY_PATH_SEPARATOR);
}

export function GetValue(obj: object, path: string): any {
  if (isArrayPath(path)) {
    return GetValues(obj, path);
  }

  return _.get(obj, path);
}

export function GetValues(data: { [key: string]: any }, path: string): any {
  const pathParts = path.split(ARRAY_PATH_SEPARATOR);
  const size = pathParts.length;

  // Return false if the path is invalid (no .$ found or more than one .$ found)
  if (size === 0 || size > 2) {
    return null;
  }

  // Get the array value from the data
  const arrayPath = pathParts[0];
  const value = GetValue(data, arrayPath);
  if (!value) {
    return value;
  }

  // If the returned value is not an array, return false
  if (!Array.isArray(value)) {
    return null;
  }

  // If there is no nested path, return the array as is
  if (size === 1 || pathParts[1] === '') {
    return value;
  }

  // Get the nested path values
  const nestedPath = pathParts[1].substring(1);
  const values: any[] = [];
  let keyFound = false;

  for (const v of value) {
    const nestedValue = GetValue(v, nestedPath);
    if (nestedValue !== undefined) {
      values.push(nestedValue);
      keyFound = true;
    } else {
      // Append null to keep the array size consistent with the original array
      values.push(null);
    }
  }

  if (!keyFound || values.length === 0) {
    return null;
  }

  return values;
}

// Set a value in an object at a given path
export function SetValue(obj: object, path: string, value: any): object {
  if (isArrayPath(path)) {
    return SetValues(obj, path, value);
  }

  return _.set(obj, path, value);
}

export function SetValues(obj: object, key: string, sourceValue: any): object {
  const pathParts = key.split(ARRAY_PATH_SEPARATOR);
  const size = pathParts.length;
  // Return if the path is invalid (equals to .$, no .$ found or more than one .$ found)
  if (size === 0 || size > 2 || key === ARRAY_PATH_SEPARATOR) {
    return obj;
  }

  // If there is no nested path, replace the array with the source value
  const arrayPath = pathParts[0];
  if (size === 1 || pathParts[1] === '') {
    return SetValue(obj, arrayPath, sourceValue);
  }

  // Get the array value from the record
  let value = GetValue(obj, arrayPath);
  // Create the array if it doesn't exist
  if (value === undefined) {
    value = [];
  }

  // Do nothing if the returned value is not an array (when the key points to a non-array field)
  if (!Array.isArray(value)) {
    return obj;
  }
  const array = value;
  const arraySize = array.length;
  // Set the nested path values (remove the first character which is a dot)
  const nestedPath = pathParts[1].substring(1);
  // Check if sourceValue is an array
  if (Array.isArray(sourceValue)) {
    for (let i = 0; i < sourceValue.length; i++) {
      // Expand the array if needed
      if (i >= arraySize) {
        array.push({});
      }

      // Set nested values
      if (typeof array[i] === 'object' && !Array.isArray(array[i])) {
        array[i] = SetValue(array[i], nestedPath, sourceValue[i]);
      }
    }
  } else {
    if (arraySize === 0) {
      array.push({});
    }

    for (let i = 0; i < array.length; i++) {
      if (typeof array[i] === 'object' && !Array.isArray(array[i])) {
        array[i] = SetValue(array[i], nestedPath, sourceValue);
      }
    }
  }

  return SetValue(obj, arrayPath, array);
}

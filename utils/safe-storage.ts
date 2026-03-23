import AsyncStorage from '@react-native-async-storage/async-storage';

// Fallback in-memory storage for when native modules are unavailable
const memoryStorage: Record<string, string> = {};
let storageAvailable: boolean | null = null;
let warnedUnavailable = false;

const isNativeStorageUnavailable = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('Native module is null') ||
    message.includes('cannot access legacy storage')
  );
};

const markStorageUnavailable = (error: unknown) => {
  storageAvailable = false;
  if (!warnedUnavailable) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('AsyncStorage unavailable, using in-memory storage.', message);
    warnedUnavailable = true;
  }
};

export const safeAsyncStorage = {
  async getItem(key: string): Promise<string | null> {
    if (storageAvailable === false) {
      return memoryStorage[key] ?? null;
    }
    try {
      const value = await AsyncStorage.getItem(key);
      storageAvailable = true;
      return value;
    } catch (error) {
      if (isNativeStorageUnavailable(error)) {
        markStorageUnavailable(error);
        return memoryStorage[key] ?? null;
      }
      console.warn(`Failed to get ${key} from AsyncStorage:`, (error as Error).message);
      return memoryStorage[key] ?? null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (storageAvailable === false) {
      memoryStorage[key] = value;
      return;
    }
    try {
      await AsyncStorage.setItem(key, value);
      storageAvailable = true;
    } catch (error) {
      if (isNativeStorageUnavailable(error)) {
        markStorageUnavailable(error);
        memoryStorage[key] = value;
        return;
      }
      console.warn(`Failed to set ${key} in AsyncStorage:`, (error as Error).message);
      // Fallback to memory storage
      memoryStorage[key] = value;
    }
  },

  async removeItem(key: string): Promise<void> {
    if (storageAvailable === false) {
      delete memoryStorage[key];
      return;
    }
    try {
      await AsyncStorage.removeItem(key);
      storageAvailable = true;
    } catch (error) {
      if (isNativeStorageUnavailable(error)) {
        markStorageUnavailable(error);
        delete memoryStorage[key];
        return;
      }
      console.warn(`Failed to remove ${key} from AsyncStorage:`, (error as Error).message);
      delete memoryStorage[key];
    }
  },

  async multiGet(keys: string[]): Promise<Array<[string, string | null]>> {
    if (storageAvailable === false) {
      return keys.map((key) => [key, memoryStorage[key] ?? null]);
    }
    try {
      const results = await Promise.all(
        keys.map(async (key) => {
          const value = await AsyncStorage.getItem(key);
          return [key, value] as [string, string | null];
        })
      );
      storageAvailable = true;
      return results;
    } catch (error) {
      if (isNativeStorageUnavailable(error)) {
        markStorageUnavailable(error);
        return keys.map((key) => [key, memoryStorage[key] ?? null]);
      }
      console.warn('Failed to get multiple items from AsyncStorage:', (error as Error).message);
      return keys.map((key) => [key, memoryStorage[key] ?? null]);
    }
  },

  async multiSet(keyValuePairs: Array<[string, string]>): Promise<void> {
    if (storageAvailable === false) {
      keyValuePairs.forEach(([key, value]) => {
        memoryStorage[key] = value;
      });
      return;
    }
    try {
      await Promise.all(
        keyValuePairs.map(([key, value]) => AsyncStorage.setItem(key, value))
      );
      storageAvailable = true;
    } catch (error) {
      if (isNativeStorageUnavailable(error)) {
        markStorageUnavailable(error);
        keyValuePairs.forEach(([key, value]) => {
          memoryStorage[key] = value;
        });
        return;
      }
      console.warn('Failed to set multiple items in AsyncStorage:', (error as Error).message);
      keyValuePairs.forEach(([key, value]) => {
        memoryStorage[key] = value;
      });
    }
  },
};

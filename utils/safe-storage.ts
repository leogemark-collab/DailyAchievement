import AsyncStorage from '@react-native-async-storage/async-storage';

// Fallback in-memory storage for when native modules are unavailable
const memoryStorage: Record<string, string> = {};

export const safeAsyncStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value;
    } catch (error) {
      console.warn(`Failed to get ${key} from AsyncStorage:`, (error as Error).message);
      return memoryStorage[key] ?? null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.warn(`Failed to set ${key} in AsyncStorage:`, (error as Error).message);
      // Fallback to memory storage
      memoryStorage[key] = value;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to remove ${key} from AsyncStorage:`, (error as Error).message);
      delete memoryStorage[key];
    }
  },

  async multiGet(keys: string[]): Promise<Array<[string, string | null]>> {
    try {
      const results = await Promise.all(
        keys.map(async (key) => {
          const value = await AsyncStorage.getItem(key);
          return [key, value] as [string, string | null];
        })
      );
      return results;
    } catch (error) {
      console.warn('Failed to get multiple items from AsyncStorage:', (error as Error).message);
      return keys.map((key) => [key, memoryStorage[key] ?? null]);
    }
  },

  async multiSet(keyValuePairs: Array<[string, string]>): Promise<void> {
    try {
      await Promise.all(
        keyValuePairs.map(([key, value]) =>
          AsyncStorage.setItem(key, value)
        )
      );
    } catch (error) {
      console.warn('Failed to set multiple items in AsyncStorage:', (error as Error).message);
      keyValuePairs.forEach(([key, value]) => {
        memoryStorage[key] = value;
      });
    }
  },
};

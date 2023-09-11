import AsyncStorage from "@react-native-async-storage/async-storage";

type StorageKey = "sessionToken";

const getItem: (key: StorageKey) => Promise<string | null> = AsyncStorage.getItem;
const setItem: (key: StorageKey, value: string) => Promise<void> = AsyncStorage.setItem;
const removeItem: (key: StorageKey) => Promise<void> = AsyncStorage.removeItem;

export const Storage = {
  getItem,
  setItem,

  getItemOrFail: (key: StorageKey) =>
    getItem(key).then((value) => value ?? Promise.reject(new Error(`${key} value is null`))),

  multiGet: <K extends StorageKey>(keys: K[]) =>
    AsyncStorage.multiGet(keys).then((values) =>
      values.reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: value,
        }),
        {} as Record<K, string | null>,
      ),
    ),

  clear: () => {
    return removeItem("sessionToken");
  },
};

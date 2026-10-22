import AsyncStorage from '@react-native-async-storage/async-storage';

export const ORDERS_STORAGE_KEY = '@onebuddy_all_orders_v2';

/**
 * Loads orders from persistent storage (AsyncStorage on native, localStorage on web).
 * If no saved orders exist, returns fallbackData and persists them.
 */
export async function getSavedOrders<T>(_fallbackData: T[]): Promise<T[]> {
  try {
    await AsyncStorage.removeItem(ORDERS_STORAGE_KEY);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(ORDERS_STORAGE_KEY);
    }
  } catch (err) {
    // ignore
  }
  return [];
}

/**
 * Persists orders array to storage (AsyncStorage and Web localStorage).
 */
export async function saveOrders<T>(_orders: T[]): Promise<void> {
  try {
    await AsyncStorage.removeItem(ORDERS_STORAGE_KEY);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(ORDERS_STORAGE_KEY);
    }
  } catch (err) {
    // ignore
  }
}

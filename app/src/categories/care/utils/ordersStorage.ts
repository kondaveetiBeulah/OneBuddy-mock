import AsyncStorage from '@react-native-async-storage/async-storage';

export const ORDERS_STORAGE_KEY = '@onebuddy_all_orders_v2';

/**
 * Loads orders from persistent storage (AsyncStorage on native, localStorage on web).
 * If no saved orders exist, returns fallbackData and persists them.
 */
export async function getSavedOrders<T>(fallbackData: T[]): Promise<T[]> {
  try {
    // 1. Try AsyncStorage first
    const nativeData = await AsyncStorage.getItem(ORDERS_STORAGE_KEY);
    if (nativeData) {
      const parsed = JSON.parse(nativeData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }

    // 2. Try window.localStorage on Web
    if (typeof window !== 'undefined' && window.localStorage) {
      const webData = window.localStorage.getItem(ORDERS_STORAGE_KEY);
      if (webData) {
        const parsed = JSON.parse(webData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn('[OrdersStorage] Error reading saved orders:', err);
  }

  // If no saved orders found, save the initial fallback data asynchronously and return it
  if (fallbackData && fallbackData.length > 0) {
    saveOrders(fallbackData).catch(() => {});
  }
  return fallbackData;
}

/**
 * Persists orders array to storage (AsyncStorage and Web localStorage).
 */
export async function saveOrders<T>(orders: T[]): Promise<void> {
  try {
    const serialized = JSON.stringify(orders);
    await AsyncStorage.setItem(ORDERS_STORAGE_KEY, serialized);

    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(ORDERS_STORAGE_KEY, serialized);
    }
  } catch (err) {
    console.warn('[OrdersStorage] Error saving orders:', err);
  }
}

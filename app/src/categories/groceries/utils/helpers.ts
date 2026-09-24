import AsyncStorage from '@react-native-async-storage/async-storage';

export const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })}`;
};

export const calculateDiscount = (
  originalPrice: number,
  discountPrice: number
): number => {
  if (originalPrice <= 0 || discountPrice >= originalPrice) return 0;
  return Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// Storage keys
export const STORAGE_KEYS = {
  USER_DATA: '@1buddy_user_data',
  AUTH_TOKEN: '@1buddy_auth_token',
  ONBOARDING_COMPLETED: '@1buddy_onboarding_completed',
  CART_ITEMS: '@1buddy_cart_items',
  WISHLIST_ITEMS: '@1buddy_wishlist_items',
  SAVED_ADDRESSES: '@1buddy_saved_addresses',
  USER_ORDERS: '@1buddy_user_orders',
};

// Helper storage functions to abstract AsyncStorage
export const storageHelper = {
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
      console.error(`Error reading storage key ${key}`, e);
      return null;
    }
  },

  async setItem<T>(key: string, value: T): Promise<boolean> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
      return true;
    } catch (e) {
      console.error(`Error saving storage key ${key}`, e);
      return false;
    }
  },

  async removeItem(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error(`Error removing storage key ${key}`, e);
      return false;
    }
  },

  async clear(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (e) {
      console.error('Error clearing storage', e);
      return false;
    }
  },
};

export interface LiveAddressResult {
  houseNo: string;
  building: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  formattedAddress: string;
}

export const fetchLiveAddressDetails = async (): Promise<LiveAddressResult> => {
  let lat: number | null = null;
  let lon: number | null = null;

  // 1. Try Browser / Device Native Geolocation
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 6000,
          maximumAge: 10000,
        });
      });
      lat = position.coords.latitude;
      lon = position.coords.longitude;
    } catch (err) {
      console.log('Native geolocation fallback to IP lookup', err);
    }
  }

  // 2. If coordinates obtained, perform high-precision reverse geocoding
  if (lat !== null && lon !== null) {
    try {
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
      );
      if (res.ok) {
        const data = await res.json();
        const city = data.city || data.locality || 'Kurnool';
        const state = data.principalSubdivision || 'Andhra Pradesh';
        const locality = data.locality || data.localityInfo?.administrative?.[4]?.name || data.localityInfo?.informative?.[7]?.name || 'Main Area';
        const pincode = data.postcode || '';
        const houseNo = `Door / Plot No., GPS (${lat.toFixed(3)}, ${lon.toFixed(3)})`;
        const building = locality;
        const landmark = [locality, city, state, pincode].filter(Boolean).join(', ');
        const formatted = `${houseNo}, ${building}, ${city}, ${state} ${pincode}`.replace(/,\s*,/g, ',').trim();

        return {
          houseNo,
          building,
          landmark,
          city,
          state,
          pincode,
          formattedAddress: formatted,
        };
      }
    } catch (e) {
      console.warn('BigDataCloud geocode failed', e);
    }
  }

  // 3. Fallback: IP-based real-time location lookup (CORS friendly)
  try {
    const ipRes = await fetch('https://ipwho.is/');
    if (ipRes.ok) {
      const ipData = await ipRes.json();
      if (ipData && ipData.success) {
        const city = ipData.city || 'Kurnool';
        const state = ipData.region || 'Andhra Pradesh';
        const pincode = ipData.postal || '';
        const houseNo = `Current Location, ${city}`;
        const building = `${city} Central Area`;
        const landmark = `Near ${city} Center, ${state} ${pincode}`.trim();
        const formatted = `${building}, ${city}, ${state} ${pincode}`.trim();

        return {
          houseNo,
          building,
          landmark,
          city,
          state,
          pincode,
          formattedAddress: formatted,
        };
      }
    }
  } catch (ipErr) {
    console.warn('IP location failed', ipErr);
  }

  // 4. Default graceful fallback
  return {
    houseNo: 'Current Location',
    building: 'Main Road',
    landmark: 'Kurnool, Andhra Pradesh',
    city: 'Kurnool',
    state: 'Andhra Pradesh',
    pincode: '518001',
    formattedAddress: 'Main Road, Kurnool, Andhra Pradesh 518001',
  };
};

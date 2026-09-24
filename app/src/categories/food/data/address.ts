import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const safeStorage = {
    getItem: async (key: string) => {
        if (Platform.OS === 'web') {
            try { return window.localStorage.getItem(key); } catch (e) { return null; }
        }
        return AsyncStorage.getItem(key);
    },
    setItem: async (key: string, value: string) => {
        if (Platform.OS === 'web') {
            try { window.localStorage.setItem(key, value); } catch (e) { }
            return Promise.resolve();
        }
        return AsyncStorage.setItem(key, value);
    }
};

export interface Address {
  id: string;
  label: string;
  houseNo: string;
  building: string;
  landmark: string;
  receiverName: string;
  receiverPhone: string;
  formattedAddress?: string;
}

export let savedAddresses: Address[] = [];

type Listener = (addrs: Address[]) => void;
const listeners = new Set<Listener>();

export const subscribeToAddresses = (listener: Listener) => {
  listeners.add(listener);
  listener(savedAddresses);
  return () => {
    listeners.delete(listener);
  };
};

const notifyListeners = () => {
  listeners.forEach(l => l(savedAddresses));
};

export const loadAddresses = async (): Promise<Address[]> => {
  try {
    const data = await safeStorage.getItem('OB_SAVED_ADDRESSES');
    if (data) {
      savedAddresses = JSON.parse(data);
      notifyListeners();
      return savedAddresses;
    }
  } catch (e) {
    console.error('Failed to load addresses', e);
  }
  return savedAddresses;
};

const syncStorage = async () => {
  try {
    await safeStorage.setItem('OB_SAVED_ADDRESSES', JSON.stringify(savedAddresses));
  } catch (e) {
    console.error('Failed to save addresses', e);
  }
};

export const saveAddress = async (address: Omit<Address, 'id'>): Promise<Address> => {
  const formattedAddress = `${address.houseNo ? address.houseNo + ', ' : ''}${address.building ? address.building + ', ' : ''}${address.landmark}`;
  const newAddress = {
    ...address,
    id: Date.now().toString(),
    formattedAddress,
  };
  savedAddresses = [newAddress, ...savedAddresses];
  notifyListeners();
  await syncStorage();
  return newAddress;
};

export const updateAddress = async (id: string, updatedAddress: Omit<Address, 'id'>): Promise<Address | null> => {
  const index = savedAddresses.findIndex(addr => addr.id === id);
  if (index !== -1) {
    const formattedAddress = `${updatedAddress.houseNo ? updatedAddress.houseNo + ', ' : ''}${updatedAddress.building ? updatedAddress.building + ', ' : ''}${updatedAddress.landmark}`;
    const newAddr = { ...updatedAddress, id, formattedAddress };
    savedAddresses[index] = newAddr;
    notifyListeners();
    await syncStorage();
    return newAddr;
  }
  return null;
};

export const deleteAddress = async (id: string) => {
  const index = savedAddresses.findIndex(addr => addr.id === id);
  if (index !== -1) {
    savedAddresses.splice(index, 1);
    notifyListeners();
    await syncStorage();
  }
};


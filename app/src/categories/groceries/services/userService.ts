import { Address, User } from '../types/user.types';
import { storageHelper, STORAGE_KEYS } from '../utils/helpers';

export const userService = {
  async getAddresses(): Promise<Address[]> {
    const user = await storageHelper.getItem<User>(STORAGE_KEYS.USER_DATA);
    if (user && user.addresses) {
      return user.addresses;
    }
    const storedAddrs = await storageHelper.getItem<Address[]>(
      STORAGE_KEYS.SAVED_ADDRESSES
    );
    return storedAddrs || [];
  },

  async addAddress(address: Omit<Address, 'id'>): Promise<Address> {
    const newAddress: Address = {
      ...address,
      id: `addr_${Date.now()}`,
    };

    const user = await storageHelper.getItem<User>(STORAGE_KEYS.USER_DATA);
    let addresses = user?.addresses || [];

    if (newAddress.isDefault) {
      addresses = addresses.map((a) => ({ ...a, isDefault: false }));
    }

    addresses.push(newAddress);

    if (user) {
      user.addresses = addresses;
      if (newAddress.isDefault) {
        user.defaultAddressId = newAddress.id;
      }
      await storageHelper.setItem(STORAGE_KEYS.USER_DATA, user);
    }
    await storageHelper.setItem(STORAGE_KEYS.SAVED_ADDRESSES, addresses);

    return newAddress;
  },

  async updateAddress(address: Address): Promise<Address> {
    const user = await storageHelper.getItem<User>(STORAGE_KEYS.USER_DATA);
    let addresses = user?.addresses || [];

    if (address.isDefault) {
      addresses = addresses.map((a) => ({
        ...a,
        isDefault: a.id === address.id,
      }));
    }

    const index = addresses.findIndex((a) => a.id === address.id);
    if (index !== -1) {
      addresses[index] = address;
    }

    if (user) {
      user.addresses = addresses;
      await storageHelper.setItem(STORAGE_KEYS.USER_DATA, user);
    }
    await storageHelper.setItem(STORAGE_KEYS.SAVED_ADDRESSES, addresses);

    return address;
  },

  async deleteAddress(addressId: string): Promise<boolean> {
    const user = await storageHelper.getItem<User>(STORAGE_KEYS.USER_DATA);
    let addresses = user?.addresses || [];

    addresses = addresses.filter((a) => a.id !== addressId);

    if (user) {
      user.addresses = addresses;
      await storageHelper.setItem(STORAGE_KEYS.USER_DATA, user);
    }
    await storageHelper.setItem(STORAGE_KEYS.SAVED_ADDRESSES, addresses);

    return true;
  },

  async updateUserProfile(profile: Partial<User>): Promise<User | null> {
    const user = await storageHelper.getItem<User>(STORAGE_KEYS.USER_DATA);
    if (!user) return null;

    const updatedUser: User = {
      ...user,
      ...profile,
    };

    await storageHelper.setItem(STORAGE_KEYS.USER_DATA, updatedUser);
    return updatedUser;
  },
};

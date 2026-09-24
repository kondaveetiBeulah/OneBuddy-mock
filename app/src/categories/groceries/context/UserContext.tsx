import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Address } from '../types/user.types';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { storageHelper, STORAGE_KEYS } from '../utils/helpers';

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  selectedAddress: Address | null;
  addresses: Address[];
  login: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  setSelectedAddress: (address: Address) => void;
  loadAddresses: () => Promise<void>;
  addAddress: (address: Omit<Address, 'id'>) => Promise<Address>;
  updateProfile: (profile: Partial<User>) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  useEffect(() => {
    loadInitialState();
  }, []);

  const loadInitialState = async () => {
    try {
      setIsLoading(true);
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);

      if (currentUser && currentUser.addresses && currentUser.addresses.length > 0) {
        setAddresses(currentUser.addresses);
        const defaultAddr =
          currentUser.addresses.find((a) => a.isDefault) || currentUser.addresses[0];
        setSelectedAddress(defaultAddr);
      } else {
        const storedAddrs = await userService.getAddresses();
        setAddresses(storedAddrs);
        if (storedAddrs.length > 0) {
          setSelectedAddress(storedAddrs[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load user context state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData: User) => {
    setUser(userData);
    if (userData.addresses && userData.addresses.length > 0) {
      setAddresses(userData.addresses);
      const defaultAddr = userData.addresses.find((a) => a.isDefault) || userData.addresses[0];
      setSelectedAddress(defaultAddr);
    }
    await storageHelper.setItem(STORAGE_KEYS.USER_DATA, userData);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setAddresses([]);
    setSelectedAddress(null);
  };

  const loadAddresses = async () => {
    const list = await userService.getAddresses();
    setAddresses(list);
    if (list.length > 0 && !selectedAddress) {
      setSelectedAddress(list[0]);
    }
  };

  const addAddress = async (newAddr: Omit<Address, 'id'>): Promise<Address> => {
    const created = await userService.addAddress(newAddr);
    await loadAddresses();
    if (created.isDefault || !selectedAddress) {
      setSelectedAddress(created);
    }
    return created;
  };

  const updateProfile = async (profile: Partial<User>) => {
    const updated = await userService.updateUserProfile(profile);
    if (updated) {
      setUser(updated);
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        selectedAddress,
        addresses,
        login,
        logout,
        setSelectedAddress,
        loadAddresses,
        addAddress,
        updateProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

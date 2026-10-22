import { Timestamp } from 'firebase/firestore';
import { User } from '../types/user.types';
import { storageHelper, STORAGE_KEYS } from '../utils/helpers';

const DEMO_USER: User = {
  id: '',
  name: '',
  email: '',
  phone: '',
  avatar: '',
  addresses: [],
  defaultAddressId: undefined,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
};

export const authService = {
  async sendOTP(phone: string): Promise<{ success: boolean; message: string }> {
    // Simulate API network delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    return {
      success: true,
      message: 'OTP sent successfully.',
    };
  },

  async verifyOTP(
    phone: string,
    otp: string,
    userData?: { name?: string; email?: string }
  ): Promise<{ success: boolean; user?: User; message?: string }> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (!otp || otp.length < 4) {
      return { success: false, message: 'Invalid OTP. Please try again.' };
    }

    const user: User = {
      ...DEMO_USER,
      id: `usr_${phone}`,
      phone,
      name: userData?.name || '',
      email: userData?.email || '',
    };

    await storageHelper.setItem(STORAGE_KEYS.USER_DATA, user);
    await storageHelper.setItem(STORAGE_KEYS.AUTH_TOKEN, `auth_token_${Date.now()}`);

    return { success: true, user };
  },

  async getCurrentUser(): Promise<User | null> {
    return await storageHelper.getItem<User>(STORAGE_KEYS.USER_DATA);
  },

  async logout(): Promise<void> {
    await storageHelper.removeItem(STORAGE_KEYS.USER_DATA);
    await storageHelper.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  },
};

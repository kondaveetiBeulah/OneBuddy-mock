import { User } from '../types/user.types';
import { storageHelper, STORAGE_KEYS } from '../utils/helpers';

const DEMO_USER: User = {
  id: 'usr_demo_1',
  name: 'Anjali',
  email: 'anjali@example.com',
  phone: '9876543210',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
  addresses: [],
  defaultAddressId: undefined,
  createdAt: new Date().toISOString(),
};

export const authService = {
  async sendOTP(phone: string): Promise<{ success: boolean; message: string }> {
    // Simulate API network delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    return {
      success: true,
      message: 'OTP sent successfully. Use 123456 for testing.',
    };
  },

  async verifyOTP(
    phone: string,
    otp: string,
    userData?: { name?: string; email?: string }
  ): Promise<{ success: boolean; user?: User; message?: string }> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (otp !== '123456') {
      return { success: false, message: 'Invalid OTP. Please enter 123456.' };
    }

    const user: User = {
      ...DEMO_USER,
      phone,
      name: userData?.name || DEMO_USER.name,
      email: userData?.email || DEMO_USER.email,
    };

    await storageHelper.setItem(STORAGE_KEYS.USER_DATA, user);
    await storageHelper.setItem(STORAGE_KEYS.AUTH_TOKEN, 'mock_jwt_token_123456');

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

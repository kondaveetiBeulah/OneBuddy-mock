export interface Address {
  id: string;
  name: string;
  phone: string;
  houseNumber: string;
  street: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  type: 'home' | 'work' | 'other';
  isDefault: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  addresses: Address[];
  defaultAddressId?: string;
  createdAt: string;
}

export interface UserPreferences {
  notifications: boolean;
  darkMode: boolean;
  language: string;
}

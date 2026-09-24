/**
 * Firestore document shapes. Mirrors the RN-facing types in
 * `src/native/**` / `src/types` as closely as possible so services can pass
 * data straight to the existing screens without a translation layer.
 *
 * Collection layout (all scoped under the signed-in user, enforced by
 * `firestore.rules`):
 *
 *   users/{uid}                          UserProfile
 *   users/{uid}/meta/settings            SettingsDoc
 *   users/{uid}/meta/security            SecurityDoc
 *   users/{uid}/meta/wallet              WalletDoc
 *   users/{uid}/addresses/{addressId}    AddressDoc
 *   users/{uid}/cards/{cardId}           CardDoc
 *   users/{uid}/upiHandles/{upiId}       UpiDoc
 *   users/{uid}/transactions/{txId}      TransactionDoc
 *   users/{uid}/orders/{orderId}         OrderDoc
 */

export interface UserProfile {
  uid: string;
  name: string;
  email: string | null;
  phone: string | null;
  photoURL: string | null;
  createdAt: number;
}

export interface SettingsDoc {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'hi' | 'te';
  locationAccess: boolean;
  shareUsageData: boolean;
  usageHistory: string[];
  updatedAt: number;
}

export interface SecurityDoc {
  biometric: boolean;
  verifiedProfile: boolean;
  familySharing: boolean;
  emergencyContact: string;
  updatedAt: number;
}

export interface WalletDoc {
  balance: number;
  updatedAt: number;
}

export type AddressLabel = 'Home' | 'Work' | 'Other';

export interface AddressDoc {
  id: string;
  label: AddressLabel;
  receiverName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  updatedAt: number;
}

export interface CardDoc {
  id: string;
  brand: string;
  last4: string;
  expiry: string;
  isDefault?: boolean;
  updatedAt: number;
}

export interface UpiDoc {
  id: string;
  vpa: string;
  isDefault?: boolean;
  updatedAt: number;
}

export interface TransactionDoc {
  id: string;
  title: string;
  date: string;
  amount: number; // positive = credit, negative = debit
  createdAt: number;
}

export type OrderCategory =
  | 'food'
  | 'groceries'
  | 'rides'
  | 'healthcare'
  | 'homeservices';

export type OrderStatusKind = 'ongoing' | 'upcoming' | 'done';
export type OrderGroup = 'Ongoing' | 'Upcoming' | 'Completed';

export interface OrderDoc {
  id: string;
  category: OrderCategory;
  icon: string;
  title: string;
  status: string;
  statusKind: OrderStatusKind;
  subtitle: string;
  actions: string[];
  group: OrderGroup;
  updatedAt: number;
}

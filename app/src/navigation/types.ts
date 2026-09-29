import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ServiceId } from '@/design/tokens';

/**
 * Replaces the old `WebViewMessageType` union in `src/webview/types.ts`.
 *
 * Every row that used to `postMessage({ type: 'openX' })` up to
 * `OneBuddyScreen` is now a route: the same destinations, checked at compile
 * time instead of at runtime on a device.
 */
export type RootStackParamList = {
  Splash: undefined;
  /** Combined login + sign-up screen with internal OTP step. */
  Auth: { initialTab?: 'login' | 'signup' } | undefined;
  Tabs: undefined;

  /** Category sub-apps, opened from the dashboard cards. */
  Food: undefined;
  Groceries: undefined;
  Rides: undefined;
  Care: undefined;
  Home: undefined;

  /** Settings destinations — previously `openAppSettings` and friends. */
  AppSettings: undefined;
  SecurityPrivacy: undefined;
  HelpSupport: undefined;
  About: undefined;
  Payments: undefined;
  OrdersAndBookings: undefined;
  Addresses: undefined;
  Notifications: undefined;
  ServicePreferences: undefined;
  EditProfile: undefined;
};

export type TabParamList = {
  HomeTab: undefined;
  OrdersTab: undefined;
  AccountTab: undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

/** Dashboard card -> route. Food, Groceries, Rides, Care, and Home have real native sub-apps. */
export const SERVICE_ROUTE: Record<ServiceId, keyof RootStackParamList | null> = {
  food: 'Food',
  grocery: 'Groceries',
  ride: 'Rides',
  home: 'Home',
  care: 'Care',
};

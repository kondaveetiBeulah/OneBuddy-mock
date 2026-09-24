import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RouteProp } from '@react-navigation/native';

export type RootStackParamList = {
  Main: undefined;
  ProductList: {
    categoryId: string;
    categoryName: string;
  };
  ProductDetails: {
    productId: string;
  };
  Search: {
    initialVoiceSearch?: boolean;
  } | undefined;
  Wishlist: undefined;
  Cart: undefined;
  Address: undefined;
  DeliverySlot: undefined;
  Payment: {
    grandTotal?: number;
    couponDiscount?: number;
    tip?: number;
  } | undefined;
  OrderConfirmation: {
    orderId: string;
  };
  LiveTracking: {
    orderId?: string;
    storeName?: string;
    storeAddress?: string;
    deliveryAddress?: string;
    deliveryAddressLabel?: string;
    items?: any[];
    totalAmount?: number | string;
    order?: any;
  };
  Feedback: {
    order: any;
  };
  Orders: undefined;
  OrderDetails: {
    orderId: string;
  };
  EditProfile: undefined;
  Settings: undefined;
  HelpSupport: undefined;
  PrivacySecurity: undefined;
  About: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Explore: undefined;
  Orders: undefined;
  Wishlist: undefined;
  Categories?: undefined;
  Profile?: undefined;
  Cart?: undefined;
};

// Generic navigation props for typescript screens
export type RootStackNavigationProp<T extends keyof RootStackParamList> =
  NativeStackNavigationProp<RootStackParamList, T>;

export type RootStackRouteProp<T extends keyof RootStackParamList> =
  RouteProp<RootStackParamList, T>;

export type MainTabNavigationProp<T extends keyof MainTabParamList> =
  BottomTabNavigationProp<MainTabParamList, T>;

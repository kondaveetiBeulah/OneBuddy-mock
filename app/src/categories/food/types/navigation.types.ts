import type { NavigatorScreenParams } from '@react-navigation/native';
import type { CartItem } from '../components/types';
import type { Address } from '../data/address';

export type FoodMainTabParamList = {
  Home: undefined;
  Orders: undefined;
  Favorites: undefined;
};

export type FoodStackParamList = {
  MainTabs: NavigatorScreenParams<FoodMainTabParamList> | undefined;
  RestaurantMenu: { restaurantId: string; initialSearchQuery?: string };
  Cart: undefined;
  PaymentCheckout: {
    grandTotal: number;
    cartItems: CartItem[];
    restaurantName?: string;
    deliveryAddress?: string;
  };
  LiveTracking: {
    restaurantName?: string;
    deliveryAddress?: string;
    items?: CartItem[];
    totalAmount?: number | string;
    orderId?: string;
    paymentMethod?: string;
  };
  Feedback: { order: any };
  LocationSearch: undefined;
  AddAddress: { initialData?: Address | null };
};

import { CartItem } from './cart.types';
import { Address } from './user.types';

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'preparing'
  | 'packed'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod =
  | 'cash_on_delivery'
  | 'upi'
  | 'card'
  | 'razorpay';

export interface DeliverySlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  unit: string;
  price: number;
  discountPrice: number;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  tax: number;
  total: number;
  status: OrderStatus;
  deliveryAddress: Address;
  deliverySlot: DeliverySlot;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pending' | 'completed' | 'failed';
  createdAt: string;
  estimatedDelivery: string;
  trackingSteps?: {
    status: OrderStatus;
    title: string;
    description: string;
    time?: string;
    completed: boolean;
  }[];
}

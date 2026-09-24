import { Order, OrderStatus, DeliverySlot, PaymentMethod } from '../types/order.types';
import { CartItem } from '../types/cart.types';
import { Address } from '../types/user.types';
import { storageHelper, STORAGE_KEYS } from '../utils/helpers';
import {
  fetchOrders,
  fetchOrderById,
  saveOrder,
} from '../../../firebase/grocery-service';

export const orderService = {
  async getOrders(userId?: string): Promise<Order[]> {
    try {
      const backendOrders = await fetchOrders(userId);
      if (backendOrders && backendOrders.length > 0) {
        await storageHelper.setItem(STORAGE_KEYS.USER_ORDERS, backendOrders);
        return backendOrders;
      }
    } catch (err) {
      console.warn('[orderService] Error fetching live orders, falling back to local storage:', err);
    }

    const stored = await storageHelper.getItem<Order[]>(STORAGE_KEYS.USER_ORDERS);
    return stored || [];
  },

  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const liveOrder = await fetchOrderById(orderId);
      if (liveOrder) {
        return liveOrder;
      }
    } catch (err) {
      console.warn(`[orderService] Error fetching live order ${orderId}:`, err);
    }

    const orders = await this.getOrders();
    return orders.find((o) => o.id === orderId) || null;
  },

  async createOrder(params: {
    userId: string;
    items: CartItem[];
    subtotal: number;
    discount: number;
    deliveryFee: number;
    tax: number;
    total: number;
    deliveryAddress: Address;
    deliverySlot: DeliverySlot;
    paymentMethod: PaymentMethod;
  }): Promise<Order> {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const newOrderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrder: Order = {
      id: newOrderId,
      userId: params.userId,
      items: params.items.map((ci) => ({
        id: `oi_${Math.random().toString(36).substr(2, 9)}`,
        productId: ci.product.id,
        productName: ci.product.name,
        productImage: ci.product.image,
        unit: ci.product.unit,
        price: ci.product.price,
        discountPrice: ci.product.discountPrice,
        quantity: ci.quantity,
      })),
      subtotal: params.subtotal,
      discount: params.discount,
      deliveryFee: params.deliveryFee,
      tax: params.tax,
      total: params.total,
      status: 'placed',
      deliveryAddress: params.deliveryAddress,
      deliverySlot: params.deliverySlot,
      paymentMethod: params.paymentMethod,
      paymentStatus: params.paymentMethod === 'cash_on_delivery' ? 'pending' : 'completed',
      createdAt: new Date().toISOString(),
      estimatedDelivery: `${params.deliverySlot.date}, ${params.deliverySlot.startTime} - ${params.deliverySlot.endTime}`,
      trackingSteps: [
        {
          status: 'placed',
          title: 'Order Placed',
          description: 'Your order has been received by 1Buddy',
          time: 'Just now',
          completed: true,
        },
        {
          status: 'confirmed',
          title: 'Order Confirmed',
          description: 'Store is confirming your items',
          completed: false,
        },
        {
          status: 'preparing',
          title: 'Packing',
          description: 'Gathering fresh items',
          completed: false,
        },
        {
          status: 'out_for_delivery',
          title: 'Out for Delivery',
          description: 'Delivery partner assigned',
          completed: false,
        },
        {
          status: 'delivered',
          title: 'Delivered',
          description: 'Handed over at doorstep',
          completed: false,
        },
      ],
    };

    // Save to live backend
    try {
      await saveOrder(newOrder);
    } catch (err) {
      console.warn('[orderService] Failed to persist order to backend Firestore:', err);
    }

    // Persist locally
    const existingOrders = await this.getOrders(params.userId);
    const updatedOrders = [newOrder, ...existingOrders.filter((o) => o.id !== newOrder.id)];
    await storageHelper.setItem(STORAGE_KEYS.USER_ORDERS, updatedOrders);

    return newOrder;
  },
};

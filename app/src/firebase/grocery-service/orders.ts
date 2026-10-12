import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
  Timestamp,
} from 'firebase/firestore';
import { Order } from '../../categories/groceries/types/order.types';
import { httpsCallable } from 'firebase/functions';
import { db, functions, auth } from '../config';

/* ─────────────── Defensive Mapper ─────────────── */

export function mapOrder(docId: string, data: any): Order {
  return {
    id: data.id || docId,
    userId: data.userId || '',
    items: Array.isArray(data.items)
      ? data.items.map((it: any, idx: number) => ({
          id: it.id || `oi_${idx}`,
          productId: it.productId || '',
          productName: it.productName || '',
          productImage: it.productImage || '',
          unit: it.unit || '',
          price: typeof it.price === 'number' ? it.price : 0,
          discountPrice: typeof it.discountPrice === 'number' ? it.discountPrice : (it.price || 0),
          quantity: typeof it.quantity === 'number' ? it.quantity : 1,
        }))
      : [],
    subtotal: typeof data.subtotal === 'number' ? data.subtotal : 0,
    discount: typeof data.discount === 'number' ? data.discount : 0,
    deliveryFee: typeof data.deliveryFee === 'number' ? data.deliveryFee : 0,
    tax: typeof data.tax === 'number' ? data.tax : 0,
    total: typeof data.total === 'number' ? data.total : 0,
    status: data.status || 'placed',
    deliveryAddress: data.deliveryAddress || {
      id: 'addr_default',
      name: '',
      phone: '',
      houseNumber: '',
      street: '',
      area: '',
      city: '',
      state: '',
      pincode: '',
      type: 'home',
    },
    deliverySlot: data.deliverySlot || {
      id: 'slot_default',
      date: 'Today',
      startTime: '09:00 AM',
      endTime: '11:00 AM',
      available: true,
    },
    paymentMethod: data.paymentMethod || 'cash_on_delivery',
    paymentStatus: data.paymentStatus || 'pending',
    createdAt: data.createdAt || Timestamp.now(),
    updatedAt: data.updatedAt || Timestamp.now(),
    estimatedDelivery: data.estimatedDelivery || '',
    trackingSteps: Array.isArray(data.trackingSteps)
      ? data.trackingSteps.map((st: any) => ({
          status: st.status || 'placed',
          title: st.title || '',
          description: st.description || '',
          time: st.time,
          completed: Boolean(st.completed),
        }))
      : undefined,
  };
}

function getTimeMs(ts: any): number {
  if (!ts) return 0;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (typeof ts.toDate === 'function') return ts.toDate().getTime();
  if (ts.seconds) return ts.seconds * 1000;
  return new Date(ts).getTime() || 0;
}

/* ─────────────── One-Time Fetchers ─────────────── */

export async function fetchOrders(userId?: string): Promise<Order[]> {
  if (!db) {
    console.warn('[GroceryBackend] db is not initialized.');
    return [];
  }
  const effectiveUid = userId || auth?.currentUser?.uid;
  if (!effectiveUid) {
    console.warn('[GroceryBackend] fetchOrders requires an authenticated user.');
    return [];
  }
  try {
    const q = query(collection(db, 'orders'), where('userId', '==', effectiveUid));
    const snap = await getDocs(q);
    const orders = snap.docs.map((d) => mapOrder(d.id, d.data()));
    // Sort orders by createdAt descending
    orders.sort((a, b) => getTimeMs(b.createdAt) - getTimeMs(a.createdAt));
    return orders;
  } catch (err: any) {
    if (err?.code === 'permission-denied' || err?.code === 'unauthenticated' || err?.message?.includes('permission')) {
      console.warn('[GroceryBackend] Orders read restricted by Firebase security rules. Falling back to local storage.');
    } else {
      console.error('[GroceryBackend] Error fetching orders:', err);
    }
    return [];
  }
}

export async function fetchOrderById(orderId: string): Promise<Order | null> {
  if (!db) return null;
  const currentUser = auth?.currentUser;
  if (!currentUser) {
    console.warn('[GroceryBackend] fetchOrderById requires an authenticated user.');
    return null;
  }
  try {
    const ref = doc(db, 'orders', orderId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      if (data.userId && data.userId !== currentUser.uid) {
        console.warn(`[GroceryBackend] Unauthorized access attempt to order ${orderId}`);
        return null;
      }
      return mapOrder(snap.id, data);
    }
  } catch (err: any) {
    if (err?.code === 'permission-denied' || err?.code === 'unauthenticated' || err?.message?.includes('permission')) {
      console.warn(`[GroceryBackend] Order ${orderId} read restricted by Firebase security rules. Falling back to local storage.`);
    } else {
      console.error(`[GroceryBackend] Error fetching order ${orderId}:`, err);
    }
  }
  return null;
}

export async function saveOrder(order: Order): Promise<void> {
  const call = httpsCallable(functions, 'placeOrder');
  
  // Format items for the backend schema
  const formattedItems = order.items.map(item => ({
    productId: item.productId,
    quantity: item.quantity
  }));

  // Send the order placement request to our secure backend
  await call({
    id: order.id,
    items: formattedItems,
    deliveryAddress: order.deliveryAddress,
    paymentMethod: order.paymentMethod,
    category: 'groceries',
    type: 'grocery'
  });
}

/* ─────────────── Real-Time Subscriptions ─────────────── */

export function subscribeOrders(
  onData: (orders: Order[]) => void,
  userId?: string,
  onError?: (err: Error) => void
): () => void {
  if (!db) {
    onData([]);
    return () => {};
  }
  const effectiveUid = userId || auth?.currentUser?.uid;
  if (!effectiveUid) {
    onData([]);
    return () => {};
  }

  const ordersColl = collection(db, 'orders');
  const q = query(ordersColl, where('userId', '==', effectiveUid));

  return onSnapshot(
    q,
    (snap) => {
      const orders = snap.docs.map((d) => mapOrder(d.id, d.data()));
      orders.sort((a, b) => getTimeMs(b.createdAt) - getTimeMs(a.createdAt));
      onData(orders);
    },
    (err: any) => {
      if (err?.code === 'permission-denied' || err?.code === 'unauthenticated' || err?.message?.includes('permission')) {
        console.warn('[GroceryBackend] Orders subscription note: access restricted by permissions.');
      } else {
        console.error('[GroceryBackend] Orders subscription error:', err);
      }
      onError?.(err);
    }
  );
}

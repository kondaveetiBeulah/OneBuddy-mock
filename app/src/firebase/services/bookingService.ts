import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions, firebaseConfigured } from '../config';
import { isDummyProvider } from './careService';

export type ServiceCategory = 'care' | 'homeServices';
export type BookingStatus = 'requested' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface CatalogServiceProviderItem {
  id: string;
  service: ServiceCategory;
  name: string;
  description: string;
  image: string;
  serviceTypes: string[];
  rating: number;
  ratingCount: number;
  active: boolean;
  serviceArea: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface BookingEventItem {
  id?: string;
  fromStatus?: BookingStatus | null;
  toStatus?: BookingStatus | null;
  actorId?: string | null;
  actorType?: 'user' | 'provider' | 'admin' | 'system' | null;
  note?: string | null;
  createdAt?: any;
}

export interface ServiceBookingItem {
  id: string;
  userId: string;
  service: ServiceCategory;
  providerId: string;
  serviceType: string;
  status: BookingStatus;
  scheduledAt: any;
  addressSnapshot: {
    receiverName: string;
    phone: string;
    line1: string;
    line2?: string | null;
    area?: string;
    city: string;
    state: string;
    postalCode: string;
    label?: string;
    location?: {
      latitude: number;
      longitude: number;
    };
  };
  quotedPriceMinor: number;
  finalPriceMinor?: number | null;
  currency: string;
  notes?: string | null;
  createdAt: any;
  updatedAt: any;
  providerNameSnapshot?: string;
  hours?: number;
  events?: BookingEventItem[];
}

export interface CreateBookingParams {
  providerId: string;
  providerName?: string;
  service: ServiceCategory;
  serviceType: string;
  scheduledAt: string | number; // ISO string or epoch millis
  addressSnapshot?: {
    receiverName?: string;
    phone?: string;
    line1: string;
    line2?: string | null;
    city?: string;
    state?: string;
    postalCode?: string;
  };
  addressId?: string;
  hours?: number;
  quotedPriceMinor?: number;
  currency?: string;
  notes?: string;
  paymentMethod?: string;
  patientDetails?: {
    fullName: string;
    phone?: string;
    age?: string | number;
    gender?: string;
  };
  idempotencyKey?: string;
}

export interface BookingQuote {
  serviceType: string;
  displayName: string;
  hours: number;
  baseFeePaise: number;
  durationFeePaise: number;
  platformFeePaise: number;
  subtotalPaise: number;
  taxPaise: number;
  totalPaise: number;
  formattedTotal: string;
  currency: string;
}

// ============================================================================
// CATALOG READ OPERATIONS
// ============================================================================

/**
 * Fetches active service providers from Firestore `catalogServiceProviders`.
 */
export async function fetchProviders(
  service?: ServiceCategory,
  serviceType?: string,
  limitCount = 20
): Promise<CatalogServiceProviderItem[]> {
  if (!firebaseConfigured || !db) {
    return [];
  }

  try {
    let q = query(
      collection(db, 'catalogServiceProviders'),
      where('active', '==', true)
    );

    if (service) {
      q = query(q, where('service', '==', service));
    }

    q = query(q, limit(limitCount));
    const snap = await getDocs(q);

    let items: CatalogServiceProviderItem[] = snap.docs
      .filter((docSnap) => !isDummyProvider(docSnap.id, (docSnap.data() as any)?.name))
      .map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<CatalogServiceProviderItem, 'id'>),
      }));

    if (serviceType && serviceType.trim()) {
      const lower = serviceType.toLowerCase().trim();
      items = items.filter(
        (p) =>
          Array.isArray(p.serviceTypes) &&
          p.serviceTypes.some((t) => t.toLowerCase().includes(lower))
      );
    }

    return items;
  } catch (err) {
    console.warn('[bookingService] Failed to load providers from Firestore:', err);
    return [];
  }
}

// ============================================================================
// PRICING & CALLABLE MUTATIONS
// ============================================================================

/**
 * Gets a server-validated pricing quote for a service booking.
 */
export async function getBookingQuote(serviceType: string, hours = 1): Promise<BookingQuote | null> {
  if (!firebaseConfigured || !functions) {
    return null;
  }

  try {
    const call = httpsCallable<{ serviceType: string; hours: number }, { quote: BookingQuote }>(
      functions,
      'quoteBooking'
    );
    const res = await call({ serviceType, hours });
    return res.data?.quote || null;
  } catch (err) {
    console.warn('[bookingService] Failed to get price quote:', err);
    return null;
  }
}

/**
 * Creates a service booking via `createBooking` Cloud Function.
 * Direct Firestore write is prohibited by Security Rules.
 */
export async function createBooking(params: CreateBookingParams) {
  if (!firebaseConfigured || !functions) {
    throw new Error('Firebase functions are not configured.');
  }

  const call = httpsCallable<CreateBookingParams, any>(functions, 'createBooking');
  const res = await call(params);
  return res.data;
}

/**
 * Updates a booking's status (Provider / Admin) via Cloud Function.
 */
export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
  note?: string,
  finalPriceMinor?: number
) {
  if (!firebaseConfigured || !functions) {
    throw new Error('Firebase functions are not configured.');
  }

  const call = httpsCallable<
    { bookingId: string; status: BookingStatus; note?: string; finalPriceMinor?: number },
    any
  >(functions, 'updateBookingStatus');
  const res = await call({ bookingId, status, note, finalPriceMinor });
  return res.data;
}

/**
 * Cancels an active booking via Cloud Function.
 */
export async function cancelBooking(bookingId: string, reason?: string) {
  if (!firebaseConfigured || !functions) {
    throw new Error('Firebase functions are not configured.');
  }

  const call = httpsCallable<{ bookingId: string; reason?: string }, any>(
    functions,
    'cancelBooking'
  );
  const res = await call({ bookingId, reason });
  return res.data;
}

/**
 * Retrieves a specific booking along with its complete audit event history.
 */
export async function getMyBooking(bookingId: string): Promise<ServiceBookingItem | null> {
  if (!firebaseConfigured || !functions) {
    return null;
  }

  try {
    const call = httpsCallable<{ bookingId: string }, { booking: ServiceBookingItem }>(
      functions,
      'getMyBooking'
    );
    const res = await call({ bookingId });
    return res.data?.booking || null;
  } catch (err) {
    console.warn('[bookingService] Failed to get booking:', err);
    return null;
  }
}

// ============================================================================
// REAL-TIME FIRESTORE SUBSCRIPTIONS (READ-ONLY)
// ============================================================================

/**
 * Subscribes to real-time updates for a user's service bookings.
 */
export function subscribeUserBookings(
  uid: string,
  onData: (bookings: ServiceBookingItem[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!firebaseConfigured || !db || !uid) {
    onData([]);
    return () => {};
  }

  const q = query(
    collection(db, 'serviceBookings'),
    where('userId', '==', uid),
    orderBy('scheduledAt', 'desc'),
    limit(25)
  );

  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<ServiceBookingItem, 'id'>),
      }));
      onData(items);
    },
    (err) => {
      console.warn('[bookingService] Error subscribing to user bookings:', err);
      onError?.(err);
    }
  );
}

/**
 * Subscribes to real-time status and changes of a specific service booking document.
 */
export function subscribeBooking(
  bookingId: string,
  onData: (booking: ServiceBookingItem | null) => void,
  onError?: (err: Error) => void
): () => void {
  if (!firebaseConfigured || !db || !bookingId) {
    onData(null);
    return () => {};
  }

  const bookingDocRef = doc(db, 'serviceBookings', bookingId);

  return onSnapshot(
    bookingDocRef,
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      onData({
        id: snap.id,
        ...(snap.data() as Omit<ServiceBookingItem, 'id'>),
      });
    },
    (err) => {
      console.warn(`[bookingService] Error subscribing to booking ${bookingId}:`, err);
      onError?.(err);
    }
  );
}

/**
 * Subscribes to real-time status events under serviceBookings/{bookingId}/events.
 */
export function subscribeBookingEvents(
  bookingId: string,
  onData: (events: BookingEventItem[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!firebaseConfigured || !db || !bookingId) {
    onData([]);
    return () => {};
  }

  const eventsQuery = query(
    collection(db, 'serviceBookings', bookingId, 'events'),
    orderBy('createdAt', 'asc'),
    limit(40)
  );

  return onSnapshot(
    eventsQuery,
    (snap) => {
      const events = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as BookingEventItem),
      }));
      onData(events);
    },
    (err) => {
      console.warn(`[bookingService] Error subscribing to events for ${bookingId}:`, err);
      onError?.(err);
    }
  );
}

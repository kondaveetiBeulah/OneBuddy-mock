import { z } from 'zod';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../core/firebase';
import { secureCallable, publicCallable } from '../core/callable';
import { log, throwError } from '../core/logger';

// ----------------------------------------------------------------------------
// REQUEST SCHEMAS
// ----------------------------------------------------------------------------

export const listCareProvidersSchema = z.object({
  serviceType: z.string().optional(),
  limit: z.number().int().positive().max(50).default(20),
});

const careAddressSchema = z.object({
  receiverName: z.string().default('Customer'),
  phone: z.string().default(''),
  line1: z.string().default(''),
  line2: z.string().nullish(),
  city: z.string().default('Hyderabad'),
  state: z.string().default('Telangana'),
  postalCode: z.string().default('500081'),
}).passthrough();

export const createCareBookingSchema = z.object({
  providerId: z.string().min(1, 'Provider ID is required'),
  providerName: z.string().optional(),
  serviceType: z.string().min(1, 'Service type is required'),
  scheduledAt: z.string().or(z.number()), // ISO string or epoch ms
  addressSnapshot: z.union([careAddressSchema, z.record(z.string(), z.any())]).default({}),
  quotedPriceMinor: z.number().int().nonnegative().default(69900), // Default ₹699 in paise
  paymentMethod: z.string().optional().default('cash_on_service'),
  patientDetails: z.object({
    fullName: z.string().min(1),
    phone: z.string().optional(),
    age: z.string().or(z.number()).optional(),
    gender: z.string().optional(),
  }).optional(),
  notes: z.string().max(500).optional(),
  idempotencyKey: z.string().optional(),
});

export const cancelCareBookingSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  reason: z.string().max(250).optional(),
});

// ----------------------------------------------------------------------------
// CALLABLE FUNCTIONS
// ----------------------------------------------------------------------------

/**
 * Lists active care / home service providers.
 */
export const listCareProviders = publicCallable(
  listCareProvidersSchema,
  async (data) => {
    let query: FirebaseFirestore.Query = db
      .collection('catalogServiceProviders')
      .where('active', '==', true)
      .where('service', '==', 'care');

    const snap = await query.limit(data.limit).get();
    let providers = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (data.serviceType && data.serviceType.trim()) {
      const type = data.serviceType.toLowerCase().trim();
      providers = providers.filter((p: any) =>
        Array.isArray(p.serviceTypes) &&
        p.serviceTypes.some((t: string) => t.toLowerCase().includes(type))
      );
    }

    return { providers };
  }
);

/**
 * Creates a home visit / care service booking.
 * Writes to canonical serviceBookings/{bookingId}, logs initial event,
 * and updates user order projection.
 */
export const createCareBooking = secureCallable(
  createCareBookingSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    const now = Timestamp.now();
    const bookingId = data.idempotencyKey || db.collection('serviceBookings').doc().id;
    const bookingRef = db.collection('serviceBookings').doc(bookingId);

    log.info(`[createCareBooking] Creating care booking for user ${uid}, provider: ${data.providerId}`);

    const result = await db.runTransaction(async (t) => {
      // 1. Idempotency Check
      const existing = await t.get(bookingRef);
      if (existing.exists) {
        log.warn(`[createCareBooking] Idempotent replay for booking ${bookingId}`);
        return { success: true, bookingId, replayed: true };
      }

      // 2. Fetch Provider details
      let providerName = data.providerName || 'Care Specialist';
      const providerRef = db.collection('catalogServiceProviders').doc(data.providerId);
      const providerSnap = await t.get(providerRef);
      if (providerSnap.exists) {
        providerName = providerSnap.data()?.name || providerName;
      }

      // Parse scheduledAt
      const scheduledMs = typeof data.scheduledAt === 'number'
        ? data.scheduledAt
        : new Date(data.scheduledAt).getTime();
      const scheduledTimestamp = Timestamp.fromMillis(scheduledMs);

      // 3. Create Canonical serviceBookings Record
      const bookingDoc: any = {
        id: bookingId,
        userId: uid,
        service: 'care',
        providerId: data.providerId,
        providerNameSnapshot: providerName,
        serviceType: data.serviceType,
        status: 'confirmed',
        scheduledAt: scheduledTimestamp,
        addressSnapshot: data.addressSnapshot,
        quotedPriceMinor: data.quotedPriceMinor,
        finalPriceMinor: data.quotedPriceMinor,
        currency: 'INR',
        paymentMethod: data.paymentMethod,
        patientDetails: data.patientDetails || null,
        notes: data.notes || null,
        createdAt: now,
        updatedAt: now,
      };

      t.set(bookingRef, bookingDoc);

      // 4. Initial Event in serviceBookings/{bookingId}/events
      const eventRef = bookingRef.collection('events').doc();
      t.set(eventRef, {
        fromStatus: null,
        toStatus: 'confirmed',
        actorType: 'user',
        actorId: uid,
        note: `Home visit booked for ${data.serviceType}`,
        createdAt: now,
      });

      // 5. User Order Projection in users/{uid}/orders/{bookingId}
      const userOrderRef = db.collection('users').doc(uid).collection('orders').doc(bookingId);
      const dateDisplay = scheduledTimestamp.toDate().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });

      t.set(userOrderRef, {
        id: bookingId,
        category: 'homeservices',
        icon: 'home',
        title: `Home Visit: ${data.serviceType}`,
        subtitle: `${providerName} • Doorstep Visit`,
        meta: `Scheduled: ${dateDisplay} at ${(data.addressSnapshot as any).line1 || 'Customer Address'}`,
        status: 'Confirmed',
        statusKind: 'upcoming',
        group: 'Upcoming',
        price: `₹${(data.quotedPriceMinor / 100).toFixed(0)}`,
        actions: ['View Details', 'Cancel'],
        bookingId,
        providerName,
        serviceType: data.serviceType,
        scheduledAt: scheduledTimestamp,
        updatedAt: now,
        createdAt: now,
      });

      return {
        success: true,
        bookingId,
        status: 'confirmed',
        scheduledAt: scheduledTimestamp,
        quotedPriceMinor: data.quotedPriceMinor,
      };
    });

    return result;
  }
);

/**
 * Cancels a care service booking.
 */
export const cancelCareBooking = secureCallable(
  cancelCareBookingSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    const now = Timestamp.now();
    const bookingRef = db.collection('serviceBookings').doc(data.bookingId);

    return await db.runTransaction(async (t) => {
      const snap = await t.get(bookingRef);
      if (!snap.exists) {
        throwError('not-found', 'Booking not found.');
      }

      const booking = snap.data()!;
      if (booking.userId !== uid) {
        throwError('permission-denied', 'You do not own this booking.');
      }

      if (booking.status === 'cancelled') {
        return { success: true, message: 'Booking already cancelled.' };
      }

      t.update(bookingRef, {
        status: 'cancelled',
        cancellationReason: data.reason || 'Cancelled by customer',
        updatedAt: now,
      });

      const eventRef = bookingRef.collection('events').doc();
      t.set(eventRef, {
        fromStatus: booking.status,
        toStatus: 'cancelled',
        actorType: 'user',
        actorId: uid,
        note: data.reason || 'Cancelled by customer',
        createdAt: now,
      });

      const userOrderRef = db.collection('users').doc(uid).collection('orders').doc(data.bookingId);
      t.set(
        userOrderRef,
        {
          status: 'Cancelled',
          statusKind: 'done',
          group: 'Completed',
          actions: ['Rebook'],
          updatedAt: now,
        },
        { merge: true }
      );

      return { success: true, bookingId: data.bookingId, status: 'cancelled' };
    });
  }
);

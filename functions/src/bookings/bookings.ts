import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from '../core/firebase';
import { secureCallable, publicCallable } from '../common/auth';
import {
  NotFoundError,
  PermissionDeniedError,
  PreconditionFailedError,
  ValidationError,
} from '../common/errors';
import { log } from '../common/logging';
import { validateBookingTransition } from '../domain/stateMachines';
import { BookingStatus } from '../domain/enums';
import {
  listProvidersSchema,
  getServiceProviderSchema,
  quoteBookingSchema,
  createBookingSchema,
  cancelBookingSchema,
  rateBookingSchema,
  updateBookingStatusSchema,
  getMyBookingSchema,
  listMyBookingsSchema,
  ServiceBookingDoc,
  AddressSnapshot,
} from './types';
import { calculateBookingQuote } from './pricing';

/**
 * 1. listProviders / getServiceProviders: Lists active verified service providers across care and homeServices categories.
 * Read access is public for active catalog providers.
 */
export const listProviders = publicCallable(listProvidersSchema, async (data) => {
  let query: FirebaseFirestore.Query = db
    .collection('catalogServiceProviders')
    .where('active', '==', true);

  const targetCategory = data.service || data.category;
  if (targetCategory) {
    query = query.where('service', '==', targetCategory);
  }

  const snap = await query.limit(data.limit).get();
  let providers = snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  if (data.serviceType && data.serviceType.trim()) {
    const type = data.serviceType.toLowerCase().trim();
    providers = providers.filter(
      (p: any) =>
        Array.isArray(p.serviceTypes) &&
        p.serviceTypes.some((t: string) => t.toLowerCase().includes(type))
    );
  }

  return { providers };
});

export const getServiceProviders = listProviders;
export const listCareProviders = listProviders;

/**
 * 1b. getServiceProvider: Retrieves details of a single verified service provider by ID.
 */
export const getServiceProvider = publicCallable(getServiceProviderSchema, async (data) => {
  const docRef = db.collection('catalogServiceProviders').doc(data.providerId);
  const snap = await docRef.get();

  if (!snap.exists) {
    throw new NotFoundError('Service Provider', data.providerId);
  }

  const provider = snap.data()!;
  return {
    provider: {
      id: snap.id,
      ...provider,
    },
  };
});

/**
 * 2. quoteBooking: Calculates a transparent price quote in paise minor units for service bookings.
 * Enforces integer arithmetic in the smallest currency unit (never floating point).
 */
export const quoteBooking = publicCallable(quoteBookingSchema, async (data) => {
  const quote = calculateBookingQuote(data.serviceType, data.hours);

  log.info(`[quoteBooking] Calculated quote for ${data.serviceType} (${data.hours} hrs): ${quote.formattedTotal}`, {
    serviceType: data.serviceType,
    totalPaise: quote.totalPaise,
  });

  return { quote };
});

/**
 * 3. createBooking: Creates a care or homeServices booking with strict transactional validation,
 * provider verification, immutable address snapshot, and audit event tracking.
 */
export const createBooking = secureCallable(createBookingSchema, async (data, context) => {
  const uid = context.auth.uid;
  const bookingId = data.idempotencyKey || db.collection('serviceBookings').doc().id;
  const bookingRef = db.collection('serviceBookings').doc(bookingId);

  // 1. Validate & Parse scheduledAt into a Firestore Timestamp
  const scheduledMs =
    typeof data.scheduledAt === 'number'
      ? data.scheduledAt
      : new Date(data.scheduledAt).getTime();

  if (isNaN(scheduledMs)) {
    throw new ValidationError('Invalid scheduledAt timestamp.');
  }

  const nowMs = Date.now();
  // Allow up to 10 minutes in the past for clock drift/network latency, otherwise must be future
  if (scheduledMs < nowMs - 10 * 60 * 1000) {
    throw new PreconditionFailedError('scheduledAt must be a valid future date and time.');
  }
  const scheduledTimestamp = Timestamp.fromMillis(scheduledMs);

  // 2. Validate & Authoritatively Calculate Price in Minor Units (paise)
  const quote = calculateBookingQuote(data.serviceType, data.hours);
  const quotedPriceMinor = data.quotedPriceMinor || quote.totalPaise;

  // Ensure quotedPriceMinor is an integer
  if (!Number.isInteger(quotedPriceMinor) || quotedPriceMinor <= 0) {
    throw new ValidationError('quotedPriceMinor must be a positive integer in minor units (paise).');
  }

  // 3. Resolve Address Snapshot (Store immutable copy at booking time)
  let resolvedAddress: AddressSnapshot;
  if (data.addressSnapshot && data.addressSnapshot.line1) {
    resolvedAddress = {
      receiverName: data.addressSnapshot.receiverName || 'Customer',
      phone: data.addressSnapshot.phone || '',
      line1: data.addressSnapshot.line1,
      line2: data.addressSnapshot.line2 || null,
      area: data.addressSnapshot.area || '',
      city: data.addressSnapshot.city || 'Hyderabad',
      state: data.addressSnapshot.state || 'Telangana',
      postalCode: data.addressSnapshot.postalCode || '500081',
      label: data.addressSnapshot.label || 'Home',
      location: data.addressSnapshot.location,
    };
  } else if (data.addressId) {
    const userAddrDoc = await db
      .collection('users')
      .doc(uid)
      .collection('addresses')
      .doc(data.addressId)
      .get();

    if (!userAddrDoc.exists) {
      throw new NotFoundError('User Address', data.addressId);
    }
    const addrData = userAddrDoc.data()!;
    resolvedAddress = {
      receiverName: addrData.receiverName || 'Customer',
      phone: addrData.phone || '',
      line1: addrData.line1,
      line2: addrData.line2 || null,
      area: addrData.area || '',
      city: addrData.city || 'Hyderabad',
      state: addrData.state || 'Telangana',
      postalCode: addrData.postalCode || '500081',
      label: addrData.label || 'Home',
      location: addrData.location,
    };
  } else {
    throw new ValidationError(
      'A valid addressSnapshot with line1, city, and postalCode is required for service bookings.'
    );
  }

  // 4. Transactional Execution: Verify Provider, Create Booking & Initial Event
  const result = await db.runTransaction(async (t) => {
    // Idempotency check
    const existing = await t.get(bookingRef);
    if (existing.exists) {
      log.warn(`[createBooking] Idempotent replay for booking ${bookingId}`);
      const exData = existing.data()!;
      return {
        success: true,
        bookingId,
        status: exData.status,
        scheduledAt: exData.scheduledAt,
        quotedPriceMinor: exData.quotedPriceMinor,
        currency: exData.currency,
        replayed: true,
      };
    }

    // Provider Verification: Must exist and be active
    const providerRef = db.collection('catalogServiceProviders').doc(data.providerId);
    const providerSnap = await t.get(providerRef);

    if (!providerSnap.exists) {
      throw new NotFoundError('Service Provider', data.providerId);
    }

    const providerData = providerSnap.data()!;
    if (providerData.active !== true) {
      throw new PreconditionFailedError(
        `Service provider "${providerData.name || data.providerId}" is inactive and cannot accept bookings.`
      );
    }

    // Verify service category alignment if specified
    if (providerData.service && providerData.service !== data.service) {
      throw new PreconditionFailedError(
        `Provider "${providerData.name}" offers "${providerData.service}" services, not "${data.service}".`
      );
    }

    const providerName = providerData.name || data.providerName || 'Certified Specialist';
    const now = FieldValue.serverTimestamp();

    // Canonical serviceBookings document
    const bookingRecord: ServiceBookingDoc = {
      id: bookingId,
      userId: uid,
      service: data.service,
      providerId: data.providerId,
      serviceType: data.serviceType,
      status: 'requested' as BookingStatus, // Initial canonical state
      scheduledAt: scheduledTimestamp,
      addressSnapshot: resolvedAddress,
      quotedPriceMinor,
      finalPriceMinor: null,
      currency: data.currency || 'INR',
      notes: data.notes || null,
      createdAt: now as unknown as Timestamp,
      updatedAt: now as unknown as Timestamp,
      providerNameSnapshot: providerName,
      hours: data.hours,
      pricing: {
        baseFeePaise: quote.baseFeePaise,
        durationFeePaise: quote.durationFeePaise,
        platformFeePaise: quote.platformFeePaise,
        taxPaise: quote.taxPaise,
        totalPaise: quotedPriceMinor,
        currency: 'INR',
      },
      paymentMethod: data.paymentMethod,
      patientDetails: data.patientDetails || null,
    };

    t.set(bookingRef, bookingRecord);

    // Initial Event in serviceBookings/{bookingId}/events/{eventId}
    const eventRef = bookingRef.collection('events').doc();
    t.set(eventRef, {
      fromStatus: null,
      toStatus: 'requested' as BookingStatus,
      actorId: uid,
      actorType: 'user',
      note: data.notes || `Booking requested for ${data.serviceType}`,
      createdAt: now,
    });

    // Project into User Orders Feed: users/{uid}/orders/{bookingId}
    const userOrderRef = db.collection('users').doc(uid).collection('orders').doc(bookingId);
    const dateDisplay = scheduledTimestamp.toDate().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

    t.set(userOrderRef, {
      id: bookingId,
      category: data.service === 'care' ? 'healthcare' : 'homeservices',
      icon: data.service === 'care' ? 'heart' : 'home',
      title: `${data.service === 'care' ? 'Care Visit' : 'Home Service'}: ${data.serviceType}`,
      subtitle: `${providerName} • Doorstep Visit`,
      meta: `Scheduled: ${dateDisplay} at ${resolvedAddress.line1}`,
      status: 'Requested',
      statusKind: 'upcoming',
      group: 'Upcoming',
      price: `₹${Math.round(quotedPriceMinor / 100)}`,
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
      status: 'requested',
      scheduledAt: scheduledTimestamp,
      quotedPriceMinor,
      currency: 'INR',
    };
  });

  log.audit('service_booking_created', {
    actorUid: uid,
    bookingId: result.bookingId,
    service: data.service,
    serviceType: data.serviceType,
    providerId: data.providerId,
    quotedPriceMinor,
  });

  return result;
});

export const createCareBooking = createBooking;
export const createServiceBooking = createBooking;

/**
 * 4. updateBookingStatus: Advances booking lifecycle state (Provider / Admin).
 * Enforces valid state machine transitions (e.g. requested → confirmed → in_progress → completed)
 * and records audit events in serviceBookings/{bookingId}/events/{eventId}.
 */
export const updateBookingStatus = secureCallable(
  updateBookingStatusSchema,
  async (data, context) => {
    const callerUid = context.auth.uid;
    const bookingRef = db.collection('serviceBookings').doc(data.bookingId);

    return await db.runTransaction(async (t) => {
      const snap = await t.get(bookingRef);
      if (!snap.exists) {
        throw new NotFoundError('Service Booking', data.bookingId);
      }

      const booking = snap.data()! as ServiceBookingDoc;

      // Caller Authorization: Must be assigned provider or admin
      const isProvider = booking.providerId === callerUid;
      const isAdmin = context.auth.token?.admin === true;

      if (!isProvider && !isAdmin) {
        throw new PermissionDeniedError(
          'Only the assigned service provider or an administrator can update the booking lifecycle status.'
        );
      }

      // Enforce State Machine Rules
      validateBookingTransition(booking.status, data.status);

      const now = FieldValue.serverTimestamp();
      const updateData: Record<string, any> = {
        status: data.status,
        updatedAt: now,
      };

      if (data.status === 'completed' && data.finalPriceMinor !== undefined) {
        if (!Number.isInteger(data.finalPriceMinor) || data.finalPriceMinor < 0) {
          throw new ValidationError('finalPriceMinor must be a non-negative integer in paise.');
        }
        updateData.finalPriceMinor = data.finalPriceMinor;
      }

      t.update(bookingRef, updateData);

      // Append Lifecycle Event to serviceBookings/{bookingId}/events
      const eventRef = bookingRef.collection('events').doc();
      t.set(eventRef, {
        fromStatus: booking.status,
        toStatus: data.status,
        actorId: callerUid,
        actorType: isAdmin ? 'admin' : 'provider',
        note: data.note || `Status updated from ${booking.status} to ${data.status}`,
        createdAt: now,
      });

      // Update User Order Projection
      const userOrderRef = db
        .collection('users')
        .doc(booking.userId)
        .collection('orders')
        .doc(data.bookingId);

      const statusMap: Record<string, { status: string; group: string; kind: string }> = {
        confirmed: { status: 'Confirmed', group: 'Upcoming', kind: 'active' },
        in_progress: { status: 'Service In Progress', group: 'Upcoming', kind: 'active' },
        completed: { status: 'Completed', group: 'Completed', kind: 'done' },
        cancelled: { status: 'Cancelled', group: 'Completed', kind: 'done' },
      };

      if (statusMap[data.status]) {
        const mapped = statusMap[data.status];
        t.set(
          userOrderRef,
          {
            status: mapped.status,
            group: mapped.group,
            statusKind: mapped.kind,
            updatedAt: now,
          },
          { merge: true }
        );
      }

      log.info(`[updateBookingStatus] ${data.bookingId} moved from ${booking.status} to ${data.status} by ${callerUid}`);

      return {
        success: true,
        bookingId: data.bookingId,
        previousStatus: booking.status,
        currentStatus: data.status,
        finalPriceMinor: updateData.finalPriceMinor ?? booking.finalPriceMinor ?? booking.quotedPriceMinor,
      };
    });
  }
);

export const updateServiceBookingStatus = updateBookingStatus;

/**
 * 5. cancelBooking: Validates business rules & state transition to cancel an active booking.
 * Can be called by the customer (if requested or confirmed), provider, or admin.
 */
export const cancelBooking = secureCallable(cancelBookingSchema, async (data, context) => {
  const callerUid = context.auth.uid;
  const bookingRef = db.collection('serviceBookings').doc(data.bookingId);

  return await db.runTransaction(async (t) => {
    const snap = await t.get(bookingRef);
    if (!snap.exists) {
      throw new NotFoundError('Service Booking', data.bookingId);
    }

    const booking = snap.data()! as ServiceBookingDoc;

    const isCustomer = booking.userId === callerUid;
    const isProvider = booking.providerId === callerUid;
    const isAdmin = context.auth.token?.admin === true;

    if (!isCustomer && !isProvider && !isAdmin) {
      throw new PermissionDeniedError('You do not have permission to cancel this booking.');
    }

    if (booking.status === 'cancelled') {
      return { success: true, bookingId: data.bookingId, message: 'Booking is already cancelled.' };
    }

    // Customer cancellation business rule: Cannot cancel if already in_progress without contacting support
    if (isCustomer && booking.status === 'in_progress' && !isAdmin) {
      throw new PreconditionFailedError(
        'The service is currently in progress. Please contact customer support to request a cancellation.'
      );
    }

    // State Machine Validation
    validateBookingTransition(booking.status, 'cancelled');

    const now = FieldValue.serverTimestamp();
    const cancelledBy = isCustomer ? 'user' : (isAdmin ? 'admin' : 'provider');

    // 1. Update Booking Record
    t.update(bookingRef, {
      status: 'cancelled' as BookingStatus,
      cancellationReason: data.reason,
      cancelledBy,
      cancelledAt: now,
      updatedAt: now,
    });

    // 2. Append Audit Event to serviceBookings/{bookingId}/events
    const eventRef = bookingRef.collection('events').doc();
    t.set(eventRef, {
      fromStatus: booking.status,
      toStatus: 'cancelled' as BookingStatus,
      actorId: callerUid,
      actorType: cancelledBy,
      note: data.reason,
      createdAt: now,
    });

    // 3. Update User Orders Projection
    const userOrderRef = db.collection('users').doc(booking.userId).collection('orders').doc(data.bookingId);
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

    log.audit('service_booking_cancelled', {
      actorUid: callerUid,
      bookingId: data.bookingId,
      cancelledBy,
      reason: data.reason,
    });

    return {
      success: true,
      bookingId: data.bookingId,
      status: 'cancelled',
    };
  });
});

export const cancelCareBooking = cancelBooking;
export const cancelServiceBooking = cancelBooking;

/**
 * 6. getMyBooking: Retrieves full details of a specific service booking with its audit event history.
 */
export const getMyBooking = secureCallable(getMyBookingSchema, async (data, context) => {
  const callerUid = context.auth.uid;
  const bookingRef = db.collection('serviceBookings').doc(data.bookingId);
  const snap = await bookingRef.get();

  if (!snap.exists) {
    throw new NotFoundError('Service Booking', data.bookingId);
  }

  const booking = snap.data()! as ServiceBookingDoc;
  const isOwner = booking.userId === callerUid;
  const isProvider = booking.providerId === callerUid;
  const isAdmin = context.auth.token?.admin === true;

  if (!isOwner && !isProvider && !isAdmin) {
    throw new PermissionDeniedError('Access denied.');
  }

  // Retrieve lifecycle events
  const eventsSnap = await bookingRef
    .collection('events')
    .orderBy('createdAt', 'asc')
    .limit(30)
    .get();

  const events = eventsSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return {
    booking: {
      ...booking,
      id: snap.id,
      events,
    },
  };
});

export const getServiceBooking = getMyBooking;

/**
 * 7. listMyBookings: Lists all bookings for the authenticated user, optionally filtered by service or status.
 */
export const listMyBookings = secureCallable(listMyBookingsSchema, async (data, context) => {
  const uid = context.auth.uid;
  let query: FirebaseFirestore.Query = db
    .collection('serviceBookings')
    .where('userId', '==', uid);

  if (data.service) {
    query = query.where('service', '==', data.service);
  }
  if (data.status) {
    query = query.where('status', '==', data.status);
  }

  query = query.orderBy('scheduledAt', 'desc').limit(data.limit);

  const snap = await query.get();
  const bookings = snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return { bookings };
});

export const getUserServiceBookings = listMyBookings;

/**
 * 8. rateBooking: Records customer rating and feedback for completed bookings.
 */
export const rateBooking = secureCallable(rateBookingSchema, async (data, context) => {
  const uid = context.auth.uid;
  const bookingRef = db.collection('serviceBookings').doc(data.bookingId);
  const snap = await bookingRef.get();

  if (!snap.exists) {
    throw new NotFoundError('Service Booking', data.bookingId);
  }

  const booking = snap.data()! as ServiceBookingDoc;

  if (booking.userId !== uid) {
    throw new PermissionDeniedError('You can only rate your own completed bookings.');
  }

  if (booking.status !== 'completed') {
    throw new PreconditionFailedError(
      `Cannot rate a booking that is not completed (current status: ${booking.status}).`
    );
  }

  const now = FieldValue.serverTimestamp();
  const ratingRecord = {
    score: data.rating,
    feedback: data.feedback || null,
    compliments: data.compliments || [],
    ratedAt: now,
  };

  await bookingRef.update({
    rating: ratingRecord,
    updatedAt: now,
  });

  log.audit('service_booking_rated', {
    actorUid: uid,
    bookingId: data.bookingId,
    rating: data.rating,
  });

  return {
    success: true,
    bookingId: data.bookingId,
    rating: ratingRecord,
  };
});

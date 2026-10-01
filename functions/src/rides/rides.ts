import { FieldValue, GeoPoint } from 'firebase-admin/firestore';
import { db, getRtdb } from '../core/firebase';


import { secureCallable, publicCallable } from '../common/auth';
import { NotFoundError, PermissionDeniedError, PreconditionFailedError } from '../common/errors';
import { log } from '../common/logging';
import { executeIdempotent } from '../common/idempotency';
import { validateRideTransition } from '../domain/stateMachines';
import { RideStatus, VehicleType } from '../domain/enums';
import {
  quoteRideSchema,
  requestRideSchema,
  cancelRideSchema,
  getRideSchema,
  rateRidesSchema,
  updateRideStatusSchema,
  maskPhoneNumber,
  maskRegistration,
  RideDocument,
} from './types';
import {
  calculateHaversineDistanceKm,
  calculateVehicleFare,
  VEHICLE_RATES,
} from './pricing';

/**
 * 1. quoteRide: Calculates distance and generates real-time fare estimates in paise minor units.
 */
export const quoteRide = publicCallable(quoteRideSchema, async (data) => {
  const { pickup, destination, vehicleType } = data;

  const distanceKm = calculateHaversineDistanceKm(
    pickup.latitude,
    pickup.longitude,
    destination.latitude,
    destination.longitude
  );

  const vehicleTypes: VehicleType[] = vehicleType
    ? [vehicleType]
    : (Object.keys(VEHICLE_RATES) as VehicleType[]);

  const quotes = vehicleTypes.map((type) => calculateVehicleFare(type, distanceKm));

  log.info(`[quoteRide] Generated quotes for distance ${distanceKm} km`, {
    distanceKm,
    vehiclesCount: quotes.length,
  });

  return {
    distanceKm,
    distanceMeters: Math.round(distanceKm * 1000),
    quotes,
    currency: 'INR',
    expiresInSeconds: 300,
  };
});

/**
 * 2. requestRide: Initiates a ride request, creates canonical rides/{rideId} document,
 * and sets up order projection with strict Greenfield fields & GeoPoints.
 */
export const requestRide = secureCallable(requestRideSchema, async (data, context) => {
  const userId = context.auth.uid;

  const distanceKm = calculateHaversineDistanceKm(
    data.pickup.latitude,
    data.pickup.longitude,
    data.destination.latitude,
    data.destination.longitude
  );

  const fareEstimate = calculateVehicleFare(data.vehicleType, distanceKm);
  const totalFarePaise = data.offeredPricePaise
    ? Math.max(fareEstimate.baseFarePaise, data.offeredPricePaise)
    : fareEstimate.totalFarePaise;

  const distanceMeters = Math.round(distanceKm * 1000);
  const estimatedDurationSeconds = Math.round(fareEstimate.durationMinutes * 60);

  // 4-digit start OTP for passenger verification
  const startOtp = Math.floor(1000 + Math.random() * 9000).toString();

  const idempotencyKey = data.idempotencyKey || `ride_req_${userId}_${Date.now()}`;

  const rideDoc = await executeIdempotent({
    collection: 'rides',
    key: idempotencyKey,
    operation: async (transaction, docId) => {
      const rideRef = db.collection('rides').doc(docId);
      const orderId = data.orderId || `order_ride_${docId}`;

      // Canonical rides/{rideId} Document matching Greenfield Specification
      const rideRecord: RideDocument = {
        userId,
        orderId,
        status: 'requested',
        vehicleType: data.vehicleType,
        pickup: {
          label: data.pickup.label,
          location: new GeoPoint(data.pickup.latitude, data.pickup.longitude),
        },
        destination: {
          label: data.destination.label,
          location: new GeoPoint(data.destination.latitude, data.destination.longitude),
        },
        quotedFareMinor: totalFarePaise,
        currency: 'INR',
        requestedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),

        // Optional / lifecycle attributes
        distanceMeters,
        estimatedDurationSeconds,
        finalFareMinor: null,
        paymentMethodId: data.paymentMethodId || data.paymentMethod || null,
        driverId: null,
        driverSnapshot: null,
        vehicleSnapshot: null,
        cancellationReason: null,
        rating: null,
        assignedAt: null,
        startedAt: null,
        completedAt: null,
        cancelledAt: null,

        // Backwards compatibility helpers for existing screens
        rideId: docId,
        startOtp,
        paymentMethod: data.paymentMethod,
        paymentStatus: 'pending',
        fare: {
          baseFarePaise: fareEstimate.baseFarePaise,
          distanceFarePaise: fareEstimate.distanceFarePaise,
          platformFeePaise: fareEstimate.platformFeePaise,
          totalFarePaise,
          currency: 'INR',
          formattedTotal: `₹${Math.round(totalFarePaise / 100)}`,
        },
      };

      transaction.set(rideRef, rideRecord);

      // 1. Initial event in subcollection rides/{rideId}/events/{eventId}
      const eventRef = rideRef.collection('events').doc();
      transaction.set(eventRef, {
        fromStatus: null,
        toStatus: 'requested',
        actorType: 'user',
        actorId: userId,
        note: 'Ride requested by passenger',
        createdAt: FieldValue.serverTimestamp(),
      });

      // 2. Canonical top-level Order Document matching Greenfield Specification
      const canonicalOrderRef = db.collection('orders').doc(orderId);
      transaction.set(canonicalOrderRef, {
        id: orderId,
        orderId,
        userId,
        category: 'rides',
        service: 'rides',
        rideId: docId,
        status: 'placed',
        vehicleType: data.vehicleType,
        pickup: {
          label: data.pickup.label,
          location: new GeoPoint(data.pickup.latitude, data.pickup.longitude),
        },
        destination: {
          label: data.destination.label,
          location: new GeoPoint(data.destination.latitude, data.destination.longitude),
        },
        subtotalMinor: totalFarePaise,
        totalMinor: totalFarePaise,
        discountMinor: 0,
        deliveryFeeMinor: 0,
        taxMinor: 0,
        currency: 'INR',
        paymentMethodId: data.paymentMethodId || data.paymentMethod || null,
        idempotencyKey,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // 3. Initial event in orders/{orderId}/events/{eventId}
      const orderEventRef = canonicalOrderRef.collection('events').doc();
      transaction.set(orderEventRef, {
        fromStatus: null,
        toStatus: 'placed',
        actorType: 'user',
        actorId: userId,
        note: 'Ride order initiated',
        createdAt: FieldValue.serverTimestamp(),
      });

      // 4. Orders & Bookings screen projection in users/{uid}/orders/{orderId}
      const projectionRef = db.collection('users').doc(userId).collection('orders').doc(orderId);
      transaction.set(projectionRef, {
        id: orderId,
        rideId: docId,
        category: 'rides',
        icon: '🚗',
        title: `${data.vehicleType.toUpperCase()} Ride`,
        status: 'Searching Driver',
        statusKind: 'ongoing',
        subtitle: `${data.pickup.label} → ${data.destination.label}`,
        actions: ['Track', 'Cancel'],
        group: 'Ongoing',
        totalMinor: totalFarePaise,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return rideRecord;
    },
  });


  log.audit('ride_requested', {
    actorUid: userId,
    rideId: rideDoc.rideId || idempotencyKey,
    vehicleType: data.vehicleType,
    distanceMeters,
    quotedFareMinor: totalFarePaise,
  });

  return {
    success: true,
    rideId: rideDoc.rideId || idempotencyKey,
    orderId: rideDoc.orderId,
    status: rideDoc.status,
    startOtp: rideDoc.startOtp,
    fare: rideDoc.fare,
    distanceMeters,
    estimatedDurationSeconds,
    quotedFareMinor: totalFarePaise,
    currency: 'INR',
  };
});

/**
 * 3. cancelRide: Validates state transition and cancels an active ride.
 */
export const cancelRide = secureCallable(cancelRideSchema, async (data, context) => {
  const userId = context.auth.uid;
  const rideRef = db.collection('rides').doc(data.rideId);
  const snap = await rideRef.get();

  if (!snap.exists) {
    throw new NotFoundError('Ride', data.rideId);
  }

  const ride = snap.data()! as RideDocument;

  // Enforce caller ownership or admin privileges
  if (ride.userId !== userId && context.auth.token?.admin !== true) {
    throw new PermissionDeniedError('You can only cancel your own rides.');
  }

  // Enforce lifecycle state machine rules
  validateRideTransition(ride.status as RideStatus, 'cancelled');

  const cancellationReason = data.reason || 'Changed plans';

  await rideRef.update({
    status: 'cancelled' as RideStatus,
    cancellationReason,
    cancelledAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Write subcollection event
  await rideRef.collection('events').doc().set({
    fromStatus: ride.status,
    toStatus: 'cancelled',
    actorType: 'user',
    actorId: userId,
    note: cancellationReason,
    createdAt: FieldValue.serverTimestamp(),
  });

  // Update canonical order and user projection if exists
  if (ride.orderId) {
    const canonicalOrderRef = db.collection('orders').doc(ride.orderId);
    await canonicalOrderRef.set(
      {
        status: 'cancelled',
        cancelledAt: FieldValue.serverTimestamp(),
        cancellationReason,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await canonicalOrderRef.collection('events').doc().set({
      fromStatus: ride.status,
      toStatus: 'cancelled',
      actorType: 'user',
      actorId: userId,
      note: cancellationReason,
      createdAt: FieldValue.serverTimestamp(),
    });

    await db.collection('users').doc(userId).collection('orders').doc(ride.orderId).set(
      {
        status: 'Cancelled',
        statusKind: 'done',
        group: 'Completed',
        actions: ['Rebook'],
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }


  log.audit('ride_cancelled', {
    actorUid: userId,
    rideId: data.rideId,
    previousStatus: ride.status,
    reason: cancellationReason,
  });

  return {
    success: true,
    rideId: data.rideId,
    status: 'cancelled',
  };
});

/**
 * 4. getRide: Retrieves current ride details and live tracking state.
 */
export const getRide = secureCallable(getRideSchema, async (data, context) => {
  const userId = context.auth.uid;
  const rideRef = db.collection('rides').doc(data.rideId);
  const snap = await rideRef.get();

  if (!snap.exists) {
    throw new NotFoundError('Ride', data.rideId);
  }

  const ride = snap.data()!;

  // Allow rider, assigned driver, or admin
  const isRider = ride.userId === userId;
  const isDriver = ride.driverId === userId || ride.driver?.driverId === userId;
  const isAdmin = context.auth.token?.admin === true;

  if (!isRider && !isDriver && !isAdmin) {
    throw new PermissionDeniedError('Access denied to this ride details.');
  }

  // Fetch live tracking data from Realtime Database for active rides
  let liveLocation: Record<string, any> | null = null;
  const activeStatuses = ['assigned', 'driver_arriving', 'in_progress'];
  if (activeStatuses.includes(ride.status)) {
    try {
      const rtdb = getRtdb();
      const locSnap = await rtdb.ref(`rideLocations/${data.rideId}`).once('value');
      if (locSnap.exists()) {
        liveLocation = locSnap.val();
      }
    } catch (locErr: any) {
      log.warn(`[getRide] Could not retrieve live location for ${data.rideId} from RTDB`, locErr);
    }
  }

  return {
    success: true,
    ride,
    liveLocation,
  };
});


/**
 * 5. rateRides: Records rider ratings, driver feedback, and compliments for completed trips.
 */
export const rateRides = secureCallable(rateRidesSchema, async (data, context) => {
  const userId = context.auth.uid;
  const rideRef = db.collection('rides').doc(data.rideId);
  const snap = await rideRef.get();

  if (!snap.exists) {
    throw new NotFoundError('Ride', data.rideId);
  }

  const ride = snap.data()!;

  if (ride.userId !== userId) {
    throw new PermissionDeniedError('You can only rate rides you completed.');
  }

  if (ride.status !== 'completed') {
    throw new PreconditionFailedError(
      `Cannot rate a ride that is not completed (current status: ${ride.status}).`
    );
  }

  const ratingRecord = {
    score: data.rating,
    feedback: data.feedback || null,
    compliments: data.compliments || [],
    ratedAt: FieldValue.serverTimestamp(),
  };

  await rideRef.update({
    rating: data.rating, // numeric rating per Greenfield spec
    ratingDetails: ratingRecord,
    updatedAt: FieldValue.serverTimestamp(),
  });

  log.audit('ride_rated', {
    actorUid: userId,
    rideId: data.rideId,
    rating: data.rating,
  });

  return {
    success: true,
    rideId: data.rideId,
    rating: data.rating,
    ratingDetails: ratingRecord,
  };
});

/**
 * Alias supporting both rateRide and rateRides naming conventions
 */
export const rateRide = rateRides;

/**
 * 6. updateRideStatus: Manages driver assignment, trip start, trip completion, and failure
 * with strict privacy masking for driver snapshots.
 */
export const updateRideStatus = secureCallable(updateRideStatusSchema, async (data, context) => {
  const actorUid = context.auth.uid;
  const rideRef = db.collection('rides').doc(data.rideId);
  const snap = await rideRef.get();

  if (!snap.exists) {
    throw new NotFoundError('Ride', data.rideId);
  }

  const ride = snap.data()! as RideDocument;
  const targetStatus = data.status as RideStatus;

  validateRideTransition(ride.status as RideStatus, targetStatus);

  const updates: Partial<RideDocument> & Record<string, any> = {
    status: targetStatus,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (targetStatus === 'assigned') {
    const driverId = data.driverId || actorUid;
    updates.driverId = driverId;
    updates.driverSnapshot = {
      name: data.driverName || 'Verified Driver',
      maskedPhone: maskPhoneNumber(data.driverPhone),
      rating: data.driverRating || 4.85,
    };
    updates.vehicleSnapshot = {
      model: data.vehicleModel || 'Standard Vehicle',
      maskedRegistration: maskRegistration(data.vehicleRegistration),
    };
    updates.assignedAt = FieldValue.serverTimestamp();
  } else if (targetStatus === 'in_progress') {
    updates.startedAt = FieldValue.serverTimestamp();
  } else if (targetStatus === 'completed') {
    updates.completedAt = FieldValue.serverTimestamp();
    updates.finalFareMinor = data.finalFareMinor || ride.quotedFareMinor;
  } else if (targetStatus === 'cancelled' || targetStatus === 'failed') {
    updates.cancelledAt = FieldValue.serverTimestamp();
    updates.cancellationReason = data.cancellationReason || `Ride marked as ${targetStatus}`;
  }

  await rideRef.update(updates);

  // Write subcollection event
  await rideRef.collection('events').doc().set({
    fromStatus: ride.status,
    toStatus: targetStatus,
    actorType: 'driver',
    actorId: actorUid,
    note: updates.cancellationReason || `Status updated to ${targetStatus}`,
    createdAt: FieldValue.serverTimestamp(),
  });

  // Update canonical order and user projection
  if (ride.orderId) {
    const canonicalOrderRef = db.collection('orders').doc(ride.orderId);
    const orderStatusMap: Record<RideStatus, string> = {
      requested: 'placed',
      searching: 'placed',
      assigned: 'confirmed',
      driver_arriving: 'preparing',
      in_progress: 'in_progress',
      completed: 'completed',
      cancelled: 'cancelled',
      failed: 'failed',
    };
    const mappedOrderStatus = orderStatusMap[targetStatus] || targetStatus;

    await canonicalOrderRef.set(
      {
        status: mappedOrderStatus,
        updatedAt: FieldValue.serverTimestamp(),
        ...(targetStatus === 'completed'
          ? { completedAt: FieldValue.serverTimestamp(), finalFareMinor: updates.finalFareMinor }
          : {}),
        ...(targetStatus === 'cancelled' || targetStatus === 'failed'
          ? {
              cancelledAt: FieldValue.serverTimestamp(),
              cancellationReason: updates.cancellationReason,
            }
          : {}),
      },
      { merge: true }
    );

    await canonicalOrderRef.collection('events').doc().set({
      fromStatus: ride.status,
      toStatus: mappedOrderStatus,
      actorType: 'driver',
      actorId: actorUid,
      note: updates.cancellationReason || `Ride status updated to ${targetStatus}`,
      createdAt: FieldValue.serverTimestamp(),
    });

    if (ride.userId) {
      const isTerminal = targetStatus === 'completed' || targetStatus === 'cancelled' || targetStatus === 'failed';
      await db.collection('users').doc(ride.userId).collection('orders').doc(ride.orderId).set(
        {
          status: targetStatus === 'completed' ? 'Completed' : targetStatus === 'cancelled' ? 'Cancelled' : 'Ongoing',
          statusKind: isTerminal ? 'done' : 'ongoing',
          group: isTerminal ? 'Completed' : 'Ongoing',
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }
  }


  log.audit('ride_status_updated', {
    actorUid,
    rideId: data.rideId,
    fromStatus: ride.status,
    toStatus: targetStatus,
  });

  return {
    success: true,
    rideId: data.rideId,
    status: targetStatus,
  };
});



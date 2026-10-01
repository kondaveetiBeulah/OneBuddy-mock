import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { z } from 'zod';
import { db, getRtdb } from '../core/firebase';
import { secureCallable } from '../common/auth';
import { NotFoundError, PermissionDeniedError, PreconditionFailedError } from '../common/errors';
import { log } from '../common/logging';

/**
 * Driver Location Update Schema
 */
export const updateDriverLocationSchema = z.object({
  rideId: z.string().min(1, 'Ride ID is required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  heading: z.number().min(0).max(360).optional(),
  speed: z.number().nonnegative().optional(),
  accuracy: z.number().nonnegative().optional(),
});

export type UpdateDriverLocationInput = z.infer<typeof updateDriverLocationSchema>;

/**
 * 1. updateDriverLocation (RTDB Location Writer)
 * Allows the assigned driver to stream real-time GPS coordinates to RTDB.
 * Path: /rideLocations/{rideId}
 */
export const updateDriverLocation = secureCallable(
  updateDriverLocationSchema,
  async (data, context) => {
    const callerUid = context.auth.uid;
    const { rideId, latitude, longitude, heading, speed, accuracy } = data;

    // 1. Fetch Ride Document to verify authorization & status
    const rideRef = db.collection('rides').doc(rideId);
    const snap = await rideRef.get();

    if (!snap.exists) {
      throw new NotFoundError('Ride', rideId);
    }

    const ride = snap.data()!;

    // 2. Authorization: Caller must be assigned driver or admin
    const isAssignedDriver = ride.driverId === callerUid || ride.driver?.driverId === callerUid;
    const isAdmin = context.auth.token?.admin === true;

    if (!isAssignedDriver && !isAdmin) {
      throw new PermissionDeniedError(
        'Only the assigned driver can update tracking coordinates for this ride.'
      );
    }

    // 3. Status Check: Only active rides accept location updates
    const activeStatuses = ['assigned', 'driver_arriving', 'in_progress'];
    if (!activeStatuses.includes(ride.status)) {
      throw new PreconditionFailedError(
        `Cannot update location for ride in status "${ride.status}". Must be active.`
      );
    }

    // 4. Write GPS update to RTDB matching Greenfield Section 3 & RTDB rules
    const timestamp = Date.now();
    const locationPayload = {
      userId: ride.userId,
      driverUid: callerUid,
      latitude,
      longitude,
      heading: typeof heading === 'number' && heading >= 0 && heading < 360 ? heading : 0,
      updatedAt: timestamp,
    };

    const rtdb = getRtdb();
    await rtdb.ref(`rideLocations/${rideId}`).set(locationPayload);


    // Optional: Also update driver's current position for fleet matching
    await rtdb.ref(`driverLocations/${callerUid}`).set({
      latitude,
      longitude,
      heading: heading ?? null,
      speed: speed ?? null,
      accuracy: accuracy ?? null,
      updatedAt: timestamp,
      activeRideId: rideId,
    });


    return {
      success: true,
      rideId,
      updatedAt: timestamp,
    };
  }
);

/**
 * Helper to delete a ride location from RTDB
 */
export async function deleteRtdbRideLocation(rideId: string): Promise<boolean> {
  try {
    const rtdb = getRtdb();
    const locRef = rtdb.ref(`rideLocations/${rideId}`);
    const snap = await locRef.once('value');
    if (snap.exists()) {
      await locRef.remove();
      log.info(`[RTDB Cleanup] Deleted ride location for ${rideId}`);
      return true;
    }
    return false;
  } catch (err: any) {
    log.error(`[RTDB Cleanup] Failed to delete location for ${rideId}`, err);
    return false;
  }
}

/**
 * 2. onRideTerminatedCleanup (Firestore Trigger Cleanup Job)
 * Listens to updates on rides/{rideId}. When the status changes to terminal states
 * ('completed', 'cancelled', 'failed'), automatically removes /rideLocations/{rideId} from RTDB.
 */
export const onRideTerminatedCleanup = onDocumentWritten(
  {
    document: 'rides/{rideId}',
    region: 'asia-south1',
  },
  async (event) => {
    const afterData = event.data?.after?.data();
    if (!afterData) return; // Document deleted

    const rideId = event.params.rideId;
    const status = afterData.status;

    const terminalStatuses = ['completed', 'cancelled', 'failed'];
    if (terminalStatuses.includes(status)) {
      log.info(`[onRideTerminatedCleanup] Ride ${rideId} entered terminal status "${status}". Cleaning RTDB.`);
      await deleteRtdbRideLocation(rideId);
    }
  }
);

/**
 * 3. cleanupStaleRideLocations (Scheduled Cron Cleanup Job)
 * Runs every 2 hours to sweep stale ride locations older than 2 hours from RTDB.
 */
export const cleanupStaleRideLocations = onSchedule(
  {
    schedule: 'every 2 hours',
    region: 'asia-south1',
    timeZone: 'Asia/Kolkata',
  },
  async () => {
    log.info('[cleanupStaleRideLocations] Starting scheduled RTDB location sweep.');
    const rtdb = getRtdb();
    const locationsRef = rtdb.ref('rideLocations');

    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    const snap = await locationsRef.once('value');

    if (!snap.exists()) {
      log.info('[cleanupStaleRideLocations] No active ride locations found in RTDB.');
      return;
    }

    const locations = snap.val() as Record<string, { updatedAt?: number }>;
    let deletedCount = 0;

    const deletePromises: Promise<unknown>[] = [];

    for (const [rideId, data] of Object.entries(locations)) {
      const updatedAt = data.updatedAt || 0;
      if (updatedAt < twoHoursAgo) {
        deletePromises.push(
          locationsRef.child(rideId).remove().then(() => {
            deletedCount++;
          })
        );
      }
    }

    await Promise.all(deletePromises);
    log.info(`[cleanupStaleRideLocations] Sweep complete. Purged ${deletedCount} stale ride locations from RTDB.`);
  }
);

import { useEffect, useState, useRef } from 'react';
import { ref, onValue, off, DataSnapshot } from 'firebase/database';
import { rtdb } from '../../../firebase/config';
import type { DriverLocation, TrackingConnectionState } from '../types/tracking';

export interface UseActiveRideLocationOptions {
  rideId: string | null | undefined;
  rideStatus?: string;
  onLocationUpdate?: (location: DriverLocation) => void;
}

export interface UseActiveRideLocationResult {
  location: DriverLocation | null;
  connectionState: TrackingConnectionState;
  isLive: boolean;
  error: Error | null;
}

const TERMINAL_STATUSES = new Set([
  'completed',
  'cancelled',
  'failed',
  'trip_completed',
]);

/**
 * useActiveRideLocation
 * Subscribes to real-time driver coordinates from Firebase Realtime Database:
 * Path: /rideLocations/{rideId}
 *
 * Implements Greenfield Specification Section 3 & 4 (live coordinates stream
 * in RTDB rather than Firestore documents to avoid excessive document writes).
 * Automatically unsubscribes immediately when:
 * 1. rideId becomes null/undefined
 * 2. rideStatus reaches a terminal status (completed, cancelled, etc.)
 * 3. Component unmounts
 */
export function useActiveRideLocation({
  rideId,
  rideStatus,
  onLocationUpdate,
}: UseActiveRideLocationOptions): UseActiveRideLocationResult {
  const [location, setLocation] = useState<DriverLocation | null>(null);
  const [connectionState, setConnectionState] = useState<TrackingConnectionState>('offline');
  const [error, setError] = useState<Error | null>(null);
  const onLocationUpdateRef = useRef(onLocationUpdate);
  onLocationUpdateRef.current = onLocationUpdate;

  useEffect(() => {
    // If no rideId, or ride is finished, ensure no listener runs
    if (!rideId || (rideStatus && TERMINAL_STATUSES.has(rideStatus))) {
      setConnectionState('offline');
      return;
    }

    if (!rtdb) {
      // RTDB not configured (dev / mock environment)
      setConnectionState('offline');
      return;
    }

    setConnectionState('reconnecting');
    const rideLocRef = ref(rtdb, `rideLocations/${rideId}`);

    onValue(
      rideLocRef,
      (snapshot: DataSnapshot) => {
        if (!snapshot.exists()) {
          setConnectionState('offline');
          return;
        }

        const data = snapshot.val();
        if (data && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
          const loc: DriverLocation = {
            latitude: data.latitude,
            longitude: data.longitude,
            heading: typeof data.heading === 'number' ? data.heading : 0,
            speed: typeof data.speed === 'number' ? data.speed : undefined,
            timestamp: typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
          };

          setLocation(loc);
          setConnectionState('connected');
          setError(null);
          onLocationUpdateRef.current?.(loc);
        }
      },
      (err) => {
        console.warn(`[useActiveRideLocation] RTDB subscription error for ride ${rideId}:`, err);
        setError(err);
        setConnectionState('error');
      }
    );

    return () => {
      // Immediate unbind on unmount, ID change, or ride completion
      off(rideLocRef);
    };
  }, [rideId, rideStatus]);

  return {
    location,
    connectionState,
    isLive: connectionState === 'connected' && location !== null,
    error,
  };
}

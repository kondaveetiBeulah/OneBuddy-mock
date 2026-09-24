import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import type {
  DeliveryStatus,
  DriverLocation,
  RouteCoordinates,
  TrackingConnectionState,
} from '../types/tracking';

/**
 * High-density road waypoints from Spice Route Kitchen (Road No. 12, Banjara Hills)
 * to Lotus Residency (Jubilee Hills), Hyderabad.
 */
export const HYDERABAD_FOOD_ROUTE: RouteCoordinates[] = [
  // 1. Starting at Spice Route Kitchen, Road No. 12 Banjara Hills
  { latitude: 17.41485, longitude: 78.43521 },
  { latitude: 17.41525, longitude: 78.43432 },
  { latitude: 17.41582, longitude: 78.43315 },
  { latitude: 17.41641, longitude: 78.43198 },
  { latitude: 17.41695, longitude: 78.43085 },
  // Turn onto MLA Colony link
  { latitude: 17.41785, longitude: 78.42942 },
  { latitude: 17.41892, longitude: 78.42795 },
  { latitude: 17.42015, longitude: 78.42621 },
  { latitude: 17.42145, longitude: 78.42455 },
  // Road 10 / Cancer Hospital junction
  { latitude: 17.42289, longitude: 78.42284 },
  { latitude: 17.42432, longitude: 78.42095 },
  { latitude: 17.42581, longitude: 78.41912 },
  // Jubilee Hills Checkpost approach
  { latitude: 17.42718, longitude: 78.41725 },
  { latitude: 17.42845, longitude: 78.41538 },
  { latitude: 17.42962, longitude: 78.41362 },
  { latitude: 17.43058, longitude: 78.41195 },
  // Road 36 Jubilee Hills stretch
  { latitude: 17.43125, longitude: 78.41025 },
  { latitude: 17.43182, longitude: 78.40885 },
  { latitude: 17.43225, longitude: 78.40765 },
  // Final turn into Lotus Residency
  { latitude: 17.43258, longitude: 78.40702 },
];

export const HYDERABAD_GROCERY_ROUTE = HYDERABAD_FOOD_ROUTE;

/**
 * Calculates bearing / heading in degrees between two GPS coordinates.
 */
export function calculateBearing(start: RouteCoordinates, end: RouteCoordinates): number {
  const startLat = (start.latitude * Math.PI) / 180;
  const startLng = (start.longitude * Math.PI) / 180;
  const endLat = (end.latitude * Math.PI) / 180;
  const endLng = (end.longitude * Math.PI) / 180;

  const dLng = endLng - startLng;
  const y = Math.sin(dLng) * Math.cos(endLat);
  const x =
    Math.cos(startLat) * Math.sin(endLat) -
    Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);

  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  bearing = (bearing + 360) % 360;
  return Math.round(bearing);
}

/**
 * Calculates Haversine distance in meters.
 */
export function calculateDistanceMeters(start: RouteCoordinates, end: RouteCoordinates): number {
  const R = 6371e3; // metres
  const φ1 = (start.latitude * Math.PI) / 180;
  const φ2 = (end.latitude * Math.PI) / 180;
  const Δφ = ((end.latitude - start.latitude) * Math.PI) / 180;
  const Δλ = ((end.longitude - start.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Generate sub-interpolated waypoints for buttery smooth animations.
 */
function generateDenseRoute(route: RouteCoordinates[], subdivisionsPerSegment = 8): RouteCoordinates[] {
  const dense: RouteCoordinates[] = [];
  for (let i = 0; i < route.length - 1; i++) {
    const p1 = route[i];
    const p2 = route[i + 1];
    dense.push(p1);
    for (let s = 1; s < subdivisionsPerSegment; s++) {
      const fraction = s / subdivisionsPerSegment;
      dense.push({
        latitude: p1.latitude + (p2.latitude - p1.latitude) * fraction,
        longitude: p1.longitude + (p2.longitude - p1.longitude) * fraction,
      });
    }
  }
  dense.push(route[route.length - 1]);
  return dense;
}

export interface UseLiveLocationSimulationOptions {
  route?: RouteCoordinates[];
  updateIntervalMs?: number;
  autoStart?: boolean;
}

export function useLiveLocationSimulation({
  route = HYDERABAD_GROCERY_ROUTE,
  updateIntervalMs = 1200,
  autoStart = true,
}: UseLiveLocationSimulationOptions = {}) {
  // Generate high density waypoints
  const denseRoute = useMemo(() => generateDenseRoute(route, 6), [route]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoStart);
  const [connectionState, setConnectionState] = useState<TrackingConnectionState>('connected');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalPoints = denseRoute.length;
  const origin = denseRoute[0];
  const destination = denseRoute[denseRoute.length - 1];

  // Current driver location with heading
  const currentLocation: DriverLocation = useMemo(() => {
    const point = denseRoute[currentIndex] || denseRoute[0];
    const nextPoint = denseRoute[Math.min(currentIndex + 1, totalPoints - 1)] || point;
    const heading = calculateBearing(point, nextPoint);

    return {
      latitude: point.latitude,
      longitude: point.longitude,
      heading: heading || 310,
      speed: 28, // km/h
      timestamp: Date.now(),
    };
  }, [currentIndex, denseRoute, totalPoints]);

  // Derive dynamic delivery status based on position along the route
  const progressRatio = currentIndex / Math.max(totalPoints - 1, 1);
  const status: DeliveryStatus = useMemo(() => {
    if (progressRatio <= 0.05) return 'picked_up';
    if (progressRatio >= 0.96) return 'delivered';
    if (progressRatio >= 0.85) return 'arriving';
    return 'on_the_way';
  }, [progressRatio]);

  // Dynamic ETA in minutes (e.g. starts at ~12 mins and counts down)
  const remainingEtaMinutes = useMemo(() => {
    if (status === 'delivered') return 0;
    const remainingFraction = 1 - progressRatio;
    return Math.max(1, Math.round(remainingFraction * 12));
  }, [status, progressRatio]);

  // Split route into completed trail and remaining route
  const completedRoute: RouteCoordinates[] = useMemo(() => {
    return denseRoute.slice(0, currentIndex + 1);
  }, [denseRoute, currentIndex]);

  const remainingRoute: RouteCoordinates[] = useMemo(() => {
    return denseRoute.slice(currentIndex);
  }, [denseRoute, currentIndex]);

  // Simulation tick
  useEffect(() => {
    if (!isPlaying || connectionState === 'offline' || connectionState === 'error') {
      if (timerRef.current) clearInterval(timerRef.current);
      return undefined;
    }

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= totalPoints - 1) {
          // Loop back or stay at end
          return 0;
        }
        return prev + 1;
      });
    }, updateIntervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, connectionState, totalPoints, updateIntervalMs]);

  const toggleSimulation = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const resetRoute = useCallback(() => {
    setCurrentIndex(0);
    setIsPlaying(true);
  }, []);

  const toggleOffline = useCallback(() => {
    setConnectionState((prev) => (prev === 'offline' ? 'connected' : 'offline'));
  }, []);

  const jumpToProgress = useCallback(
    (fraction: number) => {
      const targetIndex = Math.min(
        totalPoints - 1,
        Math.max(0, Math.floor(fraction * (totalPoints - 1))),
      );
      setCurrentIndex(targetIndex);
    },
    [totalPoints],
  );

  return {
    currentLocation,
    origin,
    destination,
    fullRoute: route,
    denseRoute,
    completedRoute,
    remainingRoute,
    progressRatio,
    status,
    remainingEtaMinutes,
    connectionState,
    isPlaying,
    toggleSimulation,
    resetRoute,
    toggleOffline,
    jumpToProgress,
  };
}

import { useCallback, useRef, useState } from 'react';
import type { RouteCoordinates } from '../types/tracking';

export interface UseMapCameraControllerOptions {
  /** Initial auto-follow state (default: true) */
  initialAutoFollow?: boolean;
  /** Camera zoom level for 2D tracking (default: 16.5) */
  zoomLevel?: number;
  /** Edge padding for fitting entire route bounds */
  defaultEdgePadding?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export function useMapCameraController({
  initialAutoFollow = true,
  zoomLevel = 16.5,
  defaultEdgePadding = { top: 120, right: 50, bottom: 280, left: 50 },
}: UseMapCameraControllerOptions = {}) {
  const mapRef = useRef<any>(null);
  const [autoFollow, setAutoFollow] = useState(initialAutoFollow);

  /**
   * Toggles the Auto-Follow mode.
   * If enabled, re-centers camera immediately onto driver position if provided.
   */
  const toggleAutoFollow = useCallback(
    (enabled: boolean, driverCoord?: RouteCoordinates) => {
      setAutoFollow(enabled);
      if (enabled && driverCoord && mapRef.current) {
        try {
          mapRef.current.animateCamera(
            {
              center: {
                latitude: driverCoord.latitude,
                longitude: driverCoord.longitude,
              },
              pitch: 0, // Strict 2D
              heading: 0,
              zoom: zoomLevel,
            },
            { duration: 650 },
          );
        } catch {
          mapRef.current.animateToRegion(
            {
              latitude: driverCoord.latitude,
              longitude: driverCoord.longitude,
              latitudeDelta: 0.008,
              longitudeDelta: 0.008,
            },
            650,
          );
        }
      }
    },
    [zoomLevel],
  );

  /**
   * Called on every driver GPS position update.
   * Smoothly animates camera if autoFollow is active.
   */
  const followDriver = useCallback(
    (driverCoord: RouteCoordinates) => {
      if (!autoFollow || !mapRef.current) return;

      try {
        mapRef.current.animateCamera(
          {
            center: {
              latitude: driverCoord.latitude,
              longitude: driverCoord.longitude,
            },
            pitch: 0, // Strict 2D
            heading: 0,
            zoom: zoomLevel,
          },
          { duration: 600 },
        );
      } catch {
        mapRef.current.animateToRegion(
          {
            latitude: driverCoord.latitude,
            longitude: driverCoord.longitude,
            latitudeDelta: 0.008,
            longitudeDelta: 0.008,
          },
          600,
        );
      }
    },
    [autoFollow, zoomLevel],
  );

  /**
   * Fits the entire route (origin, driver, destination) into the viewport.
   * Automatically disables Auto-Follow so the user can inspect the full route.
   */
  const fitEntireRoute = useCallback(
    (
      coordinates: RouteCoordinates[],
      customPadding?: { top: number; right: number; bottom: number; left: number },
    ) => {
      setAutoFollow(false);
      if (!mapRef.current || coordinates.length === 0) return;

      try {
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: customPadding ?? defaultEdgePadding,
          animated: true,
        });
      } catch {
        // Fallback if not supported
      }
    },
    [defaultEdgePadding],
  );

  /**
   * Called when user touches or drags the map manually.
   * Gracefully disables Auto-Follow mode.
   */
  const onUserPanDrag = useCallback(() => {
    if (autoFollow) {
      setAutoFollow(false);
    }
  }, [autoFollow]);

  return {
    mapRef,
    autoFollow,
    setAutoFollow,
    toggleAutoFollow,
    followDriver,
    fitEntireRoute,
    onUserPanDrag,
  };
}

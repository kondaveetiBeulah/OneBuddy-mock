import { useEffect, useCallback } from 'react';
import {
  dynamicRefreshRate,
  RefreshRateConfig,
  FPS_CONFIG,
} from './dynamicRefreshRate';

/**
 * Hook for components to dynamically scale display refresh rates between 60 FPS and 120 FPS.
 *
 * @param continuousBoost If true, locks 120 FPS for the lifetime of this component (e.g. Live Tracking Map, intense animations)
 * @param config Optional min, max, and boost duration settings
 */
export function useDynamicRefreshRate(
  continuousBoost: boolean = false,
  config?: RefreshRateConfig
) {
  useEffect(() => {
    if (config) {
      dynamicRefreshRate.init(config);
    }

    if (continuousBoost) {
      dynamicRefreshRate.startContinuousBoost();
    } else {
      dynamicRefreshRate.boost();
    }

    return () => {
      if (continuousBoost) {
        dynamicRefreshRate.stopContinuousBoost();
      }
    };
  }, [continuousBoost, config]);

  const triggerBoost = useCallback((durationMs?: number) => {
    dynamicRefreshRate.boost(durationMs);
  }, []);

  const onScroll = useCallback(() => {
    dynamicRefreshRate.boost(1000);
  }, []);

  return {
    triggerBoost,
    onScroll,
    startContinuousBoost: () => dynamicRefreshRate.startContinuousBoost(),
    stopContinuousBoost: () => dynamicRefreshRate.stopContinuousBoost(),
    scrollEventThrottle: FPS_CONFIG.SCROLL_EVENT_THROTTLE,
    fpsConfig: FPS_CONFIG,
  };
}

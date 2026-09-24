import { useEffect, useCallback } from 'react';
import { refreshRateManager, RefreshRateConfig } from '../utils/dynamicRefreshRate';

/**
 * Hook to dynamically scale display refresh rate for interactive screens
 * @param activeContinuousBoost If true, keeps refresh rate at 120 FPS for the duration of the component lifecycle (e.g. live tracking map)
 * @param config Optional min, max, and boost duration settings
 */
export function useDynamicRefreshRate(
  activeContinuousBoost: boolean = false,
  config?: RefreshRateConfig
) {
  useEffect(() => {
    if (config) {
      refreshRateManager.configure(config);
    }

    if (activeContinuousBoost) {
      refreshRateManager.startContinuousBoost();
    } else {
      refreshRateManager.boostRefreshRate(1200);
    }

    return () => {
      if (activeContinuousBoost) {
        refreshRateManager.stopContinuousBoost();
      }
    };
  }, [activeContinuousBoost, config]);

  const triggerInteractionBoost = useCallback((durationMs?: number) => {
    refreshRateManager.boostRefreshRate(durationMs);
  }, []);

  return {
    triggerInteractionBoost,
    startContinuousBoost: () => refreshRateManager.startContinuousBoost(),
    stopContinuousBoost: () => refreshRateManager.stopContinuousBoost(),
  };
}

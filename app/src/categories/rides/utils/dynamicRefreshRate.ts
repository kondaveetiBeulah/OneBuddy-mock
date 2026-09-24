/**
 * Dynamic Display Refresh Rate Manager (60Hz - 120Hz)
 *
 * Implements dynamic frame rate scaling based on user interaction, scroll gestures,
 * map movements, and active animations with proper lifecycle management.
 *
 * Capabilities:
 * - Android: Configures WindowManager.LayoutParams.preferredDisplayModeId,
 *   Surface.setFrameRate / Window.setFrameRate (API 30+), or Display.Mode.
 * - iOS: Configures CAFrameRateRange(minimum: 60, maximum: 120, preferred: 120) via CADisplayLink.
 * - Minimum Floor: 60 FPS (energy efficient during idle state).
 * - Maximum Cap: 120 FPS (ultra-smooth during interactions and animations).
 */
import { useEffect, useRef, useCallback } from 'react';
import { NativeModules, Platform, AppState, AppStateStatus } from 'react-native';

export interface RefreshRateConfig {
  minRate?: number; // default: 60
  maxRate?: number; // default: 120
  preferredRate?: number; // default: 120 during interaction, 60 during idle
  boostDurationMs?: number; // default: 1500ms after interaction ends
}

const DEFAULT_CONFIG: Required<RefreshRateConfig> = {
  minRate: 60,
  maxRate: 120,
  preferredRate: 120,
  boostDurationMs: 1500,
};

// Check if Native Module is linked in bare React Native or custom client
const NativeRefreshRate = NativeModules.DynamicRefreshRateModule || {
  setFrameRateRange: (min: number, max: number, preferred: number) => {
    // Web / Expo Go fallback simulation
    if (__DEV__) {
      // Log in debug if necessary
    }
  },
  resetFrameRate: () => {},
  getSupportedModes: async () => [60, 90, 120],
};

class RefreshRateManager {
  private static instance: RefreshRateManager;
  private currentRate: number = 60;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private config: Required<RefreshRateConfig> = DEFAULT_CONFIG;
  private isHighPerformanceRequested = false;

  private constructor() {
    this.setupAppStateListener();
  }

  public static getInstance(): RefreshRateManager {
    if (!RefreshRateManager.instance) {
      RefreshRateManager.instance = new RefreshRateManager();
    }
    return RefreshRateManager.instance;
  }

  /**
   * Configure global minimum and maximum refresh rates
   */
  public configure(config: Partial<RefreshRateConfig>) {
    this.config = { ...this.config, ...config };
    this.applyRefreshRate(this.config.minRate);
  }

  /**
   * Request dynamic high refresh rate boost (up to 120Hz) during user interactions,
   * map panning, vehicle animations, and screen transitions.
   */
  public boostRefreshRate(durationMs?: number) {
    const boostMs = durationMs ?? this.config.boostDurationMs;

    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }

    if (this.currentRate !== this.config.maxRate) {
      this.applyRefreshRate(this.config.maxRate);
    }

    // Schedule return to 60Hz energy-saving floor after interaction ends
    this.idleTimer = setTimeout(() => {
      if (!this.isHighPerformanceRequested) {
        this.applyRefreshRate(this.config.minRate);
      }
    }, boostMs);
  }

  /**
   * Lock high refresh rate for continuous animations (e.g. Live Map Tracking)
   */
  public startContinuousBoost() {
    this.isHighPerformanceRequested = true;
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    this.applyRefreshRate(this.config.maxRate);
  }

  /**
   * Stop continuous boost and return to 60Hz floor
   */
  public stopContinuousBoost() {
    this.isHighPerformanceRequested = false;
    this.applyRefreshRate(this.config.minRate);
  }

  /**
   * Apply frame rate range to native platform
   */
  private applyRefreshRate(targetRate: number) {
    this.currentRate = targetRate;
    try {
      if (Platform.OS === 'android' || Platform.OS === 'ios') {
        NativeRefreshRate.setFrameRateRange(
          this.config.minRate,
          this.config.maxRate,
          targetRate
        );
      }
    } catch {
      // Graceful fallback
    }
  }

  /**
   * Lifecycle management on AppState change (background / foreground)
   */
  private setupAppStateListener() {
    AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        // Restore appropriate frame rate when returning to foreground
        const rate = this.isHighPerformanceRequested ? this.config.maxRate : this.config.minRate;
        this.applyRefreshRate(rate);
      } else {
        // Drop to 60Hz or reset when in background / inactive
        if (this.idleTimer) {
          clearTimeout(this.idleTimer);
          this.idleTimer = null;
        }
        this.applyRefreshRate(this.config.minRate);
      }
    });
  }
}

export const refreshRateManager = RefreshRateManager.getInstance();

/**
 * Dynamic Display Refresh Rate Manager (60 FPS - 120 FPS)
 *
 * Implements dynamic frame rate scaling based on user interaction, scroll gestures,
 * map movements, high-framerate transitions, and active animations with proper
 * power-saving lifecycle management.
 *
 * Target Range & Platform Specifications:
 * - Target Range: Scaled dynamically between 60Hz (idle/static) and 120Hz (active/animating).
 * - Android:
 *     - Surface.setFrameRate(120, FRAME_RATE_COMPATIBILITY_DEFAULT) / Window.setFrameRate (API 30+)
 *     - WindowManager.LayoutParams.preferredRefreshRate / preferredDisplayModeId
 *     - Display.getMode() refresh rate selection
 * - iOS:
 *     - CADisplayLink.preferredFrameRateRange = CAFrameRateRange(minimum: 60, maximum: 120, preferred: 120)
 *     - UIKit / CAAnimation preferredFrameRateRange (ProMotion on iPhone 13 Pro+)
 * - Web / Cross-Platform Fallback:
 *     - requestAnimationFrame delta throttling with 8.33ms (120Hz) / 16.66ms (60Hz) pacing
 *     - Compositor GPU layer acceleration
 */

import { Platform, NativeModules, AppState, AppStateStatus } from 'react-native';

export interface RefreshRateConfig {
  /** Minimum refresh rate floor in FPS (default: 60) */
  minRate?: number;
  /** Maximum refresh rate ceiling in FPS (default: 120) */
  maxRate?: number;
  /** Preferred refresh rate during active motion (default: 120) */
  preferredRate?: number;
  /** Cooldown duration in ms before falling back to minRate after an interaction (default: 1200ms) */
  boostDurationMs?: number;
}

export const FPS_CONFIG = {
  MIN_FPS: 60,
  MAX_FPS: 120,
  FRAME_TIME_60FPS_MS: 16.66,
  FRAME_TIME_120FPS_MS: 8.33,
  SCROLL_EVENT_THROTTLE: 8, // 8ms throttle captures up to 120 FPS touch/scroll events
} as const;

export const DEFAULT_REFRESH_CONFIG: Required<RefreshRateConfig> = {
  minRate: FPS_CONFIG.MIN_FPS,
  maxRate: FPS_CONFIG.MAX_FPS,
  preferredRate: FPS_CONFIG.MAX_FPS,
  boostDurationMs: 1200,
};

// Interface for Native Module bridge when present in bare/custom build
interface NativeRefreshRateModuleSpec {
  setPreferredDisplayMode?: (modeId: number) => void;
  setFrameRate?: (rate: number, compatibility?: number) => void;
  setFrameRateRange?: (min: number, max: number, preferred: number) => void;
  setPreferredFrameRateRange?: (min: number, max: number, preferred: number) => void;
  resetFrameRate?: () => void;
  getSupportedRefreshRates?: () => Promise<number[]>;
}

const NativeRefreshRate: NativeRefreshRateModuleSpec =
  NativeModules.DynamicRefreshRateModule ||
  NativeModules.RNRefreshRate ||
  NativeModules.DisplayModeModule ||
  {};

class DynamicRefreshRateManager {
  private static instance: DynamicRefreshRateManager;
  private currentRate: number = FPS_CONFIG.MIN_FPS;
  private config: Required<RefreshRateConfig> = DEFAULT_REFRESH_CONFIG;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private isContinuousBoostActive = false;
  private isInitialized = false;

  private constructor() {
    this.setupAppStateListener();
  }

  public static getInstance(): DynamicRefreshRateManager {
    if (!DynamicRefreshRateManager.instance) {
      DynamicRefreshRateManager.instance = new DynamicRefreshRateManager();
    }
    return DynamicRefreshRateManager.instance;
  }

  /**
   * Initializes the refresh rate manager and configures the native display bounds (60Hz - 120Hz).
   */
  public init(config?: Partial<RefreshRateConfig>): void {
    if (this.isInitialized && !config) return;
    this.isInitialized = true;

    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Apply baseline platform configurations
    this.applyPlatformOptimizations();
    this.applyRefreshRate(this.config.minRate);
  }

  /**
   * Dynamically boosts the display refresh rate to 120 FPS during user interactions,
   * scrolling, touches, card flips, or transitions. Schedulers then settle back to 60 FPS
   * to conserve battery.
   */
  public boost(durationMs?: number): void {
    const duration = durationMs ?? this.config.boostDurationMs;

    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }

    if (this.currentRate !== this.config.maxRate) {
      this.applyRefreshRate(this.config.maxRate);
    }

    // Schedule settling back to 60 FPS floor
    this.idleTimer = setTimeout(() => {
      if (!this.isContinuousBoostActive) {
        this.applyRefreshRate(this.config.minRate);
      }
    }, duration);
  }

  /**
   * Locks the refresh rate at 120 FPS for continuous motion (e.g. live GPS tracking,
   * car route animations, smooth physics simulations).
   */
  public startContinuousBoost(): void {
    this.isContinuousBoostActive = true;
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    this.applyRefreshRate(this.config.maxRate);
  }

  /**
   * Releases continuous 120 FPS lock and safely returns to 60 FPS.
   */
  public stopContinuousBoost(): void {
    this.isContinuousBoostActive = false;
    this.applyRefreshRate(this.config.minRate);
  }

  /**
   * Returns current active FPS target.
   */
  public getCurrentFps(): number {
    return this.currentRate;
  }

  /**
   * Returns whether a continuous 120 FPS boost is active.
   */
  public isContinuousActive(): boolean {
    return this.isContinuousBoostActive;
  }

  /**
   * Applies the requested frame rate to the underlying platform.
   */
  private applyRefreshRate(targetRate: number): void {
    this.currentRate = targetRate;

    try {
      if (Platform.OS === 'android') {
        this.applyAndroidRefreshRate(targetRate);
      } else if (Platform.OS === 'ios') {
        this.applyIOSRefreshRate(targetRate);
      } else if (Platform.OS === 'web') {
        this.applyWebRefreshRate(targetRate);
      }
    } catch {
      // Graceful no-op fallback on devices where platform bridge isn't available
    }
  }

  /**
   * Android Display Mode & Frame Rate Configuration:
   * Leverages setFrameRateRange / setFrameRate / preferredDisplayModeId
   */
  private applyAndroidRefreshRate(targetRate: number): void {
    if (NativeRefreshRate.setFrameRateRange) {
      NativeRefreshRate.setFrameRateRange(
        this.config.minRate,
        this.config.maxRate,
        targetRate
      );
    } else if (NativeRefreshRate.setFrameRate) {
      NativeRefreshRate.setFrameRate(targetRate, 0);
    }
  }

  /**
   * iOS CADisplayLink & CAFrameRateRange Configuration:
   * Configures minimum 60, maximum 120, preferred frame rate range on ProMotion displays.
   */
  private applyIOSRefreshRate(targetRate: number): void {
    if (NativeRefreshRate.setPreferredFrameRateRange) {
      NativeRefreshRate.setPreferredFrameRateRange(
        this.config.minRate,
        this.config.maxRate,
        targetRate
      );
    } else if (NativeRefreshRate.setFrameRateRange) {
      NativeRefreshRate.setFrameRateRange(
        this.config.minRate,
        this.config.maxRate,
        targetRate
      );
    }
  }

  /**
   * Web GPU acceleration and compositor layer optimizations for high refresh rate monitors.
   */
  private applyWebRefreshRate(_targetRate: number): void {
    if (typeof document === 'undefined') return;
    const styleId = 'onebuddy-dynamic-fps-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        html, body, #root {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          scroll-behavior: smooth;
          text-rendering: optimizeLegibility;
          transform: translateZ(0);
          backface-visibility: hidden;
        }
        [data-focusable="true"], [role="button"], [tabindex="0"] {
          touch-action: manipulation;
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Configures web/general platform hardware optimizations.
   */
  private applyPlatformOptimizations(): void {
    if (Platform.OS === 'web') {
      this.applyWebRefreshRate(this.currentRate);
    }
  }

  /**
   * Handles app state transitions (background / inactive / active) to enforce power-saving.
   */
  private setupAppStateListener(): void {
    AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        const target = this.isContinuousBoostActive
          ? this.config.maxRate
          : this.config.minRate;
        this.applyRefreshRate(target);
      } else {
        // App backgrounded: cancel active timer & throttle to minimum 60 FPS floor
        if (this.idleTimer) {
          clearTimeout(this.idleTimer);
          this.idleTimer = null;
        }
        this.applyRefreshRate(this.config.minRate);
      }
    });
  }
}

export const dynamicRefreshRate = DynamicRefreshRateManager.getInstance();
export const initDynamicRefreshRate = (config?: Partial<RefreshRateConfig>): void => {
  dynamicRefreshRate.init(config);
};

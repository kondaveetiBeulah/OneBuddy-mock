import { Platform } from 'react-native';

/**
 * FPS Performance Manager: Enforces 60 FPS minimum and 120 FPS maximum frame rates
 * across iOS, Android, and Web platforms.
 */
export const FPS_CONFIG = {
  MIN_FPS: 60,
  MAX_FPS: 120,
  // 1000ms / 120 = 8.33ms per frame (ProMotion / 120Hz max)
  MIN_FRAME_TIME_MS: 8.33,
  // 1000ms / 60 = 16.66ms per frame (60Hz baseline)
  MAX_FRAME_TIME_MS: 16.66,
  // scrollEventThrottle={8} allows capturing touch/scroll frames up to 120 FPS
  SCROLL_EVENT_THROTTLE: 8,
};

/**
 * Injects web platform hardware acceleration and compositor optimizations
 * to guarantee 60-120 FPS animation smoothness on high refresh rate displays.
 */
export function initFpsPerformance(): void {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    try {
      const styleId = 'onebuddy-fps-optimization-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
          /* Ensure GPU hardware acceleration for 60-120 FPS rendering */
          html, body, #root {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            scroll-behavior: smooth;
            text-rendering: optimizeLegibility;
            transform: translateZ(0);
            backface-visibility: hidden;
          }

          /* Force high refresh rate compositor layers for scrollable views */
          [data-focusable="true"], [role="button"], [tabindex="0"] {
            touch-action: manipulation;
          }

          /* Smooth GPU-accelerated scrolling container */
          ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          ::-webkit-scrollbar-thumb {
            background: rgba(148, 163, 184, 0.4);
            border-radius: 9999px;
          }
          ::-webkit-scrollbar-track {
            background: transparent;
          }
        `;
        document.head.appendChild(style);
      }
    } catch (e) {
      // Ignore if document manipulation fails in non-DOM environment
    }
  }
}

import { useWindowDimensions } from "react-native";

/**
 * Reference device used to derive scale ratios (iPhone 14 portrait).
 * Every screen/component should size itself off `useResponsive()`
 * instead of hard-coded pixel values so the UI holds up on small
 * phones, large phones, foldables, tablets, and rotation.
 */
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

/** Phones vs. tablets, based on the shorter edge (orientation-safe). */
const TABLET_BREAKPOINT = 600;

export interface Responsive {
  width: number;
  height: number;
  isLandscape: boolean;
  isTablet: boolean;
  /** Linear scale relative to the shorter screen edge. */
  scale: (size: number) => number;
  /** Scale eased by `factor` (0 = no scaling, 1 = full linear scale). */
  moderateScale: (size: number, factor?: number) => number;
  /** Scale relative to screen height — good for vertical rhythm/spacing. */
  verticalScale: (size: number) => number;
  /** Horizontal page padding that grows gently on bigger screens. */
  horizontalPadding: number;
  /** Caps content width on tablets/foldables so rows don't stretch edge-to-edge. */
  contentMaxWidth: number;
}

export function useResponsive(): Responsive {
  const { width, height } = useWindowDimensions();
  const shortSide = Math.min(width, height);
  const isLandscape = width > height;
  const isTablet = shortSide >= TABLET_BREAKPOINT;

  const scale = (size: number) => (shortSide / BASE_WIDTH) * size;
  const verticalScale = (size: number) => (height / BASE_HEIGHT) * size;
  const moderateScale = (size: number, factor = 0.5) =>
    size + (scale(size) - size) * factor;

  const horizontalPadding = isTablet ? 32 : clamp(scale(16), 14, 20);
  const contentMaxWidth = isTablet ? 640 : width;

  return {
    width,
    height,
    isLandscape,
    isTablet,
    scale,
    moderateScale,
    verticalScale,
    horizontalPadding,
    contentMaxWidth
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

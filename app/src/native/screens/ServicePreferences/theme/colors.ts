/**
 * theme/colors.ts
 * -----------------------------------------------------------------------
 * Design tokens and helpers for Service Preferences.
 * -----------------------------------------------------------------------
 */

export const colors = {
  lavenderDeep: '#2E2440',
  lavender: '#5A4A73',
  lavenderLight: '#9C8AC4',
  gold: '#C9A227',
  goldLight: '#E8C767',
  bgDeep: '#0D0912',
  ink: '#15121F',
  mist: '#EDEAF6',
  mistDim: '#B8AFCB',

  // Service accent colors
  food: '#E8734A',
  grocery: '#4C9A6A',
  ride: '#3E7CB1',
  home: '#8B6CC9',
  care: '#C9557A',

  danger: '#F08A8A',

  // Surfaces
  cardSurface: 'rgba(255,255,255,0.035)',
  cardBorder: 'rgba(237,234,246,0.09)',
  rowBorder: 'rgba(237,234,246,0.07)',
  rowHover: 'rgba(255,255,255,0.05)',
  iconTileDefault: 'rgba(156,138,196,0.18)',
  overlayScrim: 'rgba(6,4,10,0.72)',
  sheetBorderTop: 'rgba(237,234,246,0.16)',
  pillBg: 'rgba(255,255,255,0.05)',
  pillBorder: 'rgba(237,234,246,0.10)',
  switchTrackOff: 'rgba(255,255,255,0.2)',
} as const;

export const radii = {
  sheet: 28,
  card: 18,
  row: 12,
  pill: 999,
  icon: 12,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
};

/**
 * Design tokens for Notifications screen, with dynamic dark and light theme support.
 */
import type { CategoryId } from './types';
import { useAppTheme } from '@/theme/ThemeContext';

export const baseColors = {
  lavenderDeep: '#2E2440',
  lavender: '#5A4A73',
  lavenderLight: '#9C8AC4',
  gold: '#5FA300',
  goldLight: '#7EC400',
  food: '#E8734A',
  foodLt: '#F5A67D',
  grocery: '#4C9A6A',
  groceryLt: '#7CC79A',
  ride: '#3E7CB1',
  rideLt: '#6FA8D9',
  home: '#8B6CC9',
  homeLt: '#B39EE0',
  medical: '#C9557A',
  medicalLt: '#E8859F',
} as const;

export const darkColors = {
  ...baseColors,
  bgDeep: '#0D0912',
  ink: '#15121F',
  mist: '#EDEAF6',
  mistDim: '#B8AFCB',
  glassBg: 'rgba(255,255,255,0.05)',
  glassBorder: 'rgba(255,255,255,0.1)',
  rowDivider: 'rgba(255,255,255,0.06)',
  overlay: 'rgba(6,4,10,0.5)',
  headerBg: 'rgba(13,9,18,0.9)',
};

export const lightColors = {
  ...baseColors,
  bgDeep: '#F8FAF5',
  ink: '#FFFFFF',
  mist: '#17240A',
  mistDim: 'rgba(23,36,10,0.60)',
  glassBg: '#FFFFFF',
  glassBorder: 'rgba(23,36,10,0.09)',
  rowDivider: 'rgba(23,36,10,0.07)',
  overlay: 'rgba(0,0,0,0.4)',
  headerBg: '#FFFFFF',
};

export const colors = darkColors;

export function useNotifColors() {
  const { scheme } = useAppTheme();
  const isDark = scheme === 'dark';
  return isDark ? darkColors : lightColors;
}

export const CATEGORY_GRADIENTS: Record<CategoryId, [string, string]> = {
  food: [baseColors.foodLt, baseColors.food],
  groceries: [baseColors.groceryLt, baseColors.grocery],
  rides: [baseColors.rideLt, baseColors.ride],
  health: [baseColors.medicalLt, baseColors.medical],
  homeServices: [baseColors.homeLt, baseColors.home],
};

export const spacing = { sm: 8, md: 14, lg: 20, xl: 28 } as const;
export const radius = { pill: 999, card: 20, sm: 12 } as const;

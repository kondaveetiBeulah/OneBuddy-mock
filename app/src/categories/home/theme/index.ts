import { useContext, createContext } from 'react';
import { useAppTheme } from '@/theme/ThemeContext';

export const lightColors = {
  // Primary OneBuddy Brand Green
  primary: '#5CB811',
  primaryDark: '#448A0A',
  primaryLight: '#EDF9E5',
  primaryMuted: '#84D145',

  secondary: '#0284C7',
  secondaryLight: '#E0F2FE',

  accent: '#F59E0B',
  accentLight: '#FEF3C7',

  success: '#16A34A',
  successLight: '#DCFCE7',
  
  danger: '#EF4444',
  dangerLight: '#FEE2E2',

  warning: '#F97316',
  warningLight: '#FFEDD5',

  // Neutrals & Surface
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSubtle: '#F4F7F4',
  surfaceAlt: '#F8FAFC',

  border: '#E2E8F0',
  borderDark: '#CBD5E1',

  // Typography
  textPrimary: '#182017',
  textSecondary: '#526450',
  textMuted: '#8E9E8C',
  textInverse: '#FFFFFF',

  // Specific UI Elements
  cardOverlay: 'rgba(24, 32, 23, 0.65)',
  backdrop: 'rgba(24, 32, 23, 0.45)',
  starFilled: '#FBBF24',
  starEmpty: '#E2E8F0',

  // Category Theme Colors
  categoryHouseCleaning: '#5CB811',
  categoryPlumbing: '#0284C7',
  categoryAc: '#0D9488',
  categoryWater: '#2563EB',
};

export const darkColors = {
  // Primary OneBuddy Brand Green in Dark Mode
  primary: '#7EC400',
  primaryDark: '#5FA300',
  primaryLight: '#1E2B16',
  primaryMuted: '#8CCB2E',

  secondary: '#38BDF8',
  secondaryLight: '#0C4A6E',

  accent: '#FBBF24',
  accentLight: '#451A03',

  success: '#22C55E',
  successLight: '#14532D',
  
  danger: '#F87171',
  dangerLight: '#450A0A',

  warning: '#FB923C',
  warningLight: '#431407',

  // Neutrals & Surface for Dark Mode
  background: '#121214',
  surface: '#1D1E22',
  surfaceSubtle: '#24262B',
  surfaceAlt: '#18191D',

  border: 'rgba(255, 255, 255, 0.10)',
  borderDark: 'rgba(255, 255, 255, 0.18)',

  // Typography for Dark Mode
  textPrimary: '#F1F1EC',
  textSecondary: '#9BA08F',
  textMuted: '#6B7266',
  textInverse: '#121214',

  // Specific UI Elements
  cardOverlay: 'rgba(0, 0, 0, 0.75)',
  backdrop: 'rgba(0, 0, 0, 0.65)',
  starFilled: '#FBBF24',
  starEmpty: '#334155',

  // Category Theme Colors
  categoryHouseCleaning: '#7EC400',
  categoryPlumbing: '#38BDF8',
  categoryAc: '#2DD4BF',
  categoryWater: '#60A5FA',
};

// Mutable active color tokens initialized with light theme
export const COLORS = { ...lightColors };

/**
 * Hook to reactively consume active home theme colors
 */
export function useHomeTheme() {
  try {
    const { scheme } = useAppTheme();
    const isDark = scheme === 'dark';
    const activeColors = isDark ? darkColors : lightColors;
    return { isDark, scheme, colors: activeColors };
  } catch {
    return { isDark: false, scheme: 'light' as const, colors: lightColors };
  }
}

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADII = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  float: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
};

import { useAppTheme } from '@/theme/ThemeContext';

export const Colors = {
  primary: '#5CB82A', // OneBuddy Vibrant Lime/Leaf Green
  primaryDark: '#449619',
  primaryLight: '#EBF7E5',
  primaryMuted: '#E2F4D9',
  primaryGradientStart: '#68C633',
  primaryGradientEnd: '#4B9F1E',

  // Secondary & Accents
  accentBlue: '#0284C7',
  accentBlueLight: '#E0F2FE',
  accentPurple: '#7C3AED',
  accentPurpleLight: '#F3E8FF',
  accentAmber: '#F59E0B',
  accentAmberLight: '#FEF3C7',
  accentRose: '#E11D48',
  accentRoseLight: '#FFE4E6',

  // Neutrals & Backgrounds
  background: '#F7FAF7',
  surface: '#FFFFFF',
  cardBackground: '#FFFFFF',
  border: '#E6EBE6',
  borderSubtle: '#F0F4F0',
  inputBackground: '#F4F7F4',

  // Typography
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',
  textOnPrimary: '#FFFFFF',

  // Status & Feedback
  success: '#16A34A',
  successLight: '#DCFCE7',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  error: '#DC2626',
  errorLight: '#FEE2E2',

  shadowColor: '#1E293B',
};

export const OC_Colors = Colors;

export function useOCColors() {
  const { scheme } = useAppTheme();
  const isDark = scheme === 'dark';
  return {
    ...Colors,
    background: isDark ? '#121214' : Colors.background,
    surface: isDark ? '#1E2025' : Colors.surface,
    cardBackground: isDark ? '#1E2025' : Colors.cardBackground,
    border: isDark ? '#3A3F4B' : Colors.border,
    borderSubtle: isDark ? '#2A2D35' : Colors.borderSubtle,
    inputBackground: isDark ? '#2A2D35' : Colors.inputBackground,
    textPrimary: isDark ? '#F1F5F9' : Colors.textPrimary,
    textSecondary: isDark ? '#CBD5E1' : Colors.textSecondary,
    textMuted: isDark ? '#94A3B8' : Colors.textMuted,
    isDark,
  };
}

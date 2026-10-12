import { useAppTheme } from '@/theme/ThemeContext';

export const COLORS = {
  // Official OneBuddy Lime Green Palette
  green: '#62B818',
  greenDark: '#468510',
  greenLight: '#EEF8E6',
  greenPale: '#F6FAF2',
  greenForest: '#2D580B',
  greenBorder: '#D5EDB9',

  // Category and UI tokens
  blue: '#62B818',
  blueLight: '#EEF8E6',
  amber: '#E0A62F',
  amberLight: '#FBF3E1',
  ink: '#1A2416',
  inkSoft: '#596657',
  line: '#E5EBDD',
  bg: '#F8FAF6',
  card: '#FFFFFF',
  purple: '#8B3FC9',
  purpleLight: '#F3E8FB',
} as const;

export function useMedColors() {
  const { scheme } = useAppTheme();
  const isDark = scheme === 'dark';
  return {
    ...COLORS,
    bg: isDark ? '#121214' : COLORS.bg,
    card: isDark ? '#1D1E22' : COLORS.card,
    surface: isDark ? '#1D1E22' : '#FFFFFF',
    surface2: isDark ? '#24262B' : '#F1F5F9',
    ink: isDark ? '#F1F1EC' : COLORS.ink,
    inkSoft: isDark ? '#CBD5E1' : COLORS.inkSoft,
    inkMuted: isDark ? '#94A3B8' : '#64748B',
    line: isDark ? 'rgba(255, 255, 255, 0.08)' : COLORS.line,
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : COLORS.line,
    greenLight: isDark ? 'rgba(98, 184, 24, 0.18)' : COLORS.greenLight,
    greenPale: isDark ? 'rgba(98, 184, 24, 0.12)' : COLORS.greenPale,
    greenBorder: isDark ? 'rgba(98, 184, 24, 0.3)' : COLORS.greenBorder,
    greenDark: isDark ? '#86EFAC' : COLORS.greenDark,
    isDark,
  };
}

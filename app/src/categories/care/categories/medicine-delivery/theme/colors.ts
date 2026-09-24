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
    bg: isDark ? '#0F172A' : COLORS.bg,
    card: isDark ? '#1E293B' : COLORS.card,
    surface: isDark ? '#1E293B' : '#FFFFFF',
    surface2: isDark ? '#334155' : '#F1F5F9',
    ink: isDark ? '#FFFFFF' : COLORS.ink,
    inkSoft: isDark ? '#CBD5E1' : COLORS.inkSoft,
    inkMuted: isDark ? '#94A3B8' : '#64748B',
    line: isDark ? '#334155' : COLORS.line,
    border: isDark ? '#334155' : COLORS.line,
    greenLight: isDark ? '#143818' : COLORS.greenLight,
    greenPale: isDark ? '#0F2612' : COLORS.greenPale,
    greenBorder: isDark ? '#1D5A22' : COLORS.greenBorder,
    greenDark: isDark ? '#86EFAC' : COLORS.greenDark,
    isDark,
  };
}

/** OneBuddy's signature fresh green & clean palette with full light & dark mode */

export const lightColors = {
  // OneBuddy Signature Greens
  primary: '#54B713',
  primaryDark: '#3F8A0E',
  primaryLight: '#EAF7E4',
  primaryMuted: '#F2FAF0',
  green: '#54B713',
  greenDark: '#3F8A0E',
  greenLight: '#EAF7E4',

  // Surfaces & Backgrounds
  bgDeep: '#F6FAF5',
  card: '#FFFFFF',
  cardSubtle: '#F8FCF7',
  sheet: '#FFFFFF',
  line: '#E3ECE1',
  lineSubtle: '#EDF4EC',

  // Typography & Inks
  ink: '#182017',
  inkSecondary: '#4B5749',
  mist: '#182017',
  mistDim: '#6B7869',

  // Accents & Statuses
  warningAmber: '#FAB818',
  warningAmberLight: '#FEF3C7',
  warningAmberDark: '#B45309',

  cashGreen: '#54B713',
  cashGreenLight: '#EAF7E4',
  cashGreenDark: '#3F8A0E',

  uberBlue: '#1F65EC',
  uberBlueDark: '#0F3DA6',
  uberBlueTag: '#1B4793',

  food: '#FF602E',
  foodLight: '#FF7B4D',
};

export const darkColors = {
  // OneBuddy Signature Greens (vibrant contrast for dark mode)
  primary: '#54B713',
  primaryDark: '#66D21E',
  primaryLight: 'rgba(84, 183, 19, 0.20)',
  primaryMuted: 'rgba(84, 183, 19, 0.12)',
  green: '#54B713',
  greenDark: '#66D21E',
  greenLight: 'rgba(84, 183, 19, 0.20)',

  // Surfaces & Backgrounds (consistent with food, groceries, & design/tokens.ts)
  bgDeep: '#121214',
  card: '#1D1E22',
  cardSubtle: '#24262B',
  sheet: '#1D1E22',
  line: 'rgba(255, 255, 255, 0.08)',
  lineSubtle: 'rgba(255, 255, 255, 0.05)',

  // Typography & Inks
  ink: '#F1F1EC',
  inkSecondary: '#9BA08F',
  mist: '#F1F1EC',
  mistDim: '#9BA08F',

  // Accents & Statuses
  warningAmber: '#FAB818',
  warningAmberLight: 'rgba(250, 184, 24, 0.18)',
  warningAmberDark: '#FDE68A',

  cashGreen: '#54B713',
  cashGreenLight: 'rgba(84, 183, 19, 0.18)',
  cashGreenDark: '#66D21E',

  uberBlue: '#3B82F6',
  uberBlueDark: '#60A5FA',
  uberBlueTag: '#2563EB',

  food: '#FF602E',
  foodLight: '#FF7B4D',
};

export type RideColors = typeof lightColors;

export const COLORS: RideColors = { ...lightColors };

// ── Theme Hook ─────────────────────────────────────────────────────────────
export function useRideTheme() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useAppTheme } = require('../../theme/ThemeContext');
    const { scheme } = useAppTheme();
    const isDark = scheme === 'dark';
    return {
      scheme: scheme as 'light' | 'dark',
      isDark,
      colors: isDark ? darkColors : lightColors,
    };
  } catch {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { isCategoryDark } = require('../../theme/installCategoryTheme');
      const isDark = isCategoryDark();
      return {
        scheme: (isDark ? 'dark' : 'light') as 'light' | 'dark',
        isDark,
        colors: isDark ? darkColors : lightColors,
      };
    } catch {
      return {
        scheme: 'light' as const,
        isDark: false,
        colors: lightColors,
      };
    }
  }
}

export const RADIUS = { sm: 8, md: 12, lg: 16, xl: 20, sheet: 26, pill: 100 } as const;
export const GUTTER = 16;

export const FONTS: {
  display?: string;
  body?: string;
  regular?: string;
  medium?: string;
  semiBold?: string;
  bold?: string;
} = {
  display: undefined,
  body: undefined,
  regular: undefined,
  medium: undefined,
  semiBold: undefined,
  bold: undefined,
};

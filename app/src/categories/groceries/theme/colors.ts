export const lightColors = {
  // ── OneBuddy Brand Greens ──
  primary: '#5A8A2E',
  primaryDark: '#3D6B1E',
  primaryLight: '#EDF4E3',
  primaryMedium: '#A3C97A',
  primaryGradientStart: '#6B9B37',
  primaryGradientEnd: '#8BC34A',

  // ── Secondary / Accent ──
  secondary: '#FF9800',
  secondaryDark: '#F57C00',
  secondaryLight: '#FFF3E0',
  accent: '#5A8A2E',

  // ── Backgrounds ──
  background: '#F4F7EE',
  cardBackground: '#FFFFFF',
  white: '#FFFFFF',
  black: '#111111',

  // ── Text ──
  textPrimary: '#1A1A1A',
  textSecondary: '#5A6370',
  textMuted: '#8E9AAB',
  text: '#1A1A1A',
  subtext: '#6B7280',

  // ── Borders ──
  border: '#E0E6D6',
  borderLight: '#EBF0E2',

  // ── Status ──
  danger: '#E53935',
  dangerLight: '#FFEBEE',
  success: '#5A8A2E',
  successLight: '#EDF4E3',
  warning: '#FB8C00',
  warningLight: '#FFF3E0',
  rating: '#FFB300',

  // ── Utility ──
  shadow: 'rgba(0, 0, 0, 0.04)',
  overlay: 'rgba(0, 0, 0, 0.35)',
  bg: '#F4F7EE',
  cardBg: '#FFFFFF',
  divider: '#E5E7EB',
  orange: '#F97316',
  green: '#5A8A2E',
  inputBg: '#F9FBF5',
  photoIcon: '#9CA3AF',
  photoBoxBorder: '#D1D5DB',
  orderThumbBg: '#F3F4F6',
};

export const darkColors = {
  // ── OneBuddy Brand Greens ──
  primary: '#5FA300',
  primaryDark: '#8CCB2E',
  primaryLight: 'rgba(95, 163, 0, 0.2)',
  primaryMedium: '#7EC400',
  primaryGradientStart: '#5FA300',
  primaryGradientEnd: '#7EC400',

  // ── Secondary / Accent ──
  secondary: '#FF9800',
  secondaryDark: '#FFA726',
  secondaryLight: 'rgba(255, 152, 0, 0.2)',
  accent: '#5FA300',

  // ── Backgrounds ──
  background: '#121214',
  cardBackground: '#1D1E22',
  white: '#FFFFFF',
  black: '#FFFFFF',

  // ── Text ──
  textPrimary: '#F1F1EC',
  textSecondary: '#9BA08F',
  textMuted: '#6B7266',
  text: '#F1F1EC',
  subtext: '#9BA08F',

  // ── Borders ──
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.06)',

  // ── Status ──
  danger: '#EF4444',
  dangerLight: 'rgba(239, 68, 68, 0.2)',
  success: '#5FA300',
  successLight: 'rgba(95, 163, 0, 0.2)',
  warning: '#FB8C00',
  warningLight: 'rgba(251, 140, 0, 0.2)',
  rating: '#FFB300',

  // ── Utility ──
  shadow: 'rgba(0, 0, 0, 0.2)',
  overlay: 'rgba(0, 0, 0, 0.6)',
  bg: '#121214',
  cardBg: '#1D1E22',
  divider: 'rgba(255, 255, 255, 0.08)',
  orange: '#F97316',
  green: '#5FA300',
  inputBg: '#24262B',
  photoIcon: '#9BA08F',
  photoBoxBorder: 'rgba(255, 255, 255, 0.12)',
  orderThumbBg: '#24262B',
};

export const colors = { ...lightColors };

// ── Theme Hook ─────────────────────────────────────────────────────────────
// Import lazily to avoid circular deps; hook is tree-shaken if unused.
// eslint-disable-next-line @typescript-eslint/no-var-requires
export function useGroceryColors() {
  // useAppTheme() is always available because GroceriesHost is a child of
  // the main app's ThemeProvider. React context crosses NavigationIndependentTree.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useAppTheme } = require('@/theme/ThemeContext');
  const { scheme } = useAppTheme();
  return scheme === 'dark' ? darkColors : lightColors;
}

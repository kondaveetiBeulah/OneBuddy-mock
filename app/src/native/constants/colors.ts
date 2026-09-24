import { useAppTheme } from '@/theme/ThemeContext';

export const DARK_COLORS = {
  bg: '#121214',
  bgAlt: '#1A1B1E',
  card: '#1D1E22',
  cardAlt: '#24262B',
  border: 'rgba(255,255,255,0.08)',
  accent: '#5FA300',
  accentDeep: '#4C8F2C',
  accentLight: '#7EC400',
  white: '#FFFFFF',
  gray: '#9BA08F',
  grayDim: '#6B7266',
  danger: '#EF4444',
};

export const LIGHT_COLORS = {
  bg: '#F8FAF5',
  bgAlt: '#FFFFFF',
  card: '#FFFFFF',
  cardAlt: '#F0F4E8',
  border: 'rgba(0,0,0,0.08)',
  accent: '#5FA300',
  accentDeep: '#4C8F2C',
  accentLight: '#4C8F2C',
  white: '#17240A',
  gray: 'rgba(23,36,10,0.65)',
  grayDim: 'rgba(23,36,10,0.45)',
  danger: '#EF4444',
};

export function getColors(scheme?: 'light' | 'dark') {
  if (scheme === 'light') return LIGHT_COLORS;
  if (scheme === 'dark') return DARK_COLORS;
  return DARK_COLORS;
}

export const COLORS = DARK_COLORS;

export function useNativeColors() {
  const { scheme } = useAppTheme();
  return scheme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
}

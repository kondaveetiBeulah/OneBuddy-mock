export const lightColors = {
  bgDeep: '#F3F4F6',
  lavenderDeep: '#3F6212',
  lavender: '#4D7C0F',
  lavenderLight: '#9C8AC4',
  gold: '#65A30D',
  goldLight: '#E8C767',
  ink: '#FFFFFF',
  inkDark: '#0A0710',
  mist: '#111827',
  mistDim: '#6B7280',

  food: '#E8734A',
  foodLt: '#F5A67D',
  foodDk: '#B94E29',

  grocery: '#4C9A6A',
  groceryLt: '#7CC79A',
  groceryDk: '#2F6B45',

  ride: '#3E7CB1',
  rideLt: '#6FA8D9',
  rideDk: '#24587F',

  home: '#8B6CC9',
  homeLt: '#B39EE0',
  homeDk: '#5F4494',

  medical: '#C9557A',
  medicalLt: '#E8859F',
  medicalDk: '#96334F',

  cardBorders: 'rgba(237, 234, 246, 0.12)',
  cardBgGlass: 'rgba(30, 23, 44, 0.85)',
};

export const darkColors = {
  ...lightColors,
  bgDeep: '#121214',
  ink: '#1D1E22',
  inkDark: '#121214',
  mist: '#F1F1EC',
  mistDim: '#9BA08F',
  cardBorders: 'rgba(255, 255, 255, 0.08)',
  cardBgGlass: 'rgba(29, 30, 34, 0.85)',
};

export const COLORS = { ...lightColors };

// ── Theme Hook ─────────────────────────────────────────────────────────────
export function useFoodMainColors() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useAppTheme } = require('@/theme/ThemeContext');
  const { scheme } = useAppTheme();
  return scheme === 'dark' ? darkColors : lightColors;
}

export const RESTAURANT_GRADIENTS = {
  krishnnaKitchen: {
    colors: ['#173a2b', '#0a1812'] as [string, string],
    border: 'rgba(76, 154, 106, 0.4)',
    accent: '#4C9A6A',
  },
  blueSea: {
    colors: ['#14345c', '#091526'] as [string, string],
    border: 'rgba(62, 124, 177, 0.4)',
    accent: '#3E7CB1',
  },
  pizzaHouse: {
    colors: ['#4e221f', '#1b0907'] as [string, string],
    border: 'rgba(232, 115, 74, 0.4)',
    accent: '#E8734A',
  },
  paradise: {
    colors: ['#3a1d4f', '#150a1e'] as [string, string],
    border: 'rgba(139, 108, 201, 0.4)',
    accent: '#8B6CC9',
  },
  bawarchi: {
    colors: ['#4a360d', '#1a1203'] as [string, string],
    border: 'rgba(201, 162, 39, 0.4)',
    accent: '#65A30D',
  },
  spiceRoute: {
    colors: ['#44162e', '#190610'] as [string, string],
    border: 'rgba(201, 85, 122, 0.4)',
    accent: '#C9557A',
  },
};

/** OneBuddy's signature fresh green & clean light palette */
export const lightColors = {
  primary: '#54B713',
  primaryDark: '#3F8A0E',
  primaryLight: '#EAF7E4',
  primaryMuted: '#F2FAF0',
  green: '#54B713',
  greenLight: '#EAF7E4',
  lavenderDeep: '#3F8A0E',
  lavender: '#EAF7E4',
  lavenderLight: '#54B713',
  gold: '#54B713',
  goldLight: '#54B713',
  bgDeep: '#F6FAF5',
  ink: '#182017',
  sheet: '#FFFFFF',
  mist: '#182017',
  mistDim: '#6B7869',
  food: '#FF602E',
  foodLight: '#FF7B4D',
  line: '#E3ECE1',
  card: '#FFFFFF',
  cardSubtle: '#F8FCF7',
};

export const darkColors = {
  primary: '#54B713',
  primaryDark: '#3F8A0E',
  primaryLight: 'rgba(84, 183, 19, 0.2)',
  primaryMuted: '#000000',
  green: '#54B713',
  greenLight: 'rgba(84, 183, 19, 0.2)',
  lavenderDeep: '#3F8A0E',
  lavender: '#000000',
  lavenderLight: '#54B713',
  gold: '#54B713',
  goldLight: '#54B713',
  bgDeep: '#000000',
  ink: '#FFFFFF',
  sheet: '#000000',
  mist: '#FFFFFF',
  mistDim: '#E5E7EB',
  food: '#FF602E',
  foodLight: '#FF7B4D',
  line: 'rgba(255, 255, 255, 0.15)',
  card: '#000000',
  cardSubtle: '#000000',
};

export const COLORS = { ...lightColors };

export const RADIUS = { sm: 12, md: 16, lg: 20, xl: 24, sheet: 28 } as const;
export const GUTTER = 16;

/**
 * The screen is designed against Space Grotesk for display and Inter for body.
 * Load them with expo-font (or drop them in android/app/src/main/assets/fonts
 * and ios Info.plist) and set these to the loaded family names; until then
 * `undefined` falls back to the platform default, which still reads fine.
 */
export const FONTS: { display?: string; body?: string } = {
  display: undefined,
  body: undefined,
};

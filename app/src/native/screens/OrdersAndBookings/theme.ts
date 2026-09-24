import { useAppTheme } from '@/theme/ThemeContext';
import type { Category, Filter, StatusKind } from './types';

// Per-tab active colors matching OneBuddy logo and brand category colors
export const TAB_ACTIVE_COLORS: Record<Filter, { bg: string; fg: string }> = {
  all: { bg: '#5FA300', fg: '#FFFFFF' },
  food: { bg: '#F07E27', fg: '#FFFFFF' },
  groceries: { bg: '#6DBE45', fg: '#FFFFFF' },
  rides: { bg: '#F2A81D', fg: '#17240A' },
  healthcare: { bg: '#3B9BE0', fg: '#FFFFFF' },
  homeservices: { bg: '#8E6FD1', fg: '#FFFFFF' },
};

// Per-category icon tint using OneBuddy brand palette
export const CATEGORY_TINT: Record<Category, { bg: string; fg: string }> = {
  food: { bg: 'rgba(240, 126, 39, 0.16)', fg: '#F07E27' },
  groceries: { bg: 'rgba(109, 190, 69, 0.16)', fg: '#6DBE45' },
  rides: { bg: 'rgba(242, 168, 29, 0.16)', fg: '#F2A81D' },
  healthcare: { bg: 'rgba(59, 155, 224, 0.16)', fg: '#3B9BE0' },
  homeservices: { bg: 'rgba(142, 111, 209, 0.16)', fg: '#8E6FD1' },
};

// Badge color per status kind using OneBuddy brand tokens. "done" is a
// neutral chip, so unlike ongoing/upcoming it has to flip with the theme —
// translucent white is invisible on a light card.
const DARK_BADGE_COLOR: Record<StatusKind, { bg: string; fg: string }> = {
  ongoing: { bg: 'rgba(95, 163, 0, 0.16)', fg: '#7EC400' },
  upcoming: { bg: 'rgba(109, 190, 69, 0.16)', fg: '#96D477' },
  done: { bg: 'rgba(255, 255, 255, 0.08)', fg: '#9BA08F' },
};

const LIGHT_BADGE_COLOR: Record<StatusKind, { bg: string; fg: string }> = {
  ongoing: { bg: 'rgba(95, 163, 0, 0.14)', fg: '#4C8F2C' },
  upcoming: { bg: 'rgba(109, 190, 69, 0.16)', fg: '#3E7A2A' },
  done: { bg: 'rgba(23, 36, 10, 0.06)', fg: 'rgba(23,36,10,0.65)' },
};

// Section label accent matching OneBuddy brand logo
export const SECTION_LABEL_COLOR = '#5FA300';

// Shared surface + text colors matching OneBuddy theme
const DARK_COLORS = {
  page: '#121214',
  screen: '#121214',
  card: '#1D1E22',
  chip: '#24262B',
  borderScreen: 'rgba(255, 255, 255, 0.08)',
  borderCard: 'rgba(255, 255, 255, 0.08)',
  borderAction: 'rgba(126, 196, 0, 0.35)',
  text: '#F1F1EC',
  textMuted: '#9BA08F',
  textFaint: '#6B7266',
  textChip: '#F1F1EC',
  textAction: '#7EC400',
};

const LIGHT_COLORS = {
  page: '#F8FAF5',
  screen: '#FFFFFF',
  card: '#FFFFFF',
  chip: '#F0F4E8',
  borderScreen: 'rgba(23, 36, 10, 0.09)',
  borderCard: 'rgba(23, 36, 10, 0.09)',
  borderAction: 'rgba(76, 143, 44, 0.35)',
  text: '#17240A',
  textMuted: 'rgba(23,36,10,0.65)',
  textFaint: 'rgba(23,36,10,0.45)',
  textChip: '#17240A',
  textAction: '#4C8F2C',
};

export type OrdersColors = typeof DARK_COLORS;

/** Live surface/text/border colors and the "done" badge, following the app's mood. */
export function useOrdersColors(): { colors: OrdersColors; badgeColor: Record<StatusKind, { bg: string; fg: string }> } {
  const { scheme } = useAppTheme();
  return scheme === 'dark'
    ? { colors: DARK_COLORS, badgeColor: DARK_BADGE_COLOR }
    : { colors: LIGHT_COLORS, badgeColor: LIGHT_BADGE_COLOR };
}

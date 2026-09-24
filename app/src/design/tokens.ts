/**
 * Design tokens ported verbatim from the old `src/styles/base.css` `:root`
 * block (and its `[data-theme="dark"]` override) so the native screens render
 * the same palette the WebView document did.
 *
 * `src/theme/colors.ts` already carries the settings-screen palette; this file
 * covers the tokens the dashboard/splash/sidebar needed that were only ever
 * expressed as CSS custom properties.
 */

export interface BrandScheme {
  /** --bg-deep */
  bgDeep: string;
  /** --mist: primary text */
  text: string;
  /** --mist-dim: secondary text */
  textDim: string;
  /** --surface-1 */
  surface1: string;
  /** --surface-2 */
  surface2: string;
  /** rgba(var(--ink-rgb), a) — overlay tint used for chips, borders, rows */
  ink: (alpha: number) => string;
  /** rgba(var(--bg-rgb), a) — page-bg-tinted translucent surfaces */
  bgTint: (alpha: number) => string;
  /** rgba(var(--shadow-rgb), a) */
  shadow: (alpha: number) => string;
}

const rgba = (rgb: string) => (alpha: number) => `rgba(${rgb},${alpha})`;

export const light: BrandScheme = {
  bgDeep: '#FFFFFF',
  text: '#1B1B1B',
  textDim: '#6B7266',
  surface1: '#FFFFFF',
  surface2: '#F4F7EE',
  ink: rgba('27,27,27'),
  bgTint: rgba('255,255,255'),
  shadow: rgba('30,45,10'),
};

export const dark: BrandScheme = {
  bgDeep: '#121214',
  text: '#F1F1EC',
  textDim: '#9BA08F',
  surface1: '#1D1E22',
  surface2: '#24262B',
  ink: rgba('255,255,255'),
  bgTint: rgba('18,18,20'),
  shadow: rgba('0,0,0'),
};

export const schemes = { light, dark } as const;

/** Brand greens — identical in both schemes. */
export const brand = {
  gold: '#5FA300',
  goldLight: '#7EC400',
  lavender: '#5FA300',
  lavenderLight: '#8CCB2E',
  lavenderDeep: '#E9F3D8',
  ink: '#17240A',
} as const;

export type ServiceId = 'food' | 'grocery' | 'ride' | 'home' | 'care';

export interface Service {
  id: ServiceId;
  /** Label as it appeared on the card front and the timeline. */
  label: string;
  emoji: string;
  blurb: string;
  base: string;
  light: string;
  dark: string;
  gradient: readonly [string, string];
  /** Angle this service's badge sits at on the splash orbit. */
  orbitAngle: number;
  /** Stagger used by the deploy transition, in ms. */
  orbitDelay: number;
}

/**
 * Order matches the old `.cards-grid` DOM order; `orbitAngle`/`orbitDelay`
 * match the `--a`/`--d` custom properties on each `.ob-slot`.
 */
export const SERVICES: readonly Service[] = [
  {
    id: 'food',
    label: 'Food',
    emoji: '🍔',
    blurb: 'Craving something?\nGet it delivered hot\nand fresh.',
    base: '#F07E27',
    light: '#F7A768',
    dark: '#C25A10',
    gradient: ['#F78536', '#E65D14'],
    orbitAngle: 126,
    orbitDelay: 240,
  },
  {
    id: 'grocery',
    label: 'Grocery',
    emoji: '🛒',
    blurb: 'Daily essentials and\nfresh produce at\nyour door.',
    base: '#6DBE45',
    light: '#96D477',
    dark: '#4C8F2C',
    gradient: ['#6EBE43', '#4CA125'],
    orbitAngle: 198,
    orbitDelay: 320,
  },
  {
    id: 'ride',
    label: 'Rides',
    emoji: '🚗',
    blurb: 'Book a ride instantly.\nSafe and reliable.',
    base: '#F2A81D',
    light: '#F7C359',
    dark: '#C07E00',
    gradient: ['#F9B127', '#E28E0B'],
    orbitAngle: 270,
    orbitDelay: 0,
  },
  {
    id: 'care',
    label: 'Care',
    emoji: '❤️',
    blurb: 'Medical needs,\npharmacy drops, &\nconsultations.',
    base: '#3B9BE0',
    light: '#79BFEE',
    dark: '#1F6FA8',
    gradient: ['#48A2E0', '#2572B8'],
    orbitAngle: 342,
    orbitDelay: 80,
  },
  {
    id: 'home',
    label: 'Home',
    emoji: '🔧',
    blurb: 'Professional services for cleaning, repair & more.',
    base: '#8E6FD1',
    light: '#B39EE0',
    dark: '#6A4CAF',
    gradient: ['#9B7ED8', '#7350B9'],
    orbitAngle: 54,
    orbitDelay: 160,
  },
] as const;

/**
 * The mark and the five service badges, lifted out of the old document's
 * inline base64 and written to `assets/brand/` as real files.
 */
export const BRAND_IMAGES = {
  mark: require('../../assets/brand/ob-mark.png'),
  badges: {
    food: require('../../assets/brand/badge-food.png'),
    grocery: require('../../assets/brand/badge-grocery.png'),
    ride: require('../../assets/brand/badge-ride.png'),
    home: require('../../assets/brand/badge-home.png'),
    care: require('../../assets/brand/badge-care.png'),
  } as Record<ServiceId, number>,
  cards: {
    food: require('../../assets/brand/card-food.jpg'),
    grocery: require('../../assets/brand/card-grocery.jpg'),
    ride: require('../../assets/brand/card-ride.jpg'),
    home: require('../../assets/brand/card-home.jpg'),
    care: require('../../assets/brand/card-care.jpg'),
  } as Record<ServiceId, number>,
  icons3d: {
    food: require('../../assets/brand/icon-food-3d.png'),
    grocery: require('../../assets/brand/icon-grocery-3d.png'),
    ride: require('../../assets/brand/icon-ride-3d.png'),
    home: require('../../assets/brand/icon-home-3d.png'),
    care: require('../../assets/brand/icon-care-3d.png'),
  } as Record<ServiceId, number>,
};

import { useAppTheme } from '@/theme/ThemeContext';

const darkColors = {
  background: "#121214",
  text: "#F1F1EC",
  subtext: "#9BA08F",
  border: "rgba(255, 255, 255, 0.08)",
  divider: "rgba(255, 255, 255, 0.06)",
  placeholder: "#6B7266",
  card: "#1D1E22",
  cardBorder: "rgba(255, 255, 255, 0.08)",

  // OneBuddy brand logo accent (green / gold)
  orange: "#5FA300",
  orangeLight: "rgba(126, 196, 0, 0.16)",
  gold: "#5FA300",
  goldLight: "rgba(126, 196, 0, 0.16)",
  goldMuted: "#7EC400",

  blue: "#3B9BE0",
  blueLight: "rgba(59, 155, 224, 0.16)",
  green: "#6DBE45",
  chatBg: "#121214",
  online: "#6DBE45",
  readTick: "#7EC400",
  white: "#FFFFFF",

  // toggle track when off
  toggleOff: "rgba(255, 255, 255, 0.14)",

  // text/icons sitting on top of the primary green/gold accent
  onGoldMuted: "#17240A",
};

const lightColors = {
  background: "#F8FAF5",
  text: "#17240A",
  subtext: "rgba(23,36,10,0.65)",
  border: "rgba(23, 36, 10, 0.09)",
  divider: "rgba(23, 36, 10, 0.07)",
  placeholder: "rgba(23,36,10,0.45)",
  card: "#FFFFFF",
  cardBorder: "rgba(23, 36, 10, 0.09)",

  // OneBuddy brand logo accent (green / gold) — kept constant across themes
  orange: "#5FA300",
  orangeLight: "rgba(95, 163, 0, 0.14)",
  gold: "#5FA300",
  goldLight: "rgba(95, 163, 0, 0.14)",
  goldMuted: "#4C8F2C",

  blue: "#3B9BE0",
  blueLight: "rgba(59, 155, 224, 0.14)",
  green: "#4C9A6A",
  chatBg: "#F8FAF5",
  online: "#4C9A6A",
  readTick: "#4C8F2C",
  white: "#FFFFFF",

  // toggle track when off
  toggleOff: "rgba(23,36,10,0.18)",

  // text/icons sitting on top of the primary green/gold accent
  onGoldMuted: "#17240A",
};

export type HelpColors = typeof darkColors;

/** @deprecated dark-only fallback — use `useHelpColors()` so screens follow the app's mood. */
export const colors = darkColors;

export function useHelpColors(): HelpColors {
  const { scheme } = useAppTheme();
  return scheme === 'dark' ? darkColors : lightColors;
}

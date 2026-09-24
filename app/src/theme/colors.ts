import { ResolvedScheme } from "@/types";

export interface Palette {
  bg: string;
  sheetBg: string;
  cardBg: string;
  cardBgAlt: string;
  border: string;
  divider: string;
  iconBg: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  sectionLabel: string;
  accentStart: string;
  accentEnd: string;
  accentText: string;
  toggleOff: string;
  toggleThumb: string;
  danger: string;
  toastBg: string;
  toastText: string;
}

const dark: Palette = {
  bg: "#121214",
  sheetBg: "#1D1E22",
  cardBg: "rgba(255,255,255,0.04)",
  cardBgAlt: "rgba(255,255,255,0.07)",
  border: "rgba(255,255,255,0.08)",
  divider: "rgba(255,255,255,0.06)",
  iconBg: "rgba(95,163,0,0.12)",
  text: "#F1F1EC",
  textSecondary: "#9BA08F",
  textTertiary: "#6B7266",
  sectionLabel: "#8CCB2E",
  accentStart: "#5FA300",
  accentEnd: "#7EC400",
  accentText: "#FFFFFF",
  toggleOff: "rgba(255,255,255,0.14)",
  toggleThumb: "#FFFFFF",
  danger: "#EF4444",
  toastBg: "#1D1E22",
  toastText: "#FFFFFF"
};

const light: Palette = {
  bg: "#F4F7EE",
  sheetBg: "#FFFFFF",
  cardBg: "rgba(23,36,10,0.03)",
  cardBgAlt: "rgba(23,36,10,0.06)",
  border: "rgba(23,36,10,0.09)",
  divider: "rgba(23,36,10,0.07)",
  iconBg: "rgba(95,163,0,0.09)",
  text: "#17240A",
  textSecondary: "rgba(23,36,10,0.60)",
  textTertiary: "rgba(23,36,10,0.38)",
  sectionLabel: "#5FA300",
  accentStart: "#5FA300",
  accentEnd: "#4C8F2C",
  accentText: "#FFFFFF",
  toggleOff: "rgba(23,36,10,0.18)",
  toggleThumb: "#FFFFFF",
  danger: "#DC2626",
  toastBg: "#17240A",
  toastText: "#FFFFFF"
};

export const palettes: Record<ResolvedScheme, Palette> = { dark, light };

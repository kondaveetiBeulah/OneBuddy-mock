export const lightColors = {
  bg: "#F9FAFB",
  text: "#111827",
  subtext: "#4B5563",
  border: "#E5E7EB",
  divider: "#E5E7EB",
  cardBg: "#FFFFFF",
  inputBg: "#FFFFFF",
  orderThumbBg: "#F3F4F6",
  starActive: "#F0B429",
  starInactive: "#E5E7EB",
  green: "#4ADE80",
  orange: "#65A30D",
  photoBoxBorder: "#E5E7EB",
  photoIcon: "#9CA3AF",
};

export const darkColors = {
  bg: "#000000",
  text: "#FFFFFF",
  subtext: "#E5E7EB",
  border: "rgba(255, 255, 255, 0.15)",
  divider: "rgba(255, 255, 255, 0.15)",
  cardBg: "#000000",
  inputBg: "#000000",
  orderThumbBg: "#000000",
  starActive: "#F0B429",
  starInactive: "rgba(255, 255, 255, 0.25)",
  green: "#4ADE80",
  orange: "#65A30D",
  photoBoxBorder: "rgba(255, 255, 255, 0.18)",
  photoIcon: "#E5E7EB",
};

export const colors = { ...lightColors };

// ── Theme Hook ─────────────────────────────────────────────────────────────
export function useFoodColors() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useAppTheme } = require('@/theme/ThemeContext');
  const { scheme } = useAppTheme();
  return scheme === 'dark' ? darkColors : lightColors;
}

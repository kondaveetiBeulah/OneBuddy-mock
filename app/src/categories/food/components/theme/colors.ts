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
  bg: "#121214",
  text: "#F1F1EC",
  subtext: "#9BA08F",
  border: "rgba(255, 255, 255, 0.08)",
  divider: "rgba(255, 255, 255, 0.08)",
  cardBg: "#1D1E22",
  inputBg: "#24262B",
  orderThumbBg: "#24262B",
  starActive: "#F0B429",
  starInactive: "rgba(255, 255, 255, 0.15)",
  green: "#4ADE80",
  orange: "#65A30D",
  photoBoxBorder: "rgba(255, 255, 255, 0.12)",
  photoIcon: "#9BA08F",
};

export const colors = { ...lightColors };

// ── Theme Hook ─────────────────────────────────────────────────────────────
export function useFoodColors() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useAppTheme } = require('@/theme/ThemeContext');
  const { scheme } = useAppTheme();
  return scheme === 'dark' ? darkColors : lightColors;
}

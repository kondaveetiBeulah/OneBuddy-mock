import React, { createContext, useContext, useMemo } from "react";
import { useColorScheme } from "react-native";
import { palettes, Palette } from "./colors";
import { ResolvedScheme, ThemeSetting } from "@/types";
import { useSettings } from "@/context/SettingsContext";
import { applyCategoryTheme } from "./categoryThemeBridge";

interface ThemeContextValue {
  scheme: ResolvedScheme;
  colors: Palette;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function resolveScheme(
  themeSetting: ThemeSetting,
  systemScheme: ResolvedScheme
): ResolvedScheme {
  if (themeSetting === "system") return systemScheme;
  return themeSetting;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { state } = useSettings();
  const systemScheme = (useColorScheme() ?? "dark") as ResolvedScheme;

  const value = useMemo<ThemeContextValue>(() => {
    const scheme = resolveScheme(state.theme, systemScheme);
    applyCategoryTheme(scheme);
    return { scheme, colors: palettes[scheme] };
  }, [state.theme, systemScheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useAppTheme must be used within a ThemeProvider");
  return ctx;
}

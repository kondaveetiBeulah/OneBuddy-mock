export type ThemeSetting = "light" | "dark" | "system";
export type ResolvedScheme = "light" | "dark";

export type LanguageCode = "en" | "hi" | "te";

export interface LanguageOption {
  code: LanguageCode;
  nativeName: string;
  englishName: string | null;
}

export type LocationStatus =
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "unavailable"
  | "unsupported";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface SettingsState {
  theme: ThemeSetting;
  language: LanguageCode;
  locationAccess: boolean;
  shareUsageData: boolean;
  usageHistory: string[];
}

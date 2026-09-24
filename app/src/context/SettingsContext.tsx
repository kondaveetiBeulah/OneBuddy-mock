import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import {
  Coordinates,
  LanguageCode,
  LocationStatus,
  SettingsState,
  ThemeSetting
} from "@/types";
import { translations } from "@/i18n/translations";
import { useToast } from "./ToastContext";
import { useAuth } from "../firebase/context/AuthContext";
import { fetchCloudSettings, pushCloudSettings } from "../firebase/services/settingsService";

const STORAGE_KEYS = {
  THEME: "onebuddy:theme",
  LANGUAGE: "onebuddy:language",
  LOCATION_ACCESS: "onebuddy:locationAccess",
  SHARE_USAGE_DATA: "onebuddy:shareUsageData",
  USAGE_HISTORY: "onebuddy:usageHistory"
} as const;

const DEFAULT_STATE: SettingsState = {
  theme: "light",
  language: "en",
  locationAccess: false,
  shareUsageData: false,
  usageHistory: []
};

async function readJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

async function writeJSON(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable — fail silently, same as the original web version
  }
}

interface SettingsContextValue {
  state: SettingsState;
  hydrated: boolean;
  locationStatus: LocationStatus;
  currentPosition: Coordinates | null;
  setTheme: (value: ThemeSetting) => void;
  setLanguage: (code: LanguageCode) => void;
  /** Silent: no toast, no warning — only the toggle state and location behavior change. */
  toggleLocationAccess: () => void;
  toggleShareUsageData: () => void;
  trackServiceUsage: (category: string) => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export interface SettingsSeed {
  theme?: ThemeSetting;
  language?: LanguageCode;
  locationAccess?: boolean;
  shareUsageData?: boolean;
}

interface SettingsProviderProps {
  children: React.ReactNode;
  /**
   * Optional starting values. OneBuddy passes the values the WebView document is
   * already holding so the native screen opens in sync with the rest of the app
   * instead of showing its own defaults. Applied once, after hydration, without
   * firing the "Saved" toast.
   */
  seed?: SettingsSeed;
}

export function SettingsProvider({ children, seed }: SettingsProviderProps) {
  const { showToast } = useToast();
  const { user, enabled } = useAuth();
  const [state, setState] = useState<SettingsState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [currentPosition, setCurrentPosition] = useState<Coordinates | null>(null);

  // Mirrors `firstRender` in the original file: restoring persisted state on
  // launch must never trigger the "Saved" toast.
  const firstRenderRef = useRef(true);

  // Captured once so a re-render of the host never re-seeds mid-session.
  const seedRef = useRef(seed);

  useEffect(() => {
    (async () => {
      const [theme, language, locationAccess, shareUsageData, usageHistory] =
        await Promise.all([
          readJSON<ThemeSetting>(STORAGE_KEYS.THEME, DEFAULT_STATE.theme),
          readJSON<LanguageCode>(STORAGE_KEYS.LANGUAGE, DEFAULT_STATE.language),
          readJSON<boolean>(STORAGE_KEYS.LOCATION_ACCESS, DEFAULT_STATE.locationAccess),
          readJSON<boolean>(STORAGE_KEYS.SHARE_USAGE_DATA, DEFAULT_STATE.shareUsageData),
          readJSON<string[]>(STORAGE_KEYS.USAGE_HISTORY, DEFAULT_STATE.usageHistory)
        ]);

      const restored: SettingsState = {
        theme,
        language,
        locationAccess,
        shareUsageData,
        usageHistory
      };

      // The cloud copy (synced from any other device) wins over what was
      // locally cached, same as the local cache wins over hard-coded
      // defaults. Whatever the host hands in via `seed` still wins over both.
      const cloud = enabled && user ? await fetchCloudSettings(user.uid) : null;
      const merged: SettingsState = { ...restored, ...(cloud ?? {}), ...(seedRef.current ?? {}) };
      setState(merged);
      setHydrated(true);

      if (merged.theme !== restored.theme) void writeJSON(STORAGE_KEYS.THEME, merged.theme);
      if (merged.language !== restored.language) void writeJSON(STORAGE_KEYS.LANGUAGE, merged.language);
      if (merged.locationAccess !== restored.locationAccess) {
        void writeJSON(STORAGE_KEYS.LOCATION_ACCESS, merged.locationAccess);
      }
      if (merged.shareUsageData !== restored.shareUsageData) {
        void writeJSON(STORAGE_KEYS.SHARE_USAGE_DATA, merged.shareUsageData);
      }
      if (enabled && user) void pushCloudSettings(user.uid, merged);

      if (merged.locationAccess) {
        void requestLocation(); // silently refresh if previously granted
      }

      // Allow the toast to fire for any *user-driven* change from here on.
      firstRenderRef.current = false;
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, user]);

  const notifySaved = useCallback(() => {
    if (firstRenderRef.current) return; // don't show on initial load/restore
    const dict = translations[state.language] ?? translations.en;
    showToast(dict.settings_saved ?? translations.en.settings_saved);
  }, [showToast, state.language]);

  const syncCloud = useCallback(
    (next: SettingsState) => {
      if (enabled && user) void pushCloudSettings(user.uid, next);
    },
    [enabled, user]
  );

  const setTheme = useCallback(
    (value: ThemeSetting) => {
      setState((prev) => {
        const next = { ...prev, theme: value };
        syncCloud(next);
        return next;
      });
      void writeJSON(STORAGE_KEYS.THEME, value);
      notifySaved();
    },
    [notifySaved, syncCloud]
  );

  const setLanguage = useCallback(
    (code: LanguageCode) => {
      setState((prev) => {
        const next = { ...prev, language: code };
        syncCloud(next);
        return next;
      });
      void writeJSON(STORAGE_KEYS.LANGUAGE, code);
      notifySaved();
    },
    [notifySaved, syncCloud]
  );

  const requestLocation = useCallback(async () => {
    setLocationStatus("requesting");
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        setLocationStatus("denied");
        setCurrentPosition(null);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      setCurrentPosition({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      setLocationStatus("granted");
    } catch {
      setLocationStatus("unavailable");
      setCurrentPosition(null);
    }
  }, []);

  // Location Access is a plain, silent toggle: flipping it only changes
  // state.locationAccess and starts/stops using the device's location.
  // No toast, warning, or confirmation message is ever shown for it.
  const toggleLocationAccess = useCallback(() => {
    setState((prev) => {
      const next = !prev.locationAccess;
      void writeJSON(STORAGE_KEYS.LOCATION_ACCESS, next);
      if (next) {
        void requestLocation();
      } else {
        // Stop using location immediately; don't keep any stale coordinates
        // and don't re-request permission until the user opts in again.
        setCurrentPosition(null);
        setLocationStatus("idle");
      }
      const nextState = { ...prev, locationAccess: next };
      syncCloud(nextState);
      return nextState;
    });
  }, [requestLocation, syncCloud]);

  const toggleShareUsageData = useCallback(() => {
    setState((prev) => {
      const next = !prev.shareUsageData;
      void writeJSON(STORAGE_KEYS.SHARE_USAGE_DATA, next);
      const nextState = { ...prev, shareUsageData: next };
      syncCloud(nextState);
      return nextState;
    });
    notifySaved();
    // While this is off, trackServiceUsage() below is a strict no-op,
    // so no further history is recorded until the user re-enables it.
  }, [notifySaved, syncCloud]);

  const trackServiceUsage = useCallback(
    (category: string) => {
      setState((prev) => {
        if (!prev.shareUsageData) return prev;
        const history = [...prev.usageHistory, category].slice(-20);
        void writeJSON(STORAGE_KEYS.USAGE_HISTORY, history);
        return { ...prev, usageHistory: history };
      });
    },
    []
  );

  return (
    <SettingsContext.Provider
      value={{
        state,
        hydrated,
        locationStatus,
        currentPosition,
        setTheme,
        setLanguage,
        toggleLocationAccess,
        toggleShareUsageData,
        trackServiceUsage
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within a SettingsProvider");
  return ctx;
}

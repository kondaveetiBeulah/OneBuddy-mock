/**
 * context/ServicePreferencesContext.tsx
 * -----------------------------------------------------------------------
 * Single source of truth for the Service Preferences feature.
 * -----------------------------------------------------------------------
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { DEFAULT_MODE_BY_SERVICE, SERVICE_CATALOG } from '../constants/serviceCatalog';
import {
  DeliveryMode,
  GlobalTogglesState,
  ServiceKey,
  ServicePreferencesContextValue,
  ServicePreferencesState,
  ToastMessage,
} from '../types';

const STORAGE_KEY = '@onebuddy/service_preferences';

const DEFAULT_STATE: ServicePreferencesState = {
  services: SERVICE_CATALOG.reduce((acc, service) => {
    acc[service.key] = {
      mode: DEFAULT_MODE_BY_SERVICE[service.key],
      enabled: true,
    };
    return acc;
  }, {} as ServicePreferencesState['services']),
  globalToggles: {
    autoReorder: true,
    contactlessDrop: true,
    ecoBagsOnly: false,
  },
};

const ServicePreferencesContext = createContext<ServicePreferencesContextValue | undefined>(
  undefined,
);

function mergeWithDefaults(persisted: Partial<ServicePreferencesState> | null): ServicePreferencesState {
  if (!persisted) return DEFAULT_STATE;
  return {
    services: {
      ...DEFAULT_STATE.services,
      ...(persisted.services ?? {}),
    },
    globalToggles: {
      ...DEFAULT_STATE.globalToggles,
      ...(persisted.globalToggles ?? {}),
    },
  };
}

export const ServicePreferencesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<ServicePreferencesState>(DEFAULT_STATE);
  const [isHydrated, setIsHydrated] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const toastIdRef = useRef(0);

  // Hydrate from disk on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = raw ? (JSON.parse(raw) as Partial<ServicePreferencesState>) : null;
        if (!cancelled) {
          setState(mergeWithDefaults(parsed));
        }
      } catch (err) {
        console.warn('[ServicePreferences] failed to hydrate from AsyncStorage:', err);
      } finally {
        if (!cancelled) setIsHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist to disk on state changes
  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch((err) => {
      console.warn('[ServicePreferences] failed to persist to AsyncStorage:', err);
    });
  }, [state, isHydrated]);

  const notify = useCallback((message: string) => {
    toastIdRef.current += 1;
    setToast({ id: toastIdRef.current, message });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  const setServiceMode = useCallback(
    (service: ServiceKey, mode: DeliveryMode) => {
      setState((prev) => ({
        ...prev,
        services: {
          ...prev.services,
          [service]: { ...prev.services[service], mode },
        },
      }));
      const meta = SERVICE_CATALOG.find((s) => s.key === service);
      notify(`${meta?.label ?? 'Service'} set to ${mode}`);
    },
    [notify],
  );

  const setServiceEnabled = useCallback(
    (service: ServiceKey, enabled: boolean) => {
      setState((prev) => ({
        ...prev,
        services: {
          ...prev.services,
          [service]: { ...prev.services[service], enabled },
        },
      }));
      const meta = SERVICE_CATALOG.find((s) => s.key === service);
      notify(`${meta?.label ?? 'Service'} turned ${enabled ? 'on' : 'off'}`);
    },
    [notify],
  );

  const setGlobalToggle = useCallback(
    (toggle: keyof GlobalTogglesState, value: boolean) => {
      setState((prev) => ({
        ...prev,
        globalToggles: { ...prev.globalToggles, [toggle]: value },
      }));
      const labels: Record<keyof GlobalTogglesState, string> = {
        autoReorder: 'Auto reorder',
        contactlessDrop: 'Contactless drop',
        ecoBagsOnly: 'Eco bags only',
      };
      notify(`${labels[toggle]} turned ${value ? 'on' : 'off'}`);
    },
    [notify],
  );

  const resetToDefaults = useCallback(() => {
    setState(DEFAULT_STATE);
    notify('Preferences reset to defaults');
  }, [notify]);

  const summaryLabel = useMemo(() => {
    const total = SERVICE_CATALOG.length;
    const on = SERVICE_CATALOG.filter((s) => state.services[s.key]?.enabled).length;
    if (on === total) return `All ${total} on`;
    if (on === 0) return 'None on';
    return `${on} of ${total} on`;
  }, [state.services]);

  const value: ServicePreferencesContextValue = {
    state,
    isHydrated,
    setServiceMode,
    setServiceEnabled,
    setGlobalToggle,
    resetToDefaults,
    summaryLabel,
    toast,
    dismissToast,
  };

  return (
    <ServicePreferencesContext.Provider value={value}>
      {children}
    </ServicePreferencesContext.Provider>
  );
};

export function useServicePreferences(): ServicePreferencesContextValue {
  const ctx = useContext(ServicePreferencesContext);
  if (!ctx) {
    throw new Error('useServicePreferences must be used within a ServicePreferencesProvider');
  }
  return ctx;
}

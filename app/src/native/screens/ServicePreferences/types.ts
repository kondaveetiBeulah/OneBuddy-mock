/**
 * types.ts
 * -----------------------------------------------------------------------
 * All shared type definitions for the "Service Preferences" feature.
 * -----------------------------------------------------------------------
 */

/** The five OneBuddy service categories shown on the Service Preferences screen. */
export type ServiceKey = 'food' | 'grocery' | 'rides' | 'homeServices' | 'care';

/** Every delivery / fulfilment mode that can appear across the five services. */
export type DeliveryMode = 'Express' | 'Scheduled' | 'Fast' | 'Economy' | 'Premium' | 'Priority';

/** Static, non-persisted metadata used purely to render a service row. */
export interface ServiceMeta {
  key: ServiceKey;
  label: string;
  subtitle: string;
  /** Emoji shown inside the rounded icon tile. */
  icon: string;
  /** Tint color for the icon tile background + accents. */
  color: string;
  /** The modes available for this specific service, in display order. */
  modes: DeliveryMode[];
}

/** The three global toggles that apply across every service. */
export interface GlobalTogglesState {
  autoReorder: boolean;
  contactlessDrop: boolean;
  ecoBagsOnly: boolean;
}

/** Per-service persisted state: which mode is selected + whether the service is enabled. */
export interface ServicePreferenceState {
  mode: DeliveryMode;
  enabled: boolean;
}

/** The full persisted state for the feature, exactly what gets written to AsyncStorage. */
export interface ServicePreferencesState {
  services: Record<ServiceKey, ServicePreferenceState>;
  globalToggles: GlobalTogglesState;
}

/** Shape of the toast queue item used by NonIntrusiveToast. */
export interface ToastMessage {
  id: number;
  message: string;
}

/** Public API exposed by ServicePreferencesContext. */
export interface ServicePreferencesContextValue {
  state: ServicePreferencesState;
  isHydrated: boolean;
  setServiceMode: (service: ServiceKey, mode: DeliveryMode) => void;
  setServiceEnabled: (service: ServiceKey, enabled: boolean) => void;
  setGlobalToggle: (toggle: keyof GlobalTogglesState, value: boolean) => void;
  resetToDefaults: () => void;
  /** "X of 5 on" style summary used in the Settings main row subtitle. */
  summaryLabel: string;
  toast: ToastMessage | null;
  dismissToast: () => void;
}

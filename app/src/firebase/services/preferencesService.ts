import { httpsCallable } from 'firebase/functions';
import { functions } from '../config';
import { SettingsState } from '../../types';
import { ServicePreferencesState } from '../../native/screens/ServicePreferences/types';

export interface PreferencesResponse {
  settings: SettingsState;
  service: ServicePreferencesState;
  notifications: Record<string, Record<string, boolean>>;
}

/**
 * CALLABLE CLIENT WRAPPER: getPreferences
 * Fetches consolidated settings, service preferences, and notification toggles in one round-trip.
 */
export async function fetchPreferences(): Promise<PreferencesResponse | null> {
  if (!functions) return null;
  try {
    const call = httpsCallable<void, PreferencesResponse>(functions, 'getPreferences');
    const res = await call();
    return res.data;
  } catch (err) {
    console.warn('[preferencesService] getPreferences note:', err);
    return null;
  }
}

/**
 * CALLABLE CLIENT WRAPPER: updateSettings
 * Updates theme, language, and client usage toggles.
 */
export async function updateSettingsPreference(
  settings: Partial<SettingsState>
): Promise<boolean> {
  if (!functions) return false;
  try {
    const call = httpsCallable<Partial<SettingsState>, { success: boolean }>(
      functions,
      'updateSettings'
    );
    const res = await call(settings);
    return !!res.data?.success;
  } catch (err) {
    console.warn('[preferencesService] updateSettings error:', err);
    return false;
  }
}

/**
 * CALLABLE CLIENT WRAPPER: updateServicePreferences
 * Updates per-service delivery modes and global fulfillment toggles.
 */
export async function updateServicePreferencesCloud(
  preferences: Partial<ServicePreferencesState>
): Promise<boolean> {
  if (!functions) return false;
  try {
    const call = httpsCallable<Partial<ServicePreferencesState>, { success: boolean }>(
      functions,
      'updateServicePreferences'
    );
    const res = await call(preferences);
    return !!res.data?.success;
  } catch (err) {
    console.warn('[preferencesService] updateServicePreferences error:', err);
    return false;
  }
}

/**
 * CALLABLE CLIENT WRAPPER: updateNotificationPreferences
 * Updates notification category toggles.
 */
export async function updateNotificationPreferencesCloud(
  categories: Record<string, Record<string, boolean>>
): Promise<boolean> {
  if (!functions) return false;
  try {
    const call = httpsCallable<{ categories: Record<string, Record<string, boolean>> }, { success: boolean }>(
      functions,
      'updateNotificationPreferences'
    );
    const res = await call({ categories });
    return !!res.data?.success;
  } catch (err) {
    console.warn('[preferencesService] updateNotificationPreferences error:', err);
    return false;
  }
}

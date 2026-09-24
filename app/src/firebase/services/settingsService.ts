import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../config';
import { SettingsDoc } from '../types';
import { SettingsState } from '../../types';

/** Reads the cloud copy of settings, if any. Returns null when the user has
 *  never synced before (first-run or offline) so callers can keep whatever
 *  they already restored from AsyncStorage. */
export async function fetchCloudSettings(uid: string): Promise<SettingsState | null> {
  const snap = await getDoc(doc(db, 'users', uid, 'preferences', 'settings'));
  if (!snap.exists()) return null;
  const data = snap.data() as SettingsDoc;
  return {
    theme: data.theme,
    language: data.language,
    locationAccess: data.locationAccess,
    shareUsageData: data.shareUsageData,
    usageHistory: data.usageHistory ?? [],
  };
}

/** Fire-and-forget write, mirrored alongside the local AsyncStorage write so
 *  settings follow the signed-in user across devices. */
export async function pushCloudSettings(uid: string, state: SettingsState): Promise<void> {
  await setDoc(
    doc(db, 'users', uid, 'preferences', 'settings'),
    { ...state, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

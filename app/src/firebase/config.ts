/**
 * Firebase bootstrap for OneBuddy.
 *
 * Reads its config from Expo public env vars (`app.json` -> `extra`, or a
 * `.env` file loaded by `expo-constants`) so the same code runs in dev,
 * EAS builds and CI without hard-coding secrets. See `.env.example` for the
 * variable names.
 *
 * Auth persistence uses AsyncStorage (via `initializeAuth`) so a signed-in
 * user survives an app restart, matching the pattern already used by
 * `SettingsContext` for local settings.
 */
import { FirebaseOptions, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth, initializeAuth } from 'firebase/auth';
// @ts-ignore - getReactNativePersistence exists in React Native bundle of firebase/auth
import { getReactNativePersistence } from 'firebase/auth';
// eslint-disable-next-line import/no-unresolved
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Firestore,
  getFirestore,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import Constants from 'expo-constants';

function readExtra(key: string): string | undefined {
  const fromExpo =
    (Constants.expoConfig?.extra as Record<string, string> | undefined)?.[key];
  // Fallback for tooling that injects EXPO_PUBLIC_* into process.env directly.
  const fromEnv = (process.env as Record<string, string | undefined>)[key];
  return fromExpo ?? fromEnv;
}

const firebaseConfig: FirebaseOptions = {
  apiKey: readExtra('EXPO_PUBLIC_FIREBASE_API_KEY') || 'AIzaSyC0i2PsCmk0H1pBYcF_cl5EYIrgFMHXY3Q',
  authDomain: readExtra('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN') || 'onebuddyuser.firebaseapp.com',
  projectId: readExtra('EXPO_PUBLIC_FIREBASE_PROJECT_ID') || 'onebuddyuser',
  storageBucket: readExtra('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET') || 'onebuddyuser.firebasestorage.app',
  messagingSenderId: readExtra('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID') || '923658815455',
  appId: readExtra('EXPO_PUBLIC_FIREBASE_APP_ID') || '1:923658815455:android:ebd8c179c923401583a66a',
};

export const FIRESTORE_DATABASE_ID =
  readExtra('EXPO_PUBLIC_FIREBASE_DATABASE_ID') || '(default)';

export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

if (!firebaseConfigured && __DEV__) {
  // eslint-disable-next-line no-console
  console.warn(
    '[firebase] Missing EXPO_PUBLIC_FIREBASE_* config — see .env.example. ' +
      'Cloud sync is disabled until this is set.'
  );
}

export const app = firebaseConfigured
  ? (getApps().length ? getApps()[0] : initializeApp(firebaseConfig))
  : (null as unknown as ReturnType<typeof initializeApp>);

import { Platform } from 'react-native';

let authInstance: Auth;
if (firebaseConfigured && app) {
  try {
    if (Platform.OS === 'web') {
      authInstance = getAuth(app);
    } else {
      authInstance = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    }
  } catch {
    // initializeAuth throws if it's already been called once for this app
    // (hot reload in dev). Fall back to the existing instance.
    authInstance = getAuth(app);
  }
} else {
  authInstance = null as unknown as Auth;
}
export const auth = authInstance;

let firestoreInstance: Firestore;
if (firebaseConfigured && app) {
  try {
    if (FIRESTORE_DATABASE_ID && FIRESTORE_DATABASE_ID !== '(default)') {
      firestoreInstance = getFirestore(app, FIRESTORE_DATABASE_ID);
    } else {
      firestoreInstance = getFirestore(app);
    }
  } catch (err) {
    console.error('[Firebase] Error initializing Firestore:', err);
    firestoreInstance = null as unknown as Firestore;
  }
} else {
  firestoreInstance = null as unknown as Firestore;
}

export const db: Firestore = firestoreInstance;



export const storage =
  firebaseConfigured && app
    ? getStorage(app)
    : (null as unknown as ReturnType<typeof getStorage>);

export const functions =
  firebaseConfigured && app
    ? getFunctions(app)
    : (null as unknown as ReturnType<typeof getFunctions>);

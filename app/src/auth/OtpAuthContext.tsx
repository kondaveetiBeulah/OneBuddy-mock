import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { provider } from './otpProvider';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/firebase/config';

const TOKEN_KEY = 'onebuddy:otpToken';
const IDENT_KEY = 'onebuddy:otpIdentifier';

interface OtpAuthValue {
  /** null while still reading storage / waiting for auth */
  token: string | null;
  identifier: string | null;
  hydrated: boolean;
  sendOtp: (identifier: string, type?: 'signup' | 'login') => Promise<void>;
  verifyOtp: (
    identifier: string,
    code: string,
    options?: { type?: 'signup' | 'login'; fullName?: string; dob?: string }
  ) => Promise<{ token: string; uid?: string; isNewUser?: boolean }>;
  signOut: () => Promise<void>;
}

const OtpAuthContext = createContext<OtpAuthValue | undefined>(undefined);

/**
 * Holds the signed-in session for the native OTP flow, synchronized with Firebase Auth.
 */
export function OtpAuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [identifier, setIdentifier] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Synchronize with Firebase Auth as single source of truth
  useEffect(() => {
    if (!auth) {
      setHydrated(true);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged((fbUser) => {
      if (fbUser) {
        setToken(fbUser.uid);
        const cleanPhone = (fbUser.phoneNumber || '').replace(/\D/g, '').slice(-10);
        setIdentifier(cleanPhone || fbUser.uid);
      } else {
        setToken(null);
        setIdentifier(null);
        AsyncStorage.multiRemove([
          TOKEN_KEY,
          IDENT_KEY,
          'onebuddy:profile',
          'onebuddy:userProfile',
        ]).catch(() => {});
      }
      setHydrated(true);
    });

    return unsubscribe;
  }, []);

  const sendOtp = useCallback(
    async (value: string, type: 'signup' | 'login' = 'login') => {
      await provider.sendOtp(value, type);
    },
    []
  );

  const verifyOtp = useCallback(
    async (
      value: string,
      code: string,
      options?: { type?: 'signup' | 'login'; fullName?: string; dob?: string }
    ) => {
      const result = await provider.verifyOtp(value, code, options);
      const cleanPhone = value.replace(/\D/g, '').slice(-10);

      if (auth && result.customToken) {
        try {
          await signInWithCustomToken(auth, result.customToken);
        } catch (authErr) {
          console.warn('[OtpAuthContext] Firebase signInWithCustomToken note:', authErr);
        }
      }

      await AsyncStorage.multiSet([
        [TOKEN_KEY, result.token],
        [IDENT_KEY, cleanPhone],
      ]);
      setIdentifier(cleanPhone);
      setToken(result.token);
      return result;
    },
    []
  );

  const signOut = useCallback(async () => {
    await AsyncStorage.multiRemove([
      TOKEN_KEY,
      IDENT_KEY,
      'onebuddy:profile',
      'onebuddy:userProfile',
    ]);
    setToken(null);
    setIdentifier(null);
    try {
      if (auth) {
        await auth.signOut();
      }
    } catch (err) {
      console.warn('Firebase signOut error:', err);
    }
  }, []);

  const value = useMemo<OtpAuthValue>(
    () => ({ token, identifier, hydrated, sendOtp, verifyOtp, signOut }),
    [token, identifier, hydrated, sendOtp, verifyOtp, signOut]
  );

  return <OtpAuthContext.Provider value={value}>{children}</OtpAuthContext.Provider>;
}

export function useOtpAuth(): OtpAuthValue {
  const ctx = useContext(OtpAuthContext);
  if (!ctx) throw new Error('useOtpAuth must be used within an OtpAuthProvider');
  return ctx;
}

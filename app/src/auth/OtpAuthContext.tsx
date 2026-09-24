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
import { auth } from '@/firebase/config';

const TOKEN_KEY = 'onebuddy:otpToken';
const IDENT_KEY = 'onebuddy:otpIdentifier';

interface OtpAuthValue {
  /** null while still reading storage — the navigator shows the splash then. */
  token: string | null;
  identifier: string | null;
  hydrated: boolean;
  sendOtp: (identifier: string) => Promise<void>;
  verifyOtp: (identifier: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const OtpAuthContext = createContext<OtpAuthValue | undefined>(undefined);

/**
 * Holds the signed-in session for the native OTP flow.
 *
 * The token is kept in AsyncStorage so a restart stays signed in, matching
 * how `SettingsContext` persists settings. When a real backend issues a
 * long-lived token, move this to `expo-secure-store` — AsyncStorage is not
 * encrypted, and on a rooted device it is readable.
 */
export function OtpAuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [identifier, setIdentifier] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [storedToken, storedIdent] = await AsyncStorage.multiGet([
          TOKEN_KEY,
          IDENT_KEY,
        ]);
        if (cancelled) return;
        setToken(storedToken[1]);
        setIdentifier(storedIdent[1]);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sendOtp = useCallback(
    (value: string) => provider.sendOtp(value),
    []
  );

  const verifyOtp = useCallback(async (value: string, code: string) => {
    const { token: issued } = await provider.verifyOtp(value, code);
    await AsyncStorage.multiSet([
      [TOKEN_KEY, issued],
      [IDENT_KEY, value.trim()],
    ]);
    setIdentifier(value.trim());
    setToken(issued);
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, IDENT_KEY]);
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

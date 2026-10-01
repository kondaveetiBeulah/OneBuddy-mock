import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  User,
  deleteUser,
  onAuthStateChanged,
  signInWithCustomToken,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, functions, firebaseConfigured } from '../config';
import { deleteUserAccountFromFirestore, getUserProfileByUid } from '../services/userService';
import { provider, OtpError } from '@/auth/otpProvider';

interface AuthContextValue {
  user: User | null;
  initializing: boolean;
  enabled: boolean;
  initialAuthTab: 'login' | 'signup';
  setInitialAuthTab: (tab: 'login' | 'signup') => void;
  sendOtp: (phone: string, type: 'signup' | 'login') => Promise<void>;
  verifyOtpAndSignIn: (params: {
    phone: string;
    otp: string;
    type: 'signup' | 'login';
    fullName?: string;
    dob?: string;
    email?: string;
  }) => Promise<User>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [initialAuthTab, setInitialAuthTabState] = useState<'login' | 'signup'>('login');

  const setInitialAuthTab = (tab: 'login' | 'signup') => {
    setInitialAuthTabState(tab);
    AsyncStorage.setItem('onebuddy:initialAuthTab', tab).catch(() => {});
  };

  useEffect(() => {
    if (!firebaseConfigured || !auth) {
      setInitializing(false);
      return;
    }

    let isMounted = true;

    // Retrieve last requested auth tab (e.g. 'login' after logout, 'signup' after account deletion)
    AsyncStorage.getItem('onebuddy:initialAuthTab')
      .then((tab) => {
        if (isMounted && (tab === 'login' || tab === 'signup')) {
          setInitialAuthTabState(tab);
        }
      })
      .catch(() => {});

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      if (!isMounted) return;

      if (nextUser) {
        try {
          // Verify user exists and is active in Firestore
          const profile = await getUserProfileByUid(nextUser.uid);
          if (!profile || profile.accountStatus === 'deleted') {
            console.warn('[Auth] User document is missing or deleted. Signing out.');
            await firebaseSignOut(auth);
            if (isMounted) {
              setUser(null);
              setInitializing(false);
            }
            return;
          }
          if (isMounted) {
            setUser(nextUser);
            setInitializing(false);
          }
        } catch (err) {
          console.warn('[Auth] Error checking user profile status:', err);
          if (isMounted) {
            setUser(nextUser);
            setInitializing(false);
          }
        }
      } else {
        if (isMounted) {
          setUser(null);
          setInitializing(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      enabled: firebaseConfigured,
      initialAuthTab,
      setInitialAuthTab,

      async sendOtp(phone: string, type: 'signup' | 'login'): Promise<void> {
        await provider.sendOtp(phone, type);
      },

      async verifyOtpAndSignIn({
        phone,
        otp,
        type,
        fullName,
        dob,
        email,
      }: {
        phone: string;
        otp: string;
        type: 'signup' | 'login';
        fullName?: string;
        dob?: string;
        email?: string;
      }): Promise<User> {
        if (!auth) throw new Error('Firebase Auth is not configured.');
        const cleanPhone = phone.replace(/\D/g, '').slice(-10);

        // 1. Verify Fast2SMS OTP on backend Cloud Functions
        const result = await provider.verifyOtp(cleanPhone, otp, {
          type,
          fullName: fullName ? fullName.trim() : undefined,
          dob: dob ? dob.trim() : undefined,
          email: email ? email.trim() : undefined,
        });

        if (!result.token) {
          throw new Error('Authentication token was not received from the server.');
        }

        // 2. Sign in to Firebase Auth using backend Custom Token (phone number identifier)
        const credential = await signInWithCustomToken(auth, result.token);
        const fbUser = credential.user;

        // 3. Cache profile details in AsyncStorage
        const resolvedName =
          fullName && fullName.trim()
            ? fullName.trim()
            : fbUser.displayName || 'OneBuddy User';

        const userProfile = {
          name: resolvedName,
          dob: dob ? dob.trim() : '',
          email: email ? email.trim() : '',
          phone: cleanPhone,
          registeredAt: new Date().toISOString(),
        };

        try {
          await AsyncStorage.setItem('onebuddy:userProfile', JSON.stringify(userProfile));
          await AsyncStorage.setItem('onebuddy:otpIdentifier', cleanPhone);
        } catch (err) {
          console.warn('[Auth] Could not save userProfile to AsyncStorage:', err);
        }

        setUser(fbUser);
        return fbUser;
      },

      async signOut(): Promise<void> {
        setInitialAuthTab('login');
        try {
          await AsyncStorage.multiRemove([
            'onebuddy:otpToken',
            'onebuddy:otpIdentifier',
            'onebuddy:profile',
            'onebuddy:userProfile',
          ]);
        } catch {}

        if (auth) {
          try {
            await firebaseSignOut(auth);
          } catch (err) {
            console.warn('[Auth] Firebase signOut error:', err);
          }
        }
        setUser(null);
      },

      async deleteAccount(): Promise<void> {
        setInitialAuthTab('signup');
        const currentUser = auth?.currentUser || user;
        if (currentUser) {
          const uid = currentUser.uid;
          console.log(`[Auth] Deleting account for UID: ${uid}`);

          // 1. Backend deletion via Cloud Function
          if (functions) {
            try {
              const deleteFn = httpsCallable<Record<string, never>, { success: boolean }>(
                functions,
                'deleteUserAccount'
              );
              await deleteFn({});
              console.log('[Auth] Backend deleteUserAccount succeeded.');
            } catch (err) {
              console.warn('[Auth] Backend deleteUserAccount fallback:', err);
              try {
                await deleteUserAccountFromFirestore(uid);
              } catch {}
              try {
                await deleteUser(currentUser);
              } catch {}
            }
          } else {
            try {
              await deleteUserAccountFromFirestore(uid);
            } catch {}
            try {
              await deleteUser(currentUser);
            } catch {}
          }
        }

        try {
          await AsyncStorage.multiRemove([
            'onebuddy:otpToken',
            'onebuddy:otpIdentifier',
            'onebuddy:profile',
            'onebuddy:userProfile',
          ]);
        } catch {}

        if (auth) {
          try {
            await firebaseSignOut(auth);
          } catch {}
        }
        setUser(null);
      },
    }),
    [user, initializing, initialAuthTab]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

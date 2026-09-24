import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { auth, firebaseConfigured } from '../config';
import { ensureUserDocument, findUserByPhone } from '../services/userService';

interface AuthContextValue {
  user: User | null;
  initializing: boolean;
  /** False when EXPO_PUBLIC_FIREBASE_* env vars are missing — screens can
   *  fall back to local-only mode instead of failing every call. */
  enabled: boolean;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<User>;
  authenticateWithPhoneOrEmail: (params: {
    phone: string;
    email?: string;
    fullName?: string;
    dob?: string;
    isSignUp: boolean;
  }) => Promise<User>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapAuthError(err: unknown): Error {
  const code = (err as { code?: string })?.code ?? '';
  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'That email already has an account. Try logging in instead.',
    'auth/invalid-email': 'That email address doesn\u2019t look right.',
    'auth/weak-password': 'Use at least 6 characters for your password.',
    'auth/user-not-found': 'No account found for that email.',
    'auth/wrong-password': 'That password is incorrect.',
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/too-many-requests': 'Too many attempts. Try again in a few minutes.',
    'auth/network-request-failed': 'Network error — check your connection.',
  };
  return new Error(messages[code] ?? (err as Error)?.message ?? 'Something went wrong.');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (!firebaseConfigured) {
      setInitializing(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      enabled: firebaseConfigured,
      async signUp(name, email, password) {
        try {
          const credential = await createUserWithEmailAndPassword(auth, email, password);
          if (name.trim()) {
            await updateProfile(credential.user, { displayName: name.trim() });
          }
          await ensureUserDocument(credential.user, name.trim());
        } catch (err) {
          throw mapAuthError(err);
        }
      },
      async signIn(email, password) {
        try {
          await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
          throw mapAuthError(err);
        }
      },
      async signInWithGoogle(): Promise<User> {
        if (!auth) throw new Error('Firebase Auth is not configured');
        try {
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });
          const credential = await signInWithPopup(auth, provider);
          if (credential.user) {
            await ensureUserDocument(credential.user, credential.user.displayName || undefined, {
              email: credential.user.email || undefined,
              phone: credential.user.phoneNumber || undefined,
            });
          }
          return credential.user;
        } catch (err) {
          throw mapAuthError(err);
        }
      },
      async authenticateWithPhoneOrEmail({
        phone,
        email,
        fullName,
        dob,
        isSignUp,
      }): Promise<User> {
        if (!auth) throw new Error('Firebase Auth is not configured');
        const cleanPhone = phone.replace(/\D/g, '').slice(-10);
        const deterministicPassword = `OneBuddy#Auth_${cleanPhone}_2026`;

        if (isSignUp) {
          const targetEmail = (email && email.trim()) ? email.trim().toLowerCase() : `${cleanPhone}@onebuddy.app`;
          let credUser: User;
          try {
            const cred = await createUserWithEmailAndPassword(auth, targetEmail, deterministicPassword);
            credUser = cred.user;
          } catch (err: any) {
            if (err?.code === 'auth/email-already-in-use') {
              const cred = await signInWithEmailAndPassword(auth, targetEmail, deterministicPassword);
              credUser = cred.user;
            } else {
              throw mapAuthError(err);
            }
          }
          if (fullName && fullName.trim()) {
            try {
              await updateProfile(credUser, { displayName: fullName.trim() });
            } catch {}
          }
          await ensureUserDocument(credUser, fullName?.trim(), {
            phone: cleanPhone,
            email: targetEmail,
            dob: dob?.trim(),
          });
          return credUser;
        } else {
          // Login flow
          const existing = await findUserByPhone(cleanPhone);
          const targetEmail = (existing?.email && existing.email.includes('@'))
            ? existing.email.toLowerCase()
            : `${cleanPhone}@onebuddy.app`;

          let credUser: User;
          try {
            const cred = await signInWithEmailAndPassword(auth, targetEmail, deterministicPassword);
            credUser = cred.user;
          } catch (err: any) {
            if (err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential') {
              const cred = await createUserWithEmailAndPassword(auth, targetEmail, deterministicPassword);
              credUser = cred.user;
            } else {
              throw mapAuthError(err);
            }
          }
          await ensureUserDocument(credUser, existing?.name || credUser.displayName || undefined, {
            phone: cleanPhone,
            email: targetEmail,
            dob: (existing as any)?.dob || undefined,
          });
          return credUser;
        }
      },
      async signOut() {
        await firebaseSignOut(auth);
      },
      async resetPassword(email) {
        try {
          await sendPasswordResetEmail(auth, email);
        } catch (err) {
          throw mapAuthError(err);
        }
      },
    }),
    [user, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

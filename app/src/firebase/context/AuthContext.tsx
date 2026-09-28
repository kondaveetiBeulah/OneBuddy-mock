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
  deleteUser,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, firebaseConfigured } from '../config';
import { deleteUserAccountFromFirestore, ensureUserDocument, findUserByPhone, getUserProfileByUid } from '../services/userService';

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
  deleteAccount: () => Promise<void>;
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
            const rawEmail = credential.user.email || '';
            const emailHandle = rawEmail.includes('@')
              ? rawEmail.split('@')[0].charAt(0).toUpperCase() + rawEmail.split('@')[0].slice(1)
              : 'Google User';
            const resolvedDisplayName = credential.user.displayName || emailHandle;

            await ensureUserDocument(credential.user, resolvedDisplayName, {
              email: rawEmail || undefined,
              phone: credential.user.phoneNumber || undefined,
            });

            // Explicit write to guarantee displayName is never null in Firestore
            try {
              const userDocRef = doc(db, 'users', credential.user.uid);
              await setDoc(
                userDocRef,
                {
                  uid: credential.user.uid,
                  displayName: resolvedDisplayName,
                  email: rawEmail || null,
                  accountStatus: 'active',
                  updatedAt: serverTimestamp(),
                },
                { merge: true }
              );
            } catch (err) {
              console.warn('[Auth] Error writing Google profile:', err);
            }
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
        if (!cleanPhone || cleanPhone.length < 10) {
          throw new Error('Please enter a valid 10-digit mobile number.');
        }
        const deterministicPassword = `OneBuddy#Auth_${cleanPhone}_2026`;
        const targetEmail = (email && email.trim()) ? email.trim().toLowerCase() : `${cleanPhone}@onebuddy.app`;

        if (isSignUp) {
          // ========================
          // STRICT SIGNUP FLOW
          // ========================
          if (!fullName || !fullName.trim()) {
            throw new Error('Full name is required to complete signup.');
          }

          let credUser: User;
          try {
            const cred = await createUserWithEmailAndPassword(auth, targetEmail, deterministicPassword);
            credUser = cred.user;
          } catch (err: any) {
            if (err?.code === 'auth/email-already-in-use') {
              const existingUser = await findUserByPhone(cleanPhone);
              if (existingUser && existingUser.accountStatus !== 'deleted') {
                throw new Error('An account with this mobile number already exists. Please login instead.');
              }
              // If orphaned Auth account with no active Firestore record, sign in and provision profile
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

          await ensureUserDocument(credUser, fullName.trim(), {
            phone: cleanPhone,
            email: targetEmail,
          });

          return credUser;
        } else {
          // ========================
          // STRICT LOGIN FLOW
          // ========================
          // 1. Verify user exists in Firestore first
          const existing = await findUserByPhone(cleanPhone);
          if (!existing || existing.accountStatus === 'deleted') {
            throw new Error('No registered account found with this number. Please signup first.');
          }

          // 2. Authenticate with Firebase Auth
          let credUser: User;
          try {
            const cred = await signInWithEmailAndPassword(auth, targetEmail, deterministicPassword);
            credUser = cred.user;
          } catch (err: any) {
            if (err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential') {
              throw new Error('No registered account found with this number. Please signup first.');
            }
            throw mapAuthError(err);
          }

          // 3. Double-check the profile record for this authenticated UID
          const profileDoc = await getUserProfileByUid(credUser.uid);
          if (!profileDoc || profileDoc.accountStatus === 'deleted') {
            await firebaseSignOut(auth);
            throw new Error('No registered account found with this number. Please signup first.');
          }

          return credUser;
        }
      },
      async signOut() {
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
            console.warn('Firebase signOut error:', err);
          }
        }
        setUser(null);
      },
      async deleteAccount() {
        const currentUser = auth.currentUser || user;
        if (currentUser) {
          const uid = currentUser.uid;
          try {
            await deleteUserAccountFromFirestore(uid);
          } catch (e) {
            console.warn('Error cleaning Firestore user data:', e);
          }
          try {
            await deleteUser(currentUser);
          } catch (err: any) {
            console.warn('Firebase deleteUser error (may require re-auth):', err);
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
        try {
          if (auth) await firebaseSignOut(auth);
        } catch {}
        setUser(null);
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

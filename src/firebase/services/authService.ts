import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from '../config';
import { handleFirestoreError, OperationType } from '../error';
import { UserProfile } from '../../types';

// Admin bootstrap owner email
export const BOOTSTRAP_ADMIN_EMAIL = 'riskiramad3@gmail.com';

const googleProvider = new GoogleAuthProvider();

export async function loginWithGoogle(): Promise<User> {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    try {
      await syncUserProfile(cred.user);
    } catch (e) {
      console.warn('[MED-COMMAND] Initial profile sync warning on Google login:', e);
    }
    return cred.user;
  } catch (error) {
    console.error('Login with Google error:', error);
    throw error;
  }
}

export async function loginWithEmail(email: string, pass: string): Promise<User> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    try {
      await syncUserProfile(cred.user);
    } catch (e) {
      console.warn('[MED-COMMAND] Initial profile sync warning on email login:', e);
    }
    return cred.user;
  } catch (error) {
    console.error('Login with Email error:', error);
    throw error;
  }
}

export async function registerWithEmail(email: string, pass: string, displayName: string): Promise<User> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    try {
      await syncUserProfile(cred.user, displayName);
    } catch (e) {
      console.warn('[MED-COMMAND] Initial profile sync warning on register:', e);
    }
    return cred.user;
  } catch (error) {
    console.error('Register with Email error:', error);
    throw error;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}

export function isDefaultAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const lower = email.trim().toLowerCase();
  return lower === BOOTSTRAP_ADMIN_EMAIL.toLowerCase() || /^admin.*@/i.test(lower);
}

export async function checkIsAdmin(uid: string, email?: string | null): Promise<boolean> {
  if (isDefaultAdminEmail(email)) {
    return true;
  }
  try {
    const adminSnap = await getDoc(doc(db, 'admins', uid));
    if (adminSnap.exists()) return true;
  } catch {
    // If not found or read denied, not admin
  }
  return false;
}

export async function syncUserProfile(user: User, customDisplayName?: string): Promise<UserProfile> {
  const userPath = `users/${user.uid}`;
  const isBootstrapAdmin = isDefaultAdminEmail(user.email);

  const fallbackProfile: UserProfile = {
    uid: user.uid,
    email: user.email || '',
    displayName: customDisplayName || user.displayName || user.email?.split('@')[0] || (isBootstrapAdmin ? 'Admin Medis' : 'Petugas'),
    role: isBootstrapAdmin ? 'admin' : 'officer',
    isActive: true,
    allowedMapIds: [],
    createdAt: new Date().toISOString(),
  };

  try {
    const userDocRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      // If user is bootstrap admin, ensure role is admin & present in admins collection
      if (isBootstrapAdmin && data.role !== 'admin') {
        try {
          await updateDoc(userDocRef, {
            role: 'admin',
            updatedAt: new Date().toISOString(),
          });
          await setDoc(doc(db, 'admins', user.uid), {
            uid: user.uid,
            email: user.email,
            createdAt: new Date().toISOString(),
          });
        } catch (e) {
          console.warn('[MED-COMMAND] Admin marker sync warning:', e);
        }
        return { ...data, role: 'admin' };
      }

      // Ensure admins marker exists for any verified admin
      if (data.role === 'admin' || isBootstrapAdmin) {
        try {
          const adminDoc = await getDoc(doc(db, 'admins', user.uid));
          if (!adminDoc.exists()) {
            await setDoc(doc(db, 'admins', user.uid), {
              uid: user.uid,
              email: user.email,
              createdAt: new Date().toISOString(),
            });
          }
        } catch {
          // Non-blocking
        }
      }

      return data;
    } else {
      // Create new profile
      const role = isBootstrapAdmin ? 'admin' : 'officer';
      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: customDisplayName || user.displayName || user.email?.split('@')[0] || (isBootstrapAdmin ? 'Admin Medis' : 'Petugas'),
        role,
        isActive: true,
        allowedMapIds: [],
        createdAt: new Date().toISOString(),
      };

      try {
        await setDoc(userDocRef, newProfile);
        if (isBootstrapAdmin) {
          await setDoc(doc(db, 'admins', user.uid), {
            uid: user.uid,
            email: user.email,
            createdAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn('[MED-COMMAND] Background profile persistence pending:', err);
      }

      return newProfile;
    }
  } catch (error: any) {
    console.warn('[MED-COMMAND] syncUserProfile network fallback:', error?.message || error);
    // If client is offline or initial connection pending, gracefully return fallback profile
    if (error instanceof Error && (error.message.includes('offline') || error.message.includes('unavailable'))) {
      return fallbackProfile;
    }
    // Re-throw through standard error handler for actual permission failures
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userPath = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error: any) {
    if (error instanceof Error && (error.message.includes('offline') || error.message.includes('unavailable'))) {
      return null;
    }
    handleFirestoreError(error, OperationType.GET, userPath);
  }
}

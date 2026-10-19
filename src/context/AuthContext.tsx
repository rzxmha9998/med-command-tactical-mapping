import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import {
  syncUserProfile,
  loginWithGoogle as fbLoginGoogle,
  loginWithEmail as fbLoginEmail,
  registerWithEmail as fbRegisterEmail,
  logoutUser as fbLogout,
  BOOTSTRAP_ADMIN_EMAIL,
  isDefaultAdminEmail,
} from '../firebase/services/authService';
import { UserProfile, UserRole } from '../types';

export type AuthStatus = 'initializing' | 'authenticated' | 'unauthenticated' | 'error';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole;
  isAdmin: boolean;
  isOfficer: boolean;
  loading: boolean;
  authStatus: AuthStatus;
  error: string | null;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getCachedProfile(uid: string): UserProfile | null {
  try {
    const raw = localStorage.getItem(`medcommand_profile_${uid}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore localStorage parse errors
  }
  return null;
}

function setCachedProfile(uid: string, profile: UserProfile) {
  try {
    localStorage.setItem(`medcommand_profile_${uid}`, JSON.stringify(profile));
  } catch {
    // Ignore
  }
}

function clearCachedProfile(uid?: string) {
  try {
    if (uid) {
      localStorage.removeItem(`medcommand_profile_${uid}`);
    }
  } catch {
    // Ignore
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('initializing');
  const [error, setError] = useState<string | null>(null);
  const profileFetchInProgress = useRef<string | null>(null);

  const fetchProfile = async (firebaseUser: User): Promise<UserProfile> => {
    const uid = firebaseUser.uid;
    const isBootstrap = isDefaultAdminEmail(firebaseUser.email);

    // Check memory or cached local profile first for near-instant hydration
    const cached = getCachedProfile(uid);
    if (cached) {
      setProfile(cached);
      setLoading(false);
      setAuthStatus('authenticated');
    }

    if (profileFetchInProgress.current === uid) {
      return cached || ({} as UserProfile);
    }
    profileFetchInProgress.current = uid;

    try {
      // 3.5s timeout protection against slow network / offline
      const syncPromise = syncUserProfile(firebaseUser);
      const timeoutPromise = new Promise<UserProfile>((_, reject) =>
        setTimeout(() => reject(new Error('Profile sync timeout')), 3500)
      );

      const userProf = await Promise.race([syncPromise, timeoutPromise]);
      setProfile(userProf);
      setCachedProfile(uid, userProf);
      return userProf;
    } catch (err: any) {
      console.warn('[MED-COMMAND] Profile fetch fast-fallback applied:', err?.message || err);
      // Fast fallback based on bootstrap admin or cached state
      const fallbackProf: UserProfile = cached || {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || (isBootstrap ? 'Admin Medis' : 'Petugas'),
        role: isBootstrap ? 'admin' : 'officer',
        isActive: true,
        allowedMapIds: [],
        createdAt: new Date().toISOString(),
      };
      setProfile(fallbackProf);
      setCachedProfile(uid, fallbackProf);
      return fallbackProf;
    } finally {
      profileFetchInProgress.current = null;
      setLoading(false);
      setAuthStatus('authenticated');
    }
  };

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return;

      setUser(firebaseUser);

      if (firebaseUser) {
        // Fast path: if cached profile exists, immediately unblock loading
        const cached = getCachedProfile(firebaseUser.uid);
        if (cached) {
          setProfile(cached);
          setLoading(false);
          setAuthStatus('authenticated');
        }
        await fetchProfile(firebaseUser);
      } else {
        setProfile(null);
        setLoading(false);
        setAuthStatus('unauthenticated');
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const loginWithGoogle = async () => {
    setError(null);
    try {
      await fbLoginGoogle();
    } catch (err: any) {
      setError(err.message || 'Gagal masuk dengan Google');
      throw err;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setError(null);
    try {
      await fbLoginEmail(email, pass);
    } catch (err: any) {
      setError(err.message || 'Gagal masuk dengan Email');
      throw err;
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    setError(null);
    try {
      await fbRegisterEmail(email, pass, name);
    } catch (err: any) {
      setError(err.message || 'Gagal mendaftar akun');
      throw err;
    }
  };

  const logout = async () => {
    setError(null);
    try {
      const currentUid = user?.uid;
      await fbLogout();
      clearCachedProfile(currentUid);
      setProfile(null);
      setUser(null);
      setAuthStatus('unauthenticated');
    } catch (err: any) {
      setError(err.message || 'Gagal keluar');
      throw err;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  const role: UserRole = profile?.role || (isDefaultAdminEmail(user?.email) ? 'admin' : 'officer');
  const isAdmin = role === 'admin';
  const isOfficer = role === 'officer';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isAdmin,
        isOfficer,
        loading,
        authStatus,
        error,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

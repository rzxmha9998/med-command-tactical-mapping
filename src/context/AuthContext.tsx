import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import {
  syncUserProfile,
  getUserProfile,
  loginWithGoogle as fbLoginGoogle,
  loginWithEmail as fbLoginEmail,
  registerWithEmail as fbRegisterEmail,
  logoutUser as fbLogout,
  BOOTSTRAP_ADMIN_EMAIL,
} from '../firebase/services/authService';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole;
  isAdmin: boolean;
  isOfficer: boolean;
  loading: boolean;
  error: string | null;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async (firebaseUser: User) => {
    try {
      const userProf = await syncUserProfile(firebaseUser);
      setProfile(userProf);
    } catch (err: any) {
      console.error('Failed to sync profile:', err);
      // Fallback local profile if offline or rules evaluate
      const isBootstrap = firebaseUser.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
      setProfile({
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || (isBootstrap ? 'Admin Medis' : 'Petugas'),
        role: isBootstrap ? 'admin' : 'officer',
        isActive: true,
        allowedMapIds: [],
        createdAt: new Date().toISOString(),
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchProfile(firebaseUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
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
      await fbLogout();
      setProfile(null);
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

  const role: UserRole = profile?.role || 'officer';
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

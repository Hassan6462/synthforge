import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, AuthSession, AuthStatus, UserRecord } from '../types/auth';
import {
  hashPassword,
  verifyPassword,
  validateEmail,
  validatePassword,
  getLockoutStatus,
  recordFailedAttempt,
  clearFailedAttempts,
} from '../utils/auth';
import {
  saveUserToDb,
  getUserByEmailFromDb,
  getUserByIdFromDb,
  updateUserInDb,
  deleteUserDataFromDb,
  seedDemoUserIfMissing,
} from '../utils/indexedDb';

interface AuthContextType {
  user: User | null;
  status: AuthStatus;
  login: (email: string, pass: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  guest: () => void;
  logout: () => void;
  updateProfile: (name?: string, newPassword?: string, currentPassword?: string) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: () => Promise<void>;
  forgotPasswordReset: (email: string, fullName: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'synthforge_auth_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  // Helper to persist session
  const saveSession = (userId: string, isGuest: boolean, rememberMe: boolean) => {
    const duration = isGuest ? 12 * 3600 * 1000 : rememberMe ? 30 * 24 * 3600 * 1000 : 24 * 3600 * 1000;
    const session: AuthSession = {
      token: `tok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      userId,
      expiresAt: Date.now() + duration,
      rememberMe,
      isGuest,
    };
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {}
  };

  // Helper to clear session
  const clearSession = () => {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {}
  };

  // Initialize and check existing session
  useEffect(() => {
    async function initAuth() {
      // Always seed demo user account on startup
      await seedDemoUserIfMissing();

      try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) {
          setStatus('unauthenticated');
          return;
        }

        const session: AuthSession = JSON.parse(raw);
        if (!session || !session.expiresAt || Date.now() > session.expiresAt) {
          clearSession();
          setStatus('unauthenticated');
          return;
        }

        if (session.isGuest) {
          setUser({
            id: 'guest',
            name: 'Guest User',
            email: 'guest@synthforge.local',
            createdAt: Date.now(),
            isGuest: true,
          });
          setStatus('authenticated');
          return;
        }

        const userRecord = await getUserByIdFromDb(session.userId);
        if (!userRecord) {
          clearSession();
          setStatus('unauthenticated');
          return;
        }

        setUser({
          id: userRecord.id,
          name: userRecord.name,
          email: userRecord.email,
          createdAt: userRecord.createdAt,
          isGuest: false,
        });
        setStatus('authenticated');
      } catch (err) {
        console.error('Session validation error:', err);
        clearSession();
        setStatus('unauthenticated');
      }
    }

    initAuth();
  }, []);

  // Periodic session expiry check
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (raw) {
          const session: AuthSession = JSON.parse(raw);
          if (session.expiresAt && Date.now() > session.expiresAt) {
            clearSession();
            setUser(null);
            setStatus('unauthenticated');
          }
        }
      } catch {}
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Login handler
  const login = useCallback(
    async (email: string, pass: string, rememberMe = false): Promise<{ success: boolean; error?: string }> => {
      const normEmail = email.trim().toLowerCase();

      // Check lockout first
      const lockout = getLockoutStatus(normEmail);
      if (lockout.isLocked) {
        return {
          success: false,
          error: `Account temporarily locked due to too many failed attempts. Try again in ${lockout.remainingSeconds}s.`,
        };
      }

      if (!normEmail || !pass) {
        return { success: false, error: 'Please enter both email and password.' };
      }

      try {
        const userRecord = await getUserByEmailFromDb(normEmail);
        if (!userRecord) {
          const lock = recordFailedAttempt(normEmail);
          if (lock.isLocked) {
            return {
              success: false,
              error: `Too many failed attempts. Account locked for ${lock.remainingSeconds} seconds.`,
            };
          }
          return { success: false, error: 'Incorrect email or password.' };
        }

        const isValid = await verifyPassword(pass, userRecord.passwordHash, userRecord.passwordSalt);
        if (!isValid) {
          const lock = recordFailedAttempt(normEmail);
          if (lock.isLocked) {
            return {
              success: false,
              error: `Too many failed attempts. Account locked for ${lock.remainingSeconds} seconds.`,
            };
          }
          return { success: false, error: 'Incorrect email or password.' };
        }

        // Login success
        clearFailedAttempts(normEmail);
        saveSession(userRecord.id, false, rememberMe);

        setUser({
          id: userRecord.id,
          name: userRecord.name,
          email: userRecord.email,
          createdAt: userRecord.createdAt,
          isGuest: false,
        });
        setStatus('authenticated');
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Login failed unexpectedly.' };
      }
    },
    []
  );

  // Register handler
  const register = useCallback(
    async (name: string, email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
      const cleanName = name.trim();
      const normEmail = email.trim().toLowerCase();

      if (!cleanName) {
        return { success: false, error: 'Please enter your full name.' };
      }
      if (!validateEmail(normEmail)) {
        return { success: false, error: 'Please enter a valid email address.' };
      }

      const passValidation = validatePassword(pass);
      if (!passValidation.isValid) {
        return { success: false, error: passValidation.message };
      }

      try {
        const existing = await getUserByEmailFromDb(normEmail);
        if (existing) {
          return { success: false, error: 'An account with this email already exists.' };
        }

        const { hash, salt } = await hashPassword(pass);
        const newUser: UserRecord = {
          id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: cleanName,
          email: normEmail,
          passwordHash: hash,
          passwordSalt: salt,
          createdAt: Date.now(),
        };

        await saveUserToDb(newUser);
        saveSession(newUser.id, false, true);

        setUser({
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          createdAt: newUser.createdAt,
          isGuest: false,
        });
        setStatus('authenticated');
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Account creation failed.' };
      }
    },
    []
  );

  // Guest handler
  const guest = useCallback(() => {
    saveSession('guest', true, false);
    setUser({
      id: 'guest',
      name: 'Guest User',
      email: 'guest@synthforge.local',
      createdAt: Date.now(),
      isGuest: true,
    });
    setStatus('authenticated');
  }, []);

  // Logout handler
  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  // Update profile handler (name and/or password)
  const updateProfile = useCallback(
    async (
      newName?: string,
      newPassword?: string,
      currentPassword?: string
    ): Promise<{ success: boolean; error?: string }> => {
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      if (user.isGuest) {
        if (newName) {
          setUser((prev) => (prev ? { ...prev, name: newName.trim() } : null));
          return { success: true };
        }
        return { success: false, error: 'Guests cannot change password. Create an account instead.' };
      }

      try {
        const userRecord = await getUserByIdFromDb(user.id);
        if (!userRecord) {
          return { success: false, error: 'User record not found.' };
        }

        const updates: Partial<UserRecord> = {};

        if (newName && newName.trim()) {
          updates.name = newName.trim();
        }

        if (newPassword) {
          if (!currentPassword) {
            return { success: false, error: 'Current password is required to change password.' };
          }
          const isCurrentValid = await verifyPassword(
            currentPassword,
            userRecord.passwordHash,
            userRecord.passwordSalt
          );
          if (!isCurrentValid) {
            return { success: false, error: 'Current password is incorrect.' };
          }

          const validation = validatePassword(newPassword);
          if (!validation.isValid) {
            return { success: false, error: validation.message };
          }

          const { hash, salt } = await hashPassword(newPassword);
          updates.passwordHash = hash;
          updates.passwordSalt = salt;
        }

        await updateUserInDb(user.id, updates);
        setUser((prev) => (prev ? { ...prev, name: updates.name || prev.name } : null));
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Failed to update profile.' };
      }
    },
    [user]
  );

  // Delete account and all associated local user data
  const deleteAccount = useCallback(async () => {
    if (!user) return;

    const userId = user.id;

    if (!user.isGuest) {
      await deleteUserDataFromDb(userId);
    }

    // Clean up namespaced localStorage keys for this user
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes(`_${userId}_`)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {}

    logout();
  }, [user, logout]);

  // Forgot password reset (demo flow: verifies email + full name)
  const forgotPasswordReset = useCallback(
    async (
      email: string,
      fullName: string,
      newPassword: string
    ): Promise<{ success: boolean; error?: string }> => {
      const normEmail = email.trim().toLowerCase();
      const normName = fullName.trim().toLowerCase();

      try {
        const userRecord = await getUserByEmailFromDb(normEmail);
        if (!userRecord) {
          return { success: false, error: 'No account found with this email address.' };
        }

        if (userRecord.name.trim().toLowerCase() !== normName) {
          return { success: false, error: 'Full name does not match our records for this account.' };
        }

        const validation = validatePassword(newPassword);
        if (!validation.isValid) {
          return { success: false, error: validation.message };
        }

        const { hash, salt } = await hashPassword(newPassword);
        await updateUserInDb(userRecord.id, {
          passwordHash: hash,
          passwordSalt: salt,
        });

        clearFailedAttempts(normEmail);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Password reset failed.' };
      }
    },
    []
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        login,
        register,
        guest,
        logout,
        updateProfile,
        deleteAccount,
        forgotPasswordReset,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

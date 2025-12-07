'use client';

/**
 * Auth Context Bridge for apps/web
 *
 * Provides authentication state to client components.
 * This is a self-contained implementation that uses the same
 * localStorage token key as the root auth module.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type UserTier = 'free' | 'intelligence' | 'apex';

export interface User {
  id: string;
  email: string;
  name?: string;
  tier: UserTier;
  createdAt: string;
  subscription?: {
    status: 'active' | 'canceled' | 'past_due';
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  };
  preferences?: {
    emailAlerts: boolean;
    priceAlertThreshold: number;
    currency: 'USD' | 'EUR' | 'GBP';
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

// ============================================================================
// CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      // Validate token and get user
      const userData = await fetchUserData(token);
      setUser(userData);
    } catch {
      localStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const mockUser = await mockSignIn(email, password);
      const token = generateMockToken(mockUser.id);
      localStorage.setItem('auth_token', token);
      setUser(mockUser);
    } catch {
      throw new Error('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    setLoading(true);
    try {
      const mockUser = await mockSignUp(email, password, name);
      const token = generateMockToken(mockUser.id);
      localStorage.setItem('auth_token', token);
      setUser(mockUser);
    } catch {
      throw new Error('Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token || !user) return;

    try {
      const userData = await fetchUserData(token);
      setUser(userData);
    } catch {
      console.error('User refresh failed');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function usePremium() {
  const { user } = useAuth();
  return {
    hasPremium: user?.tier === 'intelligence' || user?.tier === 'apex',
    hasApex: user?.tier === 'apex',
    tier: user?.tier || 'free',
  };
}

// ============================================================================
// MOCK HELPERS (Replace with real API calls in production)
// ============================================================================

async function mockSignIn(email: string, _password: string): Promise<User> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    id: 'user_' + Math.random().toString(36).substr(2, 9),
    email,
    tier: 'free',
    createdAt: new Date().toISOString(),
    preferences: {
      emailAlerts: true,
      priceAlertThreshold: 5,
      currency: 'USD',
    },
  };
}

async function mockSignUp(email: string, _password: string, name?: string): Promise<User> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    id: 'user_' + Math.random().toString(36).substr(2, 9),
    email,
    name,
    tier: 'free',
    createdAt: new Date().toISOString(),
    preferences: {
      emailAlerts: true,
      priceAlertThreshold: 5,
      currency: 'USD',
    },
  };
}

async function fetchUserData(_token: string): Promise<User> {
  return {
    id: 'user_demo',
    email: 'demo@apex-intelligence.io',
    name: 'Demo User',
    tier: 'intelligence',
    createdAt: new Date().toISOString(),
    subscription: {
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancelAtPeriodEnd: false,
    },
    preferences: {
      emailAlerts: true,
      priceAlertThreshold: 5,
      currency: 'USD',
    },
  };
}

function generateMockToken(userId: string): string {
  return `mock_token_${userId}_${Date.now()}`;
}

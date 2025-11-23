'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { analytics } from '@/lib/analytics';

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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Check for existing session
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      // Validate token and get user
      const userData = await fetchUserData(token);
      setUser(userData);

      // Track authenticated session
      analytics.track('user_session_started', {
        userId: userData.id,
        tier: userData.tier,
      });
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      // In production, this would call your auth API
      // For now, we'll use mock authentication
      const mockUser = await mockSignIn(email, password);
      const token = generateMockToken(mockUser.id);

      localStorage.setItem('auth_token', token);
      setUser(mockUser);

      analytics.track('user_signed_in', {
        userId: mockUser.id,
        method: 'email',
      });
    } catch (error) {
      throw new Error('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    setLoading(true);
    try {
      // In production, this would call your auth API
      const mockUser = await mockSignUp(email, password, name);
      const token = generateMockToken(mockUser.id);

      localStorage.setItem('auth_token', token);
      setUser(mockUser);

      analytics.track('user_signed_up', {
        userId: mockUser.id,
        tier: 'free',
      });
    } catch (error) {
      throw new Error('Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      if (user) {
        analytics.track('user_signed_out', {
          userId: user.id,
        });
      }

      localStorage.removeItem('auth_token');
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;

    try {
      // In production, this would call your API
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);

      analytics.track('user_profile_updated', {
        userId: user.id,
      });
    } catch (error) {
      throw new Error('Profile update failed');
    }
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token || !user) return;

    try {
      const userData = await fetchUserData(token);
      setUser(userData);
    } catch (error) {
      console.error('User refresh failed:', error);
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

/**
 * Hook to check if user has premium access
 */
export function usePremium() {
  const { user } = useAuth();
  return {
    hasPremium: user?.tier === 'intelligence' || user?.tier === 'apex',
    hasApex: user?.tier === 'apex',
    tier: user?.tier || 'free',
  };
}

/**
 * Mock authentication helpers
 * In production, replace these with actual API calls
 */
async function mockSignIn(email: string, password: string): Promise<User> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Mock successful sign in
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

async function mockSignUp(email: string, password: string, name?: string): Promise<User> {
  // Simulate API delay
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

async function fetchUserData(token: string): Promise<User> {
  // In production, this would validate the token and fetch user data
  // For now, return mock data
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

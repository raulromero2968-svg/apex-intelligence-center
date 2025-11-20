/**
 * Stripe Client Configuration
 *
 * Production-ready Stripe client with proper error handling and type safety.
 * Used for subscription management, checkout sessions, and webhook verification.
 */

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
  appInfo: {
    name: 'Apex Intelligence Center',
    version: '1.0.0',
  },
});

/**
 * Tier configuration mapping
 * These limits are enforced server-side in middleware and API routes
 */
export const TIER_LIMITS = {
  free: {
    watchlistLimit: 10,
    dailyApiLimit: 100,
    features: ['basic_alerts', 'public_data'],
  },
  pro: {
    watchlistLimit: 100,
    dailyApiLimit: 10000,
    features: ['basic_alerts', 'public_data', 'web_push', 'priority_feed'],
  },
  enterprise: {
    watchlistLimit: 999999,
    dailyApiLimit: 1000000,
    features: ['basic_alerts', 'public_data', 'web_push', 'priority_feed', 'dedicated_support', 'custom_integrations'],
  },
} as const;

export type SubscriptionTier = keyof typeof TIER_LIMITS;

/**
 * Helper function to get tier limits
 */
export function getTierLimits(tier: SubscriptionTier) {
  return TIER_LIMITS[tier];
}

/**
 * Check if a tier has a specific feature
 */
export function hasTierFeature(tier: SubscriptionTier, feature: string): boolean {
  return TIER_LIMITS[tier].features.includes(feature);
}

// Re-export Stripe types for convenience
export type { Stripe };

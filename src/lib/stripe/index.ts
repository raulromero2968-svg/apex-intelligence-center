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
 * SECURITY: Server-side price ID to subscription tier mapping
 *
 * This is the ONLY source of truth for mapping Stripe price IDs to subscription tiers.
 * NEVER trust tier information from client requests or metadata.
 * All tier assignments MUST go through this mapping.
 */
export const PRICE_TO_TIER_MAP: Record<string, 'free' | 'pro' | 'enterprise'> = {
  [process.env.STRIPE_PRICE_PRO_MONTHLY || '']: 'pro',
  [process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || '']: 'enterprise',
} as const;

/**
 * Maps a Stripe price ID to a subscription tier
 * Returns 'free' if price ID is not recognized
 */
export function mapPriceIdToTier(priceId: string | undefined): 'free' | 'pro' | 'enterprise' {
  if (!priceId) return 'free';
  return PRICE_TO_TIER_MAP[priceId] || 'free';
}

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

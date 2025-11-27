/**
 * Server-side Stripe SDK Wrapper
 * 
 * Centralized Stripe client with safe defaults and zero-trust configuration.
 * All Stripe operations must use this client - no raw Stripe calls elsewhere.
 */

import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

/**
 * Create and return a Stripe client instance.
 * Uses STRIPE_SECRET_KEY from environment variables.
 * 
 * @throws Error if STRIPE_SECRET_KEY is not configured
 */
export function createStripeClient(): Stripe {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error(
      'STRIPE_SECRET_KEY is not configured. ' +
      'Please set STRIPE_SECRET_KEY environment variable.'
    );
  }

  stripeClient = new Stripe(secretKey, {
    apiVersion: '2024-12-18.acacia',
    typescript: true,
    maxNetworkRetries: 2,
    timeout: 30000,
  });

  return stripeClient;
}

/**
 * Get the current Stripe client instance.
 * Creates one if it doesn't exist.
 */
export function getStripeClient(): Stripe {
  return createStripeClient();
}



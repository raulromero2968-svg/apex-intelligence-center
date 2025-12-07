/**
 * Multi-Processor Payment Abstraction Layer
 *
 * Unified API wrapper for payment processing across multiple providers.
 * Implements automatic fallback, health monitoring, and seamless switching.
 *
 * References:
 * - Payment Infrastructure Plan (December 2025)
 * - Stripe API Docs, PayPal Integration Guides
 * - Apex Antifragility Framework
 *
 * Trade-offs:
 * - GOOD: Diversification mitigates processor termination risk
 * - BAD: Multiple integrations increase complexity
 */

import Stripe from 'stripe';
import * as Sentry from '@sentry/nextjs';

import {
  type PaymentProcessor,
  type Customer,
  type Subscription,
  type CheckoutSession,
  type ProcessorHealth,
  type PaymentError,
  type PaymentErrorType,
  type SubscriptionTier,
  type ProcessorConfig,
} from './types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const PAYMENT_CONFIG = {
  /** Processor priority (lower = higher priority) */
  PROCESSORS: [
    { processor: 'stripe' as PaymentProcessor, priority: 1, isEnabled: true },
    { processor: 'paypal' as PaymentProcessor, priority: 2, isEnabled: true },
    { processor: 'crypto' as PaymentProcessor, priority: 3, isEnabled: false },
  ] as ProcessorConfig[],
  /** Retry configuration */
  RETRY: {
    maxAttempts: 2,
    baseDelayMs: 500,
    maxDelayMs: 5000,
  },
  /** Health check interval */
  HEALTH_CHECK_INTERVAL_MS: 300000, // 5 minutes
};

// ============================================================================
// PROCESSOR HEALTH TRACKING
// ============================================================================

const processorHealthMap = new Map<PaymentProcessor, ProcessorHealth>();

function initializeHealthTracking() {
  const processors: PaymentProcessor[] = ['stripe', 'paypal', 'crypto'];
  for (const processor of processors) {
    processorHealthMap.set(processor, {
      processor,
      isHealthy: true,
      lastChecked: new Date(),
      successRate: 1.0,
    });
  }
}

initializeHealthTracking();

function updateProcessorHealth(
  processor: PaymentProcessor,
  success: boolean,
  error?: string
) {
  const health = processorHealthMap.get(processor);
  if (!health) return;

  const alpha = 0.1;
  health.successRate = health.successRate * (1 - alpha) + (success ? 1 : 0) * alpha;
  health.lastChecked = new Date();
  health.isHealthy = health.successRate > 0.5;
  if (error) health.lastError = error;
}

// ============================================================================
// STRIPE CLIENT
// ============================================================================

let stripeClient: Stripe | null = null;

function getStripeClient(): Stripe {
  if (!stripeClient) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
      typescript: true,
      appInfo: {
        name: 'Apex Intelligence Center',
        version: '1.0.0',
      },
      maxNetworkRetries: 2,
      timeout: 30000,
    });
  }
  return stripeClient;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

function classifyPaymentError(
  error: unknown,
  processor: PaymentProcessor
): PaymentError {
  const err = error as Error & {
    type?: string;
    code?: string;
    decline_code?: string;
    statusCode?: number;
  };

  let type: PaymentErrorType = 'unknown';
  let retryable = false;

  if (err.type === 'StripeCardError' || err.code === 'card_declined') {
    type = 'card_declined';
    retryable = false;
  } else if (err.decline_code === 'insufficient_funds') {
    type = 'insufficient_funds';
    retryable = false;
  } else if (err.code === 'expired_card') {
    type = 'expired_card';
    retryable = false;
  } else if (err.type === 'StripeAPIError' || err.statusCode === 500) {
    type = 'processing_error';
    retryable = true;
  } else if (err.type === 'StripeAuthenticationError') {
    type = 'invalid_request';
    retryable = false;
  } else if (err.type === 'StripeRateLimitError' || err.statusCode === 429) {
    type = 'rate_limited';
    retryable = true;
  } else if (err.type === 'StripeConnectionError') {
    type = 'processor_unavailable';
    retryable = true;
  }

  const paymentError = new Error(err.message) as PaymentError;
  paymentError.type = type;
  paymentError.processor = processor;
  paymentError.code = err.code;
  paymentError.declineCode = err.decline_code;
  paymentError.retryable = retryable;

  return paymentError;
}

// ============================================================================
// PRICE/TIER MAPPING
// ============================================================================

/**
 * Server-side price ID to tier mapping
 * This is the ONLY source of truth for tier assignments
 */
const PRICE_TO_TIER_MAP: Record<string, SubscriptionTier> = {
  [process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro']: 'pro',
  [process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || 'price_enterprise']: 'enterprise',
};

const TIER_TO_PRICE_MAP: Record<SubscriptionTier, string | null> = {
  free: null,
  pro: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro',
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || 'price_enterprise',
};

export function mapPriceIdToTier(priceId: string | undefined): SubscriptionTier {
  if (!priceId) return 'free';
  return PRICE_TO_TIER_MAP[priceId] || 'free';
}

export function mapTierToPriceId(tier: SubscriptionTier): string | null {
  return TIER_TO_PRICE_MAP[tier];
}

// ============================================================================
// STRIPE IMPLEMENTATION
// ============================================================================

async function stripeCreateCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<Customer> {
  const stripe = getStripeClient();

  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { userId },
  });

  return {
    id: customer.id,
    userId,
    email,
    name,
    processor: 'stripe',
    processorCustomerId: customer.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

async function stripeCreateCheckoutSession(
  customerId: string,
  tier: SubscriptionTier,
  successUrl: string,
  cancelUrl: string
): Promise<CheckoutSession> {
  const stripe = getStripeClient();
  const priceId = mapTierToPriceId(tier);

  if (!priceId) {
    throw new Error('Cannot create checkout for free tier');
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { tier },
  });

  return {
    id: session.id,
    processor: 'stripe',
    processorSessionId: session.id,
    url: session.url!,
    customerId,
    tier,
    priceId,
    expiresAt: new Date(session.expires_at * 1000),
  };
}

async function stripeGetSubscription(
  subscriptionId: string
): Promise<Subscription | null> {
  const stripe = getStripeClient();

  try {
    const sub = await stripe.subscriptions.retrieve(subscriptionId);

    return {
      id: sub.id,
      customerId: sub.customer as string,
      processor: 'stripe',
      processorSubscriptionId: sub.id,
      tier: mapPriceIdToTier(sub.items.data[0]?.price.id),
      status: sub.status as Subscription['status'],
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      priceId: sub.items.data[0]?.price.id || '',
      amount: sub.items.data[0]?.price.unit_amount || 0,
      currency: sub.currency,
      createdAt: new Date(sub.created * 1000),
      updatedAt: new Date(),
    };
  } catch {
    return null;
  }
}

async function stripeCancelSubscription(
  subscriptionId: string,
  immediately: boolean = false
): Promise<Subscription | null> {
  const stripe = getStripeClient();

  const sub = immediately
    ? await stripe.subscriptions.cancel(subscriptionId)
    : await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });

  return {
    id: sub.id,
    customerId: sub.customer as string,
    processor: 'stripe',
    processorSubscriptionId: sub.id,
    tier: mapPriceIdToTier(sub.items.data[0]?.price.id),
    status: sub.status as Subscription['status'],
    currentPeriodStart: new Date(sub.current_period_start * 1000),
    currentPeriodEnd: new Date(sub.current_period_end * 1000),
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    priceId: sub.items.data[0]?.price.id || '',
    amount: sub.items.data[0]?.price.unit_amount || 0,
    currency: sub.currency,
    createdAt: new Date(sub.created * 1000),
    updatedAt: new Date(),
  };
}

// ============================================================================
// PAYPAL IMPLEMENTATION (STUB - TO BE IMPLEMENTED)
// ============================================================================

async function paypalCreateCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<Customer> {
  // PayPal uses email as primary identifier
  // In production, this would create/retrieve PayPal customer via REST API
  return {
    id: `paypal_${userId}`,
    userId,
    email,
    name,
    processor: 'paypal',
    processorCustomerId: email, // PayPal uses email
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

async function paypalCreateCheckoutSession(
  customerId: string,
  tier: SubscriptionTier,
  successUrl: string,
  cancelUrl: string
): Promise<CheckoutSession> {
  // In production, this would create a PayPal subscription via REST API
  // For now, throw to trigger fallback to Stripe
  throw new Error('PayPal checkout not yet implemented');
}

// ============================================================================
// PROCESSOR SELECTION
// ============================================================================

function selectProcessor(
  excludeProcessors: PaymentProcessor[] = []
): PaymentProcessor | null {
  const available = PAYMENT_CONFIG.PROCESSORS
    .filter(p => p.isEnabled && !excludeProcessors.includes(p.processor))
    .filter(p => processorHealthMap.get(p.processor)?.isHealthy)
    .sort((a, b) => a.priority - b.priority);

  return available.length > 0 ? available[0].processor : null;
}

// ============================================================================
// PUBLIC API - WITH FALLBACK
// ============================================================================

/**
 * Create a customer across payment processors with fallback
 */
export async function createCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<Customer> {
  const excludedProcessors: PaymentProcessor[] = [];

  while (excludedProcessors.length < PAYMENT_CONFIG.PROCESSORS.length) {
    const processor = selectProcessor(excludedProcessors);

    if (!processor) {
      throw new Error('No payment processors available');
    }

    try {
      let customer: Customer;

      switch (processor) {
        case 'stripe':
          customer = await stripeCreateCustomer(userId, email, name);
          break;
        case 'paypal':
          customer = await paypalCreateCustomer(userId, email, name);
          break;
        default:
          throw new Error(`Unsupported processor: ${processor}`);
      }

      updateProcessorHealth(processor, true);
      return customer;
    } catch (error) {
      const paymentError = classifyPaymentError(error, processor);
      updateProcessorHealth(processor, false, paymentError.message);

      if (!paymentError.retryable) {
        throw paymentError;
      }

      excludedProcessors.push(processor);
      console.warn(`[PAYMENTS] Processor ${processor} failed, trying fallback`);

      Sentry.captureException(error, {
        tags: { component: 'payments', processor },
      });
    }
  }

  throw new Error('All payment processors failed');
}

/**
 * Create checkout session with fallback
 */
export async function createCheckoutSession(
  customerId: string,
  tier: SubscriptionTier,
  successUrl: string,
  cancelUrl: string
): Promise<CheckoutSession> {
  const excludedProcessors: PaymentProcessor[] = [];

  while (excludedProcessors.length < PAYMENT_CONFIG.PROCESSORS.length) {
    const processor = selectProcessor(excludedProcessors);

    if (!processor) {
      throw new Error('No payment processors available');
    }

    try {
      let session: CheckoutSession;

      switch (processor) {
        case 'stripe':
          session = await stripeCreateCheckoutSession(
            customerId,
            tier,
            successUrl,
            cancelUrl
          );
          break;
        case 'paypal':
          session = await paypalCreateCheckoutSession(
            customerId,
            tier,
            successUrl,
            cancelUrl
          );
          break;
        default:
          throw new Error(`Unsupported processor: ${processor}`);
      }

      updateProcessorHealth(processor, true);
      return session;
    } catch (error) {
      const paymentError = classifyPaymentError(error, processor);
      updateProcessorHealth(processor, false, paymentError.message);

      excludedProcessors.push(processor);
      console.warn(`[PAYMENTS] Processor ${processor} failed, trying fallback`);
    }
  }

  throw new Error('All payment processors failed');
}

/**
 * Get subscription by ID
 */
export async function getSubscription(
  subscriptionId: string,
  processor: PaymentProcessor = 'stripe'
): Promise<Subscription | null> {
  try {
    switch (processor) {
      case 'stripe':
        return await stripeGetSubscription(subscriptionId);
      case 'paypal':
        // PayPal implementation would go here
        return null;
      default:
        return null;
    }
  } catch (error) {
    console.error('[PAYMENTS] Error getting subscription:', error);
    return null;
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  processor: PaymentProcessor = 'stripe',
  immediately: boolean = false
): Promise<Subscription | null> {
  try {
    switch (processor) {
      case 'stripe':
        return await stripeCancelSubscription(subscriptionId, immediately);
      case 'paypal':
        // PayPal implementation would go here
        return null;
      default:
        return null;
    }
  } catch (error) {
    console.error('[PAYMENTS] Error cancelling subscription:', error);
    Sentry.captureException(error, {
      tags: { component: 'payments', operation: 'cancel' },
    });
    return null;
  }
}

/**
 * Get processor health status
 */
export function getProcessorHealth(): ProcessorHealth[] {
  return Array.from(processorHealthMap.values());
}

/**
 * Check if a processor is available
 */
export function isProcessorAvailable(processor: PaymentProcessor): boolean {
  const config = PAYMENT_CONFIG.PROCESSORS.find(p => p.processor === processor);
  const health = processorHealthMap.get(processor);
  return config?.isEnabled && health?.isHealthy || false;
}

/**
 * Verify webhook signature
 */
export async function verifyWebhook(
  processor: PaymentProcessor,
  payload: string | Buffer,
  signature: string
): Promise<boolean> {
  try {
    switch (processor) {
      case 'stripe': {
        const stripe = getStripeClient();
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!webhookSecret) return false;

        stripe.webhooks.constructEvent(payload, signature, webhookSecret);
        return true;
      }
      case 'paypal':
        // PayPal webhook verification would go here
        return false;
      default:
        return false;
    }
  } catch {
    return false;
  }
}

// Export types
export type { PaymentProcessor, Customer, Subscription, CheckoutSession };

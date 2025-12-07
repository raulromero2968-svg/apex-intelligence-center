/**
 * Payment Infrastructure Types
 *
 * Unified type definitions for multi-processor payment abstraction.
 * Supports Stripe (primary), PayPal (backup), and crypto (optional).
 *
 * References:
 * - Payment Infrastructure Plan (December 2025)
 * - Stripe API Docs, PayPal Integration Guides
 * - Apex Antifragility Framework (processor independence)
 */

/**
 * Supported payment processors
 * Priority: Stripe (primary) -> PayPal (backup) -> Crypto (optional)
 */
export type PaymentProcessor = 'stripe' | 'paypal' | 'crypto';

/**
 * Payment status
 */
export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'refunded';

/**
 * Subscription status
 */
export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'cancelled'
  | 'unpaid'
  | 'trialing';

/**
 * Subscription tier (matches existing tier system)
 */
export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

/**
 * Customer information
 */
export interface Customer {
  id: string;
  userId: string;
  email: string;
  name?: string;
  processor: PaymentProcessor;
  processorCustomerId: string;
  defaultPaymentMethod?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Subscription information
 */
export interface Subscription {
  id: string;
  customerId: string;
  processor: PaymentProcessor;
  processorSubscriptionId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  priceId: string;
  amount: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Payment/Transaction information
 */
export interface Payment {
  id: string;
  customerId: string;
  processor: PaymentProcessor;
  processorPaymentId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  description?: string;
  metadata?: Record<string, string>;
  refundedAmount?: number;
  failureReason?: string;
  createdAt: Date;
}

/**
 * Checkout session for initiating payments
 */
export interface CheckoutSession {
  id: string;
  processor: PaymentProcessor;
  processorSessionId: string;
  url: string;
  customerId: string;
  tier: SubscriptionTier;
  priceId: string;
  expiresAt: Date;
}

/**
 * Payment method information
 */
export interface PaymentMethod {
  id: string;
  processor: PaymentProcessor;
  processorMethodId: string;
  type: 'card' | 'paypal' | 'crypto';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

/**
 * Processor health status
 */
export interface ProcessorHealth {
  processor: PaymentProcessor;
  isHealthy: boolean;
  lastChecked: Date;
  lastError?: string;
  successRate: number;
}

/**
 * Error types for payment processing
 */
export type PaymentErrorType =
  | 'card_declined'
  | 'insufficient_funds'
  | 'expired_card'
  | 'processing_error'
  | 'invalid_request'
  | 'authentication_required'
  | 'rate_limited'
  | 'processor_unavailable'
  | 'unknown';

/**
 * Structured payment error
 */
export interface PaymentError extends Error {
  type: PaymentErrorType;
  processor: PaymentProcessor;
  code?: string;
  declineCode?: string;
  retryable: boolean;
}

/**
 * Webhook event from processors
 */
export interface WebhookEvent {
  processor: PaymentProcessor;
  type: string;
  processorEventId: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Refund request
 */
export interface RefundRequest {
  paymentId: string;
  amount?: number; // Partial refund if specified
  reason?: string;
}

/**
 * Refund result
 */
export interface Refund {
  id: string;
  paymentId: string;
  processor: PaymentProcessor;
  processorRefundId: string;
  amount: number;
  status: 'pending' | 'succeeded' | 'failed';
  reason?: string;
  createdAt: Date;
}

/**
 * Processor configuration
 */
export interface ProcessorConfig {
  processor: PaymentProcessor;
  isEnabled: boolean;
  priority: number; // Lower = higher priority
  webhookSecret?: string;
}

/**
 * RC (Reputation Credit) transaction types
 */
export type RcTransactionType =
  | 'earn'
  | 'spend'
  | 'transfer_in'
  | 'transfer_out'
  | 'adjustment'
  | 'refund';

/**
 * RC transaction for double-entry accounting
 */
export interface RcTransaction {
  id: string;
  userId: string;
  type: RcTransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  relatedEntityType?: 'resource' | 'proposal' | 'collection' | 'user';
  relatedEntityId?: string;
  createdAt: Date;
}

/**
 * RC earning limits (anti-inflation)
 */
export interface RcEarningLimits {
  dailyLimit: number;
  perActionLimits: Record<string, number>;
  cooldownSeconds: Record<string, number>;
}

/**
 * Default RC earning limits
 */
export const DEFAULT_RC_LIMITS: RcEarningLimits = {
  dailyLimit: 100,
  perActionLimits: {
    create_resource: 10,
    vote_resource: 1,
    download_resource: 0.5,
    create_collection: 5,
    create_proposal: 2,
    vote_proposal: 0.5,
    referral: 20,
  },
  cooldownSeconds: {
    vote_resource: 60, // 1 vote per minute
    download_resource: 10,
    vote_proposal: 60,
  },
};

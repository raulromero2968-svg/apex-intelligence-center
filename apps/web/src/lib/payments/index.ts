/**
 * Payment Infrastructure Module
 *
 * Multi-processor payment abstraction with:
 * - Stripe (primary) and PayPal (backup) support
 * - Automatic fallback on processor failure
 * - RC economy with double-entry accounting
 * - Fraud prevention and risk assessment
 *
 * Usage:
 * ```typescript
 * import {
 *   createCustomer,
 *   createCheckoutSession,
 *   earnRC,
 *   spendRC,
 *   assessRisk,
 * } from '@/lib/payments';
 *
 * // Create customer with auto-fallback
 * const customer = await createCustomer(userId, email, name);
 *
 * // Create subscription checkout
 * const session = await createCheckoutSession(
 *   customer.id,
 *   'pro',
 *   successUrl,
 *   cancelUrl
 * );
 *
 * // Earn RC with anti-inflation limits
 * const result = await earnRC(userId, 'resource_created', 'resource', resourceId);
 *
 * // Assess fraud risk before high-value transactions
 * const risk = await assessRisk(userId, ipAddress, 'payment', amount);
 * ```
 *
 * References:
 * - Payment Infrastructure Plan (December 2025)
 * - Apex Antifragility Framework
 */

// Payment provider abstraction
export {
  createCustomer,
  createCheckoutSession,
  getSubscription,
  cancelSubscription,
  getProcessorHealth,
  isProcessorAvailable,
  verifyWebhook,
  mapPriceIdToTier,
  mapTierToPriceId,
} from './payment-provider';

// RC Economy
export {
  earnRC,
  spendRC,
  transferRC,
  adjustRC,
  getUserRCBalance,
  getTransactionHistory,
  getEconomyStats,
  checkEarningEligibility,
} from './rc-economy';

// Fraud Prevention
export {
  assessRisk,
  checkTransactionVelocity,
  checkFailedPaymentVelocity,
  recordFailedPayment,
  checkKnownDevice,
  checkIpReputation,
  checkSignupVelocity,
  recordChargeback,
  addToReviewQueue,
  getReviewQueue,
  generateFingerprintHash,
} from './fraud-prevention';

// Types
export type {
  PaymentProcessor,
  PaymentStatus,
  SubscriptionStatus,
  SubscriptionTier,
  Customer,
  Subscription,
  Payment,
  CheckoutSession,
  PaymentMethod,
  ProcessorHealth,
  PaymentError,
  PaymentErrorType,
  WebhookEvent,
  RefundRequest,
  Refund,
  RcTransaction,
  RcTransactionType,
  RcEarningLimits,
} from './types';

export type {
  RiskLevel,
  RiskAssessment,
  RiskFactor,
  DeviceFingerprint,
  FraudEvent,
} from './fraud-prevention';

// Constants
export { DEFAULT_RC_LIMITS } from './types';

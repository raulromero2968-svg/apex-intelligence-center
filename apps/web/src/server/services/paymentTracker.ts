/**
 * Payment Tracker Service
 *
 * Real-time payment tracking with Redis + PostgreSQL sync.
 *
 * Architecture:
 * - Redis: Real-time spend limit enforcement (atomic operations)
 * - PostgreSQL: Durable audit trail and transaction history
 * - Two-phase commit pattern: Reserve in Redis → Process payment → Commit to DB
 *
 * Flow:
 * 1. reservePayment() - Atomically reserve amount in Redis
 * 2. Process payment via Stripe/on-chain (external system)
 * 3. confirmPayment() - Commit to database and finalize
 * 4. If payment fails: rollbackPayment() - Refund Redis reservation
 *
 * Guarantees:
 * - No double-spending even under 100+ concurrent requests
 * - All transactions logged to database for audit
 * - All violations logged for security monitoring
 */

import { db } from '../../db';
import { paymentTransactions, spendLimitViolations } from '@apex/db';
import {
  initializeRedis,
  getCurrentSpend,
  checkSpendLimit,
  reserveSpend,
  refundSpend,
  createSpendLimitError,
  type SpendCheckResult,
  type ReserveSpendResult,
} from '@apex/compliance';
import * as Sentry from '@sentry/nextjs';

// ============================================================================
// Types
// ============================================================================

export interface PaymentReservation {
  reservationId: string;
  userId: string;
  amount: number;
  paymentSource: 'stripe' | 'on-chain';
  allowed: boolean;
  spendState: ReserveSpendResult;
}

export interface PaymentConfirmation {
  transactionId: string;
  userId: string;
  amount: number;
  paymentSource: 'stripe' | 'on-chain';
  status: 'completed' | 'failed' | 'refunded';
  externalId?: string; // Stripe payment intent ID or on-chain tx hash
}

export interface ViolationContext {
  userId: string;
  attemptedAmount: number;
  currentDailySpend: number;
  currentWeeklySpend: number;
  violationType: 'daily' | 'weekly' | 'both';
  paymentSource: 'stripe' | 'on-chain';
  ipAddress?: string;
  userAgent?: string;
  requestPath?: string;
}

// ============================================================================
// Service Initialization
// ============================================================================

let isInitialized = false;

/**
 * Initialize payment tracker service
 *
 * MUST be called at application startup before processing any payments.
 */
export function initializePaymentTracker() {
  if (isInitialized) {
    return;
  }

  try {
    // Initialize Redis client for spend limit enforcement
    initializeRedis();
    isInitialized = true;

    Sentry.addBreadcrumb({
      category: 'payment-tracker',
      level: 'info',
      message: 'Payment tracker service initialized',
    });

    console.log('[PaymentTracker] Service initialized successfully');
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        component: 'payment-tracker',
        action: 'initialization',
      },
    });

    console.error('[PaymentTracker] Failed to initialize:', error);
    throw new Error('Failed to initialize payment tracker service');
  }
}

// ============================================================================
// Public API: Payment Lifecycle
// ============================================================================

/**
 * Reserve payment amount (Phase 1: Atomic Redis check)
 *
 * Call this BEFORE processing any payment (Stripe or on-chain).
 * Only proceed with payment if result.allowed === true.
 *
 * @param userId - User attempting payment
 * @param amount - Payment amount in USD
 * @param paymentSource - 'stripe' or 'on-chain'
 * @returns Reservation result with unique ID
 *
 * @example
 * ```ts
 * const reservation = await reservePayment(userId, 25.00, 'stripe');
 * if (!reservation.allowed) {
 *   throw new Error('Spend limit exceeded');
 * }
 *
 * try {
 *   const stripeIntent = await stripe.paymentIntents.create({...});
 *   await confirmPayment(reservation, stripeIntent.id);
 * } catch (error) {
 *   await rollbackPayment(reservation);
 *   throw error;
 * }
 * ```
 */
export async function reservePayment(
  userId: string,
  amount: number,
  paymentSource: 'stripe' | 'on-chain'
): Promise<PaymentReservation> {
  if (!isInitialized) {
    throw new Error('Payment tracker not initialized. Call initializePaymentTracker() first.');
  }

  try {
    // Validate inputs
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid userId');
    }
    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error('Invalid amount');
    }

    // Atomically reserve spend in Redis (race-condition proof)
    const spendState = await reserveSpend(userId, amount);

    const reservationId = `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const reservation: PaymentReservation = {
      reservationId,
      userId,
      amount,
      paymentSource,
      allowed: spendState.reserved || false,
      spendState,
    };

    // Log reservation attempt
    Sentry.addBreadcrumb({
      category: 'payment-tracker',
      level: spendState.reserved ? 'info' : 'warning',
      message: spendState.reserved ? 'Payment reserved' : 'Payment blocked - limit exceeded',
      data: {
        userId,
        amount,
        paymentSource,
        reservationId,
        dailySpend: spendState.currentDailySpend,
        weeklySpend: spendState.currentWeeklySpend,
      },
    });

    return reservation;
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        component: 'payment-tracker',
        action: 'reserve',
      },
      extra: {
        userId,
        amount,
        paymentSource,
      },
    });

    console.error('[PaymentTracker] Reserve failed:', error);
    throw error;
  }
}

/**
 * Confirm payment completion (Phase 2: Commit to database)
 *
 * Call this AFTER payment successfully processes via Stripe/on-chain.
 * Records transaction to database for audit trail.
 *
 * @param reservation - Reservation from reservePayment()
 * @param externalId - Stripe payment intent ID or on-chain tx hash
 * @param metadata - Optional additional context (JSON serializable)
 */
export async function confirmPayment(
  reservation: PaymentReservation,
  externalId: string,
  metadata?: Record<string, any>
): Promise<PaymentConfirmation> {
  if (!isInitialized) {
    throw new Error('Payment tracker not initialized.');
  }

  try {
    // Insert completed transaction to database
    const [transaction] = await db.insert(paymentTransactions).values({
      userId: reservation.userId,
      amount: reservation.amount.toFixed(2),
      currency: 'USD',
      paymentSource: reservation.paymentSource,
      status: 'completed',
      stripePaymentIntentId: reservation.paymentSource === 'stripe' ? externalId : null,
      onChainTxHash: reservation.paymentSource === 'on-chain' ? externalId : null,
      dailySpendBefore: reservation.spendState.currentDailySpend.toFixed(2),
      weeklySpendBefore: reservation.spendState.currentWeeklySpend.toFixed(2),
      wasBlocked: 0,
      metadata: metadata ? JSON.stringify(metadata) : null,
      completedAt: new Date(),
    }).returning();

    Sentry.addBreadcrumb({
      category: 'payment-tracker',
      level: 'info',
      message: 'Payment confirmed',
      data: {
        transactionId: transaction.id,
        userId: reservation.userId,
        amount: reservation.amount,
        paymentSource: reservation.paymentSource,
        externalId,
      },
    });

    console.log(`[PaymentTracker] Payment confirmed: ${transaction.id}`);

    return {
      transactionId: transaction.id,
      userId: reservation.userId,
      amount: reservation.amount,
      paymentSource: reservation.paymentSource,
      status: 'completed',
      externalId,
    };
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        component: 'payment-tracker',
        action: 'confirm',
      },
      extra: {
        reservation,
        externalId,
      },
    });

    console.error('[PaymentTracker] Confirm failed:', error);
    throw error;
  }
}

/**
 * Rollback payment reservation (cleanup on payment failure)
 *
 * Call this if payment fails AFTER reservePayment() was successful.
 * Refunds the reserved amount in Redis so user can retry.
 *
 * @param reservation - Reservation to rollback
 * @param failureReason - Why the payment failed
 */
export async function rollbackPayment(
  reservation: PaymentReservation,
  failureReason?: string
): Promise<void> {
  if (!isInitialized) {
    throw new Error('Payment tracker not initialized.');
  }

  try {
    // Refund reserved amount in Redis
    await refundSpend(reservation.userId, reservation.amount);

    // Log failed transaction to database (for fraud detection)
    await db.insert(paymentTransactions).values({
      userId: reservation.userId,
      amount: reservation.amount.toFixed(2),
      currency: 'USD',
      paymentSource: reservation.paymentSource,
      status: 'failed',
      failureReason: failureReason || 'Payment processing failed',
      dailySpendBefore: reservation.spendState.currentDailySpend.toFixed(2),
      weeklySpendBefore: reservation.spendState.currentWeeklySpend.toFixed(2),
      wasBlocked: 0,
    });

    Sentry.addBreadcrumb({
      category: 'payment-tracker',
      level: 'warning',
      message: 'Payment rolled back',
      data: {
        userId: reservation.userId,
        amount: reservation.amount,
        paymentSource: reservation.paymentSource,
        reason: failureReason,
      },
    });

    console.log(`[PaymentTracker] Payment rolled back: ${reservation.reservationId}`);
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        component: 'payment-tracker',
        action: 'rollback',
      },
      extra: {
        reservation,
        failureReason,
      },
    });

    console.error('[PaymentTracker] Rollback failed:', error);
    // Don't throw - rollback failure is non-critical
  }
}

/**
 * Log spend limit violation (security monitoring)
 *
 * Automatically logs violations to database for fraud detection.
 * Call this when a payment is blocked by spend limits.
 *
 * @param context - Violation context with user and request details
 */
export async function logViolation(context: ViolationContext): Promise<void> {
  if (!isInitialized) {
    return; // Non-critical, skip if not initialized
  }

  try {
    await db.insert(spendLimitViolations).values({
      userId: context.userId,
      attemptedAmount: context.attemptedAmount.toFixed(2),
      currentDailySpend: context.currentDailySpend.toFixed(2),
      currentWeeklySpend: context.currentWeeklySpend.toFixed(2),
      violationType: context.violationType,
      paymentSource: context.paymentSource,
      ipAddress: context.ipAddress || null,
      userAgent: context.userAgent || null,
      requestPath: context.requestPath || null,
    });

    // Also log blocked transaction for audit trail
    await db.insert(paymentTransactions).values({
      userId: context.userId,
      amount: context.attemptedAmount.toFixed(2),
      currency: 'USD',
      paymentSource: context.paymentSource,
      status: 'failed',
      failureReason: `Spend limit exceeded: ${context.violationType}`,
      dailySpendBefore: context.currentDailySpend.toFixed(2),
      weeklySpendBefore: context.currentWeeklySpend.toFixed(2),
      wasBlocked: 1,
    });

    Sentry.addBreadcrumb({
      category: 'payment-tracker',
      level: 'warning',
      message: 'Spend limit violation logged',
      data: {
        userId: context.userId,
        attemptedAmount: context.attemptedAmount,
        violationType: context.violationType,
      },
    });

    console.log(`[PaymentTracker] Violation logged for user ${context.userId}`);
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        component: 'payment-tracker',
        action: 'log-violation',
      },
      extra: context,
    });

    console.error('[PaymentTracker] Failed to log violation:', error);
    // Don't throw - logging failure is non-critical
  }
}

// ============================================================================
// Query API: Get Spend Information
// ============================================================================

/**
 * Get current spend state for a user (read-only)
 *
 * Use this for displaying spend limits in UI.
 *
 * @param userId - User ID to query
 * @returns Current spend totals and remaining amounts
 */
export async function getUserSpend(userId: string): Promise<SpendCheckResult> {
  if (!isInitialized) {
    throw new Error('Payment tracker not initialized.');
  }

  try {
    return await getCurrentSpend(userId);
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        component: 'payment-tracker',
        action: 'get-spend',
      },
      extra: { userId },
    });

    console.error('[PaymentTracker] Failed to get user spend:', error);
    throw error;
  }
}

/**
 * Check if payment would be allowed (read-only simulation)
 *
 * Use this before showing payment UI to pre-validate.
 *
 * @param userId - User ID to check
 * @param amount - Payment amount in USD
 * @returns Whether payment would be allowed and current spend state
 */
export async function checkPaymentAllowed(
  userId: string,
  amount: number
): Promise<SpendCheckResult> {
  if (!isInitialized) {
    throw new Error('Payment tracker not initialized.');
  }

  try {
    return await checkSpendLimit(userId, amount);
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        component: 'payment-tracker',
        action: 'check-payment',
      },
      extra: { userId, amount },
    });

    console.error('[PaymentTracker] Failed to check payment:', error);
    throw error;
  }
}

// ============================================================================
// Admin API: Manual Overrides (use with caution)
// ============================================================================

/**
 * Manually record a payment (ADMIN ONLY)
 *
 * Use this to manually record external payments that bypassed the normal flow.
 * WARNING: Does NOT enforce spend limits. Only use for data correction.
 *
 * @param userId - User ID
 * @param amount - Amount in USD
 * @param paymentSource - Payment source
 * @param externalId - External transaction ID
 */
export async function recordManualPayment(
  userId: string,
  amount: number,
  paymentSource: 'stripe' | 'on-chain',
  externalId: string,
  metadata?: Record<string, any>
): Promise<void> {
  if (!isInitialized) {
    throw new Error('Payment tracker not initialized.');
  }

  try {
    await db.insert(paymentTransactions).values({
      userId,
      amount: amount.toFixed(2),
      currency: 'USD',
      paymentSource,
      status: 'completed',
      stripePaymentIntentId: paymentSource === 'stripe' ? externalId : null,
      onChainTxHash: paymentSource === 'on-chain' ? externalId : null,
      description: 'Manual entry (admin)',
      metadata: metadata ? JSON.stringify(metadata) : null,
      wasBlocked: 0,
      completedAt: new Date(),
    });

    Sentry.addBreadcrumb({
      category: 'payment-tracker',
      level: 'warning',
      message: 'Manual payment recorded (ADMIN)',
      data: { userId, amount, paymentSource, externalId },
    });

    console.log(`[PaymentTracker] Manual payment recorded for user ${userId}`);
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        component: 'payment-tracker',
        action: 'manual-record',
      },
      extra: { userId, amount, paymentSource, externalId },
    });

    console.error('[PaymentTracker] Failed to record manual payment:', error);
    throw error;
  }
}

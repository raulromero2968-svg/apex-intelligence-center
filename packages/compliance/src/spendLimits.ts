/**
 * Spend Limits Compliance Middleware
 *
 * Provides middleware and utilities for enforcing spend limits across the application.
 * Can be used in API routes, Stripe webhooks, and on-chain payment handlers.
 *
 * Features:
 * - Pre-payment validation
 * - Concurrent payment handling
 * - Automatic limit enforcement
 * - Detailed error messages
 */

import type { NextRequest } from 'next/server';

/**
 * Spend limit configuration
 */
export const SPEND_LIMITS = {
  DAILY: 50,    // $50 in 24h rolling window
  WEEKLY: 200,  // $200 in 7d rolling window
} as const;

/**
 * Spend limit error class
 */
export class SpendLimitError extends Error {
  public readonly limitType: 'daily' | 'weekly';
  public readonly amountRequested: number;
  public readonly currentSpend: number;
  public readonly limit: number;
  public readonly remaining: number;

  constructor(
    limitType: 'daily' | 'weekly',
    amountRequested: number,
    currentSpend: number,
    limit: number,
    remaining: number
  ) {
    const message = `Payment of $${amountRequested.toFixed(2)} would exceed ${limitType} limit of $${limit}. Current ${limitType} spend: $${currentSpend.toFixed(2)}, remaining: $${remaining.toFixed(2)}.`;
    super(message);
    this.name = 'SpendLimitError';
    this.limitType = limitType;
    this.amountRequested = amountRequested;
    this.currentSpend = currentSpend;
    this.limit = limit;
    this.remaining = remaining;
  }

  toJSON() {
    return {
      error: 'SPEND_LIMIT_EXCEEDED',
      message: this.message,
      limitType: this.limitType,
      amountRequested: this.amountRequested,
      currentSpend: this.currentSpend,
      limit: this.limit,
      remaining: this.remaining,
    };
  }
}

/**
 * Payment validation result
 */
export interface PaymentValidation {
  allowed: boolean;
  error?: SpendLimitError;
  dailySpent: number;
  weeklySpent: number;
  dailyRemaining: number;
  weeklyRemaining: number;
}

/**
 * Extract user ID from request
 * This is a placeholder - implement based on your auth system
 */
export function extractUserIdFromRequest(req: NextRequest): string | null {
  // Try to get from Authorization header (JWT)
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      // Decode JWT without verification (just to get userId)
      // In production, use proper JWT verification
      const payload = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString()
      );
      return payload.userId || payload.sub || null;
    } catch {
      // Invalid token format
    }
  }

  // Try to get from cookie
  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    // Try session cookie
    if (cookies.session) {
      try {
        // Decode session
        const session = JSON.parse(
          Buffer.from(cookies.session, 'base64').toString()
        );
        return session.userId || null;
      } catch {
        // Invalid session format
      }
    }
  }

  return null;
}

/**
 * Validate payment amount against spend limits
 *
 * This is the core validation function that should be called before processing any payment.
 *
 * @param userId - User ID
 * @param amountUsd - Payment amount in USD
 * @param checkSpendLimitFn - Function to check spend limits (injected for testability)
 * @returns Validation result
 */
export async function validatePayment(
  userId: string,
  amountUsd: number,
  checkSpendLimitFn: (
    userId: string,
    amount: number
  ) => Promise<{
    allowed: boolean;
    dailySpent: number;
    weeklySpent: number;
    dailyRemaining: number;
    weeklyRemaining: number;
    limitType?: 'daily' | 'weekly';
    message?: string;
  }>
): Promise<PaymentValidation> {
  const result = await checkSpendLimitFn(userId, amountUsd);

  if (!result.allowed) {
    const limitType = result.limitType || 'daily';
    const limit = limitType === 'daily' ? SPEND_LIMITS.DAILY : SPEND_LIMITS.WEEKLY;
    const currentSpend = limitType === 'daily' ? result.dailySpent : result.weeklySpent;
    const remaining = limitType === 'daily' ? result.dailyRemaining : result.weeklyRemaining;

    const error = new SpendLimitError(
      limitType,
      amountUsd,
      currentSpend,
      limit,
      remaining
    );

    return {
      allowed: false,
      error,
      dailySpent: result.dailySpent,
      weeklySpent: result.weeklySpent,
      dailyRemaining: result.dailyRemaining,
      weeklyRemaining: result.weeklyRemaining,
    };
  }

  return {
    allowed: true,
    dailySpent: result.dailySpent,
    weeklySpent: result.weeklySpent,
    dailyRemaining: result.dailyRemaining,
    weeklyRemaining: result.weeklyRemaining,
  };
}

/**
 * Create API response for spend limit error
 */
export function createSpendLimitErrorResponse(error: SpendLimitError): Response {
  return new Response(JSON.stringify(error.toJSON()), {
    status: 402, // Payment Required
    headers: {
      'Content-Type': 'application/json',
      'X-Spend-Limit-Type': error.limitType,
      'X-Spend-Limit': error.limit.toString(),
      'X-Spend-Current': error.currentSpend.toString(),
      'X-Spend-Remaining': error.remaining.toString(),
    },
  });
}

/**
 * Middleware factory for spend limit enforcement
 *
 * Usage:
 * ```ts
 * import { createSpendLimitMiddleware } from '@apex/compliance';
 * import { checkSpendLimit } from '@/server/services/paymentTracker';
 *
 * export const spendLimitMiddleware = createSpendLimitMiddleware(checkSpendLimit);
 * ```
 */
export function createSpendLimitMiddleware(
  checkSpendLimitFn: (
    userId: string,
    amount: number
  ) => Promise<{
    allowed: boolean;
    dailySpent: number;
    weeklySpent: number;
    dailyRemaining: number;
    weeklyRemaining: number;
    limitType?: 'daily' | 'weekly';
    message?: string;
  }>
) {
  return async function spendLimitMiddleware(
    req: NextRequest,
    amountUsd: number,
    userId?: string
  ): Promise<{ allowed: true } | { allowed: false; response: Response }> {
    // Extract user ID if not provided
    const uid = userId || extractUserIdFromRequest(req);
    if (!uid) {
      return {
        allowed: false,
        response: new Response(
          JSON.stringify({ error: 'UNAUTHORIZED', message: 'User ID required' }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        ),
      };
    }

    // Validate payment
    const validation = await validatePayment(uid, amountUsd, checkSpendLimitFn);

    if (!validation.allowed) {
      return {
        allowed: false,
        response: createSpendLimitErrorResponse(validation.error!),
      };
    }

    return { allowed: true };
  };
}

/**
 * Helper to convert various currencies to USD
 * In production, this should call a real-time exchange rate API
 */
export function convertToUSD(amount: number, currency: string): number {
  // Placeholder exchange rates
  const exchangeRates: Record<string, number> = {
    USD: 1,
    EUR: 1.08,
    GBP: 1.26,
    JPY: 0.0067,
    ETH: 3500, // Example: 1 ETH = $3500
    BTC: 45000, // Example: 1 BTC = $45000
    MATIC: 0.85,
    USDC: 1,
    USDT: 1,
  };

  const rate = exchangeRates[currency.toUpperCase()] || 1;
  return amount * rate;
}

/**
 * Payment metadata for tracking
 */
export interface PaymentMetadata {
  currency: string;
  originalAmount: number;
  usdRate: number;
  productId?: string;
  description?: string;
  [key: string]: any;
}

/**
 * Create payment metadata
 */
export function createPaymentMetadata(
  originalAmount: number,
  currency: string,
  additionalData?: Record<string, any>
): PaymentMetadata {
  const usdRate = convertToUSD(1, currency);
  return {
    currency,
    originalAmount,
    usdRate,
    ...additionalData,
  };
}

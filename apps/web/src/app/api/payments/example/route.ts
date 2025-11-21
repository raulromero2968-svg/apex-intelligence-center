/**
 * Example Payment Route with Spend Limit Enforcement
 *
 * This demonstrates the complete payment flow with spend limit checking.
 * Use this as a template for your own payment endpoints.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkSpendLimit, recordPayment } from '@/server/services/paymentTracker';
import { convertToUSD, createPaymentMetadata } from '@apex/compliance';
import type { NewSpendTracking } from '@/db/schema';

interface PaymentRequest {
  userId: string;
  amount: number;
  currency: string;
  paymentType: 'stripe' | 'onchain';
  stripePaymentIntentId?: string;
  onchainTxHash?: string;
  onchainNetwork?: string;
  productId?: string;
  description?: string;
}

/**
 * POST /api/payments/example
 *
 * Example endpoint showing how to integrate spend limit checking
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as PaymentRequest;

    const {
      userId,
      amount,
      currency,
      paymentType,
      stripePaymentIntentId,
      onchainTxHash,
      onchainNetwork,
      productId,
      description,
    } = body;

    // Validate required fields
    if (!userId || !amount || !currency || !paymentType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert to USD for limit checking
    const amountUsd = convertToUSD(amount, currency);

    // 1. CHECK SPEND LIMIT FIRST (critical!)
    const limitCheck = await checkSpendLimit(userId, amountUsd);

    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: 'SPEND_LIMIT_EXCEEDED',
          message: limitCheck.message,
          limitType: limitCheck.limitType,
          dailySpent: limitCheck.dailySpent,
          weeklySpent: limitCheck.weeklySpent,
          dailyRemaining: limitCheck.dailyRemaining,
          weeklyRemaining: limitCheck.weeklyRemaining,
        },
        {
          status: 402, // Payment Required
          headers: {
            'X-Spend-Limit-Type': limitCheck.limitType || 'unknown',
            'X-Spend-Limit': (limitCheck.limitType === 'daily' ? '50' : '200'),
            'X-Spend-Current': limitCheck.dailySpent.toString(),
            'X-Spend-Remaining': limitCheck.dailyRemaining.toString(),
          },
        }
      );
    }

    // 2. Process payment (Stripe or on-chain)
    // In production, this would actually process the payment
    // For this example, we'll just simulate it

    if (paymentType === 'stripe' && !stripePaymentIntentId) {
      return NextResponse.json(
        { error: 'stripePaymentIntentId required for Stripe payments' },
        { status: 400 }
      );
    }

    if (paymentType === 'onchain' && (!onchainTxHash || !onchainNetwork)) {
      return NextResponse.json(
        { error: 'onchainTxHash and onchainNetwork required for on-chain payments' },
        { status: 400 }
      );
    }

    // 3. Record payment in tracking system
    const payment: NewSpendTracking = {
      userId,
      amountUsd,
      paymentType,
      stripePaymentIntentId: paymentType === 'stripe' ? stripePaymentIntentId : undefined,
      onchainTxHash: paymentType === 'onchain' ? onchainTxHash : undefined,
      onchainNetwork: paymentType === 'onchain' ? onchainNetwork : undefined,
      status: 'pending',
      metadata: createPaymentMetadata(amount, currency, {
        productId,
        description,
      }),
    };

    const transactionId = await recordPayment(payment);

    // 4. Return success response with updated limits
    return NextResponse.json({
      success: true,
      transactionId,
      amountUsd,
      limits: {
        daily: {
          spent: limitCheck.dailySpent + amountUsd,
          remaining: limitCheck.dailyRemaining - amountUsd,
          limit: 50,
        },
        weekly: {
          spent: limitCheck.weeklySpent + amountUsd,
          remaining: limitCheck.weeklyRemaining - amountUsd,
          limit: 200,
        },
      },
      message: 'Payment recorded successfully. Complete payment via webhook to finalize.',
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payments/example?userId=xxx
 *
 * Get current spend status for a user
 */
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter required' },
        { status: 400 }
      );
    }

    // Check limits with $0 payment to get current status
    const status = await checkSpendLimit(userId, 0);

    return NextResponse.json({
      daily: {
        spent: status.dailySpent,
        remaining: status.dailyRemaining,
        limit: 50,
        percentage: (status.dailySpent / 50) * 100,
      },
      weekly: {
        spent: status.weeklySpent,
        remaining: status.weeklyRemaining,
        limit: 200,
        percentage: (status.weeklySpent / 200) * 100,
      },
      canPayToday: status.dailyRemaining > 0,
      canPayThisWeek: status.weeklyRemaining > 0,
    });

  } catch (error) {
    console.error('Error fetching spend status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Spend Tracking Schema
 *
 * Portable schema definition for spend tracking across Stripe + on-chain payments.
 * This can be imported and used in any app that needs spend limit enforcement.
 *
 * Features:
 * - Rolling window tracking (24h daily, 7d weekly)
 * - Multi-payment source support (Stripe, on-chain)
 * - Idempotency via unique constraints
 * - Optimized indexes for fast limit queries
 */

import { pgTable, text, uuid, real, timestamp, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';

/**
 * Spend Tracking table
 *
 * Tracks all payment transactions for spend limit enforcement.
 * Supports both Stripe and on-chain payments.
 */
export const spendTracking = pgTable('spend_tracking', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),

  // Transaction details
  amountUsd: real('amount_usd').notNull(), // Normalized to USD
  paymentType: text('payment_type', {
    enum: ['stripe', 'onchain']
  }).notNull(),

  // Payment-specific identifiers
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  stripeChargeId: text('stripe_charge_id'),
  onchainTxHash: text('onchain_tx_hash'),
  onchainNetwork: text('onchain_network'), // 'ethereum', 'polygon', etc.

  // Status tracking
  status: text('status', {
    enum: ['pending', 'completed', 'failed', 'refunded']
  }).notNull().default('pending'),

  // Metadata
  metadata: jsonb('metadata').$type<{
    currency?: string;
    originalAmount?: number;
    usdRate?: number;
    productId?: string;
    description?: string;
    [key: string]: any;
  }>().default({}),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),

}, (table) => ({
  // Critical indexes for spend limit queries
  userCreatedIdx: index('idx_spend_tracking_user_created').on(table.userId, table.createdAt),
  userStatusIdx: index('idx_spend_tracking_user_status').on(table.userId, table.status),
  stripePaymentIntentIdx: index('idx_spend_tracking_stripe_pi').on(table.stripePaymentIntentId),
  onchainTxIdx: index('idx_spend_tracking_onchain_tx').on(table.onchainTxHash),
  createdAtIdx: index('idx_spend_tracking_created').on(table.createdAt),

  // Unique constraints to prevent double-counting
  uniqueStripePayment: uniqueIndex('idx_spend_tracking_stripe_unique').on(table.stripePaymentIntentId),
  uniqueOnchainTx: uniqueIndex('idx_spend_tracking_onchain_unique').on(table.onchainTxHash, table.onchainNetwork),
}));

/**
 * TypeScript types
 */
export type SpendTracking = typeof spendTracking.$inferSelect;
export type NewSpendTracking = typeof spendTracking.$inferInsert;

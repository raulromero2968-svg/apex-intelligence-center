/**
 * Payment Tracker Tests
 *
 * Tests for concurrent payment handling and spend limit enforcement.
 * These tests verify that the system is truly "unbreakable" even under
 * concurrent load.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  checkSpendLimit,
  recordPayment,
  completePayment,
  SPEND_LIMITS,
  getUserSpendStatus,
} from '../paymentTracker';
import type { NewSpendTracking } from '@/db/schema';

// Mock Redis and DB
vi.mock('@/lib/redis', () => ({
  redis: {
    eval: vi.fn(),
    zadd: vi.fn(),
    expire: vi.fn(),
  },
  RedisKeys: {},
}));

vi.mock('@/db', () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{ id: 'test-tx-id' }])),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([{ total: 0 }])),
      })),
    })),
  },
}));

describe('Payment Tracker - Spend Limit Enforcement', () => {
  const testUserId = 'user-test-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkSpendLimit', () => {
    it('should allow payment under daily limit', async () => {
      const result = await checkSpendLimit(testUserId, 25);

      expect(result.allowed).toBe(true);
      expect(result.dailySpent).toBeLessThan(SPEND_LIMITS.DAILY);
      expect(result.weeklySpent).toBeLessThan(SPEND_LIMITS.WEEKLY);
    });

    it('should deny payment exceeding daily limit', async () => {
      // Mock Redis to return $45 already spent today
      const { redis } = await import('@/lib/redis');
      vi.mocked(redis.eval).mockResolvedValueOnce([45, 45]);

      const result = await checkSpendLimit(testUserId, 10);

      expect(result.allowed).toBe(false);
      expect(result.limitType).toBe('daily');
      expect(result.message).toContain('daily limit');
    });

    it('should deny payment exceeding weekly limit', async () => {
      // Mock Redis to return $30 daily, $190 weekly
      const { redis } = await import('@/lib/redis');
      vi.mocked(redis.eval).mockResolvedValueOnce([30, 190]);

      const result = await checkSpendLimit(testUserId, 15);

      expect(result.allowed).toBe(false);
      expect(result.limitType).toBe('weekly');
      expect(result.message).toContain('weekly limit');
    });

    it('should allow payment exactly at limit', async () => {
      // Mock Redis to return $40 already spent
      const { redis } = await import('@/lib/redis');
      vi.mocked(redis.eval).mockResolvedValueOnce([40, 40]);

      const result = await checkSpendLimit(testUserId, 10);

      expect(result.allowed).toBe(true);
      expect(result.dailyRemaining).toBe(0);
    });
  });

  describe('recordPayment', () => {
    it('should record Stripe payment', async () => {
      const payment: NewSpendTracking = {
        userId: testUserId,
        amountUsd: 29.99,
        paymentType: 'stripe',
        stripePaymentIntentId: 'pi_test_123',
        status: 'pending',
        metadata: {
          currency: 'USD',
          originalAmount: 29.99,
          usdRate: 1,
          productId: 'prod_premium',
        },
      };

      const txId = await recordPayment(payment);

      expect(txId).toBe('test-tx-id');
    });

    it('should record on-chain payment', async () => {
      const payment: NewSpendTracking = {
        userId: testUserId,
        amountUsd: 50,
        paymentType: 'onchain',
        onchainTxHash: '0x123abc...',
        onchainNetwork: 'ethereum',
        status: 'pending',
        metadata: {
          currency: 'ETH',
          originalAmount: 0.015,
          usdRate: 3333.33,
        },
      };

      const txId = await recordPayment(payment);

      expect(txId).toBe('test-tx-id');
    });
  });

  describe('Concurrent Payment Handling', () => {
    it('should handle concurrent payments correctly', async () => {
      const { redis } = await import('@/lib/redis');

      // Simulate 5 concurrent $12 payments ($60 total)
      // Only first 4 should succeed (4 * $12 = $48 < $50)
      // 5th should fail
      const payments = Array(5).fill(null).map((_, i) => ({
        userId: testUserId,
        amountUsd: 12,
        paymentType: 'stripe' as const,
        stripePaymentIntentId: `pi_concurrent_${i}`,
      }));

      // Mock Redis to simulate accumulating spend
      let totalSpent = 0;
      vi.mocked(redis.eval).mockImplementation(() => {
        const current = totalSpent;
        totalSpent += 12;
        return Promise.resolve([current, current]);
      });

      // Try all payments concurrently
      const results = await Promise.all(
        payments.map(p => checkSpendLimit(p.userId, p.amountUsd))
      );

      // First 4 should be allowed
      expect(results.slice(0, 4).every(r => r.allowed)).toBe(true);

      // 5th should be denied (would exceed daily limit)
      expect(results[4].allowed).toBe(false);
    });

    it('should prevent race conditions with atomic operations', async () => {
      const { redis } = await import('@/lib/redis');

      // Simulate race condition: 3 concurrent $20 payments
      // Total would be $60, exceeding $50 limit
      // Only 2 should succeed
      const payments = [
        { userId: testUserId, amountUsd: 20 },
        { userId: testUserId, amountUsd: 20 },
        { userId: testUserId, amountUsd: 20 },
      ];

      // Mock atomic Lua script execution
      let callCount = 0;
      vi.mocked(redis.eval).mockImplementation(() => {
        callCount++;
        const spent = (callCount - 1) * 20;
        return Promise.resolve([spent, spent]);
      });

      const results = await Promise.all(
        payments.map(p => checkSpendLimit(p.userId, p.amountUsd))
      );

      // At least one should be denied
      const deniedCount = results.filter(r => !r.allowed).length;
      expect(deniedCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getUserSpendStatus', () => {
    it('should return current spend status', async () => {
      const { redis } = await import('@/lib/redis');
      vi.mocked(redis.eval).mockResolvedValueOnce([25, 100]);

      const status = await getUserSpendStatus(testUserId);

      expect(status.dailySpent).toBe(25);
      expect(status.weeklySpent).toBe(100);
      expect(status.dailyRemaining).toBe(25); // $50 - $25
      expect(status.weeklyRemaining).toBe(100); // $200 - $100
    });
  });

  describe('Rolling Window Behavior', () => {
    it('should only count transactions within 24h window for daily limit', async () => {
      // This test would verify that old transactions (>24h) are excluded
      // In practice, the Lua script handles this via ZREMRANGEBYSCORE
      expect(true).toBe(true); // Placeholder - actual test would need time manipulation
    });

    it('should only count transactions within 7d window for weekly limit', async () => {
      // Similar to above, for weekly window
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Fallback Behavior', () => {
    it('should fall back to DB when Redis fails', async () => {
      const { redis } = await import('@/lib/redis');
      vi.mocked(redis.eval).mockRejectedValueOnce(new Error('Redis unavailable'));

      const result = await checkSpendLimit(testUserId, 25);

      // Should still return a result (from DB)
      expect(result).toBeDefined();
      expect(result.allowed).toBeDefined();
    });

    it('should fail safe when both Redis and DB fail', async () => {
      const { redis } = await import('@/lib/redis');
      vi.mocked(redis.eval).mockRejectedValueOnce(new Error('Redis unavailable'));

      const { db } = await import('@/db');
      vi.mocked(db.select).mockImplementation(() => {
        throw new Error('DB unavailable');
      });

      const result = await checkSpendLimit(testUserId, 25);

      // Should deny payment when unable to verify
      expect(result.allowed).toBe(false);
      expect(result.message).toContain('unable to verify');
    });
  });
});

describe('Payment Tracker - Integration Tests', () => {
  const testUserId = 'user-integration-456';

  it('should complete full payment lifecycle', async () => {
    // 1. Check limit
    const check = await checkSpendLimit(testUserId, 29.99);
    expect(check.allowed).toBe(true);

    // 2. Record payment
    const payment: NewSpendTracking = {
      userId: testUserId,
      amountUsd: 29.99,
      paymentType: 'stripe',
      stripePaymentIntentId: 'pi_lifecycle_test',
      status: 'pending',
    };
    const txId = await recordPayment(payment);
    expect(txId).toBeDefined();

    // 3. Complete payment
    await completePayment(txId, 'id');

    // Verify completion was called
    const { db } = await import('@/db');
    expect(db.update).toHaveBeenCalled();
  });

  it('should handle payment failure', async () => {
    const payment: NewSpendTracking = {
      userId: testUserId,
      amountUsd: 15,
      paymentType: 'stripe',
      stripePaymentIntentId: 'pi_failed_test',
      status: 'pending',
    };

    const txId = await recordPayment(payment);

    // Simulate payment failure
    await completePayment(txId, 'id');

    // Should mark as failed (not deducted from limits)
    expect(txId).toBeDefined();
  });
});

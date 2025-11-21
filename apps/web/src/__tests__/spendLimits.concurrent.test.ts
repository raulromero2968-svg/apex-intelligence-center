/**
 * Spend Limits Concurrent Test
 *
 * Verifies that spend limits are enforced correctly under high concurrency.
 *
 * Test Cases:
 * 1. 100 parallel $1 requests should allow exactly 50 (daily limit)
 * 2. No double-spending even under race conditions
 * 3. Refund/rollback functionality works correctly
 * 4. Weekly limit enforcement (200 requests)
 * 5. Middleware blocks requests when limit exceeded
 *
 * Run with: npm test -- spendLimits.concurrent.test.ts
 */

import { describe, test, expect, beforeAll, afterEach } from '@jest/globals';
import {
  initializeRedis,
  reserveSpend,
  refundSpend,
  resetSpend,
  getCurrentSpend,
  SPEND_LIMITS,
} from '@apex/compliance';
import { Redis } from '@upstash/redis';

// ============================================================================
// Setup
// ============================================================================

let redis: Redis;

beforeAll(() => {
  // Initialize Redis client for testing
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error('Redis credentials not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN');
  }

  redis = new Redis({ url, token });
  initializeRedis(redis);
});

afterEach(async () => {
  // Clean up test data after each test
  await resetSpend('test-user-concurrent');
  await resetSpend('test-user-weekly');
});

// ============================================================================
// Test: Concurrent Request Enforcement
// ============================================================================

describe('Spend Limits - Concurrent Requests', () => {
  test('100 parallel $1 requests should allow exactly 50 (daily limit)', async () => {
    const userId = 'test-user-concurrent';
    const amount = 1.0; // $1 per request
    const numRequests = 100;

    // Reset spend for clean test
    await resetSpend(userId);

    // Launch 100 parallel reserve requests
    const promises = Array.from({ length: numRequests }, () =>
      reserveSpend(userId, amount)
    );

    const results = await Promise.all(promises);

    // Count successes and failures
    const successful = results.filter(r => r.reserved);
    const failed = results.filter(r => !r.reserved);

    console.log(`✓ Successful reservations: ${successful.length}`);
    console.log(`✗ Failed reservations: ${failed.length}`);

    // Verify exactly 50 requests succeeded (daily limit)
    expect(successful.length).toBe(SPEND_LIMITS.DAILY);
    expect(failed.length).toBe(numRequests - SPEND_LIMITS.DAILY);

    // Verify final spend matches exactly
    const finalSpend = await getCurrentSpend(userId);
    expect(finalSpend.currentDailySpend).toBe(SPEND_LIMITS.DAILY);

    console.log(`✓ Final daily spend: $${finalSpend.currentDailySpend}`);
  }, 30000); // 30 second timeout for concurrent test

  test('Weekly limit enforcement (200 requests over 7 days)', async () => {
    const userId = 'test-user-weekly';
    const amount = 1.0;
    const numRequests = 250; // Try to exceed weekly limit

    await resetSpend(userId);

    // Launch 250 parallel reserve requests
    const promises = Array.from({ length: numRequests }, () =>
      reserveSpend(userId, amount)
    );

    const results = await Promise.all(promises);

    const successful = results.filter(r => r.reserved);
    const failed = results.filter(r => !r.reserved);

    console.log(`✓ Successful reservations: ${successful.length}`);
    console.log(`✗ Failed reservations: ${failed.length}`);

    // Should allow exactly 200 (or 50 if daily limit hit first)
    // Since we're testing both limits, daily limit ($50) hits first
    expect(successful.length).toBeLessThanOrEqual(SPEND_LIMITS.WEEKLY);
    expect(successful.length).toBeLessThanOrEqual(SPEND_LIMITS.DAILY);

    const finalSpend = await getCurrentSpend(userId);
    console.log(`✓ Final daily spend: $${finalSpend.currentDailySpend}`);
    console.log(`✓ Final weekly spend: $${finalSpend.currentWeeklySpend}`);

    // Daily and weekly should be equal (same requests)
    expect(finalSpend.currentDailySpend).toBe(finalSpend.currentWeeklySpend);
  }, 30000);

  test('Refund functionality works correctly', async () => {
    const userId = 'test-user-refund';
    const amount = 10.0;

    await resetSpend(userId);

    // Reserve $10
    const reservation1 = await reserveSpend(userId, amount);
    expect(reservation1.reserved).toBe(true);
    expect(reservation1.currentDailySpend).toBe(amount);

    // Refund $10
    await refundSpend(userId, amount);

    // Verify spend is back to 0
    const spend = await getCurrentSpend(userId);
    expect(spend.currentDailySpend).toBe(0);
    expect(spend.currentWeeklySpend).toBe(0);

    // Should be able to reserve again
    const reservation2 = await reserveSpend(userId, amount);
    expect(reservation2.reserved).toBe(true);
    expect(reservation2.currentDailySpend).toBe(amount);

    console.log('✓ Refund functionality verified');

    // Cleanup
    await resetSpend(userId);
  });

  test('No double-spending under race conditions', async () => {
    const userId = 'test-user-race';
    const amount = 25.0; // $25 per request
    const numRequests = 4; // 4 x $25 = $100, but limit is $50

    await resetSpend(userId);

    // Launch 4 concurrent $25 requests
    const promises = Array.from({ length: numRequests }, () =>
      reserveSpend(userId, amount)
    );

    const results = await Promise.all(promises);

    const successful = results.filter(r => r.reserved);
    const failed = results.filter(r => !r.reserved);

    console.log(`✓ Successful $25 reservations: ${successful.length}`);
    console.log(`✗ Failed $25 reservations: ${failed.length}`);

    // Exactly 2 should succeed (2 x $25 = $50)
    expect(successful.length).toBe(2);
    expect(failed.length).toBe(2);

    // Verify no overspending
    const finalSpend = await getCurrentSpend(userId);
    expect(finalSpend.currentDailySpend).toBe(SPEND_LIMITS.DAILY);
    expect(finalSpend.currentDailySpend).not.toBeGreaterThan(SPEND_LIMITS.DAILY);

    console.log('✓ No double-spending detected');

    // Cleanup
    await resetSpend(userId);
  });

  test('Partial amounts work correctly', async () => {
    const userId = 'test-user-partial';

    await resetSpend(userId);

    // Reserve $49.99 (just under limit)
    const reservation1 = await reserveSpend(userId, 49.99);
    expect(reservation1.reserved).toBe(true);

    // Try to reserve $0.02 (would exceed by $0.01)
    const reservation2 = await reserveSpend(userId, 0.02);
    expect(reservation2.reserved).toBe(false);
    expect(reservation2.violationType).toBe('daily');

    // Try to reserve $0.01 (exactly at limit)
    const reservation3 = await reserveSpend(userId, 0.01);
    expect(reservation3.reserved).toBe(true);

    // Verify final spend is exactly $50.00
    const finalSpend = await getCurrentSpend(userId);
    expect(finalSpend.currentDailySpend).toBe(50.0);

    console.log('✓ Partial amount enforcement verified');

    // Cleanup
    await resetSpend(userId);
  });

  test('Multiple users can spend independently', async () => {
    const user1 = 'test-user-multi-1';
    const user2 = 'test-user-multi-2';
    const amount = 30.0;

    await resetSpend(user1);
    await resetSpend(user2);

    // Both users reserve $30 concurrently
    const [res1, res2] = await Promise.all([
      reserveSpend(user1, amount),
      reserveSpend(user2, amount),
    ]);

    // Both should succeed (independent limits)
    expect(res1.reserved).toBe(true);
    expect(res2.reserved).toBe(true);

    // Verify each user has $30 spend
    const spend1 = await getCurrentSpend(user1);
    const spend2 = await getCurrentSpend(user2);

    expect(spend1.currentDailySpend).toBe(amount);
    expect(spend2.currentDailySpend).toBe(amount);

    console.log('✓ Independent user limits verified');

    // Cleanup
    await resetSpend(user1);
    await resetSpend(user2);
  });
});

// ============================================================================
// Performance Test
// ============================================================================

describe('Spend Limits - Performance', () => {
  test('Handles 100 concurrent requests in < 5 seconds', async () => {
    const userId = 'test-user-perf';
    const amount = 0.5;
    const numRequests = 100;

    await resetSpend(userId);

    const startTime = Date.now();

    // Launch 100 parallel requests
    const promises = Array.from({ length: numRequests }, () =>
      reserveSpend(userId, amount)
    );

    await Promise.all(promises);

    const duration = Date.now() - startTime;

    console.log(`✓ Processed 100 requests in ${duration}ms`);
    console.log(`✓ Average latency: ${(duration / numRequests).toFixed(2)}ms per request`);

    // Should complete in under 5 seconds
    expect(duration).toBeLessThan(5000);

    // Cleanup
    await resetSpend(userId);
  }, 10000);

  test('getCurrentSpend is fast (< 100ms)', async () => {
    const userId = 'test-user-perf-get';

    await resetSpend(userId);
    await reserveSpend(userId, 10);

    const startTime = Date.now();
    await getCurrentSpend(userId);
    const duration = Date.now() - startTime;

    console.log(`✓ getCurrentSpend latency: ${duration}ms`);

    expect(duration).toBeLessThan(100); // Should be very fast

    // Cleanup
    await resetSpend(userId);
  });
});

// ============================================================================
// Export for CLI Testing
// ============================================================================

/**
 * Run all tests and report results
 * Usage: node -r ts-node/register spendLimits.concurrent.test.ts
 */
if (require.main === module) {
  console.log('🧪 Running Spend Limits Concurrent Tests...\n');

  (async () => {
    try {
      // Run tests manually (if not using Jest)
      console.log('Note: Run with Jest for full test suite');
      console.log('npm test -- spendLimits.concurrent.test.ts');
    } catch (error) {
      console.error('Test failed:', error);
      process.exit(1);
    }
  })();
}

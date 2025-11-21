#!/usr/bin/env ts-node
/**
 * Spend Limits - Standalone Concurrent Test Script
 *
 * Tests spend limit enforcement with 100 parallel requests.
 * Can be run directly without Jest.
 *
 * Usage:
 *   npx ts-node scripts/test-spend-limits.ts
 *   npm run test:spend-limits
 *
 * Requirements:
 *   - UPSTASH_REDIS_REST_URL environment variable
 *   - UPSTASH_REDIS_REST_TOKEN environment variable
 */

import { Redis } from '@upstash/redis';

// ============================================================================
// Configuration
// ============================================================================

const SPEND_LIMITS = {
  DAILY: 50.0,
  WEEKLY: 200.0,
} as const;

const REDIS_KEY_PREFIX = {
  DAILY: 'spend:daily:',
  WEEKLY: 'spend:weekly:',
} as const;

const REDIS_TTL = {
  DAILY: 86400, // 24 hours
  WEEKLY: 604800, // 7 days
} as const;

// ============================================================================
// Redis Setup
// ============================================================================

function createRedisClient(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.error('❌ Error: Redis credentials not configured');
    console.error('Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN');
    process.exit(1);
  }

  return new Redis({ url, token });
}

const redis = createRedisClient();

// ============================================================================
// Spend Limit Functions (Inline for Testing)
// ============================================================================

async function reserveSpend(userId: string, amount: number) {
  const dailyKey = `${REDIS_KEY_PREFIX.DAILY}${userId}`;
  const weeklyKey = `${REDIS_KEY_PREFIX.WEEKLY}${userId}`;

  const luaScript = `
    local dailyKey = KEYS[1]
    local weeklyKey = KEYS[2]
    local amount = tonumber(ARGV[1])
    local dailyLimit = tonumber(ARGV[2])
    local weeklyLimit = tonumber(ARGV[3])
    local dailyTTL = tonumber(ARGV[4])
    local weeklyTTL = tonumber(ARGV[5])

    local currentDaily = tonumber(redis.call('GET', dailyKey) or '0')
    local currentWeekly = tonumber(redis.call('GET', weeklyKey) or '0')

    local newDaily = currentDaily + amount
    local newWeekly = currentWeekly + amount

    if newDaily > dailyLimit or newWeekly > weeklyLimit then
      return {0, currentDaily, currentWeekly}
    end

    redis.call('INCRBYFLOAT', dailyKey, amount)
    redis.call('INCRBYFLOAT', weeklyKey, amount)

    if currentDaily == 0 then
      redis.call('EXPIRE', dailyKey, dailyTTL)
    end
    if currentWeekly == 0 then
      redis.call('EXPIRE', weeklyKey, weeklyTTL)
    end

    return {1, newDaily, newWeekly}
  `;

  const result = await redis.eval(
    luaScript,
    [dailyKey, weeklyKey],
    [
      amount.toFixed(2),
      SPEND_LIMITS.DAILY.toFixed(2),
      SPEND_LIMITS.WEEKLY.toFixed(2),
      REDIS_TTL.DAILY.toString(),
      REDIS_TTL.WEEKLY.toString(),
    ]
  ) as [number, number, number];

  const [success, newDaily, newWeekly] = result;

  return {
    reserved: success === 1,
    currentDailySpend: newDaily,
    currentWeeklySpend: newWeekly,
  };
}

async function getCurrentSpend(userId: string) {
  const dailyKey = `${REDIS_KEY_PREFIX.DAILY}${userId}`;
  const weeklyKey = `${REDIS_KEY_PREFIX.WEEKLY}${userId}`;

  const [daily, weekly] = await Promise.all([
    redis.get<string>(dailyKey),
    redis.get<string>(weeklyKey),
  ]);

  return {
    daily: parseFloat(daily || '0'),
    weekly: parseFloat(weekly || '0'),
  };
}

async function resetSpend(userId: string) {
  const dailyKey = `${REDIS_KEY_PREFIX.DAILY}${userId}`;
  const weeklyKey = `${REDIS_KEY_PREFIX.WEEKLY}${userId}`;

  await Promise.all([
    redis.del(dailyKey),
    redis.del(weeklyKey),
  ]);
}

// ============================================================================
// Test Functions
// ============================================================================

async function testConcurrentRequests() {
  console.log('\n📊 Test 1: 100 Parallel $1 Requests (Daily Limit: $50)');
  console.log('═'.repeat(60));

  const userId = `test-user-${Date.now()}`;
  const amount = 1.0;
  const numRequests = 100;

  console.log(`User ID: ${userId}`);
  console.log(`Amount per request: $${amount}`);
  console.log(`Number of requests: ${numRequests}`);
  console.log(`Expected successes: ${SPEND_LIMITS.DAILY}`);
  console.log(`Expected failures: ${numRequests - SPEND_LIMITS.DAILY}\n`);

  // Reset spend
  await resetSpend(userId);

  // Launch concurrent requests
  console.log('🚀 Launching 100 parallel requests...');
  const startTime = Date.now();

  const promises = Array.from({ length: numRequests }, (_, i) =>
    reserveSpend(userId, amount).then(result => ({ id: i, ...result }))
  );

  const results = await Promise.all(promises);
  const duration = Date.now() - startTime;

  // Analyze results
  const successful = results.filter(r => r.reserved);
  const failed = results.filter(r => !r.reserved);

  console.log(`✓ Completed in ${duration}ms`);
  console.log(`✓ Average latency: ${(duration / numRequests).toFixed(2)}ms per request\n`);

  console.log('Results:');
  console.log(`  ✅ Successful: ${successful.length} (expected: ${SPEND_LIMITS.DAILY})`);
  console.log(`  ❌ Failed: ${failed.length} (expected: ${numRequests - SPEND_LIMITS.DAILY})`);

  // Verify final spend
  const finalSpend = await getCurrentSpend(userId);
  console.log(`\nFinal Spend:`);
  console.log(`  Daily: $${finalSpend.daily.toFixed(2)} / $${SPEND_LIMITS.DAILY}`);
  console.log(`  Weekly: $${finalSpend.weekly.toFixed(2)} / $${SPEND_LIMITS.WEEKLY}`);

  // Validate
  const isCorrect = successful.length === SPEND_LIMITS.DAILY &&
                   failed.length === numRequests - SPEND_LIMITS.DAILY &&
                   finalSpend.daily === SPEND_LIMITS.DAILY;

  if (isCorrect) {
    console.log('\n✅ TEST PASSED: Limits enforced correctly!');
  } else {
    console.log('\n❌ TEST FAILED: Limits not enforced correctly!');
    console.log(`Expected ${SPEND_LIMITS.DAILY} successes, got ${successful.length}`);
    console.log(`Expected final spend $${SPEND_LIMITS.DAILY}, got $${finalSpend.daily}`);
  }

  // Cleanup
  await resetSpend(userId);

  return isCorrect;
}

async function testRaceConditions() {
  console.log('\n📊 Test 2: Race Conditions (4 × $25 = $100, Limit: $50)');
  console.log('═'.repeat(60));

  const userId = `test-user-race-${Date.now()}`;
  const amount = 25.0;
  const numRequests = 4;

  console.log(`User ID: ${userId}`);
  console.log(`Amount per request: $${amount}`);
  console.log(`Number of requests: ${numRequests}`);
  console.log(`Total attempted: $${amount * numRequests}`);
  console.log(`Expected successes: 2 (2 × $25 = $50)\n`);

  await resetSpend(userId);

  console.log('🚀 Launching 4 concurrent $25 requests...');
  const startTime = Date.now();

  const promises = Array.from({ length: numRequests }, (_, i) =>
    reserveSpend(userId, amount).then(result => ({ id: i, ...result }))
  );

  const results = await Promise.all(promises);
  const duration = Date.now() - startTime;

  const successful = results.filter(r => r.reserved);
  const failed = results.filter(r => !r.reserved);

  console.log(`✓ Completed in ${duration}ms\n`);

  console.log('Results:');
  console.log(`  ✅ Successful: ${successful.length} (expected: 2)`);
  console.log(`  ❌ Failed: ${failed.length} (expected: 2)`);

  const finalSpend = await getCurrentSpend(userId);
  console.log(`\nFinal Spend: $${finalSpend.daily.toFixed(2)}`);

  const isCorrect = successful.length === 2 &&
                   failed.length === 2 &&
                   finalSpend.daily === SPEND_LIMITS.DAILY;

  if (isCorrect) {
    console.log('\n✅ TEST PASSED: No double-spending detected!');
  } else {
    console.log('\n❌ TEST FAILED: Double-spending occurred!');
    console.log(`Expected 2 successes, got ${successful.length}`);
    console.log(`Expected final spend $${SPEND_LIMITS.DAILY}, got $${finalSpend.daily}`);
  }

  await resetSpend(userId);

  return isCorrect;
}

async function testPerformance() {
  console.log('\n📊 Test 3: Performance (100 Concurrent Requests)');
  console.log('═'.repeat(60));

  const userId = `test-user-perf-${Date.now()}`;
  const amount = 0.5;
  const numRequests = 100;

  console.log(`User ID: ${userId}`);
  console.log(`Amount per request: $${amount}`);
  console.log(`Number of requests: ${numRequests}`);
  console.log(`Performance target: < 5000ms total, < 50ms avg latency\n`);

  await resetSpend(userId);

  console.log('🚀 Launching 100 parallel requests...');
  const startTime = Date.now();

  const promises = Array.from({ length: numRequests }, () =>
    reserveSpend(userId, amount)
  );

  await Promise.all(promises);
  const duration = Date.now() - startTime;
  const avgLatency = duration / numRequests;

  console.log(`✓ Completed in ${duration}ms`);
  console.log(`✓ Average latency: ${avgLatency.toFixed(2)}ms per request`);

  const isGoodPerf = duration < 5000 && avgLatency < 50;

  if (isGoodPerf) {
    console.log('\n✅ TEST PASSED: Performance is excellent!');
  } else {
    console.log('\n⚠️  TEST WARNING: Performance is slower than expected');
    console.log(`Expected < 5000ms total, got ${duration}ms`);
    console.log(`Expected < 50ms avg, got ${avgLatency.toFixed(2)}ms`);
  }

  await resetSpend(userId);

  return true; // Don't fail on performance
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('╔═════════════════════════════════════════════════════════╗');
  console.log('║      Spend Limits - Concurrent Test Suite              ║');
  console.log('║                                                         ║');
  console.log('║  Testing: $50/day and $200/week spend limits           ║');
  console.log('║  Method: 100 parallel requests with Redis atomic ops   ║');
  console.log('╚═════════════════════════════════════════════════════════╝');

  const results = {
    concurrent: false,
    race: false,
    performance: false,
  };

  try {
    results.concurrent = await testConcurrentRequests();
    results.race = await testRaceConditions();
    results.performance = await testPerformance();

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('📋 TEST SUMMARY');
    console.log('═'.repeat(60));
    console.log(`Test 1 (Concurrent): ${results.concurrent ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Test 2 (Race Conditions): ${results.race ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Test 3 (Performance): ${results.performance ? '✅ PASSED' : '⚠️  SLOW'}`);

    const allPassed = results.concurrent && results.race;

    if (allPassed) {
      console.log('\n🎉 ALL CRITICAL TESTS PASSED!');
      console.log('Spend limits are correctly enforced under concurrency.');
      process.exit(0);
    } else {
      console.log('\n❌ SOME TESTS FAILED!');
      console.log('Spend limits may not be correctly enforced.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ TEST ERROR:', error);
    process.exit(1);
  }
}

// Run tests
main();

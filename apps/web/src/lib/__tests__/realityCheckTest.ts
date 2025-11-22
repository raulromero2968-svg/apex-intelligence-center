/**
 * Reality Check Test Utilities
 *
 * Helper functions for testing the reality check modal system.
 * Run these in browser console to test various scenarios.
 */

/**
 * Force trigger the reality check modal immediately
 */
export function forceTriggerRealityCheck() {
  if (typeof window === 'undefined') {
    console.error('Must run in browser context');
    return;
  }

  // Get tracker from global (set by sessionActivityTracker)
  const tracker = (window as any).__APEX_SESSION_TRACKER__;

  if (!tracker) {
    console.error('Session tracker not initialized');
    return;
  }

  // Set total active time to just under 2 hours
  // Next heartbeat will trigger the modal
  const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
  tracker.sessionData.totalActiveTime = TWO_HOURS_MS - 1000;
  tracker.sessionData.lastRealityCheck = 0;
  tracker.saveSessionData();

  console.log('✅ Reality check will trigger in ~1 second');
  console.log('Current session data:', tracker.getSessionData());
}

/**
 * Reset session to start fresh
 */
export function resetSession() {
  if (typeof window === 'undefined') {
    console.error('Must run in browser context');
    return;
  }

  const tracker = (window as any).__APEX_SESSION_TRACKER__;

  if (!tracker) {
    console.error('Session tracker not initialized');
    return;
  }

  tracker.resetSession();
  console.log('✅ Session reset');
}

/**
 * Add mock spending data
 */
export function addMockSpend(amount: number, description: string) {
  if (typeof window === 'undefined') {
    console.error('Must run in browser context');
    return;
  }

  const { addTransaction } = require('@/lib/spendTracker');
  addTransaction(amount, description);

  console.log(`✅ Added transaction: $${amount} - ${description}`);
}

/**
 * Get current session stats
 */
export function getSessionStats() {
  if (typeof window === 'undefined') {
    console.error('Must run in browser context');
    return;
  }

  const tracker = (window as any).__APEX_SESSION_TRACKER__;

  if (!tracker) {
    console.error('Session tracker not initialized');
    return;
  }

  const data = tracker.getSessionData();
  const formatted = tracker.getFormattedActiveTime();
  const hours = tracker.getActiveHours();

  console.log('📊 Session Stats:');
  console.log('  Start Time:', new Date(data.startTime).toLocaleString());
  console.log('  Active Time:', formatted, `(${hours.toFixed(2)} hours)`);
  console.log('  Last Heartbeat:', new Date(data.lastHeartbeat).toLocaleString());
  console.log('  Last Reality Check:', data.lastRealityCheck, 'ms');

  return data;
}

/**
 * Get daily spend
 */
export function getDailySpendInfo() {
  if (typeof window === 'undefined') {
    console.error('Must run in browser context');
    return;
  }

  const { getDailySpend, getTodayTransactions } = require('@/lib/spendTracker');

  const total = getDailySpend();
  const transactions = getTodayTransactions();

  console.log('💰 Daily Spend:');
  console.log('  Total:', `$${total.toFixed(2)}`);
  console.log('  Transactions:', transactions.length);

  transactions.forEach((t: any, i: number) => {
    console.log(`  ${i + 1}. $${t.amount} - ${t.description}`);
  });

  return { total, transactions };
}

/**
 * Simulate active usage for testing (speeds up time)
 */
export function simulateActiveUsage(minutes: number) {
  if (typeof window === 'undefined') {
    console.error('Must run in browser context');
    return;
  }

  const tracker = (window as any).__APEX_SESSION_TRACKER__;

  if (!tracker) {
    console.error('Session tracker not initialized');
    return;
  }

  const MS_PER_MINUTE = 60 * 1000;
  tracker.sessionData.totalActiveTime += minutes * MS_PER_MINUTE;
  tracker.saveSessionData();

  console.log(`✅ Simulated ${minutes} minutes of active usage`);
  console.log('  New active time:', tracker.getFormattedActiveTime());
}

/**
 * Test force trigger via API
 */
export async function testAPIForceTrigger() {
  try {
    const response = await fetch('/api/reality-check/trigger', {
      method: 'POST',
    });

    const data = await response.json();

    if (data.ok) {
      console.log('✅ Force trigger activated via API');
      console.log('  Trigger ID:', data.triggerId);
      console.log('  Check status in ~30 seconds');
    } else {
      console.error('❌ Failed to trigger:', data.error);
    }

    return data;
  } catch (error) {
    console.error('❌ API error:', error);
  }
}

/**
 * Clear force trigger
 */
export async function clearForceTrigger() {
  try {
    const response = await fetch('/api/reality-check/trigger', {
      method: 'DELETE',
    });

    const data = await response.json();

    if (data.ok) {
      console.log('✅ Force trigger cleared');
    } else {
      console.error('❌ Failed to clear:', data.error);
    }

    return data;
  } catch (error) {
    console.error('❌ API error:', error);
  }
}

// Export all functions for browser console use
if (typeof window !== 'undefined') {
  (window as any).realityCheckTest = {
    forceTrigger: forceTriggerRealityCheck,
    resetSession,
    addMockSpend,
    getStats: getSessionStats,
    getSpend: getDailySpendInfo,
    simulateUsage: simulateActiveUsage,
    testAPITrigger: testAPIForceTrigger,
    clearTrigger: clearForceTrigger,
  };

  console.log('🧪 Reality Check Test Utilities loaded');
  console.log('Usage: window.realityCheckTest');
  console.log('Methods:', Object.keys((window as any).realityCheckTest));
}

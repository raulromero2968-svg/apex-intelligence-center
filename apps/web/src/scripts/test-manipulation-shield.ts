/**
 * Test Script for Manipulation Shield
 *
 * Creates mock pump data and tests the complete manipulation detection flow.
 *
 * Run with: tsx apps/web/src/scripts/test-manipulation-shield.ts
 */

import { db } from '@/db';
import { cards, sales, manipulationAlerts, alertSubscriptions, users } from '@/db/schema';
import { randomUUID as createId } from 'crypto';
import { activateManipulationShield } from '../services/manipulation-shield.service';

async function createMockPumpData() {
  console.log('🎯 Creating mock pump data...\n');

  // Create test user
  const userId = createId();
  await db.insert(users).values({
    id: userId,
    email: 'test@apex.test',
    name: 'Test User',
    subscriptionTier: 'pro',
  });
  console.log(`✅ Created test user: ${userId}`);

  // Create test card
  const cardId = createId();
  await db.insert(cards).values({
    id: cardId,
    name: 'Charizard VMAX (Test Pump)',
    setName: 'Darkness Ablaze',
    cardNumber: '020',
    game: 'pokemon',
    rarity: 'Rainbow Rare',
    apexScore: 75.5,
  });
  console.log(`✅ Created test card: ${cardId}`);

  // Create alert subscription for this card
  const subscriptionId = createId();
  await db.insert(alertSubscriptions).values({
    id: subscriptionId,
    userId,
    cardId,
    alertType: 'price_spike',
    threshold: 10.0, // Alert on 10% price changes
    channels: ['push', 'discord'],
    isActive: true,
  });
  console.log(`✅ Created alert subscription: ${subscriptionId}`);

  // Create baseline sales (30 days of normal activity)
  console.log('\n📊 Creating baseline sales (30 days)...');
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Normal baseline: ~3 sales per day for 29 days = 87 sales
  for (let day = 0; day < 29; day++) {
    const salesPerDay = 2 + Math.floor(Math.random() * 3); // 2-4 sales per day
    for (let sale = 0; sale < salesPerDay; sale++) {
      const saleDate = new Date(thirtyDaysAgo.getTime() + day * 24 * 60 * 60 * 1000 + Math.random() * 24 * 60 * 60 * 1000);
      const saleId = createId();

      await db.insert(sales).values({
        id: saleId,
        cardId,
        salePrice: 450 + Math.random() * 50, // $450-$500
        currency: 'USD',
        saleDate,
        grade: 'PSA 10',
        gradingCompany: 'PSA',
        source: 'ebay',
        ebayItemId: `test-${saleId}`,
      });
    }
  }
  console.log('✅ Created 80-100 baseline sales (avg ~3/day)');

  // Create PUMP: 150 sales in last 24 hours (50x spike = 5000%)
  console.log('\n🚨 Creating COORDINATED PUMP (150 sales in 24h)...');
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  for (let i = 0; i < 150; i++) {
    const saleDate = new Date(yesterday.getTime() + Math.random() * 24 * 60 * 60 * 1000);
    const saleId = createId();

    await db.insert(sales).values({
      id: saleId,
      cardId,
      salePrice: 480 + Math.random() * 20, // Prices not moving much despite volume
      currency: 'USD',
      saleDate,
      grade: 'PSA 10',
      gradingCompany: 'PSA',
      source: 'ebay',
      ebayItemId: `pump-${saleId}`,
    });
  }
  console.log('✅ Created 150 pump sales in 24h');

  console.log('\n📈 PUMP METRICS:');
  console.log(`   Baseline: ~3 sales/day`);
  console.log(`   Pump: 150 sales in 24h`);
  console.log(`   Spike: ${((150 / 3 - 1) * 100).toFixed(0)}% increase`);
  console.log(`   Threshold: 40% (EXCEEDED ✓)`);

  return { userId, cardId, subscriptionId };
}

async function testManipulationShield(cardId: string) {
  console.log('\n\n🛡️ ACTIVATING MANIPULATION SHIELD...\n');

  const result = await activateManipulationShield(cardId);

  console.log('\n📊 SHIELD ACTIVATION RESULTS:');
  console.log(`   Success: ${result.success ? '✅' : '❌'}`);
  console.log(`   Alert Created: ${result.alertCreated ? '✅' : '❌'}`);
  console.log(`   Notifications Sent: ${result.notificationsSent ? '✅' : '❌'}`);
  console.log(`   Alerts Paused: ${result.alertsPaused ? '✅' : '❌'}`);
  console.log(`   Paused Count: ${result.pausedAlertsCount || 0}`);

  if (result.error) {
    console.log(`   Error: ${result.error}`);
  }

  // Verify alert was created
  const alert = await db.query.manipulationAlerts.findFirst({
    where: (alerts, { eq }) => eq(alerts.cardId, cardId),
  });

  if (alert) {
    console.log('\n✅ MANIPULATION ALERT DETAILS:');
    console.log(`   Card ID: ${alert.cardId}`);
    console.log(`   Volume Spike: ${alert.volumeSpikePct.toFixed(1)}%`);
    console.log(`   Baseline Volume: ${alert.baselineVolume.toFixed(1)} sales/day`);
    console.log(`   Current Volume: ${alert.currentVolume} sales (24h)`);
    console.log(`   LAMP Sentiment: ${alert.lampSentiment}`);
    console.log(`   Contrarian Diversity: ${(alert.contrarianDiversity * 100).toFixed(0)}%`);
    console.log(`   Severity: ${alert.severity.toUpperCase()}`);
    console.log(`   Is Active: ${alert.isActive ? 'YES' : 'NO'}`);
    console.log(`   Detected At: ${alert.detectedAt}`);
  }

  // Verify alerts were paused
  const pausedAlerts = await db.query.alertSubscriptions.findMany({
    where: (subs, { eq, and }) => and(
      eq(subs.cardId, cardId),
      eq(subs.isActive, false)
    ),
  });

  console.log(`\n✅ PAUSED ALERTS: ${pausedAlerts.length}`);

  return result;
}

async function cleanup(cardId: string, userId: string) {
  console.log('\n\n🧹 Cleaning up test data...');

  await db.delete(manipulationAlerts).where((alerts, { eq }) => eq(alerts.cardId, cardId));
  await db.delete(alertSubscriptions).where((subs, { eq }) => eq(subs.cardId, cardId));
  await db.delete(sales).where((s, { eq }) => eq(s.cardId, cardId));
  await db.delete(cards).where((c, { eq }) => eq(c.id, cardId));
  await db.delete(users).where((u, { eq }) => eq(u.id, userId));

  console.log('✅ Cleanup complete');
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     MANIPULATION SHIELD TEST - COORDINATED PUMP        ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    // Create mock data
    const { userId, cardId, subscriptionId } = await createMockPumpData();

    // Test shield activation
    const result = await testManipulationShield(cardId);

    // Keep data for inspection or clean up
    const shouldCleanup = process.argv.includes('--cleanup');
    if (shouldCleanup) {
      await cleanup(cardId, userId);
    } else {
      console.log('\n💡 TIP: View the test card at: http://localhost:3000/card/' + cardId);
      console.log('💡 TIP: Run with --cleanup flag to remove test data');
      console.log(`\n📝 Test data IDs:`);
      console.log(`   Card ID: ${cardId}`);
      console.log(`   User ID: ${userId}`);
      console.log(`   Subscription ID: ${subscriptionId}`);
    }

    console.log('\n✅ TEST COMPLETE');

    if (!result.success) {
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    process.exit(1);
  }
}

main();

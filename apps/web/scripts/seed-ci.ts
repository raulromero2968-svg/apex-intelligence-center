#!/usr/bin/env tsx
/**
 * CI seed script
 *
 * Seeds database with test data for CI/CD pipelines.
 * Runs after migrations in the CI workflow.
 *
 * Usage:
 *   pnpm db:seed:ci
 */

import { db } from '@/db';

async function main() {
  console.log('Seeding database for CI...');

  try {
    // Example: Create test collections
    // Uncomment when database is set up:
    // await db.insert(collections).values([
    //   {
    //     title: 'Test Collection 1',
    //     slug: 'test-collection-1',
    //     is_public: true,
    //     is_unlisted: false,
    //     type: 'default',
    //   },
    //   {
    //     title: 'Test Collection 2',
    //     slug: 'test-collection-2',
    //     is_public: false,
    //     is_unlisted: false,
    //     type: 'default',
    //   },
    // ]);

    console.log('✓ Database seeded successfully');
  } catch (error) {
    console.error('✗ Seed failed:', error);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


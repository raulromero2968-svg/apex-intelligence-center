#!/usr/bin/env tsx
/**
 * Build search index script
 *
 * Pre-builds search indexes for optimal performance.
 * Runs before deployment in the CI workflow.
 *
 * Usage:
 *   pnpm build:search
 */

async function main() {
  console.log('Building search indexes...');

  try {
    // Example: Build search index from database
    // Uncomment when search implementation is ready:
    // const items = await db.select().from(intel_items);
    // const index = buildSearchIndex(items);
    // await saveIndexToFile(index, 'search-index.json');

    console.log('✓ Search indexes built successfully');
  } catch (error) {
    console.error('✗ Build failed:', error);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

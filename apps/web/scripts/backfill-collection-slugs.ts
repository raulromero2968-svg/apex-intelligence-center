#!/usr/bin/env tsx
/**
 * Backfill script for collection slugs
 *
 * This script populates the slug field for existing collections that don't have one.
 * Run after applying the 0019_collections_sharing.sql migration.
 *
 * Usage:
 *   pnpm db:backfill:slugs
 */

// Simple fallback ID generator
function generateId() {
  return Math.random().toString(36).substring(2, 8);
}

/**
 * Convert title to URL-friendly slug
 */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 48);
}

async function main() {
  console.log('Starting collection slug backfill...');
  console.log('NOTE: This is a placeholder script.');
  console.log('When database is configured, uncomment the implementation below.');

  // Placeholder implementation - uncomment when database is set up:
  /*
  import { db } from '@/db';
  import { collections } from '@/db/schema';
  import { eq, isNull } from 'drizzle-orm';
  import { customAlphabet } from 'nanoid';

  const nano = customAlphabet('abcdefghijkmnpqrstuvwxyz23456789', 6);

  const rows = await db.select().from(collections).where(isNull(collections.slug));

  if (rows.length === 0) {
    console.log('✓ No collections need slug backfill');
    return;
  }

  console.log(`Found ${rows.length} collections without slugs`);

  for (const row of rows) {
    const base = slugify(row.title || 'collection');
    const candidate = `${base}-${nano()}`;
    await db.update(collections)
      .set({ slug: candidate })
      .where(eq(collections.id, row.id));
    console.log(`✓ slugged: ${row.id} -> ${candidate}`);
  }

  console.log(`\n✓ Backfill complete: ${rows.length} collections updated`);
  */
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

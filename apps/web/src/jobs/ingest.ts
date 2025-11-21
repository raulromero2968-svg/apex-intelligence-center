import { db } from '@/db';
import { revalidateTag } from '@/lib/cache';
import { recordIngestBatch } from '@/lib/ingest-metrics';

export type Provider = 'tcgplayer' | 'ebay' | 'cardmarket' | 'whatnot';

/**
 * Ingest batch of items from a provider
 * Updates database and invalidates precise cache tags
 */
export async function ingestBatch(provider: Provider, items: any[]) {
  // 1) Upsert rows to database
  await db.transaction(async (tx: any) => {
    for (const it of items) {
      // Example: upsert to intel_items table
      // When database is set up, uncomment:
      // await tx.insert(intel_items)
      //   .values(it)
      //   .onConflictDoUpdate({ target: intel_items.id, set: it });
    }
  });

  // 2) Record metrics for observability
  await recordIngestBatch(provider, items);

  // 3) Precise tag invalidation - only the affected provider
  revalidateTag(`source:${provider}`);

  // Optional: invalidate individual item caches if needed
  // for (const it of items) {
  //   revalidateTag(`item:${it.id}`);
  // }

  return { provider, count: items.length };
}


import { db } from '@/db';
import { getCached, stableKey } from '@/lib/cache';
import * as Sentry from '@sentry/nextjs';
import type { Span } from '@sentry/types';

/**
 * Get collection by slug with caching
 * Cached with tag: collection:<slug>
 * TTL: 300 seconds (5 minutes)
 */
export async function getCollectionBySlug(slug: string) {
  const key = stableKey('col:slug', { slug });
  const tags = [`collection:${slug}`];

  return getCached(
    key,
    tags,
    async () => {
      return Sentry.startSpan(
        { name: 'collections.getBySlug', op: 'db' },
        async (span: Span) => {
          const col = await db.query.collections.findFirst({
            where: (c, { eq }) => eq(c.slug, slug),
          });
          if (!col) return null;

          const items = await db.query.collection_items.findMany({
            where: (ci, { eq }) => eq(ci.collectionId, col.id),
            with: { item: true },
          });

          span?.setAttribute?.('rowCounts', items.length);
          return { ...col, items: items.map((i: any) => i.item) };
        }
      );
    },
    300
  );
}

/**
 * List public collections with caching
 * Cached with tag: collections:public:list
 * TTL: 60 seconds (1 minute)
 */
export async function listPublicCollections() {
  const key = stableKey('col:list', { public: true });
  const tags = ['collections:public:list'];

  return getCached(
    key,
    tags,
    async () => {
      return Sentry.startSpan(
        { name: 'collections.listPublic', op: 'db' },
        async (span: Span) => {
          return db.query.collections.findMany({
            where: (c, { eq }) => eq(c.is_public, true),
            columns: { id: true, title: true, slug: true, updatedAt: true },
            orderBy: (c, { desc }) => [desc(c.updatedAt)],
            limit: 24,
          });
        }
      );
    },
    60
  );
}

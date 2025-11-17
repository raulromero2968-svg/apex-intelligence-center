import { db } from '@/db';
import { getCached, stableKey } from '@/lib/cache';
import * as Sentry from '@sentry/nextjs';

type SpanLike = {
  setAttribute?: (key: string, value: unknown) => void;
};

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
        async (span: SpanLike) => {
          const col = await db.query.collections.findFirst({
            where: (c: any, { eq }: any) => eq(c.slug, slug),
          });
          if (!col) return null;

          const items = await db.query.collection_items.findMany({
            where: (ci: any, { eq }: any) => eq(ci.collectionId, col.id),
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
        async () => {
          return db.query.collections.findMany({
            where: (c: any, { eq }: any) => eq(c.is_public, true),
            columns: { id: true, title: true, slug: true, updatedAt: true },
            orderBy: (c: any, { desc }: any) => [desc(c.updatedAt)],
            limit: 24,
          });
        }
      );
    },
    60
  );
}

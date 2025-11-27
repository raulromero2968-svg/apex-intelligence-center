import { db } from '@/db';
import { collections, collection_items } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
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
            where: eq(collections.slug, slug),
          });
          if (!col) return null;

          const items = await db.query.collection_items.findMany({
            where: eq(collection_items.collection_id, col.id),
            with: { item: true },
          });

          span?.setAttribute?.('rowCount', items.length);
          return { ...col, items: items.map((i) => i.item) };
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
        async (span: SpanLike) => {
          const rows = await db.query.collections.findMany({
            where: eq(collections.is_public, true),
            columns: { id: true, title: true, slug: true, updated_at: true },
            orderBy: desc(collections.updated_at),
            limit: 24,
          });

          span?.setAttribute?.('rowCount', rows.length);
          return rows;
        }
      );
    },
    60
  );
}


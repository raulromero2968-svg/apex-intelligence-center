/**
 * Database repository methods for collections and collection items
 * Extends the base Drizzle db object with custom CRUD operations
 */

import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Generate a URL-safe slug from a title
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Collections repository methods
 */
export function createCollectionsRepository(db: DrizzleDB) {
  return {
    async create(data: { title: string }) {
      const slug = slugify(data.title);
      const [collection] = await db
        .insert(schema.collections)
        .values({
          title: data.title,
          slug,
        })
        .returning();
      return collection;
    },

    async get(id: string) {
      return db.query.collections.findFirst({
        where: eq(schema.collections.id, id),
      });
    },

    async updateBySlug(slug: string, updates: { is_public?: boolean; is_unlisted?: boolean }) {
      const [updated] = await db
        .update(schema.collections)
        .set({
          ...updates,
          updated_at: new Date(),
        })
        .where(eq(schema.collections.slug, slug))
        .returning();
      return updated;
    },
  };
}

/**
 * Collection items repository methods
 */
export function createCollectionItemsRepository(db: DrizzleDB) {
  return {
    async add(data: { collectionId: string; itemId: string }) {
      const [item] = await db
        .insert(schema.collection_items)
        .values({
          collection_id: data.collectionId,
          item_id: data.itemId,
        })
        .returning();
      return item;
    },

    async bulkAdd(collectionId: string, itemIds: string[]) {
      const values = itemIds.map((itemId) => ({
        collection_id: collectionId,
        item_id: itemId,
      }));

      await db.insert(schema.collection_items).values(values);
      return { count: itemIds.length };
    },
  };
}

/**
 * Extend a Drizzle db instance with repository methods
 */
export function withRepositories(db: DrizzleDB) {
  return Object.assign(db, {
    collections: createCollectionsRepository(db),
    collection_items: createCollectionItemsRepository(db),
  });
}

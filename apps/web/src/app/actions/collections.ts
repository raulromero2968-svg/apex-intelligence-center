'use server';

import { revalidateTag } from '@/lib/cache';
import { db } from '@/db';
import { collections, collection_items } from '@/db/schema';
import { eq } from 'drizzle-orm';
import * as Sentry from '@sentry/nextjs';
import type { Span } from '@sentry/types';

/**
 * Generate URL-safe slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100);
}

/**
 * Create a new collection and add an item
 * Invalidates: collection:<slug>, collections:public:list, item:<itemId>
 */
export async function createCollectionAndAddItem(formData: FormData) {
  return Sentry.startSpan(
    { name: 'action.createCollectionAndAddItem', op: 'action' },
    async (span: Span) => {
      const title = String(formData.get('title') || '').trim();
      const itemId = String(formData.get('itemId') || '');

      if (!title) {
        return { error: 'Title is required' };
      }

      const slug = generateSlug(title);

      // Create collection
      const [col] = await db.insert(collections).values({
        title,
        slug,
        is_public: false,
        is_unlisted: false,
      }).returning();

      // Add item to collection if provided
      if (itemId) {
        await db.insert(collection_items).values({
          collection_id: col.id,
          item_id: itemId,
        });
      }

      // Null check for TypeScript strict mode
      if (!col?.slug) {
        throw new Error('Collection slug is required');
      }

      // Precise tag invalidation
      revalidateTag(`collection:${col.slug}`);
      if (col.is_public) revalidateTag('collections:public:list');
      if (itemId) revalidateTag(`item:${itemId}`);

      return { collectionId: col.id, slug: col.slug, title: col.title };
    }
  );
}

/**
 * Add multiple items to an existing collection
 * Invalidates: collection:<slug>, collections:public:list, item:<id> for each item
 */
export async function addItemsToCollection(data: {
  collectionId: string;
  itemIds: string[];
}) {
  return Sentry.startSpan(
    { name: 'action.addItemsToCollection', op: 'action' },
    async (span: Span) => {
      const { collectionId, itemIds } = data;

      if (!itemIds || itemIds.length === 0) {
        return { error: 'No items provided' };
      }

      // Bulk insert collection items
      const itemValues = itemIds.map(itemId => ({
        collection_id: collectionId,
        item_id: itemId,
      }));
      await db.insert(collection_items).values(itemValues);

      // Get collection for tag invalidation
      const [col] = await db.select().from(collections).where(eq(collections.id, collectionId));

      if (!col) {
        return { error: 'Collection not found' };
      }

      if (!col?.slug) {
        return { error: 'Collection not found' };
      }

      // Precise tag invalidation
      revalidateTag(`collection:${col.slug}`);
      if (col.is_public) revalidateTag('collections:public:list');
      for (const id of itemIds) {
        revalidateTag(`item:${id}`);
      }

      return { success: true, count: itemIds.length };
    }
  );
}

/**
 * Update collection visibility settings
 * Invalidates: collection:<slug>, collections:public:list
 */
export async function setVisibility(data: {
  slug: string;
  isPublic?: boolean;
  isUnlisted?: boolean;
}) {
  return Sentry.startSpan(
    { name: 'action.setVisibility', op: 'action' },
    async (span: Span) => {
      const { slug, isPublic, isUnlisted } = data;

      // Update collection by slug
      const [col] = await db.update(collections)
        .set({
          is_public: !!isPublic,
          is_unlisted: !!isUnlisted,
          updated_at: new Date(),
        })
        .where(eq(collections.slug, slug))
        .returning();

      if (!col) {
        return { error: 'Collection not found' };
      }

      // Precise tag invalidation
      revalidateTag(`collection:${slug}`);
      revalidateTag('collections:public:list');

      return { ok: true, slug, isPublic: !!isPublic, isUnlisted: !!isUnlisted };
    }
  );
}


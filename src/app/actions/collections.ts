'use server';

import { revalidateTag } from '@/lib/cache';
import { db } from '@/db';
import * as Sentry from '@sentry/nextjs';
import type { Span } from '@sentry/types';

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

      const col = await db.collections.create({ title });
      if (itemId) {
        await db.collection_items.add({ collectionId: col.id, itemId });
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

      await db.collection_items.bulkAdd(collectionId, itemIds);
      const col = await db.collections.get(collectionId);

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

      const col = await db.collections.updateBySlug(slug, {
        is_public: !!isPublic,
        is_unlisted: !!isUnlisted,
      });

      // Precise tag invalidation
      revalidateTag(`collection:${slug}`);
      revalidateTag('collections:public:list');

      return { ok: true, slug, isPublic: !!isPublic, isUnlisted: !!isUnlisted };
    }
  );
}

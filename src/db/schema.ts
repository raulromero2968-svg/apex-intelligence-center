/**
 * Database schema definitions
 *
 * This file will contain Drizzle ORM schema definitions when database is set up.
 * Currently provides placeholder types for future implementation.
 */

// Placeholder types for collections
export interface Collection {
  id: string;
  title: string;
  slug: string;
  description?: string;
  is_public: boolean;
  is_unlisted: boolean;
  type: string;
  search_params?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CollectionItem {
  id: string;
  collectionId: string;
  itemId: string;
  createdAt: Date;
}

export interface IntelItem {
  id: string;
  name: string;
  source: string;
  data: Record<string, any>;
  observed_at: Date;
  createdAt: Date;
  updatedAt: Date;
}

// When implementing with Drizzle:
// import { pgTable, text, boolean, jsonb, timestamp, uuid } from 'drizzle-orm/pg-core';
//
// export const collections = pgTable('collections', {
//   id: uuid('id').defaultRandom().primaryKey(),
//   title: text('title').notNull(),
//   slug: text('slug').unique().notNull(),
//   description: text('description'),
//   is_public: boolean('is_public').default(false).notNull(),
//   is_unlisted: boolean('is_unlisted').default(false).notNull(),
//   type: text('type').default('default').notNull(),
//   search_params: jsonb('search_params'),
//   created_at: timestamp('created_at').defaultNow().notNull(),
//   updated_at: timestamp('updated_at').defaultNow().notNull(),
// });
//
// export const collection_items = pgTable('collection_items', {
//   id: uuid('id').defaultRandom().primaryKey(),
//   collection_id: uuid('collection_id').references(() => collections.id).notNull(),
//   item_id: text('item_id').notNull(),
//   created_at: timestamp('created_at').defaultNow().notNull(),
// });
//
// export const intel_items = pgTable('intel_items', {
//   id: text('id').primaryKey(),
//   name: text('name').notNull(),
//   source: text('source').notNull(),
//   data: jsonb('data').notNull(),
//   observed_at: timestamp('observed_at').notNull(),
//   created_at: timestamp('created_at').defaultNow().notNull(),
//   updated_at: timestamp('updated_at').defaultNow().notNull(),
// });

// Export placeholder for now
export const collections = null;
export const collection_items = null;
export const intel_items = null;

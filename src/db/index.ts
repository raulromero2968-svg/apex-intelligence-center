/**
 * Database connection with Sentry integration
 *
 * This file will be configured with Drizzle ORM when database is set up.
 * Currently provides placeholder for future implementation.
 */

import * as Sentry from '@sentry/nextjs';

// Placeholder for database connection
// When implementing with Vercel Postgres + Drizzle:
// import { drizzle } from 'drizzle-orm/vercel-postgres';
// import { sql } from '@vercel/postgres';
// import * as schema from './schema';

// export const db = drizzle(sql, {
//   schema,
//   logger: {
//     logQuery(query, params) {
//       Sentry.addBreadcrumb({
//         category: 'db.query',
//         level: 'debug',
//         data: { qlen: query.length, params: params?.length ?? 0 }
//       });
//     },
//   },
// });

// Placeholder type for now
export const db = {
  query: {
    collections: {
      findFirst: async (_opts?: any): Promise<any> => null,
      findMany: async (_opts?: any): Promise<any[]> => [],
    },
    collection_items: {
      findMany: async (_opts?: any): Promise<any[]> => [],
    },
  },
  select: () => ({ from: () => ({ where: () => Promise.resolve([]) }) }),
  update: () => ({ set: () => ({ where: () => Promise.resolve(null) }) }),
  insert: () => ({ values: () => ({ onConflictDoUpdate: () => Promise.resolve(null) }) }),
  transaction: async (fn: any) => fn(db),
  collections: {
    create: async (data: any) => ({ id: '1', slug: 'placeholder', ...data }),
    get: async (id: string) => ({ id, slug: 'placeholder', is_public: true }),
    updateBySlug: async (slug: string, data: any) => ({ slug, ...data }),
  },
  collection_items: {
    add: async (_data: any) => null,
    bulkAdd: async (_collectionId: string, _itemIds: string[]) => null,
  },
};

// Log database initialization
Sentry.addBreadcrumb({
  category: 'db',
  level: 'info',
  message: 'Database module loaded (placeholder mode)',
});

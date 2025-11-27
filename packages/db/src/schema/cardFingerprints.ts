import { pgTable, text, uuid, real, timestamp, index, uniqueIndex, customType } from 'drizzle-orm/pg-core';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// Define custom vector type for pgvector (256 dimensions for fingerprint)
const vector256 = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(256)';
  },
  toDriver(value: number[]): string {
    // pgvector expects array format: '[0.1,0.2,0.3]'
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string | number[]): number[] {
    // Handle both string format from pgvector and array format from driver
    if (Array.isArray(value)) {
      return value;
    }
    // Parse string format '[0.1,0.2,0.3]'
    const cleaned = value.trim();
    if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
      return cleaned.slice(1, -1).split(',').map(Number);
    }
    return JSON.parse(value);
  },
});

/**
 * Card Fingerprints table stores unique fingerprint hashes for physical cards.
 * 
 * Used for:
 * - Deduplication of scanned cards
 * - Digital twin NFT linkage (P2D bridge)
 * - Near-duplicate detection within same card/grade cohort
 * 
 * Invariants:
 * - fingerprintHex must be unique per hashVersion (enforced by unique index)
 * - fingerprintVector must be exactly 256 dimensions (enforced by vector type)
 * - fingerprintHex must be 64-char hex (enforced at application layer)
 * - nearestNeighborDistance < FINGERPRINT_NEAR_DUP_THRESHOLD indicates potential duplicate
 */
export const cardFingerprints = pgTable(
  'card_fingerprints',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id'),
    cardId: text('card_id'),
    jobId: text('job_id'),
    imageUrl: text('image_url').notNull(),
    grade: real('grade'),
    hashVersion: text('hash_version').notNull(),
    fingerprintVector: vector256('fingerprint_vector').notNull(),
    fingerprintHex: text('fingerprint_hex').notNull(),
    nearestNeighborId: uuid('nearest_neighbor_id'),
    nearestNeighborDistance: real('nearest_neighbor_distance'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    // Unique index on (hashVersion, fingerprintHex) to prevent exact duplicates
    hashVersionFingerprintHexUniqueIdx: uniqueIndex('card_fingerprints_hash_version_fingerprint_hex_unique_idx')
      .on(table.hashVersion, table.fingerprintHex),
    // HNSW index on fingerprintVector for approximate nearest-neighbor search
    fingerprintVectorHnswIdx: index('card_fingerprints_fingerprint_vector_hnsw_idx')
      .using('hnsw', table.fingerprintVector.op('vector_l2_ops')),
    // B-tree index on cardId for fast lookups
    cardIdIdx: index('card_fingerprints_card_id_idx').on(table.cardId),
    // B-tree index on userId for user-specific queries
    userIdIdx: index('card_fingerprints_user_id_idx').on(table.userId),
    // B-tree index on jobId for linking to VARC jobs
    jobIdIdx: index('card_fingerprints_job_id_idx').on(table.jobId),
  })
);

export type CardFingerprint = InferSelectModel<typeof cardFingerprints>;
export type NewCardFingerprint = InferInsertModel<typeof cardFingerprints>;




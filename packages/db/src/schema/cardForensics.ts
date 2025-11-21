import { pgTable, text, uuid, real, jsonb, timestamp, index, uniqueIndex, customType } from 'drizzle-orm/pg-core';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// Define custom vector type for pgvector
// pgvector stores vectors as arrays and returns them as strings in format '[0.1,0.2,0.3]'
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(768)';
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

const vector1536 = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(1536)';
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string | number[]): number[] {
    if (Array.isArray(value)) {
      return value;
    }
    const cleaned = value.trim();
    if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
      return cleaned.slice(1, -1).split(',').map(Number);
    }
    return JSON.parse(value);
  },
});

/**
 * Card Forensics table stores results of VARC (Visual Analysis & Reasoning for Cards) jobs.
 * 
 * Invariants:
 * - jobId must be unique and match Intelligence Bus jobId
 * - embeddings must be exactly 768 or 1536 dimensions (enforced at application layer)
 * - reasoningTrace must be valid JSON (enforced by JSONB type)
 * - grade values are typically 1.0-10.0 (PSA scale) or 0.0-10.0 (BGS scale)
 * - counterfeitScore ranges from 0.0 (authentic) to 1.0 (likely counterfeit)
 */
export const cardForensics = pgTable(
  'card_forensics',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    jobId: text('job_id').notNull().unique(),
    userId: text('user_id'),
    cardId: text('card_id').notNull(),
    imageUrl: text('image_url'),
    grade: real('grade'),
    gradeConfidence: real('grade_confidence'),
    counterfeitScore: real('counterfeit_score'),
    embedding768: vector('embedding_768'),
    embedding1536: vector1536('embedding_1536'),
    reasoningTrace: jsonb('reasoning_trace').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    cardIdIdx: index('card_forensics_card_id_idx').on(table.cardId),
    jobIdUniqueIdx: uniqueIndex('card_forensics_job_id_unique_idx').on(table.jobId),
  })
);

export type CardForensics = InferSelectModel<typeof cardForensics>;
export type NewCardForensics = InferInsertModel<typeof cardForensics>;


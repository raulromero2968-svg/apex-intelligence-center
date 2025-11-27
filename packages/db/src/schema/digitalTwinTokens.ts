import { pgTable, text, uuid, timestamp, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

/**
 * Digital Twin Token status enum
 */
export const digitalTwinStatusEnum = pgEnum('digital_twin_status', ['pending', 'minted', 'failed']);

/**
 * Digital Twin Tokens table stores blockchain NFT records linked to card forensics.
 * 
 * Invariants:
 * - cardForensicsId must be unique (one digital twin per forensics record)
 * - polygonTokenId must be unique per contract
 * - status transitions: pending -> minted | failed
 */
export const digitalTwinTokens = pgTable(
  'digital_twin_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    cardForensicsId: uuid('card_forensics_id').notNull().unique(),
    userId: text('user_id'),
    cardId: text('card_id'),
    polygonTokenId: text('polygon_token_id').notNull(),
    polygonTxHash: text('polygon_tx_hash').notNull(),
    metadataUri: text('metadata_uri').notNull(),
    status: digitalTwinStatusEnum('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    cardForensicsIdUniqueIdx: uniqueIndex('digital_twin_tokens_card_forensics_id_unique_idx').on(
      table.cardForensicsId
    ),
    polygonTokenIdIdx: index('digital_twin_tokens_polygon_token_id_idx').on(table.polygonTokenId),
    userIdIdx: index('digital_twin_tokens_user_id_idx').on(table.userId),
    cardIdIdx: index('digital_twin_tokens_card_id_idx').on(table.cardId),
    statusIdx: index('digital_twin_tokens_status_idx').on(table.status),
  })
);

export type DigitalTwinToken = InferSelectModel<typeof digitalTwinTokens>;
export type NewDigitalTwinToken = InferInsertModel<typeof digitalTwinTokens>;




import { pgTable, text, uuid, real, jsonb, timestamp, integer, numeric, index, uniqueIndex } from 'drizzle-orm/pg-core';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

/**
 * Project O OTC Orders table
 * Stores OTC (Over-The-Counter) order book data from Project O marketplace
 */
export const projectOotcOrders = pgTable(
  'project_o_otc_orders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: text('order_id').notNull().unique(),
    side: text('side').notNull(), // "buy" | "sell"
    cardId: text('card_id').notNull(),
    price: numeric('price', { precision: 20, scale: 8 }).notNull(),
    priceCurrency: text('price_currency').notNull(),
    size: integer('size').notNull(),
    traderHandle: text('trader_handle'),
    source: text('source').notNull(), // e.g., "official_otc", "mirror_site"
    raw: jsonb('raw').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
  },
  (table) => ({
    orderIdUniqueIdx: uniqueIndex('project_o_otc_orders_order_id_unique_idx').on(table.orderId),
    cardIdIdx: index('project_o_otc_orders_card_id_idx').on(table.cardId),
    sideCardIdx: index('project_o_otc_orders_side_card_idx').on(table.side, table.cardId),
    createdAtIdx: index('project_o_otc_orders_created_at_idx').on(table.createdAt),
  })
);

/**
 * Project O Whitelist Prices table
 * Stores on-chain price data for whitelist tokens
 */
export const projectOwhitelistPrices = pgTable(
  'project_o_whitelist_prices',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    chain: text('chain').notNull(),
    tokenAddress: text('token_address').notNull(),
    price: numeric('price', { precision: 20, scale: 8 }).notNull(),
    priceUsd: numeric('price_usd', { precision: 20, scale: 8 }).notNull(),
    blockNumber: integer('block_number').notNull(),
    txHash: text('tx_hash'),
    observedAt: timestamp('observed_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tokenAddressIdx: index('project_o_whitelist_prices_token_address_idx').on(table.tokenAddress),
    observedAtIdx: index('project_o_whitelist_prices_observed_at_idx').on(table.observedAt),
    chainTokenIdx: index('project_o_whitelist_prices_chain_token_idx').on(table.chain, table.tokenAddress),
  })
);

/**
 * Project O Discord Messages table
 * Stores Discord messages with sentiment analysis
 */
export const projectOdiscordMessages = pgTable(
  'project_o_discord_messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    messageId: text('message_id').notNull().unique(),
    author: text('author').notNull(),
    content: text('content').notNull(),
    sentimentScore: real('sentiment_score'), // -1 to 1
    channelId: text('channel_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    ingestedAt: timestamp('ingested_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    messageIdUniqueIdx: uniqueIndex('project_o_discord_messages_message_id_unique_idx').on(table.messageId),
    channelIdIdx: index('project_o_discord_messages_channel_id_idx').on(table.channelId),
    createdAtIdx: index('project_o_discord_messages_created_at_idx').on(table.createdAt),
    sentimentScoreIdx: index('project_o_discord_messages_sentiment_score_idx').on(table.sentimentScore),
  })
);

export type ProjectOOtcOrder = InferSelectModel<typeof projectOotcOrders>;
export type NewProjectOOtcOrder = InferInsertModel<typeof projectOotcOrders>;
export type ProjectOWhitelistPrice = InferSelectModel<typeof projectOwhitelistPrices>;
export type NewProjectOWhitelistPrice = InferInsertModel<typeof projectOwhitelistPrices>;
export type ProjectODiscordMessage = InferSelectModel<typeof projectOdiscordMessages>;
export type NewProjectODiscordMessage = InferInsertModel<typeof projectOdiscordMessages>;




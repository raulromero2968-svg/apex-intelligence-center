import { pgTable, uuid, text, real, numeric, jsonb, timestamp, index } from 'drizzle-orm/pg-core';

export const arbitrageOpportunities = pgTable(
  'arbitrage_opportunities',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    baseCollection: text('base_collection').notNull(),
    edgeBps: real('edge_bps').notNull(),
    estimatedProfitUsd: numeric('estimated_profit_usd', { precision: 12, scale: 2 }).notNull(),
    riskScore: real('risk_score').notNull(),
    status: text('status').notNull().default('open'), // 'open' | 'stale' | 'executed' | 'ignored'
    legs: jsonb('legs').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    createdAtIdx: index('arbitrage_opportunities_created_at_idx').on(table.createdAt.desc()),
    baseCollectionIdx: index('arbitrage_opportunities_base_collection_idx').on(table.baseCollection),
    statusIdx: index('arbitrage_opportunities_status_idx').on(table.status),
  })
);

export type ArbitrageOpportunity = typeof arbitrageOpportunities.$inferSelect;
export type NewArbitrageOpportunity = typeof arbitrageOpportunities.$inferInsert;




import { pgTable, pgEnum, text, uuid, timestamp, decimal, jsonb, index, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { users } from '../schema';

// =============================================================================
// X-INTEL REPORTS
// =============================================================================
// Intelligence capture and reporting system for X (Twitter) posts
// Supports posting to Commons (public) and RC Market (premium)

// =============================================================================
// ENUMS
// =============================================================================

/**
 * Intel report status
 */
export const intelReportStatusEnum = pgEnum('intel_report_status', [
  'draft',
  'published',
  'archived',
  'flagged',
]);

/**
 * Intel report type for categorization
 */
export const intelReportTypeEnum = pgEnum('intel_report_type', [
  'market_intel',
  'price_alert',
  'trend_analysis',
  'breaking_news',
  'insider_tip',
  'community_update',
  'other',
]);

// =============================================================================
// INTEL REPORTS TABLE
// =============================================================================

/**
 * Intel Reports - captures X posts and transforms them into actionable intel
 * Users can post to Commons (public), RC Market (premium), or both
 */
export const intelReports = pgTable(
  'intel_reports',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Source information
    xPostUrl: text('x_post_url').notNull(),
    xPostId: text('x_post_id'), // Extracted post ID for deduplication
    xAuthor: text('x_author'), // Original author handle

    // Content
    title: text('title'),
    content: text('content').notNull(),
    summary: text('summary'), // AI-generated summary

    // Categorization
    reportType: intelReportTypeEnum('report_type').default('other').notNull(),
    tags: jsonb('tags').$type<string[]>().default([]),

    // Distribution
    postedTo: jsonb('posted_to').$type<string[]>().default([]), // ['commons', 'rc_market']
    isPublic: boolean('is_public').default(false).notNull(),

    // Pricing (for RC Market)
    price: decimal('price', { precision: 10, scale: 2 }).default('0.00'),

    // Quality metrics
    qualityScore: decimal('quality_score', { precision: 3, scale: 2 }),
    views: decimal('views', { precision: 10, scale: 0 }).default('0'),

    // Status
    status: intelReportStatusEnum('status').default('draft').notNull(),

    // Metadata
    metadata: jsonb('metadata').$type<{
      aiTransformed?: boolean;
      transformationModel?: string;
      originalTweetData?: Record<string, unknown>;
      moderationFlags?: string[];
    }>().default({}),

    // Timestamps
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('intel_reports_user_id_idx').on(table.userId),
    statusIdx: index('intel_reports_status_idx').on(table.status),
    reportTypeIdx: index('intel_reports_type_idx').on(table.reportType),
    createdAtIdx: index('intel_reports_created_at_idx').on(table.createdAt.desc()),
    xPostIdIdx: index('intel_reports_x_post_id_idx').on(table.xPostId),
    isPublicIdx: index('intel_reports_is_public_idx').on(table.isPublic),
  })
);

// =============================================================================
// INTEL REPORT PURCHASES
// =============================================================================

/**
 * Track purchases of premium intel reports from RC Market
 */
export const intelReportPurchases = pgTable(
  'intel_report_purchases',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    reportId: uuid('report_id')
      .notNull()
      .references(() => intelReports.id, { onDelete: 'cascade' }),
    buyerId: uuid('buyer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    purchasedAt: timestamp('purchased_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    reportIdIdx: index('intel_purchases_report_idx').on(table.reportId),
    buyerIdIdx: index('intel_purchases_buyer_idx').on(table.buyerId),
  })
);

// =============================================================================
// RELATIONS
// =============================================================================

export const intelReportsRelations = relations(intelReports, ({ one, many }) => ({
  user: one(users, {
    fields: [intelReports.userId],
    references: [users.id],
  }),
  purchases: many(intelReportPurchases),
}));

export const intelReportPurchasesRelations = relations(intelReportPurchases, ({ one }) => ({
  report: one(intelReports, {
    fields: [intelReportPurchases.reportId],
    references: [intelReports.id],
  }),
  buyer: one(users, {
    fields: [intelReportPurchases.buyerId],
    references: [users.id],
  }),
}));

// =============================================================================
// TYPES
// =============================================================================

export type IntelReport = InferSelectModel<typeof intelReports>;
export type NewIntelReport = InferInsertModel<typeof intelReports>;

export type IntelReportPurchase = InferSelectModel<typeof intelReportPurchases>;
export type NewIntelReportPurchase = InferInsertModel<typeof intelReportPurchases>;

// Enum type exports
export type IntelReportStatus = 'draft' | 'published' | 'archived' | 'flagged';
export type IntelReportType = 'market_intel' | 'price_alert' | 'trend_analysis' | 'breaking_news' | 'insider_tip' | 'community_update' | 'other';

/**
 * SEO Performance Schema
 *
 * Database tables for Core Web Vitals and SEO optimization.
 * Implements knowledge-07-seo-performance architecture.
 *
 * Tables:
 * - vitalsMetrics: Core Web Vitals measurements
 * - seoAudits: Lighthouse audit results
 * - schemaMarkups: JSON-LD structured data
 * - sitemapConfigs: Sitemap configurations
 * - ogImages: Dynamic OG image configurations
 * - seoKnowledge: RAG knowledge base
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  boolean,
  integer,
  real,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';

// ============================================================================
// ENUMS
// ============================================================================

export const vitalTypeEnum = pgEnum('vital_type', ['LCP', 'INP', 'CLS', 'FCP', 'TTFB', 'FID']);

export const vitalRatingEnum = pgEnum('vital_rating', ['good', 'needs_improvement', 'poor']);

export const schemaTypeEnum = pgEnum('schema_type', [
  'Product',
  'Article',
  'FAQPage',
  'BreadcrumbList',
  'Organization',
  'WebSite',
  'WebPage',
  'ItemList',
  'HowTo',
  'Review',
]);

export const auditCategoryEnum = pgEnum('audit_category', [
  'performance',
  'accessibility',
  'best_practices',
  'seo',
  'pwa',
]);

export const changefreqEnum = pgEnum('changefreq', [
  'always',
  'hourly',
  'daily',
  'weekly',
  'monthly',
  'yearly',
  'never',
]);

// ============================================================================
// CORE WEB VITALS
// ============================================================================

/**
 * Core Web Vitals measurements
 */
export const vitalsMetrics = pgTable(
  'vitals_metrics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    pageUrl: text('page_url').notNull(),
    pageId: text('page_id'),
    userId: text('user_id'),
    sessionId: text('session_id'),

    // Vital metrics
    vitalType: vitalTypeEnum('vital_type').notNull(),
    value: real('value').notNull(),
    rating: vitalRatingEnum('rating').notNull(),

    // Context
    deviceType: text('device_type'), // mobile, desktop, tablet
    connectionType: text('connection_type'), // 4g, 3g, wifi
    viewportWidth: integer('viewport_width'),
    viewportHeight: integer('viewport_height'),

    // Attribution
    element: text('element'), // Element selector for LCP/CLS
    navigationType: text('navigation_type'), // navigate, reload, back_forward
    attribution: jsonb('attribution').$type<{
      element?: string;
      url?: string;
      timeToFirstByte?: number;
      resourceLoadDelay?: number;
      elementRenderDelay?: number;
    }>(),

    // Raw data
    rawMetrics: jsonb('raw_metrics'),

    timestamp: timestamp('timestamp').notNull().defaultNow(),
  },
  (table) => [
    index('vitals_page_url_idx').on(table.pageUrl),
    index('vitals_type_idx').on(table.vitalType),
    index('vitals_timestamp_idx').on(table.timestamp),
    index('vitals_rating_idx').on(table.rating),
  ]
);

// ============================================================================
// SEO AUDITS
// ============================================================================

/**
 * Lighthouse audit results
 */
export const seoAudits = pgTable(
  'seo_audits',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    pageUrl: text('page_url').notNull(),
    projectId: text('project_id'),
    userId: text('user_id'),

    // Scores (0-100)
    performanceScore: integer('performance_score'),
    accessibilityScore: integer('accessibility_score'),
    bestPracticesScore: integer('best_practices_score'),
    seoScore: integer('seo_score'),
    pwaScore: integer('pwa_score'),

    // Core Web Vitals from audit
    lcpMs: real('lcp_ms'),
    inpMs: real('inp_ms'),
    clsScore: real('cls_score'),
    fcpMs: real('fcp_ms'),
    ttfbMs: real('ttfb_ms'),
    siMs: real('si_ms'), // Speed Index
    tbtMs: real('tbt_ms'), // Total Blocking Time

    // Issues found
    issues: jsonb('issues').$type<
      Array<{
        id: string;
        title: string;
        description: string;
        category: string;
        severity: 'error' | 'warning' | 'info';
        score: number;
        details?: Record<string, unknown>;
      }>
    >(),

    // Opportunities
    opportunities: jsonb('opportunities').$type<
      Array<{
        id: string;
        title: string;
        description: string;
        savingsMs?: number;
        savingsBytes?: number;
        details?: Record<string, unknown>;
      }>
    >(),

    // Diagnostics
    diagnostics: jsonb('diagnostics').$type<{
      mainThreadWorkMs: number;
      jsExecutionMs: number;
      totalByteWeight: number;
      domSize: number;
      criticalRequestChains: number;
    }>(),

    // Configuration
    deviceEmulation: text('device_emulation'), // mobile, desktop
    throttling: jsonb('throttling').$type<{
      cpuSlowdownMultiplier: number;
      networkThrottling: string;
    }>(),

    // Full report
    fullReport: jsonb('full_report'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('audits_page_url_idx').on(table.pageUrl),
    index('audits_project_idx').on(table.projectId),
    index('audits_created_idx').on(table.createdAt),
  ]
);

// ============================================================================
// SCHEMA MARKUP
// ============================================================================

/**
 * JSON-LD structured data configurations
 */
export const schemaMarkups = pgTable(
  'schema_markups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description'),
    projectId: text('project_id'),
    userId: text('user_id'),

    // Schema configuration
    schemaType: schemaTypeEnum('schema_type').notNull(),
    schemaData: jsonb('schema_data').notNull().$type<Record<string, unknown>>(),

    // Page association
    pagePattern: text('page_pattern'), // URL pattern to apply schema
    componentName: text('component_name'), // React component name

    // Validation
    isValid: boolean('is_valid').default(false),
    validationErrors: jsonb('validation_errors').$type<
      Array<{
        property: string;
        message: string;
        severity: 'error' | 'warning';
      }>
    >(),

    // Rich results eligibility
    richResultsEligible: boolean('rich_results_eligible').default(false),
    richResultsType: text('rich_results_type'), // e.g., "Product snippet", "FAQ"

    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('schema_project_idx').on(table.projectId),
    index('schema_type_idx').on(table.schemaType),
  ]
);

// ============================================================================
// SITEMAP CONFIGURATION
// ============================================================================

/**
 * Sitemap configurations
 */
export const sitemapConfigs = pgTable(
  'sitemap_configs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description'),
    projectId: text('project_id'),
    userId: text('user_id'),

    // Sitemap settings
    baseUrl: text('base_url').notNull(),
    defaultChangefreq: changefreqEnum('default_changefreq').default('weekly'),
    defaultPriority: real('default_priority').default(0.5),

    // Page rules
    pageRules: jsonb('page_rules').$type<
      Array<{
        pattern: string;
        changefreq: string;
        priority: number;
        include: boolean;
        lastmodSource?: 'static' | 'database' | 'api';
      }>
    >(),

    // Exclusions
    excludePatterns: jsonb('exclude_patterns').$type<string[]>(),

    // Dynamic pages
    dynamicSources: jsonb('dynamic_sources').$type<
      Array<{
        name: string;
        tableName: string;
        urlPattern: string;
        lastmodColumn?: string;
      }>
    >(),

    // Generated sitemap
    lastGenerated: timestamp('last_generated'),
    pageCount: integer('page_count'),
    sitemapXml: text('sitemap_xml'),

    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('sitemap_project_idx').on(table.projectId)]
);

// ============================================================================
// OG IMAGES
// ============================================================================

/**
 * Dynamic OG image configurations
 */
export const ogImages = pgTable(
  'og_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description'),
    projectId: text('project_id'),
    userId: text('user_id'),

    // Template configuration
    template: jsonb('template').$type<{
      width: number;
      height: number;
      backgroundColor: string;
      backgroundGradient?: {
        from: string;
        to: string;
        direction: string;
      };
      elements: Array<{
        type: 'text' | 'image' | 'shape';
        x: number;
        y: number;
        width?: number;
        height?: number;
        content?: string;
        variable?: string;
        style?: Record<string, unknown>;
      }>;
    }>(),

    // Page association
    pagePattern: text('page_pattern'),

    // Variables available
    variables: jsonb('variables').$type<
      Array<{
        name: string;
        type: 'string' | 'number' | 'image';
        source: 'static' | 'page_data' | 'api';
        defaultValue?: string;
      }>
    >(),

    // Caching
    cacheDuration: integer('cache_duration').default(86400), // seconds

    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('og_project_idx').on(table.projectId)]
);

// ============================================================================
// SEO KNOWLEDGE BASE
// ============================================================================

/**
 * RAG knowledge base for SEO
 */
export const seoKnowledge = pgTable(
  'seo_knowledge',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    content: text('content').notNull(),

    // Classification
    documentType: text('document_type').notNull(), // concept, api_reference, code_example, best_practice, troubleshooting
    category: text('category').notNull(), // vitals, schema, sitemap, images, fonts, meta, og

    // Metadata
    tags: jsonb('tags').$type<string[]>(),
    relatedTopics: jsonb('related_topics').$type<string[]>(),
    codeExamples: jsonb('code_examples').$type<
      Array<{
        language: string;
        code: string;
        description: string;
      }>
    >(),

    // Next.js version compatibility
    nextjsVersion: text('nextjs_version'), // e.g., "14+"

    // Vector embedding
    embedding: jsonb('embedding').$type<number[]>(),

    // Source
    sourceUrl: text('source_url'),
    isVerified: boolean('is_verified').default(false),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('seo_knowledge_type_idx').on(table.documentType),
    index('seo_knowledge_category_idx').on(table.category),
  ]
);

// ============================================================================
// TYPES
// ============================================================================

export type VitalsMetric = typeof vitalsMetrics.$inferSelect;
export type NewVitalsMetric = typeof vitalsMetrics.$inferInsert;

export type SeoAudit = typeof seoAudits.$inferSelect;
export type NewSeoAudit = typeof seoAudits.$inferInsert;

export type SchemaMarkup = typeof schemaMarkups.$inferSelect;
export type NewSchemaMarkup = typeof schemaMarkups.$inferInsert;

export type SitemapConfig = typeof sitemapConfigs.$inferSelect;
export type NewSitemapConfig = typeof sitemapConfigs.$inferInsert;

export type OgImage = typeof ogImages.$inferSelect;
export type NewOgImage = typeof ogImages.$inferInsert;

export type SeoKnowledge = typeof seoKnowledge.$inferSelect;
export type NewSeoKnowledge = typeof seoKnowledge.$inferInsert;

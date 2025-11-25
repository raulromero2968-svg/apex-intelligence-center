/**
 * Feedback & A/B Testing Schema for Apex Intelligence
 *
 * Implements user feedback loop with A/B testing:
 * - A/B experiment tracking
 * - Survey responses with job impact analysis
 * - Conversion tracking
 * - Statistical significance calculations
 *
 * @see knowledge-06-data-ab-testing for A/B methodology
 */

import { pgTable, text, boolean, jsonb, timestamp, uuid, index, uniqueIndex, integer, real } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from '../schema';

// ============================================================================
// A/B TESTING FRAMEWORK
// ============================================================================

/**
 * A/B Experiments - Experiment configuration and status
 */
export const abExperiments = pgTable('ab_experiments', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Experiment identification
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),

  // Experiment type
  experimentType: text('experiment_type', {
    enum: ['feature', 'ui', 'algorithm', 'pricing', 'survey', 'content']
  }).notNull(),

  // Variants configuration
  variants: jsonb('variants').$type<Array<{
    id: string;
    name: string;
    description?: string;
    weight: number; // Traffic allocation (0-100)
    config?: Record<string, any>;
  }>>().notNull(),

  // Targeting rules
  targeting: jsonb('targeting').$type<{
    userSegments?: string[];
    subscriptionTiers?: string[];
    newUsersOnly?: boolean;
    percentage?: number;
    geoTargets?: string[];
  }>().default({}),

  // Goals and metrics
  primaryMetric: text('primary_metric').notNull(), // e.g., 'conversion', 'engagement', 'retention'
  secondaryMetrics: jsonb('secondary_metrics').$type<string[]>().default([]),
  successCriteria: jsonb('success_criteria').$type<{
    minSampleSize: number;
    minConfidence: number;
    minEffect: number;
  }>().default({ minSampleSize: 100, minConfidence: 0.95, minEffect: 0.05 }),

  // Status
  status: text('status', {
    enum: ['draft', 'running', 'paused', 'completed', 'archived']
  }).default('draft').notNull(),

  // Results
  winningVariant: text('winning_variant'),
  statisticalSignificance: real('statistical_significance'),
  resultsJson: jsonb('results_json').$type<{
    variantResults: Record<string, {
      participants: number;
      conversions: number;
      conversionRate: number;
      avgMetricValue?: number;
    }>;
    pValue?: number;
    confidenceInterval?: [number, number];
    effect?: number;
  }>(),

  // Timing
  startedAt: timestamp('started_at'),
  endedAt: timestamp('ended_at'),
  scheduledStartAt: timestamp('scheduled_start_at'),
  scheduledEndAt: timestamp('scheduled_end_at'),

  // Owner
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex('idx_ab_experiments_slug').on(table.slug),
  statusIdx: index('idx_ab_experiments_status').on(table.status),
  typeIdx: index('idx_ab_experiments_type').on(table.experimentType),
  startedIdx: index('idx_ab_experiments_started').on(table.startedAt),
}));

/**
 * Experiment Assignments - User variant assignments
 */
export const experimentAssignments = pgTable('experiment_assignments', {
  id: uuid('id').defaultRandom().primaryKey(),

  experimentId: uuid('experiment_id').notNull().references(() => abExperiments.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Assignment
  variantId: text('variant_id').notNull(),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),

  // Context at assignment time
  context: jsonb('context').$type<{
    userAgent?: string;
    platform?: string;
    subscriptionTier?: string;
    referrer?: string;
  }>(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  experimentUserIdx: uniqueIndex('idx_experiment_assignments_unique').on(table.experimentId, table.userId),
  experimentIdx: index('idx_experiment_assignments_experiment').on(table.experimentId),
  variantIdx: index('idx_experiment_assignments_variant').on(table.experimentId, table.variantId),
}));

/**
 * Experiment Conversions - Conversion events for experiments
 */
export const experimentConversions = pgTable('experiment_conversions', {
  id: uuid('id').defaultRandom().primaryKey(),

  assignmentId: uuid('assignment_id').notNull().references(() => experimentAssignments.id, { onDelete: 'cascade' }),
  experimentId: uuid('experiment_id').notNull().references(() => abExperiments.id, { onDelete: 'cascade' }),

  // Conversion details
  eventType: text('event_type').notNull(), // e.g., 'signup', 'purchase', 'feature_used'
  eventValue: real('event_value'), // Optional numeric value

  // Metadata
  metadata: jsonb('metadata').$type<Record<string, any>>(),

  convertedAt: timestamp('converted_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  assignmentIdx: index('idx_experiment_conversions_assignment').on(table.assignmentId),
  experimentIdx: index('idx_experiment_conversions_experiment').on(table.experimentId),
  eventTypeIdx: index('idx_experiment_conversions_event').on(table.eventType),
}));

// ============================================================================
// SURVEY & FEEDBACK SYSTEM
// ============================================================================

/**
 * Surveys - Survey definitions
 */
export const surveys = pgTable('surveys', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Survey metadata
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),

  // Survey type
  surveyType: text('survey_type', {
    enum: ['job_impact', 'satisfaction', 'feature_request', 'nps', 'usability', 'custom']
  }).notNull(),

  // Questions
  questions: jsonb('questions').$type<Array<{
    id: string;
    type: 'rating' | 'scale' | 'multiple_choice' | 'text' | 'yes_no';
    text: string;
    required: boolean;
    options?: string[];
    scale?: { min: number; max: number; labels?: { min: string; max: string } };
  }>>().notNull(),

  // Display settings
  trigger: text('trigger', {
    enum: ['manual', 'time_based', 'event_based', 'feature_gated']
  }).default('manual').notNull(),
  triggerConfig: jsonb('trigger_config').$type<{
    delaySeconds?: number;
    eventName?: string;
    featureId?: string;
    frequency?: 'once' | 'weekly' | 'monthly';
  }>(),

  // A/B experiment link (if part of experiment)
  experimentId: uuid('experiment_id').references(() => abExperiments.id, { onDelete: 'set null' }),

  // Status
  status: text('status', {
    enum: ['draft', 'active', 'paused', 'completed', 'archived']
  }).default('draft').notNull(),

  // Targeting
  targetAudience: jsonb('target_audience').$type<{
    subscriptionTiers?: string[];
    userSegments?: string[];
    minAccountAge?: number; // days
  }>(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex('idx_surveys_slug').on(table.slug),
  statusIdx: index('idx_surveys_status').on(table.status),
  typeIdx: index('idx_surveys_type').on(table.surveyType),
}));

/**
 * Survey Responses - Individual user survey responses
 */
export const surveyResponses = pgTable('survey_responses', {
  id: uuid('id').defaultRandom().primaryKey(),

  surveyId: uuid('survey_id').notNull().references(() => surveys.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),

  // Experiment context (if part of A/B)
  experimentId: uuid('experiment_id').references(() => abExperiments.id, { onDelete: 'set null' }),
  variantId: text('variant_id'),

  // Responses
  responses: jsonb('responses').$type<Record<string, any>>().notNull(), // question_id -> answer

  // Job impact analysis (for job_impact surveys)
  jobImpactAnalysis: jsonb('job_impact_analysis').$type<{
    category: 'high_impact' | 'medium_impact' | 'low_impact';
    timeSavedHours?: number;
    skillsRequired?: string[];
    reskillSuggestions?: string[];
    sentiment?: 'positive' | 'negative' | 'neutral';
    ragInsight?: string;
  }>(),

  // Sentiment analysis
  sentimentScore: real('sentiment_score'), // -1 to 1
  sentimentCategory: text('sentiment_category', {
    enum: ['positive', 'negative', 'neutral', 'mixed']
  }),

  // Metadata
  completedAt: timestamp('completed_at').defaultNow().notNull(),
  timeToCompleteSeconds: integer('time_to_complete_seconds'),
  deviceInfo: jsonb('device_info').$type<{
    userAgent?: string;
    platform?: string;
  }>(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  surveyIdx: index('idx_survey_responses_survey').on(table.surveyId),
  userIdx: index('idx_survey_responses_user').on(table.userId),
  experimentIdx: index('idx_survey_responses_experiment').on(table.experimentId),
  sentimentIdx: index('idx_survey_responses_sentiment').on(table.sentimentCategory),
  completedIdx: index('idx_survey_responses_completed').on(table.completedAt),
}));

/**
 * Feedback Items - General user feedback collection
 */
export const feedbackItems = pgTable('feedback_items', {
  id: uuid('id').defaultRandom().primaryKey(),

  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),

  // Feedback details
  feedbackType: text('feedback_type', {
    enum: ['bug', 'feature_request', 'improvement', 'praise', 'complaint', 'question', 'other']
  }).notNull(),
  category: text('category'), // e.g., 'ui', 'performance', 'pricing', 'ai_features'
  title: text('title'),
  content: text('content').notNull(),

  // Attachments
  attachments: jsonb('attachments').$type<Array<{
    type: 'image' | 'video' | 'file';
    url: string;
    name?: string;
  }>>().default([]),

  // Context
  pageUrl: text('page_url'),
  sessionId: text('session_id'),
  context: jsonb('context').$type<{
    userAgent?: string;
    platform?: string;
    subscriptionTier?: string;
    screenshotUrl?: string;
  }>(),

  // Processing
  status: text('status', {
    enum: ['new', 'reviewed', 'in_progress', 'resolved', 'closed', 'wont_fix']
  }).default('new').notNull(),
  priority: text('priority', {
    enum: ['low', 'medium', 'high', 'urgent']
  }).default('medium').notNull(),
  assignedTo: text('assigned_to'),
  resolution: text('resolution'),

  // Sentiment
  sentimentScore: real('sentiment_score'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_feedback_items_user').on(table.userId),
  typeIdx: index('idx_feedback_items_type').on(table.feedbackType),
  statusIdx: index('idx_feedback_items_status').on(table.status),
  priorityIdx: index('idx_feedback_items_priority').on(table.priority),
  createdIdx: index('idx_feedback_items_created').on(table.createdAt),
}));

// ============================================================================
// RELATIONS
// ============================================================================

export const abExperimentsRelations = relations(abExperiments, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [abExperiments.createdBy],
    references: [users.id],
  }),
  assignments: many(experimentAssignments),
  conversions: many(experimentConversions),
  surveys: many(surveys),
}));

export const experimentAssignmentsRelations = relations(experimentAssignments, ({ one, many }) => ({
  experiment: one(abExperiments, {
    fields: [experimentAssignments.experimentId],
    references: [abExperiments.id],
  }),
  user: one(users, {
    fields: [experimentAssignments.userId],
    references: [users.id],
  }),
  conversions: many(experimentConversions),
}));

export const experimentConversionsRelations = relations(experimentConversions, ({ one }) => ({
  assignment: one(experimentAssignments, {
    fields: [experimentConversions.assignmentId],
    references: [experimentAssignments.id],
  }),
  experiment: one(abExperiments, {
    fields: [experimentConversions.experimentId],
    references: [abExperiments.id],
  }),
}));

export const surveysRelations = relations(surveys, ({ one, many }) => ({
  experiment: one(abExperiments, {
    fields: [surveys.experimentId],
    references: [abExperiments.id],
  }),
  responses: many(surveyResponses),
}));

export const surveyResponsesRelations = relations(surveyResponses, ({ one }) => ({
  survey: one(surveys, {
    fields: [surveyResponses.surveyId],
    references: [surveys.id],
  }),
  user: one(users, {
    fields: [surveyResponses.userId],
    references: [users.id],
  }),
  experiment: one(abExperiments, {
    fields: [surveyResponses.experimentId],
    references: [abExperiments.id],
  }),
}));

export const feedbackItemsRelations = relations(feedbackItems, ({ one }) => ({
  user: one(users, {
    fields: [feedbackItems.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type AbExperiment = typeof abExperiments.$inferSelect;
export type NewAbExperiment = typeof abExperiments.$inferInsert;
export type ExperimentAssignment = typeof experimentAssignments.$inferSelect;
export type NewExperimentAssignment = typeof experimentAssignments.$inferInsert;
export type ExperimentConversion = typeof experimentConversions.$inferSelect;
export type NewExperimentConversion = typeof experimentConversions.$inferInsert;
export type Survey = typeof surveys.$inferSelect;
export type NewSurvey = typeof surveys.$inferInsert;
export type SurveyResponse = typeof surveyResponses.$inferSelect;
export type NewSurveyResponse = typeof surveyResponses.$inferInsert;
export type FeedbackItem = typeof feedbackItems.$inferSelect;
export type NewFeedbackItem = typeof feedbackItems.$inferInsert;

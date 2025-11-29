/**
 * Personal Operating System (POS) Database Schema
 *
 * Implements a comprehensive personal development and resilience system.
 * Rooted in first principles: probabilistic reality, Bayesian trust inference,
 * and anti-fragile design patterns.
 *
 * Features:
 * - Trust scoring with BRAVING framework (Brené Brown)
 * - Vulnerability drill tracking with progression levels
 * - Emotion dashboard with HRV integration hooks
 * - Bias calibration and model audit protocols
 * - Resource allocation optimization
 * - Reactivity escape hatch patterns
 *
 * @see master-plan-personal-operating-system
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
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from '../schema';

// ============================================================================
// ENUMS
// ============================================================================

export const trustLevelEnum = pgEnum('trust_level', [
  'minimal',      // New relationship, no data
  'cautious',     // Some positive signals
  'developing',   // Building trust patterns
  'established',  // Consistent positive history
  'deep',         // High-confidence trust
]);

export const vulnerabilityLevelEnum = pgEnum('vulnerability_level', [
  'level_1',  // Basic - factual vulnerabilities (low emotional load)
  'level_2',  // Intermediate - relational specifics
  'level_3',  // Advanced - high-stakes emotional exposure
]);

export const emotionIntensityEnum = pgEnum('emotion_intensity', [
  'minimal',    // 1-2
  'low',        // 3-4
  'moderate',   // 5-6
  'elevated',   // 7-8
  'intense',    // 9-10
]);

export const drillStatusEnum = pgEnum('drill_status', [
  'scheduled',
  'in_progress',
  'completed',
  'skipped',
  'paused',
]);

export const shieldModeEnum = pgEnum('shield_mode', [
  'analysis',     // Deep pattern analysis active
  'balanced',     // Moderate analysis/surrender
  'surrender',    // Trust-forward mode
  'recovery',     // Post-stress recovery
]);

export const bravingElementEnum = pgEnum('braving_element', [
  'boundaries',
  'reliability',
  'accountability',
  'vault',
  'integrity',
  'non_judgment',
  'generosity',
]);

// Nietzschean Volitional Enums
export const volitionalVirtueEnum = pgEnum('volitional_virtue', [
  'will_to_power',
  'self_overcoming',
  'eternal_recurrence',
  'master_morality',
]);

export const aristotelianVirtueEnum = pgEnum('aristotelian_virtue', [
  'courage',
  'temperance',
  'justice',
  'phronesis',
  'magnificence',
  'magnanimity',
]);

export const moralityTypeEnum = pgEnum('morality_type', [
  'master',
  'slave',
  'neutral',
]);

export const volitionalPracticeStatusEnum = pgEnum('volitional_practice_status', [
  'scheduled',
  'in_progress',
  'completed',
  'affirmed',
  'rolled_back',
]);

// ============================================================================
// TRUST SCORES TABLE (BRAVING Framework)
// ============================================================================

export const trustScores = pgTable(
  'pos_trust_scores',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // Entity being evaluated
    entityType: text('entity_type').notNull(), // 'person', 'organization', 'system'
    entityName: text('entity_name').notNull(),
    entityId: text('entity_id'), // Optional external reference

    // Overall trust metrics
    overallScore: real('overall_score').notNull().default(50), // 0-100
    trustLevel: trustLevelEnum('trust_level').default('minimal').notNull(),
    confidenceScore: real('confidence_score').default(0.5), // 0-1 Bayesian confidence

    // BRAVING Framework scores (0-10 each)
    bravingScores: jsonb('braving_scores').$type<{
      boundaries: number;       // Respect for defined edges
      reliability: number;      // Consistency of action to word
      accountability: number;   // Ownership of errors
      vault: number;           // Confidentiality maintained
      integrity: number;       // Values/actions alignment
      nonJudgment: number;     // Safe space for vulnerability
      generosity: number;      // Assumes best intent
    }>().notNull().default({
      boundaries: 5,
      reliability: 5,
      accountability: 5,
      vault: 5,
      integrity: 5,
      nonJudgment: 5,
      generosity: 5,
    }),

    // Historical context
    interactionCount: integer('interaction_count').default(0),
    positiveSignals: integer('positive_signals').default(0),
    negativeSignals: integer('negative_signals').default(0),

    // Bayesian priors
    priorStrength: real('prior_strength').default(1), // Weight of historical data
    lastBayesianUpdate: timestamp('last_bayesian_update'),

    // Notes and context
    notes: text('notes'),
    contextTags: text('context_tags').array(),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('pos_trust_user_idx').on(table.userId),
    entityIdx: index('pos_trust_entity_idx').on(table.entityName),
    levelIdx: index('pos_trust_level_idx').on(table.trustLevel),
    scoreIdx: index('pos_trust_score_idx').on(table.overallScore),
  })
);

// ============================================================================
// TRUST EVENTS TABLE (Signal Logging)
// ============================================================================

export const trustEvents = pgTable(
  'pos_trust_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    trustScoreId: uuid('trust_score_id')
      .references(() => trustScores.id, { onDelete: 'cascade' })
      .notNull(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // Event details
    eventType: text('event_type').notNull(), // 'positive_signal', 'negative_signal', 'neutral', 'breach', 'repair'
    bravingElement: bravingElementEnum('braving_element'),

    // Event data
    description: text('description').notNull(),
    impactScore: real('impact_score').notNull(), // -10 to +10

    // Context
    situation: text('situation'),
    emotionalState: text('emotional_state'),

    // Bayesian update info
    priorScore: real('prior_score'),
    posteriorScore: real('posterior_score'),
    likelihoodRatio: real('likelihood_ratio'),

    // Verification
    isVerified: boolean('is_verified').default(false),
    verifiedAt: timestamp('verified_at'),

    // Timestamps
    occurredAt: timestamp('occurred_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    trustScoreIdx: index('pos_trust_events_score_idx').on(table.trustScoreId),
    userIdx: index('pos_trust_events_user_idx').on(table.userId),
    typeIdx: index('pos_trust_events_type_idx').on(table.eventType),
    timeIdx: index('pos_trust_events_time_idx').on(table.occurredAt),
  })
);

// ============================================================================
// VULNERABILITY DRILLS TABLE
// ============================================================================

export const vulnerabilityDrills = pgTable(
  'pos_vulnerability_drills',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // Drill configuration
    level: vulnerabilityLevelEnum('level').notNull(),
    title: text('title').notNull(),
    prompt: text('prompt').notNull(), // What to share

    // Scheduling
    scheduledAt: timestamp('scheduled_at'),
    status: drillStatusEnum('status').default('scheduled').notNull(),

    // Environment setup
    safeContext: text('safe_context'), // Environment description
    targetEntityId: uuid('target_entity_id').references(() => trustScores.id),

    // Physical anchors for grounding (Level 3)
    physicalAnchors: text('physical_anchors').array(),

    // Execution data
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),

    // Pre-drill state
    preEmotionIntensity: emotionIntensityEnum('pre_emotion_intensity'),
    preAnxietyLevel: integer('pre_anxiety_level'), // 1-10

    // Post-drill observations
    postEmotionIntensity: emotionIntensityEnum('post_emotion_intensity'),
    postAnxietyLevel: integer('post_anxiety_level'), // 1-10

    // Response harvest (objective observations)
    partnerResponse: jsonb('partner_response').$type<{
      words: string;
      tone: 'supportive' | 'neutral' | 'dismissive' | 'defensive' | 'curious';
      actions: string[];
      bodyLanguage?: string;
    }>(),

    // Debrief (next day analysis)
    debriefNotes: text('debrief_notes'),
    confirmedBenevolence: boolean('confirmed_benevolence'),
    priorAdjustment: real('prior_adjustment'), // How much trust prior changed

    // Outcome metrics
    worldEnded: boolean('world_ended').default(false), // Did catastrophe happen? (Spoiler: No)
    successScore: integer('success_score'), // 1-10

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('pos_drills_user_idx').on(table.userId),
    levelIdx: index('pos_drills_level_idx').on(table.level),
    statusIdx: index('pos_drills_status_idx').on(table.status),
    scheduledIdx: index('pos_drills_scheduled_idx').on(table.scheduledAt),
  })
);

// ============================================================================
// EMOTION TRACKING TABLE
// ============================================================================

export const emotionTracking = pgTable(
  'pos_emotion_tracking',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // Emotion snapshot
    timestamp: timestamp('timestamp').defaultNow().notNull(),

    // Core emotions (0-10 intensity)
    emotions: jsonb('emotions').$type<{
      joy: number;
      sadness: number;
      anger: number;
      fear: number;
      surprise: number;
      disgust: number;
      trust: number;
      anticipation: number;
      // Extended
      anxiety: number;
      frustration: number;
      contentment: number;
      vulnerability: number;
    }>().notNull(),

    // Overall intensity
    overallIntensity: emotionIntensityEnum('overall_intensity').notNull(),
    dominantEmotion: text('dominant_emotion').notNull(),

    // Biofeedback integration (HRV)
    biofeedback: jsonb('biofeedback').$type<{
      heartRateVariability?: number; // ms (higher = less stress)
      heartRate?: number;            // bpm
      stressLevel?: number;          // 0-100 from wearable
      sleepQuality?: number;         // 0-100
      energyLevel?: number;          // 0-100
      source?: string;               // 'apple_watch', 'fitbit', 'oura', 'manual'
    }>(),

    // Context
    context: text('context'),
    triggers: text('triggers').array(),

    // Shield mode recommendation
    recommendedMode: shieldModeEnum('recommended_mode'),
    currentMode: shieldModeEnum('current_mode'),

    // Pattern detection
    patternFlags: text('pattern_flags').array(), // Detected patterns from firewall

    // Notes
    notes: text('notes'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('pos_emotion_user_idx').on(table.userId),
    timeIdx: index('pos_emotion_time_idx').on(table.timestamp),
    intensityIdx: index('pos_emotion_intensity_idx').on(table.overallIntensity),
    dominantIdx: index('pos_emotion_dominant_idx').on(table.dominantEmotion),
  })
);

// ============================================================================
// BIAS CALIBRATION / MODEL AUDIT TABLE
// ============================================================================

export const modelAudits = pgTable(
  'pos_model_audits',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // Audit info
    auditDate: timestamp('audit_date').defaultNow().notNull(),
    auditType: text('audit_type').notNull(), // 'weekly', 'triggered', 'quarterly'
    domain: text('domain').notNull(), // 'work', 'relationship', 'self', 'general'

    // Pattern under review
    patternDescription: text('pattern_description').notNull(),
    patternSource: text('pattern_source'), // Where pattern was observed
    patternFirstNoticed: timestamp('pattern_first_noticed'),

    // Self-assessment
    selfConfidence: real('self_confidence'), // 0-1
    selfRationale: text('self_rationale'),
    potentialBiases: text('potential_biases').array(),

    // Third-party review (therapist, peer)
    reviewerType: text('reviewer_type'), // 'therapist', 'trusted_peer', 'coach'
    reviewerRating: real('reviewer_rating'), // 0-1 agreement
    reviewerNotes: text('reviewer_notes'),

    // Inter-rater reliability
    interRaterReliability: real('inter_rater_reliability'), // 0-1

    // Outcome
    isApophenia: boolean('is_apophenia'), // False positive pattern?
    isValidPattern: boolean('is_valid_pattern'),
    adjustmentMade: text('adjustment_made'),

    // Confidence delta
    preAuditConfidence: real('pre_audit_confidence'),
    postAuditConfidence: real('post_audit_confidence'),

    // Status
    status: text('status').default('pending'), // 'pending', 'reviewed', 'validated', 'rejected'

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('pos_audits_user_idx').on(table.userId),
    dateIdx: index('pos_audits_date_idx').on(table.auditDate),
    domainIdx: index('pos_audits_domain_idx').on(table.domain),
    statusIdx: index('pos_audits_status_idx').on(table.status),
  })
);

// ============================================================================
// RESOURCE ALLOCATION TABLE (Shield Mode Management)
// ============================================================================

export const resourceAllocation = pgTable(
  'pos_resource_allocation',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // Date tracking
    date: timestamp('date').defaultNow().notNull(),

    // Time allocation (minutes)
    shieldModeMinutes: jsonb('shield_mode_minutes').$type<{
      analysis: number;
      balanced: number;
      surrender: number;
      recovery: number;
    }>().notNull().default({
      analysis: 0,
      balanced: 0,
      surrender: 0,
      recovery: 0,
    }),

    // Daily limits (configurable)
    dailyLimits: jsonb('daily_limits').$type<{
      maxAnalysisMinutes: number;      // Default: 20% of waking hours
      relationshipAnalysisPercent: number; // Cap for relationship analysis
      triggerRecoveryThreshold: number;    // HRV threshold for auto-surrender
    }>().notNull().default({
      maxAnalysisMinutes: 180,           // 3 hours
      relationshipAnalysisPercent: 20,   // 20% max on relationship analysis
      triggerRecoveryThreshold: 50,      // If HRV drops below 50, trigger recovery
    }),

    // Auto-toggle events
    autoToggles: jsonb('auto_toggles').$type<Array<{
      timestamp: string;
      fromMode: string;
      toMode: string;
      trigger: 'hrv_drop' | 'time_limit' | 'manual' | 'scheduled';
      triggerValue?: number;
    }>>().default([]),

    // Metrics
    totalActiveMinutes: integer('total_active_minutes').default(0),
    burnoutRiskScore: real('burnout_risk_score'), // 0-100

    // HRV tracking for the day
    avgHrv: real('avg_hrv'),
    minHrv: real('min_hrv'),
    maxHrv: real('max_hrv'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('pos_allocation_user_idx').on(table.userId),
    dateIdx: index('pos_allocation_date_idx').on(table.date),
    uniqueUserDate: uniqueIndex('pos_allocation_user_date_unique').on(table.userId, table.date),
  })
);

// ============================================================================
// REACTIVITY ESCAPE HATCH TABLE
// ============================================================================

export const escapeHatches = pgTable(
  'pos_escape_hatches',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // Script configuration
    name: text('name').notNull(),
    phrase: text('phrase').notNull(), // The escape phrase
    context: text('context'), // When to use

    // Variants for A/B testing
    variants: jsonb('variants').$type<Array<{
      variant: string;
      phrase: string;
      usageCount: number;
      successRate: number;
    }>>().default([]),

    // Active variant
    activeVariant: text('active_variant'),

    // Usage tracking
    usageCount: integer('usage_count').default(0),
    successCount: integer('success_count').default(0),

    // Effectiveness metrics
    avgEscalationPrevention: real('avg_escalation_prevention'), // 0-1
    avgTimeToCalm: integer('avg_time_to_calm'), // seconds

    // Status
    isActive: boolean('is_active').default(true),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('pos_escape_user_idx').on(table.userId),
    activeIdx: index('pos_escape_active_idx').on(table.isActive),
  })
);

// ============================================================================
// ESCAPE HATCH USAGE LOG
// ============================================================================

export const escapeHatchUsage = pgTable(
  'pos_escape_hatch_usage',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    escapeHatchId: uuid('escape_hatch_id')
      .references(() => escapeHatches.id, { onDelete: 'cascade' })
      .notNull(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // Usage context
    usedAt: timestamp('used_at').defaultNow().notNull(),
    variantUsed: text('variant_used'),

    // Situation
    situation: text('situation'),
    triggerEmotion: text('trigger_emotion'),
    triggerIntensity: integer('trigger_intensity'), // 1-10

    // Outcome
    preventedEscalation: boolean('prevented_escalation'),
    timeToCalm: integer('time_to_calm'), // seconds
    partnerReaction: text('partner_reaction'),

    // Rating
    effectivenessRating: integer('effectiveness_rating'), // 1-10
    notes: text('notes'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    hatchIdx: index('pos_hatch_usage_hatch_idx').on(table.escapeHatchId),
    userIdx: index('pos_hatch_usage_user_idx').on(table.userId),
    timeIdx: index('pos_hatch_usage_time_idx').on(table.usedAt),
  })
);

// ============================================================================
// HYBRID MODE TRUST POINTS TABLE
// ============================================================================

export const trustPoints = pgTable(
  'pos_trust_points',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // Points tracking
    date: timestamp('date').defaultNow().notNull(),
    points: integer('points').default(0),

    // Interaction that earned points
    interactionType: text('interaction_type').notNull(), // 'clarified_ambiguity', 'vulnerability_shared', 'trust_maintained'
    description: text('description'),
    relatedEntityId: uuid('related_entity_id').references(() => trustScores.id),

    // Threshold tracking
    thresholdReached: boolean('threshold_reached').default(false),
    rewardClaimed: boolean('reward_claimed').default(false),
    rewardType: text('reward_type'), // 'date_night', 'low_analysis_activity', 'self_care'

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('pos_points_user_idx').on(table.userId),
    dateIdx: index('pos_points_date_idx').on(table.date),
    typeIdx: index('pos_points_type_idx').on(table.interactionType),
  })
);

// ============================================================================
// PATTERN FIREWALL TABLE
// ============================================================================

export const patternFirewall = pgTable(
  'pos_pattern_firewall',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // Pattern definition
    patternName: text('pattern_name').notNull(),
    patternDescription: text('pattern_description'),

    // Detection criteria
    triggers: text('triggers').array(),
    keywords: text('keywords').array(),
    emotionalSignatures: text('emotional_signatures').array(),

    // Response configuration
    autoResponse: text('auto_response'), // What to do when detected
    notifyUser: boolean('notify_user').default(true),
    requiresPause: boolean('requires_pause').default(false),
    pauseDuration: integer('pause_duration'), // seconds

    // Historical data
    detectionCount: integer('detection_count').default(0),
    falsePositiveCount: integer('false_positive_count').default(0),
    truePositiveCount: integer('true_positive_count').default(0),

    // Accuracy
    accuracy: real('accuracy'), // Computed: truePositive / (truePositive + falsePositive)

    // Status
    isActive: boolean('is_active').default(true),
    lastTriggered: timestamp('last_triggered'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('pos_firewall_user_idx').on(table.userId),
    activeIdx: index('pos_firewall_active_idx').on(table.isActive),
  })
);

// ============================================================================
// BRAVING SCAN HISTORY
// ============================================================================

export const bravingScans = pgTable(
  'pos_braving_scans',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    trustScoreId: uuid('trust_score_id')
      .references(() => trustScores.id, { onDelete: 'cascade' })
      .notNull(),

    // Scan date
    scanDate: timestamp('scan_date').defaultNow().notNull(),

    // Individual scores (1-10)
    scores: jsonb('scores').$type<{
      boundaries: { score: number; notes: string };
      reliability: { score: number; notes: string };
      accountability: { score: number; notes: string };
      vault: { score: number; notes: string };
      integrity: { score: number; notes: string };
      nonJudgment: { score: number; notes: string };
      generosity: { score: number; notes: string };
    }>().notNull(),

    // Overall assessment
    overallScore: real('overall_score').notNull(), // Average
    lowestElement: bravingElementEnum('lowest_element'),

    // Action items
    actionItems: jsonb('action_items').$type<Array<{
      element: string;
      action: string;
      priority: 'high' | 'medium' | 'low';
      completed: boolean;
    }>>().default([]),

    // Comparison to previous
    deltaFromPrevious: real('delta_from_previous'),
    trend: text('trend'), // 'improving', 'stable', 'declining'

    // Notes
    notes: text('notes'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('pos_braving_scans_user_idx').on(table.userId),
    trustIdx: index('pos_braving_scans_trust_idx').on(table.trustScoreId),
    dateIdx: index('pos_braving_scans_date_idx').on(table.scanDate),
  })
);

// ============================================================================
// NIETZSCHEAN VOLITIONAL PRACTICES TABLE
// ============================================================================

export const volitionalPractices = pgTable(
  'pos_volitional_practices',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // Practice configuration
    virtue: volitionalVirtueEnum('virtue').notNull(),
    objective: text('objective').notNull(),
    scenario: text('scenario').notNull(),

    // Status tracking
    status: volitionalPracticeStatusEnum('status').default('scheduled').notNull(),
    scheduledAt: timestamp('scheduled_at'),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),

    // Volitional metrics
    willPower: real('will_power'), // 0-100 power affirmation score
    recurrenceScore: real('recurrence_score'), // 0-100 eternal recurrence acceptance
    moralityType: moralityTypeEnum('morality_type').default('neutral'),

    // Actionable steps completion
    stepsCompleted: jsonb('steps_completed').$type<Array<{
      step: number;
      action: string;
      validation: string;
      passed: boolean;
      timestamp: string;
    }>>().default([]),

    // Fusion with Aristotelian
    fusedWithVirtue: aristotelianVirtueEnum('fused_with_virtue'),
    meanFusionScore: real('mean_fusion_score'), // 0-1 Aristotelian balance

    // Outcome tracking
    willedOutcome: jsonb('willed_outcome').$type<{
      net: string;
      affirmation: number;
      übermensch: number;
    }>(),
    decidedAction: text('decided_action'),

    // Error handling
    rolledBack: boolean('rolled_back').default(false),
    rollbackReason: text('rollback_reason'),
    auditLog: jsonb('audit_log').$type<Array<{
      event: string;
      timestamp: string;
      details: Record<string, unknown>;
    }>>().default([]),

    // Notes
    notes: text('notes'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('pos_volitional_user_idx').on(table.userId),
    virtueIdx: index('pos_volitional_virtue_idx').on(table.virtue),
    statusIdx: index('pos_volitional_status_idx').on(table.status),
    scheduledIdx: index('pos_volitional_scheduled_idx').on(table.scheduledAt),
  })
);

// ============================================================================
// ARISTOTELIAN VIRTUE PRACTICES TABLE (Expanded)
// ============================================================================

export const aristotelianPractices = pgTable(
  'pos_aristotelian_practices',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // Practice configuration
    virtue: aristotelianVirtueEnum('virtue').notNull(),
    objective: text('objective').notNull(),
    scenario: text('scenario').notNull(),

    // Status tracking
    status: drillStatusEnum('status').default('scheduled').notNull(),
    scheduledAt: timestamp('scheduled_at'),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),

    // Mean calculation
    excessIdentified: text('excess_identified'), // e.g., 'Lavish', 'Arrogant'
    deficiencyIdentified: text('deficiency_identified'), // e.g., 'Cheap', 'Doubtful'
    meanAchieved: text('mean_achieved'), // e.g., 'Thoughtful', 'Noble'
    meanBalance: real('mean_balance'), // 0-1 score

    // Actionable steps completion
    stepsCompleted: jsonb('steps_completed').$type<Array<{
      step: number;
      action: string;
      validation: string;
      passed: boolean;
      timestamp: string;
    }>>().default([]),

    // Fusion with Nietzschean
    fusedWithWill: volitionalVirtueEnum('fused_with_will'),
    willFusionScore: real('will_fusion_score'), // 0-1 Nietzschean affirmation

    // Outcome tracking
    meanedOutcome: jsonb('meaned_outcome').$type<{
      net: string;
      virtueGain: number;
      eudaimonicScore: number;
    }>(),
    decidedAction: text('decided_action'),

    // Flourishing metric
    flourishingScore: real('flourishing_score'), // 0-100 eudaimonia

    // Notes
    notes: text('notes'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('pos_aristotelian_user_idx').on(table.userId),
    virtueIdx: index('pos_aristotelian_virtue_idx').on(table.virtue),
    statusIdx: index('pos_aristotelian_status_idx').on(table.status),
    scheduledIdx: index('pos_aristotelian_scheduled_idx').on(table.scheduledAt),
  })
);

// ============================================================================
// VOLITIONAL FUSION LOG TABLE (RRF Tracking)
// ============================================================================

export const volitionalFusionLogs = pgTable(
  'pos_volitional_fusion_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // Fusion timestamp
    fusedAt: timestamp('fused_at').defaultNow().notNull(),

    // Input rankings
    virtueResults: jsonb('virtue_results').$type<Array<{
      virtue: string;
      score: number;
      rank: number;
    }>>().notNull(),
    willResults: jsonb('will_results').$type<Array<{
      will: string;
      score: number;
      rank: number;
    }>>().notNull(),

    // RRF output
    rrfK: integer('rrf_k').default(60), // RRF constant
    fusedResults: jsonb('fused_results').$type<Array<{
      virtue: string;
      will: string;
      rrfScore: number;
      fusedAction: string;
      eudaimonicGain: number;
      übermenschMetric: number;
    }>>().notNull(),

    // Selected action
    selectedVirtue: aristotelianVirtueEnum('selected_virtue'),
    selectedWill: volitionalVirtueEnum('selected_will'),
    finalAction: text('final_action'),

    // Outcome verification
    outcomeVerified: boolean('outcome_verified').default(false),
    outcomeNotes: text('outcome_notes'),

    // Context
    scenario: text('scenario'),
    domain: text('domain'), // 'relational', 'apex', 'personal'

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('pos_fusion_user_idx').on(table.userId),
    fusedIdx: index('pos_fusion_fused_idx').on(table.fusedAt),
    domainIdx: index('pos_fusion_domain_idx').on(table.domain),
  })
);

// ============================================================================
// VOLITIONAL RATE LIMITER TABLE (Token Bucket)
// ============================================================================

export const volitionalRateLimits = pgTable(
  'pos_volitional_rate_limits',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // Date tracking
    date: timestamp('date').defaultNow().notNull(),

    // Token bucket state
    currentTokens: real('current_tokens').notNull().default(4),
    maxTokens: integer('max_tokens').notNull().default(4),
    refillRate: real('refill_rate').notNull().default(0.5), // tokens per hour
    lastRefill: timestamp('last_refill').defaultNow().notNull(),

    // Usage tracking
    fusionsToday: integer('fusions_today').default(0),
    lastFusion: timestamp('last_fusion'),

    // Denied attempts
    deniedAttempts: integer('denied_attempts').default(0),
    lastDenied: timestamp('last_denied'),

    // Configuration
    refillPeriods: jsonb('refill_periods').$type<Array<{
      startHour: number;
      endHour: number;
      multiplier: number;
    }>>().default([
      { startHour: 6, endHour: 10, multiplier: 1.5 },   // Morning boost
      { startHour: 18, endHour: 22, multiplier: 1.2 }  // Evening reflection
    ]),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('pos_rate_limit_user_idx').on(table.userId),
    dateIdx: index('pos_rate_limit_date_idx').on(table.date),
    uniqueUserDate: uniqueIndex('pos_rate_limit_user_date_unique').on(table.userId, table.date),
  })
);

// ============================================================================
// VOLITIONAL STATE HISTORY TABLE (Rollback Support)
// ============================================================================

export const volitionalStateHistory = pgTable(
  'pos_volitional_state_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // State snapshot
    snapshotAt: timestamp('snapshot_at').defaultNow().notNull(),

    // Current state
    currentVirtue: aristotelianVirtueEnum('current_virtue'),
    currentWill: volitionalVirtueEnum('current_will'),
    meanBalance: real('mean_balance'), // 0-1
    willPower: real('will_power'), // 0-100

    // Übermensch metrics
    übermenschScore: real('ubermensch_score'), // 0-100 overall volitional health
    eudaimonicScore: real('eudaimonic_score'), // 0-100 flourishing metric

    // Stability indicators
    isStable: boolean('is_stable').default(true),
    stabilityNotes: text('stability_notes'),

    // Rollback metadata
    isRollbackPoint: boolean('is_rollback_point').default(false),
    rolledBackTo: boolean('rolled_back_to').default(false),
    rollbackTrigger: text('rollback_trigger'),

    // Phronesis audit
    auditedBy: text('audited_by'), // 'self', 'therapist', 'peer'
    auditNotes: text('audit_notes'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('pos_state_history_user_idx').on(table.userId),
    snapshotIdx: index('pos_state_history_snapshot_idx').on(table.snapshotAt),
    rollbackIdx: index('pos_state_history_rollback_idx').on(table.isRollbackPoint),
  })
);

// ============================================================================
// ÜBERMENSCH METRICS TABLE (Weekly Tracking)
// ============================================================================

export const übermenschMetrics = pgTable(
  'pos_ubermensch_metrics',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // Week tracking
    weekStart: timestamp('week_start').notNull(),
    weekEnd: timestamp('week_end').notNull(),

    // Nietzschean metrics
    selfOvercomingEvents: integer('self_overcoming_events').default(0),
    recurrenceAffirmations: integer('recurrence_affirmations').default(0),
    masterMoralityCreations: integer('master_morality_creations').default(0),
    ressentimentAvoidances: integer('ressentiment_avoidances').default(0),

    // Aristotelian metrics
    magnificenceActs: integer('magnificence_acts').default(0),
    magnanimityMoments: integer('magnanimity_moments').default(0),
    phronesisDecisions: integer('phronesis_decisions').default(0),
    meanAchievements: integer('mean_achievements').default(0),

    // Fusion metrics
    totalFusions: integer('total_fusions').default(0),
    successfulFusions: integer('successful_fusions').default(0),
    fusionSuccessRate: real('fusion_success_rate'), // 0-1

    // Aggregate scores
    weeklyÜbermenschScore: real('weekly_ubermensch_score'), // 0-100
    weeklyEudaimonicScore: real('weekly_eudaimonic_score'), // 0-100
    weeklyWillPower: real('weekly_will_power'), // 0-100
    weeklyMeanBalance: real('weekly_mean_balance'), // 0-1

    // Trend indicators
    übermenschTrend: text('ubermensch_trend'), // 'ascending', 'stable', 'descending'
    eudaimonicTrend: text('eudaimonic_trend'),

    // Action items
    rollbacksTriggered: integer('rollbacks_triggered').default(0),
    phronesisAuditsNeeded: integer('phronesis_audits_needed').default(0),

    // Notes
    weeklyReflection: text('weekly_reflection'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('pos_ubermensch_user_idx').on(table.userId),
    weekIdx: index('pos_ubermensch_week_idx').on(table.weekStart),
    uniqueUserWeek: uniqueIndex('pos_ubermensch_user_week_unique').on(table.userId, table.weekStart),
  })
);

// ============================================================================
// RELATIONS
// ============================================================================

export const volitionalPracticesRelations = relations(volitionalPractices, ({ one }) => ({
  user: one(users, {
    fields: [volitionalPractices.userId],
    references: [users.id],
  }),
}));

export const aristotelianPracticesRelations = relations(aristotelianPractices, ({ one }) => ({
  user: one(users, {
    fields: [aristotelianPractices.userId],
    references: [users.id],
  }),
}));

export const volitionalFusionLogsRelations = relations(volitionalFusionLogs, ({ one }) => ({
  user: one(users, {
    fields: [volitionalFusionLogs.userId],
    references: [users.id],
  }),
}));

export const volitionalRateLimitsRelations = relations(volitionalRateLimits, ({ one }) => ({
  user: one(users, {
    fields: [volitionalRateLimits.userId],
    references: [users.id],
  }),
}));

export const volitionalStateHistoryRelations = relations(volitionalStateHistory, ({ one }) => ({
  user: one(users, {
    fields: [volitionalStateHistory.userId],
    references: [users.id],
  }),
}));

export const übermenschMetricsRelations = relations(übermenschMetrics, ({ one }) => ({
  user: one(users, {
    fields: [übermenschMetrics.userId],
    references: [users.id],
  }),
}));

export const trustScoresRelations = relations(trustScores, ({ one, many }) => ({
  user: one(users, {
    fields: [trustScores.userId],
    references: [users.id],
  }),
  events: many(trustEvents),
  drills: many(vulnerabilityDrills),
  scans: many(bravingScans),
  points: many(trustPoints),
}));

export const trustEventsRelations = relations(trustEvents, ({ one }) => ({
  trustScore: one(trustScores, {
    fields: [trustEvents.trustScoreId],
    references: [trustScores.id],
  }),
  user: one(users, {
    fields: [trustEvents.userId],
    references: [users.id],
  }),
}));

export const vulnerabilityDrillsRelations = relations(vulnerabilityDrills, ({ one }) => ({
  user: one(users, {
    fields: [vulnerabilityDrills.userId],
    references: [users.id],
  }),
  targetEntity: one(trustScores, {
    fields: [vulnerabilityDrills.targetEntityId],
    references: [trustScores.id],
  }),
}));

export const emotionTrackingRelations = relations(emotionTracking, ({ one }) => ({
  user: one(users, {
    fields: [emotionTracking.userId],
    references: [users.id],
  }),
}));

export const modelAuditsRelations = relations(modelAudits, ({ one }) => ({
  user: one(users, {
    fields: [modelAudits.userId],
    references: [users.id],
  }),
}));

export const resourceAllocationRelations = relations(resourceAllocation, ({ one }) => ({
  user: one(users, {
    fields: [resourceAllocation.userId],
    references: [users.id],
  }),
}));

export const escapeHatchesRelations = relations(escapeHatches, ({ one, many }) => ({
  user: one(users, {
    fields: [escapeHatches.userId],
    references: [users.id],
  }),
  usageLogs: many(escapeHatchUsage),
}));

export const escapeHatchUsageRelations = relations(escapeHatchUsage, ({ one }) => ({
  escapeHatch: one(escapeHatches, {
    fields: [escapeHatchUsage.escapeHatchId],
    references: [escapeHatches.id],
  }),
  user: one(users, {
    fields: [escapeHatchUsage.userId],
    references: [users.id],
  }),
}));

export const trustPointsRelations = relations(trustPoints, ({ one }) => ({
  user: one(users, {
    fields: [trustPoints.userId],
    references: [users.id],
  }),
  relatedEntity: one(trustScores, {
    fields: [trustPoints.relatedEntityId],
    references: [trustScores.id],
  }),
}));

export const patternFirewallRelations = relations(patternFirewall, ({ one }) => ({
  user: one(users, {
    fields: [patternFirewall.userId],
    references: [users.id],
  }),
}));

export const bravingScansRelations = relations(bravingScans, ({ one }) => ({
  user: one(users, {
    fields: [bravingScans.userId],
    references: [users.id],
  }),
  trustScore: one(trustScores, {
    fields: [bravingScans.trustScoreId],
    references: [trustScores.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type TrustScore = typeof trustScores.$inferSelect;
export type NewTrustScore = typeof trustScores.$inferInsert;
export type TrustEvent = typeof trustEvents.$inferSelect;
export type NewTrustEvent = typeof trustEvents.$inferInsert;
export type VulnerabilityDrill = typeof vulnerabilityDrills.$inferSelect;
export type NewVulnerabilityDrill = typeof vulnerabilityDrills.$inferInsert;
export type EmotionTracking = typeof emotionTracking.$inferSelect;
export type NewEmotionTracking = typeof emotionTracking.$inferInsert;
export type ModelAudit = typeof modelAudits.$inferSelect;
export type NewModelAudit = typeof modelAudits.$inferInsert;
export type ResourceAllocation = typeof resourceAllocation.$inferSelect;
export type NewResourceAllocation = typeof resourceAllocation.$inferInsert;
export type EscapeHatch = typeof escapeHatches.$inferSelect;
export type NewEscapeHatch = typeof escapeHatches.$inferInsert;
export type EscapeHatchUsage = typeof escapeHatchUsage.$inferSelect;
export type NewEscapeHatchUsage = typeof escapeHatchUsage.$inferInsert;
export type TrustPoint = typeof trustPoints.$inferSelect;
export type NewTrustPoint = typeof trustPoints.$inferInsert;
export type PatternFirewall = typeof patternFirewall.$inferSelect;
export type NewPatternFirewall = typeof patternFirewall.$inferInsert;
export type BravingScan = typeof bravingScans.$inferSelect;
export type NewBravingScan = typeof bravingScans.$inferInsert;

// Nietzschean-Aristotelian Types
export type VolitionalPractice = typeof volitionalPractices.$inferSelect;
export type NewVolitionalPractice = typeof volitionalPractices.$inferInsert;
export type AristotelianPractice = typeof aristotelianPractices.$inferSelect;
export type NewAristotelianPractice = typeof aristotelianPractices.$inferInsert;
export type VolitionalFusionLog = typeof volitionalFusionLogs.$inferSelect;
export type NewVolitionalFusionLog = typeof volitionalFusionLogs.$inferInsert;
export type VolitionalRateLimit = typeof volitionalRateLimits.$inferSelect;
export type NewVolitionalRateLimit = typeof volitionalRateLimits.$inferInsert;
export type VolitionalStateHistory = typeof volitionalStateHistory.$inferSelect;
export type NewVolitionalStateHistory = typeof volitionalStateHistory.$inferInsert;
export type ÜbermenschMetric = typeof übermenschMetrics.$inferSelect;
export type NewÜbermenschMetric = typeof übermenschMetrics.$inferInsert;

// Zen Integration Types (v1.7.0)
export type ZenPractice = typeof zenPractices.$inferSelect;
export type NewZenPractice = typeof zenPractices.$inferInsert;
export type ZenRateLimit = typeof zenRateLimits.$inferSelect;
export type NewZenRateLimit = typeof zenRateLimits.$inferInsert;
export type NonDualFusionLog = typeof nonDualFusionLogs.$inferSelect;
export type NewNonDualFusionLog = typeof nonDualFusionLogs.$inferInsert;
export type NonDualStateHistory = typeof nonDualStateHistory.$inferSelect;
export type NewNonDualStateHistory = typeof nonDualStateHistory.$inferInsert;
export type NonDualWeeklyMetric = typeof nonDualWeeklyMetrics.$inferSelect;
export type NewNonDualWeeklyMetric = typeof nonDualWeeklyMetrics.$inferInsert;

// ============================================================================
// ZEN UNCERTAINTY INTEGRATION (v1.7.0)
// ============================================================================

/**
 * Zen Uncertainty Virtue Enum
 * Virtues from Zen Buddhism: mu (emptiness), koan (paradox), zazen (observation)
 */
export const zenUncertaintyVirtueEnum = pgEnum('zen_uncertainty_virtue', [
  'mu_emptiness',
  'koan_paradox',
  'zazen_observation',
  'satori_breakthrough',
  'beginner_mind',
]);

/**
 * Balance Trend Enum for Non-Dual Metrics
 */
export const balanceTrendEnum = pgEnum('balance_trend', [
  'harmonized',
  'will_dominant',
  'zen_dominant',
  'fluctuating',
]);

// ============================================================================
// ZEN PRACTICES TABLE
// ============================================================================

export const zenPractices = pgTable(
  'pos_zen_practices',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // Practice identification
    virtue: zenUncertaintyVirtueEnum('virtue').notNull(),
    practiceName: text('practice_name').notNull(),
    objective: text('objective'),

    // Practice execution
    practicedAt: timestamp('practiced_at').defaultNow().notNull(),
    duration: integer('duration'), // minutes
    context: text('context'), // 'relational', 'apex', 'personal'

    // Emptiness metrics (0-100)
    emptinessScore: real('emptiness_score'),
    satoriAchieved: boolean('satori_achieved').default(false),
    dualAvoidanceSuccess: boolean('dual_avoidance_success'),

    // Non-dual balance
    preEmptinessLevel: real('pre_emptiness_level'), // before practice
    postEmptinessLevel: real('post_emptiness_level'), // after practice
    emptinessGain: real('emptiness_gain'), // delta

    // Koan specific
    koanUsed: text('koan_used'),
    koanResolved: boolean('koan_resolved'),
    resolutionInsight: text('resolution_insight'),

    // Zazen specific
    breathCount: integer('breath_count'),
    thoughtCount: integer('thought_count'),
    observationQuality: real('observation_quality'), // 0-100

    // Actionable steps completed
    stepsCompleted: integer('steps_completed'),
    totalSteps: integer('total_steps'),
    validationsPassed: integer('validations_passed'),

    // Nietzschean fusion
    fusedWithWill: boolean('fused_with_will').default(false),
    fusedVirtue: volitionalVirtueEnum('fused_virtue'),
    fusionScore: real('fusion_score'),

    // Scenario details
    scenarioDescription: text('scenario_description'),
    decision: text('decision'),
    outcome: text('outcome'),
    outcomeRating: integer('outcome_rating'), // 1-10

    // Notes
    reflectionNotes: text('reflection_notes'),
    practitionerNotes: text('practitioner_notes'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('pos_zen_user_idx').on(table.userId),
    virtueIdx: index('pos_zen_virtue_idx').on(table.virtue),
    practicedIdx: index('pos_zen_practiced_idx').on(table.practicedAt),
    satoriIdx: index('pos_zen_satori_idx').on(table.satoriAchieved),
  })
);

// ============================================================================
// ZEN RATE LIMITER TABLE (Token Bucket for Mu-Overload Prevention)
// ============================================================================

export const zenRateLimits = pgTable(
  'pos_zen_rate_limits',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // Date tracking
    date: timestamp('date').defaultNow().notNull(),

    // Token bucket state
    currentTokens: real('current_tokens').notNull().default(3),
    maxTokens: integer('max_tokens').notNull().default(3),
    refillRate: real('refill_rate').notNull().default(0.375), // tokens per hour (3/8 waking hours)
    lastRefill: timestamp('last_refill').defaultNow().notNull(),

    // Satori bonus tracking
    satoriCount: integer('satori_count').default(0),
    bonusTokensEarned: integer('bonus_tokens_earned').default(0),

    // Usage tracking
    meditationsToday: integer('meditations_today').default(0),
    lastMeditation: timestamp('last_meditation'),

    // Denied attempts
    deniedAttempts: integer('denied_attempts').default(0),
    lastDenied: timestamp('last_denied'),

    // Configuration - mindful periods for refill boost
    refillPeriods: jsonb('refill_periods').$type<Array<{
      startHour: number;
      endHour: number;
      multiplier: number;
    }>>().default([
      { startHour: 5, endHour: 7, multiplier: 2.0 },   // Dawn meditation boost
      { startHour: 20, endHour: 22, multiplier: 1.5 } // Evening zazen boost
    ]),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('pos_zen_rate_limit_user_idx').on(table.userId),
    dateIdx: index('pos_zen_rate_limit_date_idx').on(table.date),
    uniqueUserDate: uniqueIndex('pos_zen_rate_limit_user_date_unique').on(table.userId, table.date),
  })
);

// ============================================================================
// NON-DUAL FUSION LOGS TABLE
// ============================================================================

export const nonDualFusionLogs = pgTable(
  'pos_non_dual_fusion_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // Fusion details
    fusedAt: timestamp('fused_at').defaultNow().notNull(),
    fusionType: text('fusion_type').notNull(), // 'will-zen', 'zen-will', 'balanced'

    // Will component
    willVirtue: volitionalVirtueEnum('will_virtue'),
    willScore: real('will_score'), // 0-100
    willRank: integer('will_rank'), // position in RRF

    // Zen component
    zenVirtue: zenUncertaintyVirtueEnum('zen_virtue'),
    zenScore: real('zen_score'), // 0-100
    zenRank: integer('zen_rank'), // position in RRF

    // RRF fusion results
    rrfScore: real('rrf_score'),
    fusionK: integer('fusion_k').default(60), // RRF k parameter

    // Outcome metrics
    willGain: real('will_gain'),
    muGain: real('mu_gain'),
    satoriMetric: real('satori_metric'),

    // Balance analysis
    balanceType: balanceTrendEnum('balance_type'),
    harmonyScore: real('harmony_score'), // 0-1, how balanced the fusion was

    // Execution
    fusedAction: text('fused_action'),
    actionSuccessful: boolean('action_successful'),
    successNotes: text('success_notes'),

    // Context
    domain: text('domain'), // 'relational', 'apex', 'personal'
    urgency: text('urgency'), // 'low', 'medium', 'high'
    scenarioDescription: text('scenario_description'),

    // Rate limiting impact
    willTokensUsed: real('will_tokens_used'),
    zenTokensUsed: real('zen_tokens_used'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('pos_non_dual_fusion_user_idx').on(table.userId),
    fusedIdx: index('pos_non_dual_fusion_fused_idx').on(table.fusedAt),
    typeIdx: index('pos_non_dual_fusion_type_idx').on(table.fusionType),
    balanceIdx: index('pos_non_dual_fusion_balance_idx').on(table.balanceType),
  })
);

// ============================================================================
// NON-DUAL STATE HISTORY TABLE (Rollback Support)
// ============================================================================

export const nonDualStateHistory = pgTable(
  'pos_non_dual_state_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // State snapshot
    snapshotAt: timestamp('snapshot_at').defaultNow().notNull(),

    // Current will state
    currentWill: volitionalVirtueEnum('current_will'),
    willPower: real('will_power'), // 0-100

    // Current zen state
    currentZen: zenUncertaintyVirtueEnum('current_zen'),
    emptinessLevel: real('emptiness_level'), // 0-100

    // Combined metrics
    satoriScore: real('satori_score'), // 0-100
    harmonyScore: real('harmony_score'), // 0-1

    // Stability indicators
    isStable: boolean('is_stable').default(true),
    stabilityNotes: text('stability_notes'),
    imbalanceType: text('imbalance_type'), // 'over-will', 'over-emptiness', 'striving', 'attachment'

    // Rollback metadata
    isRollbackPoint: boolean('is_rollback_point').default(false),
    rolledBackTo: boolean('rolled_back_to').default(false),
    rollbackTrigger: text('rollback_trigger'),

    // Satori audit
    auditedBy: text('audited_by'), // 'self', 'therapist', 'peer'
    auditNotes: text('audit_notes'),

    // Default state info (for rollback)
    defaultWill: text('default_will').default('amor_fati_deepened'),
    defaultZen: text('default_zen').default('mu_emptiness'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('pos_non_dual_state_user_idx').on(table.userId),
    snapshotIdx: index('pos_non_dual_state_snapshot_idx').on(table.snapshotAt),
    rollbackIdx: index('pos_non_dual_state_rollback_idx').on(table.isRollbackPoint),
    stabilityIdx: index('pos_non_dual_state_stability_idx').on(table.isStable),
  })
);

// ============================================================================
// NON-DUAL WEEKLY METRICS TABLE
// ============================================================================

export const nonDualWeeklyMetrics = pgTable(
  'pos_non_dual_weekly_metrics',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // Week tracking
    weekStart: timestamp('week_start').notNull(),
    weekEnd: timestamp('week_end').notNull(),

    // Nietzschean expanded metrics
    dionysianAffirmations: integer('dionysian_affirmations').default(0),
    deepenedRecurrences: integer('deepened_recurrences').default(0),
    amorFatiDeepened: integer('amor_fati_deepened').default(0),

    // Zen metrics
    muEmptyings: integer('mu_emptyings').default(0),
    koanResolutions: integer('koan_resolutions').default(0),
    zazenSessions: integer('zazen_sessions').default(0),
    satoriBreakthroughs: integer('satori_breakthroughs').default(0),
    beginnerMindMoments: integer('beginner_mind_moments').default(0),

    // Non-dual fusion metrics
    totalFusions: integer('total_fusions').default(0),
    successfulFusions: integer('successful_fusions').default(0),
    fusionSuccessRate: real('fusion_success_rate'), // 0-1

    // Aggregate scores
    weeklyNonDualScore: real('weekly_non_dual_score'), // 0-100
    weeklyWillPower: real('weekly_will_power'), // 0-100
    weeklyEmptinessLevel: real('weekly_emptiness_level'), // 0-100
    weeklyHarmonyScore: real('weekly_harmony_score'), // 0-1

    // Trend indicators
    willTrend: trendEnum('will_trend'),
    zenTrend: trendEnum('zen_trend'),
    balanceTrend: balanceTrendEnum('balance_trend'),

    // Action items
    rollbacksTriggered: integer('rollbacks_triggered').default(0),
    satoriAuditsNeeded: integer('satori_audits_needed').default(0),
    strivingTrapsDetected: integer('striving_traps_detected').default(0),
    overEmptinessDetected: integer('over_emptiness_detected').default(0),

    // Rate limit impact
    willTokensDepleted: integer('will_tokens_depleted').default(0),
    zenTokensDepleted: integer('zen_tokens_depleted').default(0),
    bonusTokensEarned: integer('bonus_tokens_earned').default(0),

    // Notes
    weeklyReflection: text('weekly_reflection'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('pos_non_dual_metrics_user_idx').on(table.userId),
    weekIdx: index('pos_non_dual_metrics_week_idx').on(table.weekStart),
    uniqueUserWeek: uniqueIndex('pos_non_dual_metrics_user_week_unique').on(table.userId, table.weekStart),
    balanceIdx: index('pos_non_dual_metrics_balance_idx').on(table.balanceTrend),
  })
);

// ============================================================================
// ZEN RELATIONS
// ============================================================================

export const zenPracticesRelations = relations(zenPractices, ({ one }) => ({
  user: one(users, {
    fields: [zenPractices.userId],
    references: [users.id],
  }),
}));

export const zenRateLimitsRelations = relations(zenRateLimits, ({ one }) => ({
  user: one(users, {
    fields: [zenRateLimits.userId],
    references: [users.id],
  }),
}));

export const nonDualFusionLogsRelations = relations(nonDualFusionLogs, ({ one }) => ({
  user: one(users, {
    fields: [nonDualFusionLogs.userId],
    references: [users.id],
  }),
}));

export const nonDualStateHistoryRelations = relations(nonDualStateHistory, ({ one }) => ({
  user: one(users, {
    fields: [nonDualStateHistory.userId],
    references: [users.id],
  }),
}));

export const nonDualWeeklyMetricsRelations = relations(nonDualWeeklyMetrics, ({ one }) => ({
  user: one(users, {
    fields: [nonDualWeeklyMetrics.userId],
    references: [users.id],
  }),
}));

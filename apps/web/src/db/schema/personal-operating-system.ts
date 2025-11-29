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

// Zazen Mindfulness Enums (v1.6.0)
export const zazenVirtueEnum = pgEnum('zazen_virtue', [
  'shikantaza',
  'kinhin',
  'mu',
  'koan',
  'zazen',
]);

// Taoist Effortless Enums (v1.6.0)
export const taoistVirtueEnum = pgEnum('taoist_virtue', [
  'wu_wei',
  'wei_wu_wei',
  'harmony_flow',
]);

export const dualityTypeEnum = pgEnum('duality_type', [
  'dual',
  'non_dual',
]);

export const flowForceTypeEnum = pgEnum('flow_force_type', [
  'flow',
  'force',
]);

export const zazenPracticeStatusEnum = pgEnum('zazen_practice_status', [
  'scheduled',
  'in_progress',
  'completed',
  'satori_achieved',
  'rolled_back',
]);

export const taoistPracticeStatusEnum = pgEnum('taoist_practice_status', [
  'scheduled',
  'in_progress',
  'completed',
  'harmony_achieved',
  'rolled_back',
]);

export const volitionalPracticeStatusEnum = pgEnum('volitional_practice_status', [
  'scheduled',
  'in_progress',
  'completed',
  'affirmed',
  'rolled_back',
]);

// Mean-Effortless Fusion Enums (v2.3.0)
export const meanEffortlessVirtueEnum = pgEnum('mean_effortless_virtue', [
  'wu_wei_courage_mean',
  'wu_wei_temperance_mean',
  'wu_wei_justice_mean',
  'wu_wei_wisdom_mean',
  'harmony_courage_mean',
  'harmony_temperance_mean',
  'effortless_golden_mean',
]);

export const meanEffortlessPracticeStatusEnum = pgEnum('mean_effortless_practice_status', [
  'scheduled',
  'in_progress',
  'completed',
  'eudaimonia_achieved',
  'rolled_back',
]);

export const meanEffortlessBalanceEnum = pgEnum('mean_effortless_balance', [
  'harmonized',
  'flow_dominant',
  'mean_dominant',
  'fluctuating',
]);

// Quantum Geometry Enums (v2.4.0)
export const quantumGeometryStateEnum = pgEnum('quantum_geometry_state', [
  'ground_state',
  'excited_state',
  'superposition',
  'entangled',
  'coherent',
  'decoherent',
]);

export const geometryFlowTypeEnum = pgEnum('geometry_flow_type', [
  'material_flow',
  'geometric_flow',
  'topological_flow',
  'quantum_flow',
]);

export const geometryFusionStatusEnum = pgEnum('geometry_fusion_status', [
  'scheduled',
  'in_progress',
  'completed',
  'coherence_achieved',
  'rolled_back',
]);

// Confucian Ren Enums (v2.4.0)
export const confucianRenVirtueEnum = pgEnum('confucian_ren_virtue', [
  'ren_benevolence',
  'yi_righteousness',
  'li_propriety',
  'zhi_wisdom',
  'xin_fidelity',
]);

export const aristotelianRenFusionStatusEnum = pgEnum('aristotelian_ren_fusion_status', [
  'scheduled',
  'in_progress',
  'completed',
  'harmony_achieved',
  'rolled_back',
]);

// Deepened Wu Wei Enums (v2.4.0)
export const deepenedWuWeiVirtueEnum = pgEnum('deepened_wu_wei_virtue', [
  'wu_wei_relational',
  'wu_wei_spontaneous',
  'wu_wei_energy_economy',
  'wu_wei_non_interference',
  'wu_wei_stress_reduction',
]);

// Deepened Golden Mean Enums (v2.4.0)
export const deepenedGoldenMeanVirtueEnum = pgEnum('deepened_golden_mean_virtue', [
  'courage_mean_deepened',
  'temperance_mean_deepened',
  'justice_mean_deepened',
  'wisdom_mean_deepened',
  'magnanimity_mean_deepened',
]);

// POS Error Type Enum (v2.4.0)
export const posErrorTypeEnum = pgEnum('pos_error_type', [
  'geometry_imbalance',
  'wu_wei_excess',
  'mean_deviation',
  'coherence_failure',
  'rollback_required',
  'rate_limit_exceeded',
  'chaos_overload',
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
// ZAZEN PRACTICES TABLE (v1.6.0)
// ============================================================================

export const zazenPractices = pgTable(
  'pos_zazen_practices',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // Practice configuration
    virtue: zazenVirtueEnum('virtue').notNull(),
    objective: text('objective').notNull(),
    scenario: text('scenario').notNull(),

    // Status tracking
    status: zazenPracticeStatusEnum('status').default('scheduled').notNull(),
    scheduledAt: timestamp('scheduled_at'),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),

    // Mindfulness metrics
    emptinessScore: real('emptiness_score'), // 0-100 mu balance
    presenceBalance: real('presence_balance'), // 0-1 goal-less presence
    dynamicBalance: real('dynamic_balance'), // 0-1 for kinhin movement
    dualityType: dualityTypeEnum('duality_type').default('non_dual'),

    // Actionable steps completion
    stepsCompleted: jsonb('steps_completed').$type<Array<{
      step: number;
      action: string;
      validation: string;
      passed: boolean;
      timestamp: string;
    }>>().default([]),

    // Fusion with Taoist
    fusedWithFlow: taoistVirtueEnum('fused_with_flow'),
    wuWeiFusionScore: real('wu_wei_fusion_score'), // 0-1 Taoist harmony

    // Outcome tracking
    emptiedOutcome: jsonb('emptied_outcome').$type<{
      net: string;
      satori: number;
      emptiness: number;
    }>(),
    decidedAction: text('decided_action'),

    // Satori achievement
    satoriAchieved: boolean('satori_achieved').default(false),
    satoriNotes: text('satori_notes'),

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
    userIdx: index('pos_zazen_user_idx').on(table.userId),
    virtueIdx: index('pos_zazen_virtue_idx').on(table.virtue),
    statusIdx: index('pos_zazen_status_idx').on(table.status),
    scheduledIdx: index('pos_zazen_scheduled_idx').on(table.scheduledAt),
  })
);

// ============================================================================
// TAOIST PRACTICES TABLE (v1.6.0)
// ============================================================================

export const taoistPractices = pgTable(
  'pos_taoist_practices',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // Practice configuration
    virtue: taoistVirtueEnum('virtue').notNull(),
    objective: text('objective').notNull(),
    scenario: text('scenario').notNull(),

    // Status tracking
    status: taoistPracticeStatusEnum('status').default('scheduled').notNull(),
    scheduledAt: timestamp('scheduled_at'),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),

    // Effortless metrics
    harmonyScore: real('harmony_score'), // 0-100 flow balance
    flowBalance: real('flow_balance'), // 0-1 effortless action
    nonActionBalance: real('non_action_balance'), // 0-1 for wei wu wei
    flowForceType: flowForceTypeEnum('flow_force_type').default('flow'),

    // Actionable steps completion
    stepsCompleted: jsonb('steps_completed').$type<Array<{
      step: number;
      action: string;
      validation: string;
      passed: boolean;
      timestamp: string;
    }>>().default([]),

    // Fusion with Zazen
    fusedWithPractice: zazenVirtueEnum('fused_with_practice'),
    muFusionScore: real('mu_fusion_score'), // 0-1 Zazen emptiness

    // Outcome tracking
    flowedOutcome: jsonb('flowed_outcome').$type<{
      net: string;
      harmony: number;
      effortless: number;
    }>(),
    decidedAction: text('decided_action'),

    // Harmony achievement
    harmonyAchieved: boolean('harmony_achieved').default(false),
    harmonyNotes: text('harmony_notes'),

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
    userIdx: index('pos_taoist_user_idx').on(table.userId),
    virtueIdx: index('pos_taoist_virtue_idx').on(table.virtue),
    statusIdx: index('pos_taoist_status_idx').on(table.status),
    scheduledIdx: index('pos_taoist_scheduled_idx').on(table.scheduledAt),
  })
);

// ============================================================================
// ZAZEN-TAOIST FUSION LOG TABLE (RRF Tracking - v1.6.0)
// ============================================================================

export const zazenTaoistFusionLogs = pgTable(
  'pos_zazen_taoist_fusion_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // Fusion timestamp
    fusedAt: timestamp('fused_at').defaultNow().notNull(),

    // Input rankings
    zazenResults: jsonb('zazen_results').$type<Array<{
      practice: string;
      score: number;
      rank: number;
    }>>().notNull(),
    taoistResults: jsonb('taoist_results').$type<Array<{
      flow: string;
      score: number;
      rank: number;
    }>>().notNull(),

    // RRF output
    rrfK: integer('rrf_k').default(60), // RRF constant
    fusedResults: jsonb('fused_results').$type<Array<{
      practice: string;
      flow: string;
      rrfScore: number;
      fusedAction: string;
      emptinessGain: number;
      harmonyMetric: number;
    }>>().notNull(),

    // Selected action
    selectedPractice: zazenVirtueEnum('selected_practice'),
    selectedFlow: taoistVirtueEnum('selected_flow'),
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
    userIdx: index('pos_zazen_taoist_fusion_user_idx').on(table.userId),
    fusedIdx: index('pos_zazen_taoist_fusion_fused_idx').on(table.fusedAt),
    domainIdx: index('pos_zazen_taoist_fusion_domain_idx').on(table.domain),
  })
);

// ============================================================================
// MINDFUL-EFFORTLESS RATE LIMITER TABLE (Token Bucket - v1.6.0)
// ============================================================================

export const mindfulEffortlessRateLimits = pgTable(
  'pos_mindful_effortless_rate_limits',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // Date tracking
    date: timestamp('date').defaultNow().notNull(),

    // Token bucket state
    currentTokens: real('current_tokens').notNull().default(3),
    maxTokens: integer('max_tokens').notNull().default(3),
    refillRate: real('refill_rate').notNull().default(0.5), // tokens per hour
    lastRefill: timestamp('last_refill').defaultNow().notNull(),

    // Usage tracking
    fusionsToday: integer('fusions_today').default(0),
    lastFusion: timestamp('last_fusion'),

    // Denied attempts
    deniedAttempts: integer('denied_attempts').default(0),
    lastDenied: timestamp('last_denied'),

    // Configuration (refill during kinhin periods)
    refillPeriods: jsonb('refill_periods').$type<Array<{
      startHour: number;
      endHour: number;
      multiplier: number;
      activity: 'kinhin' | 'shikantaza' | 'harmony_flow';
    }>>().default([
      { startHour: 6, endHour: 8, multiplier: 1.5, activity: 'shikantaza' },   // Morning meditation
      { startHour: 12, endHour: 13, multiplier: 1.2, activity: 'kinhin' },     // Midday walk
      { startHour: 18, endHour: 20, multiplier: 1.3, activity: 'harmony_flow' } // Evening flow
    ]),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('pos_mindful_rate_limit_user_idx').on(table.userId),
    dateIdx: index('pos_mindful_rate_limit_date_idx').on(table.date),
    uniqueUserDate: uniqueIndex('pos_mindful_rate_limit_user_date_unique').on(table.userId, table.date),
  })
);

// ============================================================================
// MINDFUL-EFFORTLESS STATE HISTORY TABLE (Rollback Support - v1.6.0)
// ============================================================================

export const mindfulEffortlessStateHistory = pgTable(
  'pos_mindful_effortless_state_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // State snapshot
    snapshotAt: timestamp('snapshot_at').defaultNow().notNull(),

    // Current state
    currentPractice: zazenVirtueEnum('current_practice'),
    currentFlow: taoistVirtueEnum('current_flow'),
    emptinessBalance: real('emptiness_balance'), // 0-1
    harmonyPower: real('harmony_power'), // 0-100

    // Mindful-effortless metrics
    satoriScore: real('satori_score'), // 0-100 enlightenment metric
    wuWeiScore: real('wu_wei_score'), // 0-100 effortless flow metric

    // Stability indicators
    isStable: boolean('is_stable').default(true),
    stabilityNotes: text('stability_notes'),

    // Rollback metadata
    isRollbackPoint: boolean('is_rollback_point').default(false),
    rolledBackTo: boolean('rolled_back_to').default(false),
    rollbackTrigger: text('rollback_trigger'),

    // Kinhin audit (movement check)
    auditedBy: text('audited_by'), // 'self', 'therapist', 'peer'
    auditNotes: text('audit_notes'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('pos_mindful_state_history_user_idx').on(table.userId),
    snapshotIdx: index('pos_mindful_state_history_snapshot_idx').on(table.snapshotAt),
    rollbackIdx: index('pos_mindful_state_history_rollback_idx').on(table.isRollbackPoint),
  })
);

// ============================================================================
// ZAZEN-TAOIST WEEKLY METRICS TABLE (v1.6.0)
// ============================================================================

export const zazenTaoistWeeklyMetrics = pgTable(
  'pos_zazen_taoist_weekly_metrics',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // Week tracking
    weekStart: timestamp('week_start').notNull(),
    weekEnd: timestamp('week_end').notNull(),

    // Zazen metrics
    shikantazaSessions: integer('shikantaza_sessions').default(0),
    kinhinSessions: integer('kinhin_sessions').default(0),
    muMoments: integer('mu_moments').default(0),
    satoriAchievements: integer('satori_achievements').default(0),

    // Taoist metrics
    wuWeiMoments: integer('wu_wei_moments').default(0),
    weiWuWeiMoments: integer('wei_wu_wei_moments').default(0),
    harmonyFlowPeriods: integer('harmony_flow_periods').default(0),
    effortlessActions: integer('effortless_actions').default(0),

    // Fusion metrics
    totalFusions: integer('total_fusions').default(0),
    successfulFusions: integer('successful_fusions').default(0),
    fusionSuccessRate: real('fusion_success_rate'), // 0-1

    // Aggregate scores
    weeklyEmptinessScore: real('weekly_emptiness_score'), // 0-100
    weeklyHarmonyScore: real('weekly_harmony_score'), // 0-100
    weeklySatoriBalance: real('weekly_satori_balance'), // 0-100
    weeklyWuWeiBalance: real('weekly_wu_wei_balance'), // 0-1

    // Trend indicators
    emptinessTrend: text('emptiness_trend'), // 'ascending', 'stable', 'descending'
    harmonyTrend: text('harmony_trend'),

    // Action items
    rollbacksTriggered: integer('rollbacks_triggered').default(0),
    kinhinAuditsNeeded: integer('kinhin_audits_needed').default(0),

    // Notes
    weeklyReflection: text('weekly_reflection'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('pos_zazen_taoist_weekly_user_idx').on(table.userId),
    weekIdx: index('pos_zazen_taoist_weekly_week_idx').on(table.weekStart),
    uniqueUserWeek: uniqueIndex('pos_zazen_taoist_weekly_user_week_unique').on(table.userId, table.weekStart),
  })
);

// ============================================================================
// RELATIONS
// ============================================================================

export const zazenPracticesRelations = relations(zazenPractices, ({ one }) => ({
  user: one(users, {
    fields: [zazenPractices.userId],
    references: [users.id],
  }),
}));

export const taoistPracticesRelations = relations(taoistPractices, ({ one }) => ({
  user: one(users, {
    fields: [taoistPractices.userId],
    references: [users.id],
  }),
}));

export const zazenTaoistFusionLogsRelations = relations(zazenTaoistFusionLogs, ({ one }) => ({
  user: one(users, {
    fields: [zazenTaoistFusionLogs.userId],
    references: [users.id],
  }),
}));

export const mindfulEffortlessRateLimitsRelations = relations(mindfulEffortlessRateLimits, ({ one }) => ({
  user: one(users, {
    fields: [mindfulEffortlessRateLimits.userId],
    references: [users.id],
  }),
}));

export const mindfulEffortlessStateHistoryRelations = relations(mindfulEffortlessStateHistory, ({ one }) => ({
  user: one(users, {
    fields: [mindfulEffortlessStateHistory.userId],
    references: [users.id],
  }),
}));

export const zazenTaoistWeeklyMetricsRelations = relations(zazenTaoistWeeklyMetrics, ({ one }) => ({
  user: one(users, {
    fields: [zazenTaoistWeeklyMetrics.userId],
    references: [users.id],
  }),
}));

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

// ============================================================================
// MEAN-EFFORTLESS FUSION TABLES (v2.3.0)
// Wu Wei + Aristotelian Golden Mean Integration
// ============================================================================

export const meanEffortlessFusionLogs = pgTable(
  'pos_mean_effortless_fusion_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // Fusion details
    fusedAt: timestamp('fused_at').defaultNow().notNull(),
    fusionType: text('fusion_type').notNull(), // 'flow-mean', 'mean-flow', 'balanced'

    // Wu Wei component
    wuWeiVirtue: taoistVirtueEnum('wu_wei_virtue'),
    wuWeiScore: real('wu_wei_score'), // 0-100
    wuWeiRank: integer('wu_wei_rank'), // position in RRF

    // Aristotelian component
    aristotelianVirtue: aristotelianVirtueEnum('aristotelian_virtue'),
    aristotelianScore: real('aristotelian_score'), // 0-100
    aristotelianRank: integer('aristotelian_rank'), // position in RRF

    // RRF fusion results
    rrfScore: real('rrf_score'),
    fusionK: integer('fusion_k').default(60), // RRF k parameter

    // Outcome metrics
    flowGain: real('flow_gain'),
    meanGain: real('mean_gain'),
    eudaimoniaMetric: real('eudaimonia_metric'),

    // Balance analysis
    balanceType: meanEffortlessBalanceEnum('balance_type'),
    harmonyScore: real('harmony_score'), // 0-1, how balanced the fusion was

    // Execution
    fusedAction: text('fused_action'),
    actionSuccessful: boolean('action_successful'),
    successNotes: text('success_notes'),

    // Context
    domain: text('domain'), // 'relational', 'apex', 'personal'
    urgency: text('urgency'), // 'low', 'medium', 'high'
    scenarioDescription: text('scenario_description'),

    // A/B Testing
    abTestVariant: text('ab_test_variant'), // 'A' (Wu Wei only), 'B' (with Mean)
    abTestId: text('ab_test_id'),

    // Rate limiting impact
    wuWeiTokensUsed: real('wu_wei_tokens_used'),
    meanTokensUsed: real('mean_tokens_used'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('pos_mean_effortless_fusion_user_idx').on(table.userId),
    fusedIdx: index('pos_mean_effortless_fusion_fused_idx').on(table.fusedAt),
    typeIdx: index('pos_mean_effortless_fusion_type_idx').on(table.fusionType),
    balanceIdx: index('pos_mean_effortless_fusion_balance_idx').on(table.balanceType),
    abTestIdx: index('pos_mean_effortless_fusion_ab_test_idx').on(table.abTestId),
  })
);

export const meanEffortlessRateLimits = pgTable(
  'pos_mean_effortless_rate_limits',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // Date tracking
    date: timestamp('date').defaultNow().notNull(),

    // Token bucket state
    currentTokens: real('current_tokens').notNull().default(4),
    maxTokens: integer('max_tokens').notNull().default(4),
    refillRate: real('refill_rate').notNull().default(0.5), // tokens per hour (4/8 waking hours)
    lastRefill: timestamp('last_refill').defaultNow().notNull(),

    // Eudaimonia bonus tracking
    eudaimoniaCount: integer('eudaimonia_count').default(0),
    bonusTokensEarned: integer('bonus_tokens_earned').default(0),

    // Usage tracking
    fusionsToday: integer('fusions_today').default(0),
    lastFusion: timestamp('last_fusion'),

    // Denied attempts
    deniedAttempts: integer('denied_attempts').default(0),
    lastDenied: timestamp('last_denied'),

    // Configuration - harmonious periods for refill boost
    refillPeriods: jsonb('refill_periods').$type<Array<{
      startHour: number;
      endHour: number;
      multiplier: number;
    }>>().default([
      { startHour: 6, endHour: 8, multiplier: 2.0 },   // Morning reflection boost
      { startHour: 19, endHour: 21, multiplier: 1.5 } // Evening contemplation boost
    ]),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('pos_mean_effortless_rate_limit_user_idx').on(table.userId),
    dateIdx: index('pos_mean_effortless_rate_limit_date_idx').on(table.date),
    uniqueUserDate: uniqueIndex('pos_mean_effortless_rate_limit_user_date_unique').on(table.userId, table.date),
  })
);

export const meanEffortlessStateHistory = pgTable(
  'pos_mean_effortless_state_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // State snapshot
    snapshotAt: timestamp('snapshot_at').defaultNow().notNull(),

    // Current wu wei state
    currentFlow: taoistVirtueEnum('current_flow'),
    flowLevel: real('flow_level'), // 0-100

    // Current aristotelian state
    currentMean: aristotelianVirtueEnum('current_mean'),
    meanLevel: real('mean_level'), // 0-100

    // Combined metrics
    eudaimoniaScore: real('eudaimonia_score'), // 0-100
    harmonyScore: real('harmony_score'), // 0-1

    // Stability indicators
    isStable: boolean('is_stable').default(true),
    stabilityNotes: text('stability_notes'),
    imbalanceType: text('imbalance_type'), // 'over-flow', 'over-mean', 'extreme', 'passive'

    // Rollback metadata
    isRollbackPoint: boolean('is_rollback_point').default(false),
    rolledBackTo: boolean('rolled_back_to').default(false),
    rollbackTrigger: text('rollback_trigger'),

    // Eudaimonia audit
    auditedBy: text('audited_by'), // 'self', 'therapist', 'peer'
    auditNotes: text('audit_notes'),

    // Default state info (for rollback)
    defaultFlow: text('default_flow').default('wu_wei'),
    defaultMean: text('default_mean').default('temperance'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('pos_mean_effortless_state_user_idx').on(table.userId),
    snapshotIdx: index('pos_mean_effortless_state_snapshot_idx').on(table.snapshotAt),
    rollbackIdx: index('pos_mean_effortless_state_rollback_idx').on(table.isRollbackPoint),
    stabilityIdx: index('pos_mean_effortless_state_stability_idx').on(table.isStable),
  })
);

export const meanEffortlessWeeklyMetrics = pgTable(
  'pos_mean_effortless_weekly_metrics',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // Week tracking
    weekStart: timestamp('week_start').notNull(),
    weekEnd: timestamp('week_end').notNull(),

    // Wu Wei metrics
    wuWeiFlows: integer('wu_wei_flows').default(0),
    weiWuWeiFlows: integer('wei_wu_wei_flows').default(0),
    harmonyFlows: integer('harmony_flows').default(0),

    // Aristotelian metrics
    courageMeans: integer('courage_means').default(0),
    temperanceMeans: integer('temperance_means').default(0),
    justiceMeans: integer('justice_means').default(0),
    wisdomMeans: integer('wisdom_means').default(0),

    // Fusion metrics
    totalFusions: integer('total_fusions').default(0),
    successfulFusions: integer('successful_fusions').default(0),
    fusionSuccessRate: real('fusion_success_rate'), // 0-1
    eudaimoniaAchievements: integer('eudaimonia_achievements').default(0),

    // Aggregate scores
    weeklyMeanEffortlessScore: real('weekly_mean_effortless_score'), // 0-100
    weeklyFlowLevel: real('weekly_flow_level'), // 0-100
    weeklyMeanLevel: real('weekly_mean_level'), // 0-100
    weeklyHarmonyScore: real('weekly_harmony_score'), // 0-1

    // Trend indicators
    flowTrend: text('flow_trend'), // 'ascending', 'stable', 'descending'
    meanTrend: text('mean_trend'), // 'ascending', 'stable', 'descending'
    balanceTrend: meanEffortlessBalanceEnum('balance_trend'),

    // A/B test metrics
    variantADecisions: integer('variant_a_decisions').default(0),
    variantBDecisions: integer('variant_b_decisions').default(0),
    variantASuccessRate: real('variant_a_success_rate'),
    variantBSuccessRate: real('variant_b_success_rate'),

    // Action items
    rollbacksTriggered: integer('rollbacks_triggered').default(0),
    eudaimoniaAuditsNeeded: integer('eudaimonia_audits_needed').default(0),
    extremesDetected: integer('extremes_detected').default(0),
    passivityDetected: integer('passivity_detected').default(0),

    // Rate limit impact
    flowTokensDepleted: integer('flow_tokens_depleted').default(0),
    meanTokensDepleted: integer('mean_tokens_depleted').default(0),
    bonusTokensEarned: integer('bonus_tokens_earned').default(0),

    // Notes
    weeklyReflection: text('weekly_reflection'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('pos_mean_effortless_metrics_user_idx').on(table.userId),
    weekIdx: index('pos_mean_effortless_metrics_week_idx').on(table.weekStart),
    uniqueUserWeek: uniqueIndex('pos_mean_effortless_metrics_user_week_unique').on(table.userId, table.weekStart),
    balanceIdx: index('pos_mean_effortless_metrics_balance_idx').on(table.balanceTrend),
  })
);

// ============================================================================
// MEAN-EFFORTLESS RELATIONS
// ============================================================================

export const meanEffortlessFusionLogsRelations = relations(meanEffortlessFusionLogs, ({ one }) => ({
  user: one(users, {
    fields: [meanEffortlessFusionLogs.userId],
    references: [users.id],
  }),
}));

export const meanEffortlessRateLimitsRelations = relations(meanEffortlessRateLimits, ({ one }) => ({
  user: one(users, {
    fields: [meanEffortlessRateLimits.userId],
    references: [users.id],
  }),
}));

export const meanEffortlessStateHistoryRelations = relations(meanEffortlessStateHistory, ({ one }) => ({
  user: one(users, {
    fields: [meanEffortlessStateHistory.userId],
    references: [users.id],
  }),
}));

export const meanEffortlessWeeklyMetricsRelations = relations(meanEffortlessWeeklyMetrics, ({ one }) => ({
  user: one(users, {
    fields: [meanEffortlessWeeklyMetrics.userId],
    references: [users.id],
  }),
}));

// Zazen-Taoist Types (v1.8.0)
export type ZazenPracticeType = typeof zazenPractices.$inferSelect;
export type NewZazenPracticeType = typeof zazenPractices.$inferInsert;
export type TaoistPracticeType = typeof taoistPractices.$inferSelect;
export type NewTaoistPracticeType = typeof taoistPractices.$inferInsert;
export type ZazenTaoistFusionLog = typeof zazenTaoistFusionLogs.$inferSelect;
export type NewZazenTaoistFusionLog = typeof zazenTaoistFusionLogs.$inferInsert;
export type MindfulEffortlessRateLimit = typeof mindfulEffortlessRateLimits.$inferSelect;
export type NewMindfulEffortlessRateLimit = typeof mindfulEffortlessRateLimits.$inferInsert;
export type MindfulEffortlessStateHistory = typeof mindfulEffortlessStateHistory.$inferSelect;
export type NewMindfulEffortlessStateHistory = typeof mindfulEffortlessStateHistory.$inferInsert;
export type ZazenTaoistWeeklyMetric = typeof zazenTaoistWeeklyMetrics.$inferSelect;
export type NewZazenTaoistWeeklyMetric = typeof zazenTaoistWeeklyMetrics.$inferInsert;

// Mean-Effortless Types (v2.3.0)
export type MeanEffortlessFusionLog = typeof meanEffortlessFusionLogs.$inferSelect;
export type NewMeanEffortlessFusionLog = typeof meanEffortlessFusionLogs.$inferInsert;
export type MeanEffortlessRateLimit = typeof meanEffortlessRateLimits.$inferSelect;
export type NewMeanEffortlessRateLimit = typeof meanEffortlessRateLimits.$inferInsert;
export type MeanEffortlessStateHistory = typeof meanEffortlessStateHistory.$inferSelect;
export type NewMeanEffortlessStateHistory = typeof meanEffortlessStateHistory.$inferInsert;
export type MeanEffortlessWeeklyMetric = typeof meanEffortlessWeeklyMetrics.$inferSelect;
export type NewMeanEffortlessWeeklyMetric = typeof meanEffortlessWeeklyMetrics.$inferInsert;

// ============================================================================
// QUANTUM GEOMETRY FUSION TABLES (v2.4.0)
// ============================================================================

export const quantumGeometryFusionLogs = pgTable(
  'pos_quantum_geometry_fusion_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // Wu Wei context
    wuWeiVirtue: deepenedWuWeiVirtueEnum('wu_wei_virtue').notNull(),
    wuWeiScore: real('wu_wei_score').notNull(), // 0-100

    // Geometry context
    geometryState: quantumGeometryStateEnum('geometry_state').notNull(),
    flowType: geometryFlowTypeEnum('flow_type').notNull(),
    coherence: real('coherence').notNull(), // 0-1
    entanglementStrength: real('entanglement_strength'), // 0-1
    materialResilience: real('material_resilience').notNull(), // 0-100
    geometricAccuracy: real('geometric_accuracy').notNull(), // 0-100

    // Fusion result
    status: geometryFusionStatusEnum('status').notNull(),
    rrfScore: real('rrf_score').notNull(),
    fusedAction: text('fused_action').notNull(),
    effortlessGain: real('effortless_gain'), // 0-100
    geometricGain: real('geometric_gain'), // 0-100

    // Trade-off analysis
    tradeoffGood: text('tradeoff_good'),
    tradeoffBad: text('tradeoff_bad'),
    tradeoffMitigation: text('tradeoff_mitigation'),

    // Error handling
    errorType: posErrorTypeEnum('error_type'),
    rollbackTriggered: boolean('rollback_triggered').default(false),
    rollbackState: jsonb('rollback_state'),

    // Audit
    auditLog: jsonb('audit_log').$type<Array<{
      timestamp: string;
      action: string;
      metrics: Record<string, number>;
    }>>(),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('pos_quantum_geometry_fusion_user_idx').on(table.userId),
    wuWeiIdx: index('pos_quantum_geometry_fusion_wuwei_idx').on(table.wuWeiVirtue),
    geometryIdx: index('pos_quantum_geometry_fusion_geometry_idx').on(table.geometryState),
    statusIdx: index('pos_quantum_geometry_fusion_status_idx').on(table.status),
  })
);

// ============================================================================
// ARISTOTELIAN-REN FUSION TABLES (v2.4.0)
// ============================================================================

export const aristotelianRenFusionLogs = pgTable(
  'pos_aristotelian_ren_fusion_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // Golden Mean context
    goldenMeanVirtue: deepenedGoldenMeanVirtueEnum('golden_mean_virtue').notNull(),
    meanBalance: real('mean_balance').notNull(), // 0-1

    // Ren context
    renVirtue: confucianRenVirtueEnum('ren_virtue').notNull(),
    benevolenceLevel: real('benevolence_level').notNull(), // 0-1

    // Fusion result
    status: aristotelianRenFusionStatusEnum('status').notNull(),
    rrfScore: real('rrf_score').notNull(),
    fusedAction: text('fused_action').notNull(),
    meanGain: real('mean_gain'), // 0-100
    benevolenceGain: real('benevolence_gain'), // 0-100
    eudaimoniaMetric: real('eudaimonia_metric'), // 0-100
    harmonyMetric: real('harmony_metric'), // 0-1

    // Trade-off analysis
    tradeoffGood: text('tradeoff_good'),
    tradeoffBad: text('tradeoff_bad'),
    tradeoffMitigation: text('tradeoff_mitigation'),

    // Error handling
    errorType: posErrorTypeEnum('error_type'),
    rollbackTriggered: boolean('rollback_triggered').default(false),
    rollbackState: jsonb('rollback_state'),

    // Audit
    auditLog: jsonb('audit_log').$type<Array<{
      timestamp: string;
      action: string;
      metrics: Record<string, number>;
    }>>(),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('pos_aristotelian_ren_fusion_user_idx').on(table.userId),
    meanIdx: index('pos_aristotelian_ren_fusion_mean_idx').on(table.goldenMeanVirtue),
    renIdx: index('pos_aristotelian_ren_fusion_ren_idx').on(table.renVirtue),
    statusIdx: index('pos_aristotelian_ren_fusion_status_idx').on(table.status),
  })
);

// ============================================================================
// QUANTUM GEOMETRY RATE LIMITS (v2.4.0)
// ============================================================================

export const quantumGeometryRateLimits = pgTable(
  'pos_quantum_geometry_rate_limits',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // Token bucket
    tokens: integer('tokens').notNull().default(5),
    maxTokens: integer('max_tokens').notNull().default(5),
    refillRate: real('refill_rate').notNull().default(0.21), // ~5 tokens per day
    lastRefill: timestamp('last_refill').defaultNow().notNull(),

    // Effortless period refill
    effortlessPeriodRefill: boolean('effortless_period_refill').default(true),

    // Geometry checks
    coherenceThreshold: real('coherence_threshold').notNull().default(0.3),
    materialResilienceThreshold: real('material_resilience_threshold').notNull().default(50),
    chaosOverloadPrevention: boolean('chaos_overload_prevention').default(true),

    // Usage stats
    fusionCount: integer('fusion_count').default(0),
    chaosOverloadCount: integer('chaos_overload_count').default(0),
    dailyFusions: integer('daily_fusions').default(0),
    lastDailyReset: timestamp('last_daily_reset').defaultNow(),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: uniqueIndex('pos_quantum_geometry_rate_limits_user_idx').on(table.userId),
  })
);

// ============================================================================
// ARISTOTELIAN-REN RATE LIMITS (v2.4.0)
// ============================================================================

export const aristotelianRenRateLimits = pgTable(
  'pos_aristotelian_ren_rate_limits',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // Token bucket
    tokens: integer('tokens').notNull().default(5),
    maxTokens: integer('max_tokens').notNull().default(5),
    refillRate: real('refill_rate').notNull().default(0.21), // ~5 tokens per day
    lastRefill: timestamp('last_refill').defaultNow().notNull(),

    // Balance checks
    meanBalanceThreshold: real('mean_balance_threshold').notNull().default(0.3),
    benevolenceThreshold: real('benevolence_threshold').notNull().default(0.4),

    // Usage stats
    fusionCount: integer('fusion_count').default(0),
    eudaimoniaCount: integer('eudaimonia_count').default(0),
    dailyFusions: integer('daily_fusions').default(0),
    lastDailyReset: timestamp('last_daily_reset').defaultNow(),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: uniqueIndex('pos_aristotelian_ren_rate_limits_user_idx').on(table.userId),
  })
);

// ============================================================================
// QUANTUM GEOMETRY WEEKLY METRICS (v2.4.0)
// ============================================================================

export const quantumGeometryWeeklyMetrics = pgTable(
  'pos_quantum_geometry_weekly_metrics',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // Week tracking
    weekStart: timestamp('week_start').notNull(),
    weekEnd: timestamp('week_end').notNull(),

    // Wu Wei metrics
    wuWeiMoments: integer('wu_wei_moments').default(0),
    relationalFlows: integer('relational_flows').default(0),
    apexAlignments: integer('apex_alignments').default(0),
    selfDoubtFlows: integer('self_doubt_flows').default(0),

    // Geometry metrics
    geometryFusions: integer('geometry_fusions').default(0),
    materialGains: integer('material_gains').default(0),
    effortlessGains: integer('effortless_gains').default(0),

    // Aggregate metrics
    totalFusions: integer('total_fusions').default(0),
    successfulFusions: integer('successful_fusions').default(0),
    weeklyWuWeiScore: real('weekly_wu_wei_score'), // 0-100
    weeklyGeometryScore: real('weekly_geometry_score'), // 0-100

    // Trend indicators
    wuWeiTrend: text('wu_wei_trend'), // 'ascending', 'stable', 'descending'
    geometryTrend: text('geometry_trend'), // 'ascending', 'stable', 'descending'
    balanceTrend: text('balance_trend'), // 'harmonized', 'wuwei-dominant', 'geometry-dominant', 'fluctuating'

    // Error tracking
    errorsOccurred: integer('errors_occurred').default(0),
    rollbacksTriggered: integer('rollbacks_triggered').default(0),

    // Notes
    weeklyReflection: text('weekly_reflection'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('pos_quantum_geometry_weekly_user_idx').on(table.userId),
    weekIdx: index('pos_quantum_geometry_weekly_week_idx').on(table.weekStart),
    uniqueUserWeek: uniqueIndex('pos_quantum_geometry_weekly_user_week_unique').on(table.userId, table.weekStart),
  })
);

// ============================================================================
// ARISTOTELIAN-REN WEEKLY METRICS (v2.4.0)
// ============================================================================

export const aristotelianRenWeeklyMetrics = pgTable(
  'pos_aristotelian_ren_weekly_metrics',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // Week tracking
    weekStart: timestamp('week_start').notNull(),
    weekEnd: timestamp('week_end').notNull(),

    // Golden Mean metrics
    courageMeans: integer('courage_means').default(0),
    temperanceMeans: integer('temperance_means').default(0),
    justiceMeans: integer('justice_means').default(0),
    wisdomMeans: integer('wisdom_means').default(0),

    // Ren metrics
    renPractices: integer('ren_practices').default(0),
    yiPractices: integer('yi_practices').default(0),
    liPractices: integer('li_practices').default(0),

    // Achievement metrics
    eudaimoniaAchievements: integer('eudaimonia_achievements').default(0),
    harmonyMoments: integer('harmony_moments').default(0),

    // Aggregate metrics
    totalFusions: integer('total_fusions').default(0),
    successfulFusions: integer('successful_fusions').default(0),
    weeklyMeanScore: real('weekly_mean_score'), // 0-100
    weeklyRenScore: real('weekly_ren_score'), // 0-100

    // Trend indicators
    meanTrend: text('mean_trend'), // 'ascending', 'stable', 'descending'
    renTrend: text('ren_trend'), // 'ascending', 'stable', 'descending'
    balanceTrend: text('balance_trend'), // 'harmonized', 'mean-dominant', 'ren-dominant', 'fluctuating'

    // Error tracking
    errorsOccurred: integer('errors_occurred').default(0),
    rollbacksTriggered: integer('rollbacks_triggered').default(0),

    // Notes
    weeklyReflection: text('weekly_reflection'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('pos_aristotelian_ren_weekly_user_idx').on(table.userId),
    weekIdx: index('pos_aristotelian_ren_weekly_week_idx').on(table.weekStart),
    uniqueUserWeek: uniqueIndex('pos_aristotelian_ren_weekly_user_week_unique').on(table.userId, table.weekStart),
  })
);

// ============================================================================
// v2.4.0 RELATIONS
// ============================================================================

export const quantumGeometryFusionLogsRelations = relations(quantumGeometryFusionLogs, ({ one }) => ({
  user: one(users, {
    fields: [quantumGeometryFusionLogs.userId],
    references: [users.id],
  }),
}));

export const aristotelianRenFusionLogsRelations = relations(aristotelianRenFusionLogs, ({ one }) => ({
  user: one(users, {
    fields: [aristotelianRenFusionLogs.userId],
    references: [users.id],
  }),
}));

export const quantumGeometryRateLimitsRelations = relations(quantumGeometryRateLimits, ({ one }) => ({
  user: one(users, {
    fields: [quantumGeometryRateLimits.userId],
    references: [users.id],
  }),
}));

export const aristotelianRenRateLimitsRelations = relations(aristotelianRenRateLimits, ({ one }) => ({
  user: one(users, {
    fields: [aristotelianRenRateLimits.userId],
    references: [users.id],
  }),
}));

export const quantumGeometryWeeklyMetricsRelations = relations(quantumGeometryWeeklyMetrics, ({ one }) => ({
  user: one(users, {
    fields: [quantumGeometryWeeklyMetrics.userId],
    references: [users.id],
  }),
}));

export const aristotelianRenWeeklyMetricsRelations = relations(aristotelianRenWeeklyMetrics, ({ one }) => ({
  user: one(users, {
    fields: [aristotelianRenWeeklyMetrics.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// v2.4.0 TYPES
// ============================================================================

// Quantum Geometry Types (v2.4.0)
export type QuantumGeometryFusionLog = typeof quantumGeometryFusionLogs.$inferSelect;
export type NewQuantumGeometryFusionLog = typeof quantumGeometryFusionLogs.$inferInsert;
export type QuantumGeometryRateLimit = typeof quantumGeometryRateLimits.$inferSelect;
export type NewQuantumGeometryRateLimit = typeof quantumGeometryRateLimits.$inferInsert;
export type QuantumGeometryWeeklyMetric = typeof quantumGeometryWeeklyMetrics.$inferSelect;
export type NewQuantumGeometryWeeklyMetric = typeof quantumGeometryWeeklyMetrics.$inferInsert;

// Aristotelian-Ren Types (v2.4.0)
export type AristotelianRenFusionLog = typeof aristotelianRenFusionLogs.$inferSelect;
export type NewAristotelianRenFusionLog = typeof aristotelianRenFusionLogs.$inferInsert;
export type AristotelianRenRateLimit = typeof aristotelianRenRateLimits.$inferSelect;
export type NewAristotelianRenRateLimit = typeof aristotelianRenRateLimits.$inferInsert;
export type AristotelianRenWeeklyMetric = typeof aristotelianRenWeeklyMetrics.$inferSelect;
export type NewAristotelianRenWeeklyMetric = typeof aristotelianRenWeeklyMetrics.$inferInsert;

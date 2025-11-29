/**
 * Apex Commons Content
 *
 * Export all commons content for easy importing
 */

// Core philosophical content
export { noteOnHeroes } from './note-on-heroes';
export { shadowReflexTest } from './shadow-reflex-test';
export { foundersOath } from './founders-oath';

// Personal Operating System
export { personalOperatingSystem } from './personal-operating-system';
export type {
  POSModule,
  CacheEntry,
  EventPayload,
  VitalsMetric,
  ChangelogEntry,
  POSLayer,
  POSPhase,
  SecurityFactor,
  // Nietzschean-Aristotelian Types (v1.5.0)
  ExpandedAristotelianVirtue,
  NietzscheanVolitionalVirtue,
  MoralityType,
  ActionableStep,
  AristotelianPractice,
  AristotelianExample,
  NietzscheanPractice,
  NietzscheanExample,
  MetricTracker,
  VolitionalFusionResult,
  VolitionalBucket,
  VolitionalState,
  ÜbermenschWeeklyMetrics,
  // Zen Uncertainty Types (v1.7.0)
  ZenPractice,
  ZenExample,
  NonDualFusionResult,
  ZenBucket,
  NonDualState,
  NonDualWeeklyMetrics,
  // Zazen-Taoist Types (v1.8.0)
  ZazenMindfulnessVirtue,
  TaoistEffortlessVirtue,
  DualityType,
  FlowForceType,
  ZazenPractice,
  ZazenExample,
  ZazenMetricTracker,
  TaoistPractice,
  TaoistExample,
  TaoistMetricTracker,
  ZazenTaoistFusionResult,
  MindfulEffortlessBucket,
  MindfulEffortlessState,
  ZazenTaoistWeeklyMetrics,
} from './personal-operating-system';

// POS Version and Changelog exports
export {
  POS_VERSION,
  POS_CHANGELOG_V1_5,
  POS_CHANGELOG_V1_7,
  POS_CHANGELOG_V1_8,
  calculateRRFScore,
  shouldProceedWithWill,
  calculateNonDualRRFScore,
  shouldProceedWithNonDual,
  calculateZazenTaoistRRF,
  shouldProceedWithWuWei,
} from './personal-operating-system';

// BRAVING Protocol (Trust Operations)
export { bravingProtocol } from './braving-protocol';
export type {
  BravingExercise,
  BravingElement,
  BravingExerciseType,
} from './braving-protocol';

// Antifragility Middleware (Resilience Engineering)
export { antifragilityMiddleware } from './antifragility-middleware';
export type {
  AntifragileStrategy,
  AntifragileStrategyType,
} from './antifragility-middleware';

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

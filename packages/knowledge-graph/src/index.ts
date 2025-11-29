/**
 * Apex Intelligence Center - Knowledge Graph Package
 *
 * This package provides a unified interface for interacting with the Apex knowledge graph,
 * Fara-7B Computer-Using Agent, and Civilizational Analytics engine.
 *
 * The Civilizational Analytics module extends the TCG market intelligence framework
 * to map elite power networks using the same mechanisms:
 * - Artificial scarcity (Rentism) ↔ TCG buyouts
 * - Insider knowledge (Kompromat) ↔ Reprint leaks
 * - Gatekeeping (Institutional control) ↔ PSA/BGS grading
 * - Wash trading (Circular donations) ↔ Fake price history
 *
 * @module @apex/knowledge-graph
 * @version 1.1.0
 */

export * from './neo4j-client';
export * from './fara-client';
export * from './civilizational-client';

// Re-export commonly used types from neo4j-client
export type {
  CardNode,
  MarketNode,
  TransactionNode,
  ResearchNode,
  ConceptNode,
  AgentNode,
  RelationshipType,
} from './neo4j-client';

// Re-export commonly used types from fara-client
export type {
  Task,
  TaskStatus,
  TaskResult,
  ActionLog,
  ActionType,
  CriticalPoint,
} from './fara-client';

// Re-export commonly used types from civilizational-client
export type {
  EntityNode,
  DomainNode,
  EventNode,
  NarrativeNode,
  UnifiedAssetNode,
  EntityType,
  EventType,
  SevenMountain,
  InfluenceMechanism,
  NarrativeStance,
  CivilizationalRelationshipType,
  InfluenceEdgeProperties,
  FundingEdgeProperties,
} from './civilizational-client';

export { SEVEN_MOUNTAINS } from './civilizational-client';

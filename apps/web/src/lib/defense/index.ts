/**
 * Defense & Resilience Module
 *
 * Unified export for all defense-related functionality.
 * Implements pack-ai-defense-001 architecture for TCG market intelligence.
 *
 * @module defense
 */

// Edge AI Monitoring
export {
  getEdgeNodes,
  getEdgeNodeWithEvents,
  createEdgeNode,
  updateEdgeNodeStatus,
  processHealthCheck,
  runHealthChecks,
  simulateDDIL,
  endDDILSimulation,
  logNodeEvent,
  getRecentEvents,
  getNetworkHealthSummary,
  getAnomalousNodes,
  type NodeStatus,
  type NodeHealthCheck,
  type DDILSimulationConfig,
  type EdgeNodeWithEvents,
} from './edge-monitor';

// OODA Analytics
export {
  recordOodaMeasurement,
  createOodaTracker,
  getOodaMetrics,
  analyzeBottlenecks,
  getOodaSummary,
  compareProcessingTypes,
  type OodaPhase,
  type ProcessingType,
  type OodaMeasurement,
  type BottleneckAnalysis,
  type OodaSummary,
} from './ooda-analytics';

// Threat Detection
export {
  detectThreats,
  recordThreatEvent,
  updateThreatStatus,
  getActiveThreats,
  getThreatsForCards,
  upsertNetworkNode,
  addNetworkEdge,
  getNetworkGraph,
  updateNodeThreatLevel,
  getThreatSummary,
  THREAT_TECHNIQUES,
  type ThreatType,
  type ThreatSeverity,
  type ThreatStatus,
  type ThreatIndicators,
  type ThreatDetectionResult,
} from './threat-detection';

// Defense Domain Pack (RAG)
export {
  PROMPT_TEMPLATES,
  seedDefenseKnowledge,
  searchKnowledge,
  getKnowledgeByDomain,
  addKnowledge,
  buildAgentContext,
  fillTemplate,
  buildRagContext,
  type KnowledgeDomain,
  type DocumentType,
  type KnowledgeQuery,
  type KnowledgeResult,
} from './domain-pack';

// Re-export schema types
export type {
  EdgeNode,
  NewEdgeNode,
  EdgeNodeEvent,
  NewEdgeNodeEvent,
  DigitalTwin,
  NewDigitalTwin,
  TwinSensor,
  NewTwinSensor,
  AttackScenario,
  NewAttackScenario,
  OodaMetric,
  NewOodaMetric,
  NetworkNode,
  NewNetworkNode,
  NetworkEdge,
  NewNetworkEdge,
  ThreatEvent,
  NewThreatEvent,
  SupplyNode,
  NewSupplyNode,
  SupplyRoute,
  NewSupplyRoute,
  ResilienceProfile,
  NewResilienceProfile,
  DefenseKnowledge,
  NewDefenseKnowledge,
} from '@/db/schema/defense';

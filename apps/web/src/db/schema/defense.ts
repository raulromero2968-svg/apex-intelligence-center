/**
 * Defense & Resilience Schema for Apex Intelligence
 *
 * Implements the AI x Defense Integration knowledge pack (pack-ai-defense-001)
 * adapted for TCG market intelligence:
 * - Edge AI monitoring for distributed price tracking
 * - Digital twins for market ecosystem simulation
 * - OODA loop analytics for decision optimization
 * - Threat detection for market manipulation patterns
 * - Supply chain/logistics for card distribution optimization
 *
 * @see pack-ai-defense-001 for domain mapping
 */

import { pgTable, text, boolean, jsonb, timestamp, uuid, index, uniqueIndex, integer, real, customType } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from '../schema';

/**
 * Custom pgvector type for embeddings
 */
const vector = customType<{ data: number[]; driverData: string }>({
  dataType(config) {
    return config?.dimensions ? `vector(${config.dimensions})` : 'vector';
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string): number[] {
    return value.slice(1, -1).split(',').map(Number);
  },
});

// ============================================================================
// EDGE AI MONITORING (pack-ai-defense-001 §3.1)
// ============================================================================

/**
 * Edge Nodes - Distributed AI processing nodes for market data
 *
 * Tracks status of edge nodes (e.g., exchange scrapers, price aggregators)
 * that process data locally for DDIL resilience. In TCG context:
 * - Exchange API connectors (TCGPlayer, CardMarket, eBay)
 * - Price aggregation services
 * - Anomaly detection processors
 */
export const edgeNodes = pgTable('edge_nodes', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Node identification
  name: text('name').notNull(),
  region: text('region').notNull(), // 'us-east', 'eu-west', 'jp-tokyo', etc.
  nodeType: text('node_type', {
    enum: ['scraper', 'aggregator', 'processor', 'cache', 'gateway']
  }).notNull(),

  // Connection details
  endpoint: text('endpoint'), // URL or internal address

  // Status tracking (DDIL states)
  status: text('status', {
    enum: ['online', 'degraded', 'intermittent', 'limited', 'denied', 'offline']
  }).default('offline').notNull(),

  // Performance metrics
  load: real('load').default(0).notNull(), // 0-100%
  latencyMs: integer('latency_ms'), // Last measured latency
  throughput: real('throughput'), // Requests per second
  errorRate: real('error_rate').default(0), // 0-1 error percentage

  // Anomaly detection vector (for pattern matching)
  anomalyVector: vector('anomaly_vector', { dimensions: 128 }),
  anomalyScore: real('anomaly_score').default(0), // 0-1, >0.7 = anomaly

  // Edge capabilities
  capabilities: jsonb('capabilities').$type<{
    supportsCache?: boolean;
    cacheSize?: number;
    maxConcurrency?: number;
    supportedSources?: string[];
    mlModels?: string[];
  }>().default({}),

  // Health check
  lastHealthCheck: timestamp('last_health_check'),
  consecutiveFailures: integer('consecutive_failures').default(0),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  statusIdx: index('idx_edge_nodes_status').on(table.status),
  regionIdx: index('idx_edge_nodes_region').on(table.region),
  typeIdx: index('idx_edge_nodes_type').on(table.nodeType),
  anomalyIdx: index('idx_edge_nodes_anomaly').on(table.anomalyScore),
  uniqueName: uniqueIndex('idx_edge_nodes_name_unique').on(table.name),
}));

/**
 * Edge Node Events - Event log for edge node state changes
 */
export const edgeNodeEvents = pgTable('edge_node_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  nodeId: uuid('node_id').notNull().references(() => edgeNodes.id, { onDelete: 'cascade' }),

  eventType: text('event_type', {
    enum: ['status_change', 'anomaly_detected', 'failover', 'recovery', 'config_update', 'health_check']
  }).notNull(),

  previousStatus: text('previous_status'),
  newStatus: text('new_status'),

  // Event details
  details: jsonb('details').$type<{
    reason?: string;
    metrics?: Record<string, number>;
    triggeredBy?: string;
    resolution?: string;
  }>().default({}),

  // Timestamps
  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => ({
  nodeIdx: index('idx_edge_node_events_node').on(table.nodeId),
  typeIdx: index('idx_edge_node_events_type').on(table.eventType),
  timestampIdx: index('idx_edge_node_events_timestamp').on(table.timestamp.desc()),
}));

// ============================================================================
// DIGITAL TWIN SIMULATION (pack-ai-defense-001 §3.2)
// ============================================================================

/**
 * Digital Twins - 3D models of TCG market ecosystems
 *
 * Represents virtual models of market systems for simulation:
 * - Card set release cycles
 * - Exchange price relationships
 * - Market participant networks
 */
export const digitalTwins = pgTable('digital_twins', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Twin identification
  name: text('name').notNull(),
  description: text('description'),
  twinType: text('twin_type', {
    enum: ['market_ecosystem', 'exchange_network', 'set_release', 'supply_chain', 'custom']
  }).notNull(),

  // 3D Model reference
  modelUrl: text('model_url'), // glTF file URL
  thumbnailUrl: text('thumbnail_url'),

  // Owner/creator
  ownerId: text('owner_id').references(() => users.id, { onDelete: 'set null' }),
  isPublic: boolean('is_public').default(false).notNull(),

  // Configuration
  config: jsonb('config').$type<{
    scale?: number;
    defaultCamera?: { x: number; y: number; z: number };
    sensorMappings?: Array<{ sensorId: string; position: [number, number, number] }>;
    animationSpeed?: number;
  }>().default({}),

  // Simulation state
  isActive: boolean('is_active').default(false).notNull(),
  lastSimulationAt: timestamp('last_simulation_at'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  ownerIdx: index('idx_digital_twins_owner').on(table.ownerId),
  typeIdx: index('idx_digital_twins_type').on(table.twinType),
  publicIdx: index('idx_digital_twins_public').on(table.isPublic),
}));

/**
 * Twin Sensors - Data feeds overlaid on digital twins
 *
 * Real-time data points mapped to 3D positions on twins:
 * - Price feeds
 * - Volume metrics
 * - Anomaly indicators
 */
export const twinSensors = pgTable('twin_sensors', {
  id: uuid('id').defaultRandom().primaryKey(),
  twinId: uuid('twin_id').notNull().references(() => digitalTwins.id, { onDelete: 'cascade' }),

  // Sensor identification
  name: text('name').notNull(),
  sensorType: text('sensor_type', {
    enum: ['price', 'volume', 'anomaly', 'latency', 'health', 'custom']
  }).notNull(),

  // 3D position on model
  position: jsonb('position').$type<[number, number, number]>().notNull(),

  // Data source
  dataSource: text('data_source').notNull(), // API endpoint or internal reference
  refreshIntervalMs: integer('refresh_interval_ms').default(5000),

  // Current value
  currentValue: real('current_value'),
  previousValue: real('previous_value'),
  isAnomaly: boolean('is_anomaly').default(false),

  // Thresholds
  thresholds: jsonb('thresholds').$type<{
    warning?: { min?: number; max?: number };
    critical?: { min?: number; max?: number };
  }>().default({}),

  // Display config
  displayConfig: jsonb('display_config').$type<{
    color?: string;
    size?: number;
    labelVisible?: boolean;
    animationOnChange?: boolean;
  }>().default({}),

  // Timestamps
  lastUpdatedAt: timestamp('last_updated_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  twinIdx: index('idx_twin_sensors_twin').on(table.twinId),
  typeIdx: index('idx_twin_sensors_type').on(table.sensorType),
  anomalyIdx: index('idx_twin_sensors_anomaly').on(table.isAnomaly),
}));

/**
 * Attack Scenarios - Simulation scenarios for resilience testing
 *
 * Pre-defined or custom scenarios for testing system resilience:
 * - Market manipulation (pump & dump)
 * - Exchange outages (DDIL)
 * - Supply chain disruptions
 */
export const attackScenarios = pgTable('attack_scenarios', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Scenario identification
  name: text('name').notNull(),
  description: text('description'),
  scenarioType: text('scenario_type', {
    enum: ['manipulation', 'ddil', 'supply_disruption', 'cyber', 'cascade_failure', 'custom']
  }).notNull(),

  // Target
  targetTwinId: uuid('target_twin_id').references(() => digitalTwins.id, { onDelete: 'set null' }),

  // Scenario definition
  steps: jsonb('steps').$type<Array<{
    stepNumber: number;
    action: string;
    targetSensorIds?: string[];
    parameters: Record<string, any>;
    durationMs: number;
    delayMs?: number;
  }>>().notNull(),

  // Execution state
  status: text('status', {
    enum: ['draft', 'ready', 'running', 'paused', 'completed', 'failed']
  }).default('draft').notNull(),
  currentStep: integer('current_step').default(0),

  // Results
  results: jsonb('results').$type<{
    startedAt?: string;
    completedAt?: string;
    anomaliesDetected?: number;
    failuresTriggered?: number;
    recoveryTimeMs?: number;
    findings?: string[];
  }>(),

  // Creator
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  typeIdx: index('idx_attack_scenarios_type').on(table.scenarioType),
  statusIdx: index('idx_attack_scenarios_status').on(table.status),
  twinIdx: index('idx_attack_scenarios_twin').on(table.targetTwinId),
}));

// ============================================================================
// OODA LOOP ANALYTICS (pack-ai-defense-001 §3.1)
// ============================================================================

/**
 * OODA Metrics - Decision cycle latency tracking
 *
 * Tracks time spent in each OODA phase:
 * - Observe: Data collection from sources
 * - Orient: Data fusion and analysis
 * - Decide: Decision generation (AI or human)
 * - Act: Action execution
 */
export const oodaMetrics = pgTable('ooda_metrics', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Context
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  sessionId: text('session_id'),
  pipelineId: text('pipeline_id'), // Which decision pipeline

  // Processing type
  processingType: text('processing_type', {
    enum: ['edge', 'central', 'hybrid']
  }).notNull(),

  // OODA phase latencies (milliseconds)
  observeLatencyMs: integer('observe_latency_ms').notNull(),
  orientLatencyMs: integer('orient_latency_ms').notNull(),
  decideLatencyMs: integer('decide_latency_ms').notNull(),
  actLatencyMs: integer('act_latency_ms').notNull(),
  totalLatencyMs: integer('total_latency_ms').notNull(),

  // Bottleneck analysis
  bottleneckPhase: text('bottleneck_phase', {
    enum: ['observe', 'orient', 'decide', 'act']
  }),

  // Context metadata
  metadata: jsonb('metadata').$type<{
    dataSourceCount?: number;
    dataPointsProcessed?: number;
    modelUsed?: string;
    actionTaken?: string;
    outcome?: string;
  }>().default({}),

  // Timestamps
  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_ooda_metrics_user').on(table.userId),
  pipelineIdx: index('idx_ooda_metrics_pipeline').on(table.pipelineId),
  typeIdx: index('idx_ooda_metrics_type').on(table.processingType),
  timestampIdx: index('idx_ooda_metrics_timestamp').on(table.timestamp.desc()),
  bottleneckIdx: index('idx_ooda_metrics_bottleneck').on(table.bottleneckPhase),
}));

// ============================================================================
// THREAT DETECTION (pack-ai-defense-001 §3.4)
// ============================================================================

/**
 * Network Nodes - Nodes in the threat visualization graph
 *
 * Represents entities in the market network:
 * - Exchanges
 * - Sellers/Buyers
 * - Card listings
 * - Price feeds
 */
export const networkNodes = pgTable('network_nodes', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Node identification
  name: text('name').notNull(),
  nodeType: text('node_type', {
    enum: ['exchange', 'seller', 'buyer', 'listing', 'feed', 'service', 'unknown']
  }).notNull(),

  // External reference
  externalId: text('external_id'), // ID in external system
  externalSource: text('external_source'), // e.g., 'tcgplayer', 'ebay'

  // Status
  status: text('status', {
    enum: ['healthy', 'suspicious', 'compromised', 'offline']
  }).default('healthy').notNull(),

  // Risk assessment
  riskScore: real('risk_score').default(0), // 0-1
  threatLevel: text('threat_level', {
    enum: ['none', 'low', 'medium', 'high', 'critical']
  }).default('none').notNull(),

  // Position for visualization (optional, can be auto-layouted)
  position: jsonb('position').$type<{ x: number; y: number; z: number }>(),

  // Metadata
  metadata: jsonb('metadata').$type<{
    reputation?: number;
    transactionCount?: number;
    lastActivityAt?: string;
    tags?: string[];
  }>().default({}),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  typeIdx: index('idx_network_nodes_type').on(table.nodeType),
  statusIdx: index('idx_network_nodes_status').on(table.status),
  threatIdx: index('idx_network_nodes_threat').on(table.threatLevel),
  externalIdx: index('idx_network_nodes_external').on(table.externalSource, table.externalId),
}));

/**
 * Network Edges - Connections between network nodes
 */
export const networkEdges = pgTable('network_edges', {
  id: uuid('id').defaultRandom().primaryKey(),

  sourceNodeId: uuid('source_node_id').notNull().references(() => networkNodes.id, { onDelete: 'cascade' }),
  targetNodeId: uuid('target_node_id').notNull().references(() => networkNodes.id, { onDelete: 'cascade' }),

  // Edge type
  edgeType: text('edge_type', {
    enum: ['transaction', 'listing', 'data_flow', 'ownership', 'suspicious', 'attack_vector']
  }).notNull(),

  // Weight/strength
  weight: real('weight').default(1),

  // Metadata
  metadata: jsonb('metadata').$type<{
    transactionCount?: number;
    totalValue?: number;
    lastActivityAt?: string;
  }>().default({}),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  sourceIdx: index('idx_network_edges_source').on(table.sourceNodeId),
  targetIdx: index('idx_network_edges_target').on(table.targetNodeId),
  typeIdx: index('idx_network_edges_type').on(table.edgeType),
}));

/**
 * Threat Events - Detected threat patterns
 *
 * Records detected threats with MITRE ATT&CK-style classification:
 * - Pump & dump patterns
 * - Wash trading
 * - Price manipulation
 * - Account takeover indicators
 */
export const threatEvents = pgTable('threat_events', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Threat classification
  threatType: text('threat_type', {
    enum: ['pump_dump', 'wash_trading', 'price_manipulation', 'shill_bidding',
           'account_compromise', 'bot_activity', 'ddil_attack', 'unknown']
  }).notNull(),

  // MITRE-style technique ID (custom for TCG domain)
  techniqueId: text('technique_id'), // e.g., 'TCG-T001' for pump & dump

  // Severity
  severity: text('severity', {
    enum: ['info', 'low', 'medium', 'high', 'critical']
  }).notNull(),

  // Confidence
  confidence: real('confidence').notNull(), // 0-1

  // Affected entities
  affectedNodeIds: jsonb('affected_node_ids').$type<string[]>().default([]),
  affectedCardIds: jsonb('affected_card_ids').$type<string[]>().default([]),

  // Event details
  description: text('description').notNull(),
  indicators: jsonb('indicators').$type<{
    volumeSpike?: number;
    priceDeviation?: number;
    accountAge?: number;
    transactionPattern?: string;
    ipAddresses?: string[];
  }>().default({}),

  // Pattern vector for similarity matching
  patternVector: vector('pattern_vector', { dimensions: 256 }),

  // Response
  status: text('status', {
    enum: ['detected', 'investigating', 'confirmed', 'mitigated', 'false_positive']
  }).default('detected').notNull(),

  suggestedActions: jsonb('suggested_actions').$type<string[]>().default([]),
  mitigationTaken: text('mitigation_taken'),

  // Timeline
  detectedAt: timestamp('detected_at').defaultNow().notNull(),
  confirmedAt: timestamp('confirmed_at'),
  mitigatedAt: timestamp('mitigated_at'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  typeIdx: index('idx_threat_events_type').on(table.threatType),
  severityIdx: index('idx_threat_events_severity').on(table.severity),
  statusIdx: index('idx_threat_events_status').on(table.status),
  detectedIdx: index('idx_threat_events_detected').on(table.detectedAt.desc()),
  techniqueIdx: index('idx_threat_events_technique').on(table.techniqueId),
}));

// ============================================================================
// SUPPLY CHAIN / LOGISTICS (pack-ai-defense-001 §3.3)
// ============================================================================

/**
 * Supply Nodes - Points in the TCG supply chain
 *
 * Represents distribution points:
 * - Card printers/manufacturers
 * - Distributors
 * - Retailers
 * - Exchanges
 * - Grading services
 */
export const supplyNodes = pgTable('supply_nodes', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Node identification
  name: text('name').notNull(),
  nodeType: text('node_type', {
    enum: ['manufacturer', 'distributor', 'retailer', 'exchange', 'grading_service', 'warehouse', 'custom']
  }).notNull(),

  // Location
  region: text('region').notNull(),
  country: text('country'),
  coordinates: jsonb('coordinates').$type<{ lat: number; lng: number }>(),

  // Capacity
  capacity: integer('capacity'), // Units per day
  currentLoad: real('current_load').default(0), // 0-100%

  // Status
  status: text('status', {
    enum: ['operational', 'degraded', 'disrupted', 'offline']
  }).default('operational').notNull(),

  // Resilience score (0-100)
  resilienceScore: real('resilience_score').default(50),

  // Metadata
  metadata: jsonb('metadata').$type<{
    processingTimeHours?: number;
    qualityRating?: number;
    costMultiplier?: number;
  }>().default({}),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  typeIdx: index('idx_supply_nodes_type').on(table.nodeType),
  regionIdx: index('idx_supply_nodes_region').on(table.region),
  statusIdx: index('idx_supply_nodes_status').on(table.status),
}));

/**
 * Supply Routes - Connections between supply nodes
 */
export const supplyRoutes = pgTable('supply_routes', {
  id: uuid('id').defaultRandom().primaryKey(),

  sourceNodeId: uuid('source_node_id').notNull().references(() => supplyNodes.id, { onDelete: 'cascade' }),
  targetNodeId: uuid('target_node_id').notNull().references(() => supplyNodes.id, { onDelete: 'cascade' }),

  // Route characteristics
  transportType: text('transport_type', {
    enum: ['air', 'sea', 'ground', 'digital', 'mixed']
  }).notNull(),

  // Timing
  transitTimeHours: real('transit_time_hours').notNull(),
  variabilityPercent: real('variability_percent').default(10), // ±% variance

  // Cost
  costPerUnit: real('cost_per_unit'),
  currency: text('currency').default('USD'),

  // Capacity
  maxCapacity: integer('max_capacity'), // Units per shipment
  currentUtilization: real('current_utilization').default(0), // 0-100%

  // Status
  status: text('status', {
    enum: ['active', 'congested', 'disrupted', 'inactive']
  }).default('active').notNull(),

  // Threat exposure (0-1)
  threatExposure: real('threat_exposure').default(0),

  // Metadata
  metadata: jsonb('metadata').$type<{
    carrierName?: string;
    trackingEnabled?: boolean;
    insuranceIncluded?: boolean;
  }>().default({}),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  sourceIdx: index('idx_supply_routes_source').on(table.sourceNodeId),
  targetIdx: index('idx_supply_routes_target').on(table.targetNodeId),
  statusIdx: index('idx_supply_routes_status').on(table.status),
  transportIdx: index('idx_supply_routes_transport').on(table.transportType),
}));

// ============================================================================
// RESILIENCE PROFILES (Calibration)
// ============================================================================

/**
 * Resilience Profiles - User-specific or system calibration settings
 */
export const resilienceProfiles = pgTable('resilience_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Owner (null = system default)
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),

  // Profile name
  name: text('name').notNull(),
  isDefault: boolean('is_default').default(false),

  // Anomaly detection thresholds
  anomalyThresholds: jsonb('anomaly_thresholds').$type<{
    priceSpike?: number; // % change to flag
    volumeSpike?: number;
    latencyThreshold?: number; // ms
    errorRateThreshold?: number; // 0-1
  }>().notNull(),

  // OODA optimization preferences
  oodaPreferences: jsonb('ooda_preferences').$type<{
    preferEdge?: boolean;
    maxLatencyMs?: number;
    autoOptimize?: boolean;
  }>().default({}),

  // Alert preferences
  alertPreferences: jsonb('alert_preferences').$type<{
    minSeverity?: string;
    channels?: string[];
    quietHoursStart?: string;
    quietHoursEnd?: string;
  }>().default({}),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_resilience_profiles_user').on(table.userId),
  defaultIdx: index('idx_resilience_profiles_default').on(table.isDefault),
}));

// ============================================================================
// DEFENSE KNOWLEDGE (RAG Domain Pack)
// ============================================================================

/**
 * Defense Knowledge - RAG documents for defense domain
 *
 * Stores defense/resilience concepts adapted for TCG:
 * - DDIL patterns and mitigations
 * - OODA loop optimization strategies
 * - Threat patterns and detection methods
 * - Resilience best practices
 */
export const defenseKnowledge = pgTable('defense_knowledge', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Document type
  documentType: text('document_type', {
    enum: ['concept', 'pattern', 'technique', 'mitigation', 'best_practice', 'case_study']
  }).notNull(),

  // Content
  title: text('title').notNull(),
  content: text('content').notNull(),

  // Categorization
  domain: text('domain', {
    enum: ['edge_ai', 'digital_twin', 'ooda', 'threat_detection', 'supply_chain', 'general']
  }).notNull(),

  tags: jsonb('tags').$type<string[]>().default([]),

  // Vector embedding for semantic search
  embedding: vector('embedding', { dimensions: 1536 }),

  // Source reference
  sourceRef: text('source_ref'), // e.g., 'pack-ai-defense-001 §3.1'

  // Metadata
  metadata: jsonb('metadata').$type<{
    author?: string;
    version?: string;
    lastReviewedAt?: string;
    reliability?: number;
  }>().default({}),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  typeIdx: index('idx_defense_knowledge_type').on(table.documentType),
  domainIdx: index('idx_defense_knowledge_domain').on(table.domain),
}));

// ============================================================================
// RELATIONS
// ============================================================================

export const edgeNodesRelations = relations(edgeNodes, ({ many }) => ({
  events: many(edgeNodeEvents),
}));

export const edgeNodeEventsRelations = relations(edgeNodeEvents, ({ one }) => ({
  node: one(edgeNodes, {
    fields: [edgeNodeEvents.nodeId],
    references: [edgeNodes.id],
  }),
}));

export const digitalTwinsRelations = relations(digitalTwins, ({ one, many }) => ({
  owner: one(users, {
    fields: [digitalTwins.ownerId],
    references: [users.id],
  }),
  sensors: many(twinSensors),
  scenarios: many(attackScenarios),
}));

export const twinSensorsRelations = relations(twinSensors, ({ one }) => ({
  twin: one(digitalTwins, {
    fields: [twinSensors.twinId],
    references: [digitalTwins.id],
  }),
}));

export const attackScenariosRelations = relations(attackScenarios, ({ one }) => ({
  targetTwin: one(digitalTwins, {
    fields: [attackScenarios.targetTwinId],
    references: [digitalTwins.id],
  }),
  creator: one(users, {
    fields: [attackScenarios.createdBy],
    references: [users.id],
  }),
}));

export const oodaMetricsRelations = relations(oodaMetrics, ({ one }) => ({
  user: one(users, {
    fields: [oodaMetrics.userId],
    references: [users.id],
  }),
}));

export const networkNodesRelations = relations(networkNodes, ({ many }) => ({
  outgoingEdges: many(networkEdges, { relationName: 'source' }),
  incomingEdges: many(networkEdges, { relationName: 'target' }),
}));

export const networkEdgesRelations = relations(networkEdges, ({ one }) => ({
  sourceNode: one(networkNodes, {
    fields: [networkEdges.sourceNodeId],
    references: [networkNodes.id],
    relationName: 'source',
  }),
  targetNode: one(networkNodes, {
    fields: [networkEdges.targetNodeId],
    references: [networkNodes.id],
    relationName: 'target',
  }),
}));

export const supplyNodesRelations = relations(supplyNodes, ({ many }) => ({
  outgoingRoutes: many(supplyRoutes, { relationName: 'source' }),
  incomingRoutes: many(supplyRoutes, { relationName: 'target' }),
}));

export const supplyRoutesRelations = relations(supplyRoutes, ({ one }) => ({
  sourceNode: one(supplyNodes, {
    fields: [supplyRoutes.sourceNodeId],
    references: [supplyNodes.id],
    relationName: 'source',
  }),
  targetNode: one(supplyNodes, {
    fields: [supplyRoutes.targetNodeId],
    references: [supplyNodes.id],
    relationName: 'target',
  }),
}));

export const resilienceProfilesRelations = relations(resilienceProfiles, ({ one }) => ({
  user: one(users, {
    fields: [resilienceProfiles.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type EdgeNode = typeof edgeNodes.$inferSelect;
export type NewEdgeNode = typeof edgeNodes.$inferInsert;
export type EdgeNodeEvent = typeof edgeNodeEvents.$inferSelect;
export type NewEdgeNodeEvent = typeof edgeNodeEvents.$inferInsert;
export type DigitalTwin = typeof digitalTwins.$inferSelect;
export type NewDigitalTwin = typeof digitalTwins.$inferInsert;
export type TwinSensor = typeof twinSensors.$inferSelect;
export type NewTwinSensor = typeof twinSensors.$inferInsert;
export type AttackScenario = typeof attackScenarios.$inferSelect;
export type NewAttackScenario = typeof attackScenarios.$inferInsert;
export type OodaMetric = typeof oodaMetrics.$inferSelect;
export type NewOodaMetric = typeof oodaMetrics.$inferInsert;
export type NetworkNode = typeof networkNodes.$inferSelect;
export type NewNetworkNode = typeof networkNodes.$inferInsert;
export type NetworkEdge = typeof networkEdges.$inferSelect;
export type NewNetworkEdge = typeof networkEdges.$inferInsert;
export type ThreatEvent = typeof threatEvents.$inferSelect;
export type NewThreatEvent = typeof threatEvents.$inferInsert;
export type SupplyNode = typeof supplyNodes.$inferSelect;
export type NewSupplyNode = typeof supplyNodes.$inferInsert;
export type SupplyRoute = typeof supplyRoutes.$inferSelect;
export type NewSupplyRoute = typeof supplyRoutes.$inferInsert;
export type ResilienceProfile = typeof resilienceProfiles.$inferSelect;
export type NewResilienceProfile = typeof resilienceProfiles.$inferInsert;
export type DefenseKnowledge = typeof defenseKnowledge.$inferSelect;
export type NewDefenseKnowledge = typeof defenseKnowledge.$inferInsert;

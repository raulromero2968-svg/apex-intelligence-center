/**
 * Edge AI Monitoring Service
 *
 * Implements edge node monitoring for DDIL resilience (pack-ai-defense-001 §3.1).
 * Adapted for TCG market intelligence:
 * - Monitors distributed price scrapers and aggregators
 * - Detects connectivity degradation (DDIL states)
 * - Triggers failover to edge caches
 * - Tracks node health and anomalies
 *
 * @see pack-ai-defense-001 for architecture details
 */

import { db } from '@/lib/db';
import { eq, desc, and, gte, sql } from 'drizzle-orm';
import {
  edgeNodes,
  edgeNodeEvents,
  type EdgeNode,
  type NewEdgeNode,
  type EdgeNodeEvent,
  type NewEdgeNodeEvent,
} from '@/db/schema/defense';

// ============================================================================
// TYPES
// ============================================================================

export type NodeStatus = 'online' | 'degraded' | 'intermittent' | 'limited' | 'denied' | 'offline';

export interface NodeHealthCheck {
  nodeId: string;
  status: NodeStatus;
  latencyMs: number;
  errorRate: number;
  load: number;
  timestamp: Date;
}

export interface DDILSimulationConfig {
  targetNodes?: string[]; // Node IDs to affect, or all if empty
  scenario: 'intermittent' | 'limited' | 'denied' | 'degraded';
  durationMs: number;
  intensity: number; // 0-1, affects severity
}

export interface EdgeNodeWithEvents extends EdgeNode {
  events?: EdgeNodeEvent[];
}

// ============================================================================
// EDGE NODE MANAGEMENT
// ============================================================================

/**
 * Get all edge nodes with optional status filter
 */
export async function getEdgeNodes(status?: NodeStatus): Promise<EdgeNode[]> {
  if (status) {
    return db.select().from(edgeNodes).where(eq(edgeNodes.status, status)).execute();
  }
  return db.select().from(edgeNodes).execute();
}

/**
 * Get a single edge node by ID with recent events
 */
export async function getEdgeNodeWithEvents(
  nodeId: string,
  eventLimit = 10
): Promise<EdgeNodeWithEvents | null> {
  const [node] = await db
    .select()
    .from(edgeNodes)
    .where(eq(edgeNodes.id, nodeId))
    .limit(1)
    .execute();

  if (!node) return null;

  const events = await db
    .select()
    .from(edgeNodeEvents)
    .where(eq(edgeNodeEvents.nodeId, nodeId))
    .orderBy(desc(edgeNodeEvents.timestamp))
    .limit(eventLimit)
    .execute();

  return { ...node, events };
}

/**
 * Create a new edge node
 */
export async function createEdgeNode(data: NewEdgeNode): Promise<EdgeNode> {
  const [node] = await db.insert(edgeNodes).values(data).returning().execute();
  return node;
}

/**
 * Update edge node status and metrics
 */
export async function updateEdgeNodeStatus(
  nodeId: string,
  update: Partial<Pick<EdgeNode, 'status' | 'load' | 'latencyMs' | 'errorRate' | 'anomalyScore'>>
): Promise<EdgeNode | null> {
  const [currentNode] = await db
    .select()
    .from(edgeNodes)
    .where(eq(edgeNodes.id, nodeId))
    .limit(1)
    .execute();

  if (!currentNode) return null;

  // Log status change event if status changed
  if (update.status && update.status !== currentNode.status) {
    await logNodeEvent({
      nodeId,
      eventType: 'status_change',
      previousStatus: currentNode.status,
      newStatus: update.status,
      details: {
        reason: 'Status update',
        metrics: {
          load: update.load ?? currentNode.load,
          latencyMs: update.latencyMs ?? currentNode.latencyMs ?? 0,
          errorRate: update.errorRate ?? currentNode.errorRate ?? 0,
        },
      },
    });
  }

  const [updated] = await db
    .update(edgeNodes)
    .set({
      ...update,
      lastHealthCheck: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(edgeNodes.id, nodeId))
    .returning()
    .execute();

  return updated ?? null;
}

// ============================================================================
// HEALTH MONITORING
// ============================================================================

/**
 * Process a health check from an edge node
 */
export async function processHealthCheck(check: NodeHealthCheck): Promise<EdgeNode | null> {
  const [node] = await db
    .select()
    .from(edgeNodes)
    .where(eq(edgeNodes.id, check.nodeId))
    .limit(1)
    .execute();

  if (!node) return null;

  // Determine new status based on metrics
  let newStatus: NodeStatus = 'online';

  if (check.errorRate > 0.5 || check.latencyMs > 10000) {
    newStatus = 'denied';
  } else if (check.errorRate > 0.3 || check.latencyMs > 5000) {
    newStatus = 'limited';
  } else if (check.errorRate > 0.1 || check.latencyMs > 2000) {
    newStatus = 'degraded';
  } else if (check.errorRate > 0.05 || check.latencyMs > 1000) {
    newStatus = 'intermittent';
  }

  // Calculate anomaly score based on deviation from baseline
  const anomalyScore = calculateAnomalyScore(node, check);

  // Update node
  const updatedNode = await updateEdgeNodeStatus(check.nodeId, {
    status: newStatus,
    load: check.load,
    latencyMs: check.latencyMs,
    errorRate: check.errorRate,
    anomalyScore,
  });

  // Log anomaly if detected
  if (anomalyScore > 0.7) {
    await logNodeEvent({
      nodeId: check.nodeId,
      eventType: 'anomaly_detected',
      details: {
        reason: 'High anomaly score',
        metrics: {
          anomalyScore,
          latencyMs: check.latencyMs,
          errorRate: check.errorRate,
        },
      },
    });
  }

  return updatedNode;
}

/**
 * Calculate anomaly score based on deviation from normal behavior
 */
function calculateAnomalyScore(node: EdgeNode, check: NodeHealthCheck): number {
  const scores: number[] = [];

  // Latency deviation
  if (node.latencyMs) {
    const latencyDeviation = Math.abs(check.latencyMs - node.latencyMs) / Math.max(node.latencyMs, 1);
    scores.push(Math.min(latencyDeviation, 1));
  }

  // Error rate spike
  if (node.errorRate !== null) {
    const errorDeviation = Math.abs(check.errorRate - (node.errorRate ?? 0));
    scores.push(Math.min(errorDeviation * 2, 1));
  }

  // Load spike
  const loadDeviation = Math.abs(check.load - node.load) / 100;
  scores.push(loadDeviation);

  // Return average of scores
  if (scores.length === 0) return 0;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/**
 * Run health checks on all nodes (called by cron)
 */
export async function runHealthChecks(): Promise<{
  checked: number;
  failures: number;
  recoveries: number;
}> {
  const nodes = await getEdgeNodes();
  let failures = 0;
  let recoveries = 0;

  for (const node of nodes) {
    try {
      // In production, this would ping the actual endpoint
      // For now, we simulate based on last known state
      const isHealthy = await checkNodeHealth(node);

      if (!isHealthy && node.status === 'online') {
        failures++;
        await updateEdgeNodeStatus(node.id, { status: 'degraded' });
      } else if (isHealthy && node.status !== 'online') {
        recoveries++;
        await updateEdgeNodeStatus(node.id, { status: 'online' });
        await logNodeEvent({
          nodeId: node.id,
          eventType: 'recovery',
          previousStatus: node.status,
          newStatus: 'online',
          details: { reason: 'Health check passed' },
        });
      }
    } catch {
      // Node unreachable
      const newFailures = (node.consecutiveFailures ?? 0) + 1;
      await db
        .update(edgeNodes)
        .set({
          consecutiveFailures: newFailures,
          status: newFailures >= 3 ? 'offline' : 'degraded',
          updatedAt: new Date(),
        })
        .where(eq(edgeNodes.id, node.id))
        .execute();
      failures++;
    }
  }

  return { checked: nodes.length, failures, recoveries };
}

/**
 * Check if a node is healthy (placeholder for actual ping)
 */
async function checkNodeHealth(node: EdgeNode): Promise<boolean> {
  // In production, this would:
  // 1. Ping the node's endpoint
  // 2. Check response time
  // 3. Verify data freshness
  // For now, simulate based on error rate
  return (node.errorRate ?? 0) < 0.3;
}

// ============================================================================
// DDIL SIMULATION
// ============================================================================

/**
 * Simulate DDIL conditions for testing resilience
 */
export async function simulateDDIL(config: DDILSimulationConfig): Promise<{
  affectedNodes: string[];
  previousStates: Map<string, NodeStatus>;
}> {
  let nodesToAffect: EdgeNode[];

  if (config.targetNodes && config.targetNodes.length > 0) {
    nodesToAffect = await db
      .select()
      .from(edgeNodes)
      .where(sql`${edgeNodes.id} = ANY(${config.targetNodes})`)
      .execute();
  } else {
    nodesToAffect = await getEdgeNodes();
  }

  const previousStates = new Map<string, NodeStatus>();
  const affectedNodes: string[] = [];

  for (const node of nodesToAffect) {
    // Store previous state for rollback
    previousStates.set(node.id, node.status);
    affectedNodes.push(node.id);

    // Apply simulation status
    await updateEdgeNodeStatus(node.id, {
      status: config.scenario,
      errorRate: config.scenario === 'denied' ? 1 : config.intensity * 0.5,
      latencyMs: config.scenario === 'limited' ? 5000 : config.intensity * 3000,
    });

    // Log simulation event
    await logNodeEvent({
      nodeId: node.id,
      eventType: 'status_change',
      previousStatus: node.status,
      newStatus: config.scenario,
      details: {
        reason: 'DDIL simulation',
        triggeredBy: 'simulation',
      },
    });
  }

  // Schedule rollback after duration
  if (config.durationMs > 0) {
    setTimeout(async () => {
      for (const [nodeId, previousStatus] of previousStates) {
        await updateEdgeNodeStatus(nodeId, { status: previousStatus });
        await logNodeEvent({
          nodeId,
          eventType: 'recovery',
          previousStatus: config.scenario,
          newStatus: previousStatus,
          details: { reason: 'DDIL simulation ended' },
        });
      }
    }, config.durationMs);
  }

  return { affectedNodes, previousStates };
}

/**
 * End DDIL simulation and restore previous states
 */
export async function endDDILSimulation(
  previousStates: Map<string, NodeStatus>
): Promise<void> {
  for (const [nodeId, previousStatus] of previousStates) {
    const [node] = await db
      .select()
      .from(edgeNodes)
      .where(eq(edgeNodes.id, nodeId))
      .limit(1)
      .execute();

    if (node) {
      await updateEdgeNodeStatus(nodeId, { status: previousStatus });
      await logNodeEvent({
        nodeId,
        eventType: 'recovery',
        previousStatus: node.status,
        newStatus: previousStatus,
        details: { reason: 'DDIL simulation manually ended' },
      });
    }
  }
}

// ============================================================================
// EVENT LOGGING
// ============================================================================

/**
 * Log an edge node event
 */
export async function logNodeEvent(
  event: Omit<NewEdgeNodeEvent, 'id' | 'timestamp'>
): Promise<EdgeNodeEvent> {
  const [logged] = await db
    .insert(edgeNodeEvents)
    .values({
      ...event,
      timestamp: new Date(),
    })
    .returning()
    .execute();
  return logged;
}

/**
 * Get recent events across all nodes
 */
export async function getRecentEvents(
  limit = 50,
  since?: Date
): Promise<EdgeNodeEvent[]> {
  let query = db
    .select()
    .from(edgeNodeEvents)
    .orderBy(desc(edgeNodeEvents.timestamp))
    .limit(limit);

  if (since) {
    query = db
      .select()
      .from(edgeNodeEvents)
      .where(gte(edgeNodeEvents.timestamp, since))
      .orderBy(desc(edgeNodeEvents.timestamp))
      .limit(limit);
  }

  return query.execute();
}

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * Get edge network health summary
 */
export async function getNetworkHealthSummary(): Promise<{
  totalNodes: number;
  byStatus: Record<NodeStatus, number>;
  averageLoad: number;
  averageLatency: number;
  anomalyCount: number;
}> {
  const nodes = await getEdgeNodes();

  const byStatus: Record<NodeStatus, number> = {
    online: 0,
    degraded: 0,
    intermittent: 0,
    limited: 0,
    denied: 0,
    offline: 0,
  };

  let totalLoad = 0;
  let totalLatency = 0;
  let latencyCount = 0;
  let anomalyCount = 0;

  for (const node of nodes) {
    byStatus[node.status]++;
    totalLoad += node.load;

    if (node.latencyMs) {
      totalLatency += node.latencyMs;
      latencyCount++;
    }

    if ((node.anomalyScore ?? 0) > 0.7) {
      anomalyCount++;
    }
  }

  return {
    totalNodes: nodes.length,
    byStatus,
    averageLoad: nodes.length > 0 ? totalLoad / nodes.length : 0,
    averageLatency: latencyCount > 0 ? totalLatency / latencyCount : 0,
    anomalyCount,
  };
}

/**
 * Get nodes with anomalies
 */
export async function getAnomalousNodes(threshold = 0.7): Promise<EdgeNode[]> {
  return db
    .select()
    .from(edgeNodes)
    .where(gte(edgeNodes.anomalyScore, threshold))
    .execute();
}

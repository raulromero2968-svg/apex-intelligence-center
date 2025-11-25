/**
 * OODA Loop Analytics Service
 *
 * Implements decision cycle optimization (pack-ai-defense-001 §3.1).
 * Tracks latency across OODA phases:
 * - Observe: Data collection from market sources
 * - Orient: Data fusion and analysis (RAG, ML)
 * - Decide: Decision generation (AI recommendations)
 * - Act: Action execution (alerts, trades)
 *
 * Adapted for TCG market decisions:
 * - Price tracking → investment decisions
 * - Anomaly detection → manipulation alerts
 * - Portfolio optimization → rebalancing actions
 *
 * @see pack-ai-defense-001 for OODA loop theory
 */

import { db } from '@/lib/db';
import { eq, desc, gte, lte, and, sql, avg, count } from 'drizzle-orm';
import {
  oodaMetrics,
  type OodaMetric,
  type NewOodaMetric,
} from '@/db/schema/defense';

// ============================================================================
// TYPES
// ============================================================================

export type OodaPhase = 'observe' | 'orient' | 'decide' | 'act';
export type ProcessingType = 'edge' | 'central' | 'hybrid';

export interface OodaMeasurement {
  userId?: string;
  sessionId?: string;
  pipelineId: string;
  processingType: ProcessingType;
  phases: {
    observe: number; // ms
    orient: number;
    decide: number;
    act: number;
  };
  metadata?: {
    dataSourceCount?: number;
    dataPointsProcessed?: number;
    modelUsed?: string;
    actionTaken?: string;
    outcome?: string;
  };
}

export interface BottleneckAnalysis {
  bottleneckPhase: OodaPhase;
  averageLatency: number;
  percentageOfTotal: number;
  recommendations: string[];
}

export interface OodaSummary {
  totalMeasurements: number;
  averageTotal: number;
  averageByPhase: Record<OodaPhase, number>;
  bottleneck: OodaPhase;
  byProcessingType: Record<ProcessingType, {
    count: number;
    averageTotal: number;
  }>;
}

// ============================================================================
// MEASUREMENT RECORDING
// ============================================================================

/**
 * Record an OODA loop measurement
 */
export async function recordOodaMeasurement(
  measurement: OodaMeasurement
): Promise<OodaMetric> {
  const total =
    measurement.phases.observe +
    measurement.phases.orient +
    measurement.phases.decide +
    measurement.phases.act;

  // Determine bottleneck phase
  const phases = measurement.phases;
  let bottleneck: OodaPhase = 'observe';
  let maxLatency = phases.observe;

  if (phases.orient > maxLatency) {
    bottleneck = 'orient';
    maxLatency = phases.orient;
  }
  if (phases.decide > maxLatency) {
    bottleneck = 'decide';
    maxLatency = phases.decide;
  }
  if (phases.act > maxLatency) {
    bottleneck = 'act';
  }

  const [metric] = await db
    .insert(oodaMetrics)
    .values({
      userId: measurement.userId,
      sessionId: measurement.sessionId,
      pipelineId: measurement.pipelineId,
      processingType: measurement.processingType,
      observeLatencyMs: measurement.phases.observe,
      orientLatencyMs: measurement.phases.orient,
      decideLatencyMs: measurement.phases.decide,
      actLatencyMs: measurement.phases.act,
      totalLatencyMs: total,
      bottleneckPhase: bottleneck,
      metadata: measurement.metadata ?? {},
      timestamp: new Date(),
    })
    .returning()
    .execute();

  return metric;
}

/**
 * Create a measurement tracker for timing OODA phases
 */
export function createOodaTracker(pipelineId: string, processingType: ProcessingType = 'central') {
  const timings: Partial<Record<OodaPhase, { start: number; end?: number }>> = {};
  let currentPhase: OodaPhase | null = null;

  return {
    startPhase(phase: OodaPhase) {
      if (currentPhase && timings[currentPhase]) {
        timings[currentPhase]!.end = Date.now();
      }
      currentPhase = phase;
      timings[phase] = { start: Date.now() };
    },

    endPhase(phase: OodaPhase) {
      if (timings[phase]) {
        timings[phase]!.end = Date.now();
      }
      if (currentPhase === phase) {
        currentPhase = null;
      }
    },

    async record(options?: {
      userId?: string;
      sessionId?: string;
      metadata?: OodaMeasurement['metadata'];
    }): Promise<OodaMetric> {
      // End any ongoing phase
      if (currentPhase && timings[currentPhase]) {
        timings[currentPhase]!.end = Date.now();
      }

      const phases = {
        observe: timings.observe ? (timings.observe.end ?? Date.now()) - timings.observe.start : 0,
        orient: timings.orient ? (timings.orient.end ?? Date.now()) - timings.orient.start : 0,
        decide: timings.decide ? (timings.decide.end ?? Date.now()) - timings.decide.start : 0,
        act: timings.act ? (timings.act.end ?? Date.now()) - timings.act.start : 0,
      };

      return recordOodaMeasurement({
        pipelineId,
        processingType,
        phases,
        userId: options?.userId,
        sessionId: options?.sessionId,
        metadata: options?.metadata,
      });
    },
  };
}

// ============================================================================
// ANALYSIS
// ============================================================================

/**
 * Get OODA metrics for a time range
 */
export async function getOodaMetrics(options: {
  userId?: string;
  pipelineId?: string;
  processingType?: ProcessingType;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): Promise<OodaMetric[]> {
  const conditions = [];

  if (options.userId) {
    conditions.push(eq(oodaMetrics.userId, options.userId));
  }
  if (options.pipelineId) {
    conditions.push(eq(oodaMetrics.pipelineId, options.pipelineId));
  }
  if (options.processingType) {
    conditions.push(eq(oodaMetrics.processingType, options.processingType));
  }
  if (options.startDate) {
    conditions.push(gte(oodaMetrics.timestamp, options.startDate));
  }
  if (options.endDate) {
    conditions.push(lte(oodaMetrics.timestamp, options.endDate));
  }

  let query = db
    .select()
    .from(oodaMetrics)
    .orderBy(desc(oodaMetrics.timestamp))
    .limit(options.limit ?? 100);

  if (conditions.length > 0) {
    query = db
      .select()
      .from(oodaMetrics)
      .where(and(...conditions))
      .orderBy(desc(oodaMetrics.timestamp))
      .limit(options.limit ?? 100);
  }

  return query.execute();
}

/**
 * Analyze bottlenecks in OODA loop
 */
export async function analyzeBottlenecks(options: {
  pipelineId?: string;
  processingType?: ProcessingType;
  days?: number;
}): Promise<BottleneckAnalysis> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (options.days ?? 7));

  const metrics = await getOodaMetrics({
    pipelineId: options.pipelineId,
    processingType: options.processingType,
    startDate,
    limit: 1000,
  });

  if (metrics.length === 0) {
    return {
      bottleneckPhase: 'observe',
      averageLatency: 0,
      percentageOfTotal: 0,
      recommendations: ['No data available for analysis'],
    };
  }

  // Calculate averages
  const totals = {
    observe: 0,
    orient: 0,
    decide: 0,
    act: 0,
    total: 0,
  };

  for (const m of metrics) {
    totals.observe += m.observeLatencyMs;
    totals.orient += m.orientLatencyMs;
    totals.decide += m.decideLatencyMs;
    totals.act += m.actLatencyMs;
    totals.total += m.totalLatencyMs;
  }

  const averages = {
    observe: totals.observe / metrics.length,
    orient: totals.orient / metrics.length,
    decide: totals.decide / metrics.length,
    act: totals.act / metrics.length,
    total: totals.total / metrics.length,
  };

  // Find bottleneck
  let bottleneck: OodaPhase = 'observe';
  let maxAvg = averages.observe;

  if (averages.orient > maxAvg) {
    bottleneck = 'orient';
    maxAvg = averages.orient;
  }
  if (averages.decide > maxAvg) {
    bottleneck = 'decide';
    maxAvg = averages.decide;
  }
  if (averages.act > maxAvg) {
    bottleneck = 'act';
    maxAvg = averages.act;
  }

  const percentageOfTotal = averages.total > 0 ? (maxAvg / averages.total) * 100 : 0;

  // Generate recommendations
  const recommendations = generateRecommendations(bottleneck, averages, options.processingType);

  return {
    bottleneckPhase: bottleneck,
    averageLatency: maxAvg,
    percentageOfTotal,
    recommendations,
  };
}

/**
 * Generate optimization recommendations based on bottleneck analysis
 */
function generateRecommendations(
  bottleneck: OodaPhase,
  averages: Record<OodaPhase | 'total', number>,
  processingType?: ProcessingType
): string[] {
  const recommendations: string[] = [];

  switch (bottleneck) {
    case 'observe':
      recommendations.push('Add edge caching for frequently accessed data sources');
      recommendations.push('Implement parallel data fetching across sources');
      if (processingType === 'central') {
        recommendations.push('Consider edge processing to reduce data collection latency');
      }
      if (averages.observe > 1000) {
        recommendations.push('Review API rate limits and consider batching requests');
      }
      break;

    case 'orient':
      recommendations.push('Optimize RAG query pipeline with better indexing');
      recommendations.push('Implement incremental data fusion instead of full recomputation');
      if (averages.orient > 2000) {
        recommendations.push('Consider pre-computing common analysis patterns');
        recommendations.push('Review embedding model performance - consider smaller models');
      }
      break;

    case 'decide':
      recommendations.push('Cache frequent decision patterns');
      recommendations.push('Use lighter ML models for common scenarios');
      if (averages.decide > 1500) {
        recommendations.push('Implement decision tree shortcuts for obvious cases');
        recommendations.push('Review LLM token usage and prompt efficiency');
      }
      break;

    case 'act':
      recommendations.push('Batch non-urgent actions');
      recommendations.push('Implement async action execution with callbacks');
      if (averages.act > 500) {
        recommendations.push('Review notification delivery pipeline');
        recommendations.push('Consider queue-based action processing');
      }
      break;
  }

  // Processing type specific recommendations
  if (processingType === 'central' && averages.total > 3000) {
    recommendations.push('Consider hybrid processing to offload to edge nodes');
  }
  if (processingType === 'edge' && averages.orient > averages.observe * 2) {
    recommendations.push('Edge nodes may lack resources for complex analysis - consider hybrid approach');
  }

  return recommendations;
}

/**
 * Get OODA summary statistics
 */
export async function getOodaSummary(options: {
  pipelineId?: string;
  days?: number;
}): Promise<OodaSummary> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (options.days ?? 7));

  const metrics = await getOodaMetrics({
    pipelineId: options.pipelineId,
    startDate,
    limit: 10000,
  });

  if (metrics.length === 0) {
    return {
      totalMeasurements: 0,
      averageTotal: 0,
      averageByPhase: { observe: 0, orient: 0, decide: 0, act: 0 },
      bottleneck: 'observe',
      byProcessingType: {
        edge: { count: 0, averageTotal: 0 },
        central: { count: 0, averageTotal: 0 },
        hybrid: { count: 0, averageTotal: 0 },
      },
    };
  }

  // Calculate totals
  const totals = {
    observe: 0,
    orient: 0,
    decide: 0,
    act: 0,
    total: 0,
  };

  const byType: Record<ProcessingType, { count: number; total: number }> = {
    edge: { count: 0, total: 0 },
    central: { count: 0, total: 0 },
    hybrid: { count: 0, total: 0 },
  };

  for (const m of metrics) {
    totals.observe += m.observeLatencyMs;
    totals.orient += m.orientLatencyMs;
    totals.decide += m.decideLatencyMs;
    totals.act += m.actLatencyMs;
    totals.total += m.totalLatencyMs;

    byType[m.processingType].count++;
    byType[m.processingType].total += m.totalLatencyMs;
  }

  const n = metrics.length;
  const averageByPhase = {
    observe: totals.observe / n,
    orient: totals.orient / n,
    decide: totals.decide / n,
    act: totals.act / n,
  };

  // Find bottleneck
  let bottleneck: OodaPhase = 'observe';
  let maxAvg = averageByPhase.observe;
  for (const phase of ['orient', 'decide', 'act'] as OodaPhase[]) {
    if (averageByPhase[phase] > maxAvg) {
      bottleneck = phase;
      maxAvg = averageByPhase[phase];
    }
  }

  return {
    totalMeasurements: n,
    averageTotal: totals.total / n,
    averageByPhase,
    bottleneck,
    byProcessingType: {
      edge: {
        count: byType.edge.count,
        averageTotal: byType.edge.count > 0 ? byType.edge.total / byType.edge.count : 0,
      },
      central: {
        count: byType.central.count,
        averageTotal: byType.central.count > 0 ? byType.central.total / byType.central.count : 0,
      },
      hybrid: {
        count: byType.hybrid.count,
        averageTotal: byType.hybrid.count > 0 ? byType.hybrid.total / byType.hybrid.count : 0,
      },
    },
  };
}

// ============================================================================
// COMPARISON
// ============================================================================

/**
 * Compare OODA performance between edge and central processing
 */
export async function compareProcessingTypes(options: {
  pipelineId?: string;
  days?: number;
}): Promise<{
  edge: { averageTotal: number; count: number };
  central: { averageTotal: number; count: number };
  recommendation: string;
  improvementPotential: number; // percentage
}> {
  const summary = await getOodaSummary(options);

  const edge = summary.byProcessingType.edge;
  const central = summary.byProcessingType.central;

  let recommendation: string;
  let improvementPotential: number;

  if (edge.count === 0 && central.count === 0) {
    recommendation = 'No data available for comparison';
    improvementPotential = 0;
  } else if (edge.count === 0) {
    recommendation = 'Consider implementing edge processing for potential latency reduction';
    improvementPotential = 30; // Estimated
  } else if (central.count === 0) {
    recommendation = 'Edge-only processing in use. Consider central for complex analysis.';
    improvementPotential = 0;
  } else if (edge.averageTotal < central.averageTotal) {
    const improvement = ((central.averageTotal - edge.averageTotal) / central.averageTotal) * 100;
    recommendation = `Edge processing is ${improvement.toFixed(1)}% faster. Increase edge utilization.`;
    improvementPotential = improvement;
  } else {
    const improvement = ((edge.averageTotal - central.averageTotal) / edge.averageTotal) * 100;
    recommendation = `Central processing is ${improvement.toFixed(1)}% faster for this workload.`;
    improvementPotential = 0;
  }

  return {
    edge,
    central,
    recommendation,
    improvementPotential,
  };
}

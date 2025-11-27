/**
 * Shadow Mode Testing Harness
 * 
 * Allows running new model/service versions in shadow mode alongside production.
 * For a selected percentage of jobs, duplicates the job envelope and sends to
 * shadow endpoints, then compares results and logs discrepancies.
 */

import { QueuedJobEnvelope, VarcJobPayload, LampJobPayload, VarcResultPayload, LampSimulationUpdatePayload } from '@apex/shared/src/contracts/queues';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { pgTable, text, timestamp, uuid, jsonb, integer, real } from 'drizzle-orm/pg-core';
import { eq } from 'drizzle-orm';

const SHADOW_MODE_PERCENT = parseInt(process.env.SHADOW_MODE_PERCENT || '0', 10);
const VARC_SERVICE_URL_SHADOW = process.env.VARC_SERVICE_URL_SHADOW;
const LAMP_SERVICE_URL_SHADOW = process.env.LAMP_SERVICE_URL_SHADOW;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const db = drizzle(pool);

export const shadowComparisonTable = pgTable('shadow_comparisons', {
  id: uuid('id').defaultRandom().primaryKey(),
  jobId: text('job_id').notNull(),
  traceId: text('trace_id').notNull(),
  serviceType: text('service_type').notNull(), // 'varc' or 'lamp'
  primaryResult: jsonb('primary_result').notNull(),
  shadowResult: jsonb('shadow_result').notNull(),
  discrepancies: jsonb('discrepancies'),
  metrics: jsonb('metrics'), // responseTime, gradeDiff, pnlDiff, etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Determine if a job should be shadowed based on configured percentage
 */
function shouldShadowJob(jobId: string): boolean {
  if (SHADOW_MODE_PERCENT <= 0) {
    return false;
  }
  if (SHADOW_MODE_PERCENT >= 100) {
    return true;
  }
  const hash = hashString(jobId);
  return (hash % 100) < SHADOW_MODE_PERCENT;
}

/**
 * Simple hash function for consistent job selection
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Compare VARC results and identify discrepancies
 */
function compareVarcResults(primary: VarcResultPayload, shadow: VarcResultPayload): {
  discrepancies: Array<{ field: string; primary: unknown; shadow: unknown; diff?: number }>;
  metrics: { gradeDiff?: number; confidenceDiff?: number; responseTimeDiff?: number };
} {
  const discrepancies: Array<{ field: string; primary: unknown; shadow: unknown; diff?: number }> = [];
  const metrics: { gradeDiff?: number; confidenceDiff?: number; responseTimeDiff?: number } = {};

  if (primary.status !== shadow.status) {
    discrepancies.push({
      field: 'status',
      primary: primary.status,
      shadow: shadow.status,
    });
  }

  if (primary.status === 'completed' && shadow.status === 'completed') {
    const primaryGrade = primary.result?.grade;
    const shadowGrade = shadow.result?.grade;

    if (primaryGrade !== shadowGrade) {
      discrepancies.push({
        field: 'grade',
        primary: primaryGrade,
        shadow: shadowGrade,
      });
      
      if (typeof primaryGrade === 'number' && typeof shadowGrade === 'number') {
        metrics.gradeDiff = Math.abs(primaryGrade - shadowGrade);
      }
    }

    const primaryConfidence = primary.result?.confidence;
    const shadowConfidence = shadow.result?.confidence;

    if (primaryConfidence !== shadowConfidence) {
      discrepancies.push({
        field: 'confidence',
        primary: primaryConfidence,
        shadow: shadowConfidence,
      });

      if (typeof primaryConfidence === 'number' && typeof shadowConfidence === 'number') {
        metrics.confidenceDiff = Math.abs(primaryConfidence - shadowConfidence);
      }
    }

    const primaryResponseTime = primary.result?.responseTimeMs;
    const shadowResponseTime = shadow.result?.responseTimeMs;

    if (primaryResponseTime && shadowResponseTime) {
      metrics.responseTimeDiff = Math.abs(primaryResponseTime - shadowResponseTime);
    }
  }

  return { discrepancies, metrics };
}

/**
 * Compare LAMP simulation results
 */
function compareLampResults(
  primary: LampSimulationUpdatePayload,
  shadow: LampSimulationUpdatePayload
): {
  discrepancies: Array<{ field: string; primary: unknown; shadow: unknown; diff?: number }>;
  metrics: { pnlDiff?: number; decisionDiff?: number; progressDiff?: number };
} {
  const discrepancies: Array<{ field: string; primary: unknown; shadow: unknown; diff?: number }> = [];
  const metrics: { pnlDiff?: number; decisionDiff?: number; progressDiff?: number } = {};

  if (primary.status !== shadow.status) {
    discrepancies.push({
      field: 'status',
      primary: primary.status,
      shadow: shadow.status,
    });
  }

  if (primary.progress !== shadow.progress) {
    discrepancies.push({
      field: 'progress',
      primary: primary.progress,
      shadow: shadow.progress,
    });
    metrics.progressDiff = Math.abs((primary.progress || 0) - (shadow.progress || 0));
  }

  if (primary.status === 'completed' && shadow.status === 'completed' && primary.result && shadow.result) {
    const primaryPnL = primary.result.pnl;
    const shadowPnL = shadow.result.pnl;

    if (primaryPnL !== shadowPnL) {
      discrepancies.push({
        field: 'pnl',
        primary: primaryPnL,
        shadow: shadowPnL,
      });

      if (typeof primaryPnL === 'number' && typeof shadowPnL === 'number') {
        metrics.pnlDiff = Math.abs(primaryPnL - shadowPnL);
      }
    }

    const primaryDecision = primary.result.decision;
    const shadowDecision = shadow.result.decision;

    if (JSON.stringify(primaryDecision) !== JSON.stringify(shadowDecision)) {
      discrepancies.push({
        field: 'decision',
        primary: primaryDecision,
        shadow: shadowDecision,
      });
      metrics.decisionDiff = 1;
    }
  }

  return { discrepancies, metrics };
}

/**
 * Run VARC job in shadow mode
 */
export async function runVarcShadow(
  envelope: QueuedJobEnvelope<VarcJobPayload>,
  primaryResult: VarcResultPayload
): Promise<void> {
  if (!VARC_SERVICE_URL_SHADOW || !shouldShadowJob(envelope.jobId)) {
    return;
  }

  try {
    const shadowStartTime = Date.now();
    const response = await fetch(`${VARC_SERVICE_URL_SHADOW}/infer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(envelope),
    });

    if (!response.ok) {
      throw new Error(`Shadow VARC service error: ${response.status}`);
    }

    const shadowResult: VarcResultPayload = await response.json();
    const shadowResponseTime = Date.now() - shadowStartTime;

    const { discrepancies, metrics } = compareVarcResults(primaryResult, shadowResult);

    await db.insert(shadowComparisonTable).values({
      jobId: envelope.jobId,
      traceId: envelope.traceId,
      serviceType: 'varc',
      primaryResult: primaryResult as any,
      shadowResult: shadowResult as any,
      discrepancies: discrepancies.length > 0 ? discrepancies : null,
      metrics: {
        ...metrics,
        primaryResponseTimeMs: primaryResult.result?.responseTimeMs,
        shadowResponseTimeMs: shadowResponseTime,
      },
    });
  } catch (error) {
    console.error('[shadow] VARC shadow execution failed:', error);
    await db.insert(shadowComparisonTable).values({
      jobId: envelope.jobId,
      traceId: envelope.traceId,
      serviceType: 'varc',
      primaryResult: primaryResult as any,
      shadowResult: { status: 'error', error: { message: error instanceof Error ? error.message : 'Unknown error' } },
      discrepancies: [{ field: 'shadow_execution_error', primary: 'success', shadow: 'error' }],
    });
  }
}

/**
 * Run LAMP job in shadow mode
 */
export async function runLampShadow(
  envelope: QueuedJobEnvelope<LampJobPayload>,
  primaryUpdates: LampSimulationUpdatePayload[]
): Promise<void> {
  if (!LAMP_SERVICE_URL_SHADOW || !shouldShadowJob(envelope.jobId)) {
    return;
  }

  try {
    const shadowStartTime = Date.now();
    const response = await fetch(`${LAMP_SERVICE_URL_SHADOW}/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(envelope),
    });

    if (!response.ok) {
      throw new Error(`Shadow LAMP service error: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('Shadow LAMP service returned no response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const shadowUpdates: LampSimulationUpdatePayload[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter((line) => line.trim());

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            shadowUpdates.push({
              simulationId: data.simulationId || envelope.payload.scenarioId,
              status: data.status || 'running',
              progress: data.progress,
              result: data.result,
              updatedAt: new Date().toISOString(),
            });
          } catch (parseError) {
            console.error('[shadow] Failed to parse SSE chunk:', parseError);
          }
        }
      }
    }

    const shadowResponseTime = Date.now() - shadowStartTime;
    const finalPrimary = primaryUpdates[primaryUpdates.length - 1];
    const finalShadow = shadowUpdates[shadowUpdates.length - 1] || {
      simulationId: envelope.payload.scenarioId,
      status: 'error' as const,
      updatedAt: new Date().toISOString(),
    };

    const { discrepancies, metrics } = compareLampResults(finalPrimary, finalShadow);

    await db.insert(shadowComparisonTable).values({
      jobId: envelope.jobId,
      traceId: envelope.traceId,
      serviceType: 'lamp',
      primaryResult: finalPrimary as any,
      shadowResult: finalShadow as any,
      discrepancies: discrepancies.length > 0 ? discrepancies : null,
      metrics: {
        ...metrics,
        primaryUpdatesCount: primaryUpdates.length,
        shadowUpdatesCount: shadowUpdates.length,
        primaryResponseTimeMs: shadowResponseTime,
        shadowResponseTimeMs: shadowResponseTime,
      },
    });
  } catch (error) {
    console.error('[shadow] LAMP shadow execution failed:', error);
    const finalPrimary = primaryUpdates[primaryUpdates.length - 1] || {
      simulationId: envelope.payload.scenarioId,
      status: 'error' as const,
      updatedAt: new Date().toISOString(),
    };
    await db.insert(shadowComparisonTable).values({
      jobId: envelope.jobId,
      traceId: envelope.traceId,
      serviceType: 'lamp',
      primaryResult: finalPrimary as any,
      shadowResult: { status: 'error', error: { message: error instanceof Error ? error.message : 'Unknown error' } },
      discrepancies: [{ field: 'shadow_execution_error', primary: 'success', shadow: 'error' }],
    });
  }
}


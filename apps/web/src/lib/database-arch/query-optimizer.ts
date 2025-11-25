/**
 * Query Optimizer Service
 *
 * Implements knowledge-09-database-architecture query analysis.
 * Analyzes queries, suggests indexes, and tracks performance.
 *
 * Features:
 * - EXPLAIN plan analysis
 * - Index recommendations
 * - Slow query detection
 * - Query normalization
 *
 * @see knowledge-09-database-architecture for architecture details
 */

import { db } from '@/lib/db';
import { eq, desc, and, sql } from 'drizzle-orm';
import {
  queryAnalytics,
  type QueryAnalytic,
  type NewQueryAnalytic,
} from '@/db/schema/database-arch';
import crypto from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface ExplainPlan {
  planningTime: number;
  executionTime: number;
  totalCost: number;
  nodeType: string;
  scanType?: string;
  indexUsed?: string;
  rowsEstimated: number;
  rowsActual: number;
  loops: number;
  children?: ExplainPlan[];
}

export interface QuerySuggestion {
  type: 'add_index' | 'rewrite_query' | 'add_limit' | 'use_materialized_view';
  description: string;
  impact: 'low' | 'medium' | 'high';
  implementation?: string;
}

export interface QueryAnalysis {
  queryHash: string;
  normalizedQuery: string;
  explainPlan: ExplainPlan;
  suggestions: QuerySuggestion[];
  isSlowQuery: boolean;
  estimatedImprovement?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const SLOW_QUERY_THRESHOLD_MS = 100;

export const SCAN_TYPE_SEVERITY: Record<string, 'good' | 'warning' | 'poor'> = {
  'Index Scan': 'good',
  'Index Only Scan': 'good',
  'Bitmap Index Scan': 'good',
  'Seq Scan': 'warning', // OK for small tables
  'Full Table Scan': 'poor',
};

// ============================================================================
// QUERY ANALYSIS
// ============================================================================

/**
 * Generate hash for query normalization
 */
export function hashQuery(query: string): string {
  const normalized = normalizeQuery(query);
  return crypto.createHash('md5').update(normalized).digest('hex');
}

/**
 * Normalize query by removing literals
 */
export function normalizeQuery(query: string): string {
  return query
    .replace(/\s+/g, ' ')
    .replace(/'[^']*'/g, '?')
    .replace(/"[^"]*"/g, '?')
    .replace(/\b\d+\b/g, '?')
    .trim()
    .toLowerCase();
}

/**
 * Parse EXPLAIN ANALYZE output
 */
export function parseExplainOutput(explainResult: Record<string, unknown>[]): ExplainPlan {
  // Simplified parsing - real implementation would parse full JSON
  const plan = explainResult[0] as Record<string, unknown>;

  return {
    planningTime: (plan['Planning Time'] as number) ?? 0,
    executionTime: (plan['Execution Time'] as number) ?? 0,
    totalCost: (plan['Total Cost'] as number) ?? 0,
    nodeType: (plan['Node Type'] as string) ?? 'Unknown',
    scanType: plan['Node Type'] as string,
    indexUsed: plan['Index Name'] as string | undefined,
    rowsEstimated: (plan['Plan Rows'] as number) ?? 0,
    rowsActual: (plan['Actual Rows'] as number) ?? 0,
    loops: (plan['Actual Loops'] as number) ?? 1,
  };
}

/**
 * Analyze query and generate suggestions
 */
export function analyzeQuery(
  query: string,
  explainPlan: ExplainPlan,
  tables: string[]
): QueryAnalysis {
  const queryHash = hashQuery(query);
  const normalizedQuery = normalizeQuery(query);
  const suggestions: QuerySuggestion[] = [];
  const totalTime = explainPlan.planningTime + explainPlan.executionTime;
  const isSlowQuery = totalTime > SLOW_QUERY_THRESHOLD_MS;

  // Check for sequential scans
  if (explainPlan.scanType === 'Seq Scan' && explainPlan.rowsActual > 1000) {
    suggestions.push({
      type: 'add_index',
      description: `Sequential scan on large table (${explainPlan.rowsActual} rows). Consider adding an index.`,
      impact: 'high',
      implementation: `-- Analyze WHERE clause columns
CREATE INDEX idx_${tables[0]}_column ON ${tables[0]} (column_name);`,
    });
  }

  // Check for missing LIMIT
  if (!query.toLowerCase().includes('limit') && explainPlan.rowsActual > 100) {
    suggestions.push({
      type: 'add_limit',
      description: 'Query returns many rows without LIMIT. Consider pagination.',
      impact: 'medium',
      implementation: `-- Add pagination
SELECT * FROM ${tables[0]}
ORDER BY id
LIMIT 50 OFFSET 0;`,
    });
  }

  // Check for high cost
  if (explainPlan.totalCost > 10000) {
    suggestions.push({
      type: 'rewrite_query',
      description: 'High query cost. Consider query restructuring or caching.',
      impact: 'high',
    });
  }

  // Check for repeated expensive queries
  if (isSlowQuery) {
    suggestions.push({
      type: 'use_materialized_view',
      description: 'Slow query - consider caching with materialized view.',
      impact: 'high',
      implementation: `CREATE MATERIALIZED VIEW mv_${tables[0]}_summary AS
SELECT ...
WITH DATA;

-- Refresh periodically
REFRESH MATERIALIZED VIEW mv_${tables[0]}_summary;`,
    });
  }

  return {
    queryHash,
    normalizedQuery,
    explainPlan,
    suggestions,
    isSlowQuery,
    estimatedImprovement: suggestions.length > 0 ? 30 + suggestions.length * 20 : 0,
  };
}

// ============================================================================
// ANALYTICS TRACKING
// ============================================================================

/**
 * Record query execution
 */
export async function recordQueryExecution(
  data: Omit<NewQueryAnalytic, 'id' | 'firstSeen' | 'lastSeen'>
): Promise<QueryAnalytic> {
  const existing = await db
    .select()
    .from(queryAnalytics)
    .where(eq(queryAnalytics.queryHash, data.queryHash))
    .execute();

  if (existing.length > 0) {
    // Update existing record
    const prev = existing[0];
    const newCount = (prev.executionCount ?? 0) + 1;
    const newTotalTime = (prev.totalTimeMs ?? 0) + (data.totalTimeMs ?? 0);

    const [updated] = await db
      .update(queryAnalytics)
      .set({
        executionCount: newCount,
        totalTimeMs: newTotalTime,
        avgTimeMs: newTotalTime / newCount,
        minTimeMs: Math.min(prev.minTimeMs ?? Infinity, data.minTimeMs ?? Infinity),
        maxTimeMs: Math.max(prev.maxTimeMs ?? 0, data.maxTimeMs ?? 0),
        totalRowsReturned: (prev.totalRowsReturned ?? 0) + (data.totalRowsReturned ?? 0),
        avgRowsReturned:
          ((prev.totalRowsReturned ?? 0) + (data.totalRowsReturned ?? 0)) / newCount,
        lastSeen: new Date(),
        explainPlan: data.explainPlan ?? prev.explainPlan,
        suggestions: data.suggestions ?? prev.suggestions,
        isSlowQuery: data.isSlowQuery ?? prev.isSlowQuery,
      })
      .where(eq(queryAnalytics.id, prev.id))
      .returning();

    return updated;
  }

  // Create new record
  const [created] = await db
    .insert(queryAnalytics)
    .values({
      ...data,
      executionCount: 1,
      avgTimeMs: data.totalTimeMs,
      avgRowsReturned: data.totalRowsReturned,
    })
    .returning();

  return created;
}

/**
 * Get slow queries
 */
export async function getSlowQueries(
  options: {
    projectId?: string;
    thresholdMs?: number;
    limit?: number;
  } = {}
): Promise<QueryAnalytic[]> {
  const { projectId, thresholdMs = SLOW_QUERY_THRESHOLD_MS, limit = 50 } = options;

  const conditions = [eq(queryAnalytics.isSlowQuery, true)];

  if (projectId) {
    conditions.push(eq(queryAnalytics.projectId, projectId));
  }

  return db
    .select()
    .from(queryAnalytics)
    .where(and(...conditions))
    .orderBy(desc(queryAnalytics.avgTimeMs))
    .limit(limit)
    .execute();
}

/**
 * Get most executed queries
 */
export async function getMostExecutedQueries(
  options: {
    projectId?: string;
    limit?: number;
  } = {}
): Promise<QueryAnalytic[]> {
  const { projectId, limit = 50 } = options;

  const conditions = [];

  if (projectId) {
    conditions.push(eq(queryAnalytics.projectId, projectId));
  }

  return db
    .select()
    .from(queryAnalytics)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(queryAnalytics.executionCount))
    .limit(limit)
    .execute();
}

// ============================================================================
// INDEX RECOMMENDATIONS
// ============================================================================

export interface IndexRecommendation {
  tableName: string;
  columns: string[];
  type: 'btree' | 'hash' | 'gin' | 'gist';
  reason: string;
  createStatement: string;
  estimatedImpact: 'low' | 'medium' | 'high';
}

/**
 * Generate index recommendations from slow queries
 */
export function generateIndexRecommendations(
  queries: QueryAnalytic[]
): IndexRecommendation[] {
  const recommendations: IndexRecommendation[] = [];
  const seenIndexes = new Set<string>();

  for (const query of queries) {
    const suggestions = query.suggestions as QuerySuggestion[] | null;
    if (!suggestions) continue;

    for (const suggestion of suggestions) {
      if (suggestion.type !== 'add_index') continue;

      const tables = query.sourceTables as string[] | null;
      if (!tables || tables.length === 0) continue;

      const tableName = tables[0];
      const indexKey = `${tableName}`;

      if (seenIndexes.has(indexKey)) continue;
      seenIndexes.add(indexKey);

      recommendations.push({
        tableName,
        columns: ['id'], // Would need query parsing to determine actual columns
        type: 'btree',
        reason: `Slow query (${query.avgTimeMs?.toFixed(1)}ms avg) uses sequential scan`,
        createStatement: `CREATE INDEX CONCURRENTLY idx_${tableName}_optimize
  ON ${tableName} (column_name);`,
        estimatedImpact: (query.avgTimeMs ?? 0) > 500 ? 'high' : 'medium',
      });
    }
  }

  return recommendations;
}

/**
 * Generate optimized Drizzle query
 */
export function generateOptimizedDrizzleQuery(
  tableName: string,
  operation: 'select' | 'insert' | 'update' | 'delete',
  options: {
    columns?: string[];
    where?: string;
    orderBy?: string;
    limit?: number;
  } = {}
): string {
  const { columns, where, orderBy, limit } = options;

  let code = `import { db } from '@/lib/db';\n`;
  code += `import { ${tableName}, eq, desc } from '@/db/schema';\n\n`;

  switch (operation) {
    case 'select':
      code += `const result = await db\n`;
      code += `  .select(${columns ? `{ ${columns.join(', ')} }` : ''})\n`;
      code += `  .from(${tableName})\n`;
      if (where) code += `  .where(${where})\n`;
      if (orderBy) code += `  .orderBy(${orderBy})\n`;
      if (limit) code += `  .limit(${limit})\n`;
      code += `  .execute();`;
      break;
    case 'insert':
      code += `const [inserted] = await db\n`;
      code += `  .insert(${tableName})\n`;
      code += `  .values(data)\n`;
      code += `  .returning();`;
      break;
    case 'update':
      code += `const [updated] = await db\n`;
      code += `  .update(${tableName})\n`;
      code += `  .set(updates)\n`;
      if (where) code += `  .where(${where})\n`;
      code += `  .returning();`;
      break;
    case 'delete':
      code += `const deleted = await db\n`;
      code += `  .delete(${tableName})\n`;
      if (where) code += `  .where(${where})\n`;
      code += `  .returning();`;
      break;
  }

  return code;
}

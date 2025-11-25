/**
 * Query Analytics API Routes
 *
 * Endpoints for query analysis and optimization.
 * Implements knowledge-09-database-architecture API layer.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  analyzeQuery,
  parseExplainOutput,
  recordQueryExecution,
  getSlowQueries,
  getMostExecutedQueries,
  generateIndexRecommendations,
  generateOptimizedDrizzleQuery,
  SLOW_QUERY_THRESHOLD_MS,
} from '@/lib/database-arch';

/**
 * POST /api/database-arch/query
 * Analyze a query or record execution metrics
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, projectId, query, explainOutput, tables, executionData } = body;

    switch (action) {
      case 'analyze': {
        if (!query || !explainOutput) {
          return NextResponse.json(
            { error: 'Missing required fields: query, explainOutput' },
            { status: 400 }
          );
        }

        const explainPlan = parseExplainOutput(explainOutput);
        const analysis = analyzeQuery(query, explainPlan, tables ?? []);

        return NextResponse.json({
          success: true,
          analysis,
          explainPlan,
        });
      }

      case 'record': {
        if (!projectId || !executionData) {
          return NextResponse.json(
            { error: 'Missing required fields: projectId, executionData' },
            { status: 400 }
          );
        }

        const { query: rawQuery, durationMs, tables: queryTables } = executionData;

        if (!rawQuery || typeof durationMs !== 'number') {
          return NextResponse.json(
            { error: 'executionData must include query and durationMs' },
            { status: 400 }
          );
        }

        const record = await recordQueryExecution({
          projectId,
          query: rawQuery,
          durationMs,
          tables: queryTables ?? [],
        });

        return NextResponse.json({
          success: true,
          record,
          isSlowQuery: durationMs > SLOW_QUERY_THRESHOLD_MS,
        });
      }

      case 'generate': {
        const { tableName, operation, options } = body;

        if (!tableName || !operation) {
          return NextResponse.json(
            { error: 'Missing required fields: tableName, operation' },
            { status: 400 }
          );
        }

        const drizzleQuery = generateOptimizedDrizzleQuery(tableName, operation, options ?? {});

        return NextResponse.json({
          success: true,
          drizzleQuery,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: analyze, record, or generate' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing query request:', error);
    return NextResponse.json(
      { error: 'Failed to process query request' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/database-arch/query
 * Get query analytics and recommendations
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') ?? '20', 10);

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing required parameter: projectId' },
        { status: 400 }
      );
    }

    switch (type) {
      case 'slow': {
        const minDuration = parseInt(searchParams.get('minDuration') ?? String(SLOW_QUERY_THRESHOLD_MS), 10);
        const queries = await getSlowQueries(projectId, { minDuration, limit });

        return NextResponse.json({
          success: true,
          count: queries.length,
          threshold: minDuration,
          queries,
        });
      }

      case 'frequent': {
        const queries = await getMostExecutedQueries(projectId, { limit });

        return NextResponse.json({
          success: true,
          count: queries.length,
          queries,
        });
      }

      case 'recommendations': {
        // Get slow and frequent queries for recommendations
        const [slowQueries, frequentQueries] = await Promise.all([
          getSlowQueries(projectId, { limit: 50 }),
          getMostExecutedQueries(projectId, { limit: 50 }),
        ]);

        const allQueries = [...slowQueries, ...frequentQueries];
        const uniqueQueries = Array.from(
          new Map(allQueries.map((q) => [q.queryHash, q])).values()
        );

        const recommendations = generateIndexRecommendations(uniqueQueries);

        return NextResponse.json({
          success: true,
          analyzedQueries: uniqueQueries.length,
          recommendations,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid type. Use: slow, frequent, or recommendations' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching query analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch query analytics' },
      { status: 500 }
    );
  }
}

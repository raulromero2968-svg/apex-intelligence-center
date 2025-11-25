/**
 * Mobile Performance Optimization API
 *
 * Endpoints for component analysis and optimization.
 * Implements knowledge-08-mobile-performance optimization engine.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getOptimizationRules,
  createOptimizationRule,
  initializeBuiltInRules,
  analyzeComponent,
  generateOptimizedComponent,
  recordBridgeCall,
  getSessionBridgeAnalytics,
  analyzeBridgeCalls,
  generateBatchingCode,
  BUILT_IN_RULES,
} from '@/lib/mobile-perf';

/**
 * GET /api/mobile-perf/optimize
 *
 * Get optimization rules and bridge analytics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') ?? 'rules';
    const platform = searchParams.get('platform') as 'ios' | 'android' | 'both' | null;
    const type = searchParams.get('type') as string | null;
    const sessionId = searchParams.get('sessionId');

    switch (action) {
      case 'rules': {
        const rules = await getOptimizationRules({
          platform: platform ?? undefined,
          type: type as any,
          enabledOnly: searchParams.get('enabledOnly') !== 'false',
        });
        return NextResponse.json({ rules });
      }

      case 'built-in-rules': {
        const rules = BUILT_IN_RULES.map((rule) => ({
          name: rule.name,
          description: rule.description,
          optimizationType: rule.optimizationType,
          severity: rule.severity,
          platform: rule.platform,
        }));
        return NextResponse.json({ rules });
      }

      case 'bridge-analytics': {
        if (!sessionId) {
          return NextResponse.json(
            { error: 'Missing required parameter: sessionId' },
            { status: 400 }
          );
        }

        const analytics = await getSessionBridgeAnalytics(sessionId);
        const optimizations = analyzeBridgeCalls(analytics);

        return NextResponse.json({ analytics, optimizations });
      }

      default:
        return NextResponse.json(
          {
            error: `Invalid action: ${action}. Valid actions: rules, built-in-rules, bridge-analytics`,
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching optimization data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

/**
 * POST /api/mobile-perf/optimize
 *
 * Analyze components and generate optimizations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action ?? 'analyze';

    switch (action) {
      case 'analyze': {
        if (!body.code || !body.componentName) {
          return NextResponse.json(
            { error: 'Missing required fields: code, componentName' },
            { status: 400 }
          );
        }

        const rules = await getOptimizationRules({
          platform: body.platform,
          enabledOnly: true,
        });

        const analysis = analyzeComponent(body.code, body.componentName, rules);
        return NextResponse.json({ analysis });
      }

      case 'generate-optimized': {
        if (!body.code || !body.suggestions) {
          return NextResponse.json(
            { error: 'Missing required fields: code, suggestions' },
            { status: 400 }
          );
        }

        const optimizedCode = generateOptimizedComponent(body.code, body.suggestions);
        return NextResponse.json({ optimizedCode });
      }

      case 'generate-batching-code': {
        if (!body.moduleName || !body.methods) {
          return NextResponse.json(
            { error: 'Missing required fields: moduleName, methods' },
            { status: 400 }
          );
        }

        const code = generateBatchingCode(body.moduleName, body.methods);
        return NextResponse.json({ code });
      }

      case 'record-bridge-call': {
        if (!body.moduleName || !body.methodName) {
          return NextResponse.json(
            { error: 'Missing required fields: moduleName, methodName' },
            { status: 400 }
          );
        }

        const analytic = await recordBridgeCall({
          sessionId: body.sessionId,
          profileId: body.profileId,
          moduleName: body.moduleName,
          methodName: body.methodName,
          callCount: body.callCount ?? 1,
          avgDurationMs: body.avgDurationMs,
          maxDurationMs: body.maxDurationMs,
          totalDurationMs: body.totalDurationMs,
          avgPayloadBytes: body.avgPayloadBytes,
          totalPayloadBytes: body.totalPayloadBytes,
          isBatched: body.isBatched ?? false,
          isOptimizable: body.isOptimizable ?? false,
          optimizationSuggestion: body.optimizationSuggestion,
          callerComponent: body.callerComponent,
          stackTrace: body.stackTrace,
        });

        return NextResponse.json({ analytic }, { status: 201 });
      }

      case 'create-rule': {
        if (!body.name || !body.optimizationType) {
          return NextResponse.json(
            { error: 'Missing required fields: name, optimizationType' },
            { status: 400 }
          );
        }

        const rule = await createOptimizationRule({
          name: body.name,
          description: body.description,
          optimizationType: body.optimizationType,
          platform: body.platform ?? 'both',
          severity: body.severity ?? 'medium',
          detectionPattern: body.detectionPattern,
          fixSuggestion: body.fixSuggestion,
          expectedImprovement: body.expectedImprovement,
          documentation: body.documentation,
          exampleBefore: body.exampleBefore,
          exampleAfter: body.exampleAfter,
          isBuiltIn: false,
          isEnabled: body.isEnabled ?? true,
          priority: body.priority ?? 0,
        });

        return NextResponse.json({ rule }, { status: 201 });
      }

      case 'initialize-rules': {
        const count = await initializeBuiltInRules();
        return NextResponse.json({
          success: true,
          rulesInitialized: count,
        });
      }

      default:
        return NextResponse.json(
          {
            error: `Invalid action: ${action}. Valid actions: analyze, generate-optimized, generate-batching-code, record-bridge-call, create-rule, initialize-rules`,
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing optimization:', error);
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}

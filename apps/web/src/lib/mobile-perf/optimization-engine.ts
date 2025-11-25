/**
 * Optimization Engine Service
 *
 * Implements knowledge-08-mobile-performance optimization patterns.
 * Provides list optimization, bridge batching, and memoization analysis.
 *
 * Features:
 * - List rendering optimization (FlatList, SectionList)
 * - React.memo and useMemo suggestions
 * - JS-Native bridge call optimization
 * - Image and asset optimization
 *
 * @see knowledge-08-mobile-performance for architecture details
 */

import { db } from '@/lib/db';
import { eq, desc, and } from 'drizzle-orm';
import {
  optimizationRules,
  bridgeAnalytics,
  type OptimizationRule,
  type NewOptimizationRule,
  type BridgeAnalytic,
  type NewBridgeAnalytic,
} from '@/db/schema/mobile-perf';

// ============================================================================
// TYPES
// ============================================================================

export type OptimizationType =
  | 'memoization'
  | 'virtualization'
  | 'lazy_loading'
  | 'image_optimization'
  | 'bridge_batching'
  | 'hermes_tuning'
  | 'memory_management'
  | 'render_prevention';

export interface ComponentAnalysis {
  componentName: string;
  filePath?: string;
  issues: ComponentIssue[];
  suggestions: OptimizationSuggestion[];
  estimatedImprovement: {
    renderTime?: number;
    reRenders?: number;
    memoryMb?: number;
  };
}

export interface ComponentIssue {
  type: OptimizationType;
  severity: 'low' | 'medium' | 'high';
  description: string;
  line?: number;
  code?: string;
}

export interface OptimizationSuggestion {
  title: string;
  description: string;
  type: OptimizationType;
  beforeCode: string;
  afterCode: string;
  autoApplicable: boolean;
}

export interface BridgeOptimization {
  moduleName: string;
  callCount: number;
  totalLatency: number;
  suggestion: string;
  batchableWith?: string[];
  priority: 'low' | 'medium' | 'high';
}

// ============================================================================
// BUILT-IN OPTIMIZATION RULES
// ============================================================================

export const BUILT_IN_RULES: Array<Omit<NewOptimizationRule, 'id' | 'createdAt' | 'updatedAt'>> = [
  {
    name: 'Missing React.memo on List Item',
    description: 'List item components should be wrapped in React.memo to prevent unnecessary re-renders',
    optimizationType: 'memoization',
    platform: 'both',
    severity: 'high',
    detectionPattern: {
      type: 'component',
      pattern: 'renderItem.*=>.*<.*>',
      conditions: { noMemo: true },
    },
    fixSuggestion: {
      description: 'Wrap the component in React.memo',
      codeTemplate: 'const {ComponentName} = React.memo(({props}) => {\n  return (\n    {content}\n  );\n});',
      imports: ['React'],
      autoApplicable: true,
      riskLevel: 'low',
    },
    expectedImprovement: {
      renderTimeReduction: 30,
    },
    documentation: 'React.memo prevents re-renders when props have not changed.',
    exampleBefore: `const CardItem = ({ card }) => (
  <View><Text>{card.name}</Text></View>
);`,
    exampleAfter: `const CardItem = React.memo(({ card }) => (
  <View><Text>{card.name}</Text></View>
));`,
    isBuiltIn: true,
    isEnabled: true,
    priority: 100,
  },
  {
    name: 'Inline Function in renderItem',
    description: 'Inline functions in renderItem cause new references on each render',
    optimizationType: 'render_prevention',
    platform: 'both',
    severity: 'medium',
    detectionPattern: {
      type: 'component',
      pattern: 'renderItem=\\{\\(\\{',
    },
    fixSuggestion: {
      description: 'Extract renderItem to useCallback',
      codeTemplate: 'const renderItem = useCallback(({item}) => {\n  return <{ComponentName} item={item} />;\n}, [dependencies]);',
      imports: ['useCallback'],
      autoApplicable: true,
      riskLevel: 'low',
    },
    expectedImprovement: {
      renderTimeReduction: 15,
    },
    exampleBefore: `<FlatList
  data={items}
  renderItem={({ item }) => <CardItem card={item} />}
/>`,
    exampleAfter: `const renderItem = useCallback(({ item }) => (
  <CardItem card={item} />
), []);

<FlatList
  data={items}
  renderItem={renderItem}
/>`,
    isBuiltIn: true,
    isEnabled: true,
    priority: 90,
  },
  {
    name: 'Missing keyExtractor',
    description: 'FlatList without keyExtractor uses index, causing inefficient updates',
    optimizationType: 'virtualization',
    platform: 'both',
    severity: 'medium',
    detectionPattern: {
      type: 'component',
      pattern: '<FlatList(?!.*keyExtractor)',
    },
    fixSuggestion: {
      description: 'Add a stable keyExtractor function',
      codeTemplate: 'keyExtractor={(item) => item.id}',
      autoApplicable: true,
      riskLevel: 'low',
    },
    expectedImprovement: {
      renderTimeReduction: 20,
    },
    exampleBefore: `<FlatList
  data={items}
  renderItem={renderItem}
/>`,
    exampleAfter: `<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
/>`,
    isBuiltIn: true,
    isEnabled: true,
    priority: 85,
  },
  {
    name: 'Missing getItemLayout',
    description: 'Without getItemLayout, FlatList must measure each item',
    optimizationType: 'virtualization',
    platform: 'both',
    severity: 'medium',
    detectionPattern: {
      type: 'component',
      pattern: '<FlatList(?!.*getItemLayout)',
    },
    fixSuggestion: {
      description: 'Add getItemLayout for fixed-height items',
      codeTemplate: 'getItemLayout={(data, index) => ({\n  length: ITEM_HEIGHT,\n  offset: ITEM_HEIGHT * index,\n  index,\n})}',
      autoApplicable: false,
      riskLevel: 'medium',
    },
    expectedImprovement: {
      renderTimeReduction: 25,
    },
    exampleBefore: `<FlatList
  data={items}
  renderItem={renderItem}
/>`,
    exampleAfter: `const ITEM_HEIGHT = 80;
const getItemLayout = (data, index) => ({
  length: ITEM_HEIGHT,
  offset: ITEM_HEIGHT * index,
  index,
});

<FlatList
  data={items}
  renderItem={renderItem}
  getItemLayout={getItemLayout}
/>`,
    isBuiltIn: true,
    isEnabled: true,
    priority: 75,
  },
  {
    name: 'Large Image Without Caching',
    description: 'Images should use caching to prevent repeated network requests',
    optimizationType: 'image_optimization',
    platform: 'both',
    severity: 'high',
    detectionPattern: {
      type: 'component',
      pattern: '<Image.*source=\\{\\{\\s*uri:',
    },
    fixSuggestion: {
      description: 'Use expo-image with caching',
      codeTemplate: `import { Image } from 'expo-image';
<Image source={{ uri }} cachePolicy="memory-disk" />`,
      imports: ['expo-image'],
      autoApplicable: false,
      riskLevel: 'medium',
    },
    expectedImprovement: {
      memoryReduction: 20,
    },
    exampleBefore: `import { Image } from 'react-native';
<Image source={{ uri: imageUrl }} />`,
    exampleAfter: `import { Image } from 'expo-image';
<Image
  source={{ uri: imageUrl }}
  cachePolicy="memory-disk"
  placeholder={blurhash}
  transition={200}
/>`,
    isBuiltIn: true,
    isEnabled: true,
    priority: 80,
  },
  {
    name: 'Synchronous Native Module Call',
    description: 'Synchronous calls block the JS thread',
    optimizationType: 'bridge_batching',
    platform: 'both',
    severity: 'high',
    detectionPattern: {
      type: 'api_call',
      pattern: 'NativeModules\\..*\\..*Sync',
    },
    fixSuggestion: {
      description: 'Use async version of the native method',
      autoApplicable: false,
      riskLevel: 'high',
    },
    expectedImprovement: {
      bridgeCallReduction: 50,
    },
    exampleBefore: `const result = NativeModules.MyModule.getValueSync();`,
    exampleAfter: `const result = await NativeModules.MyModule.getValue();`,
    isBuiltIn: true,
    isEnabled: true,
    priority: 95,
  },
  {
    name: 'State Update in useEffect Without Cleanup',
    description: 'May cause memory leaks if component unmounts during async operation',
    optimizationType: 'memory_management',
    platform: 'both',
    severity: 'medium',
    detectionPattern: {
      type: 'hook',
      pattern: 'useEffect.*setState.*(?!return)',
    },
    fixSuggestion: {
      description: 'Add cleanup function to useEffect',
      codeTemplate: `useEffect(() => {
  let isMounted = true;
  fetchData().then(data => {
    if (isMounted) setState(data);
  });
  return () => { isMounted = false; };
}, []);`,
      autoApplicable: false,
      riskLevel: 'low',
    },
    expectedImprovement: {
      memoryReduction: 10,
    },
    exampleBefore: `useEffect(() => {
  fetchData().then(setData);
}, []);`,
    exampleAfter: `useEffect(() => {
  let isMounted = true;
  fetchData().then(data => {
    if (isMounted) setData(data);
  });
  return () => { isMounted = false; };
}, []);`,
    isBuiltIn: true,
    isEnabled: true,
    priority: 70,
  },
  {
    name: 'Console.log in Production',
    description: 'Console statements impact performance in production',
    optimizationType: 'hermes_tuning',
    platform: 'both',
    severity: 'low',
    detectionPattern: {
      type: 'api_call',
      pattern: 'console\\.(log|warn|error)',
    },
    fixSuggestion: {
      description: 'Remove or conditionally disable console statements',
      codeTemplate: `if (__DEV__) console.log(...)`,
      autoApplicable: true,
      riskLevel: 'low',
    },
    expectedImprovement: {
      fpsGain: 2,
    },
    exampleBefore: `console.log('Card data:', card);`,
    exampleAfter: `if (__DEV__) console.log('Card data:', card);`,
    isBuiltIn: true,
    isEnabled: true,
    priority: 50,
  },
];

// ============================================================================
// RULE MANAGEMENT
// ============================================================================

/**
 * Get all optimization rules
 */
export async function getOptimizationRules(
  options: {
    platform?: 'ios' | 'android' | 'both';
    type?: OptimizationType;
    enabledOnly?: boolean;
  } = {}
): Promise<OptimizationRule[]> {
  const { platform, type, enabledOnly = true } = options;

  const conditions = [];

  if (platform) {
    conditions.push(eq(optimizationRules.platform, platform));
  }
  if (type) {
    conditions.push(eq(optimizationRules.optimizationType, type));
  }
  if (enabledOnly) {
    conditions.push(eq(optimizationRules.isEnabled, true));
  }

  return db
    .select()
    .from(optimizationRules)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(optimizationRules.priority))
    .execute();
}

/**
 * Create a custom optimization rule
 */
export async function createOptimizationRule(
  data: Omit<NewOptimizationRule, 'id' | 'createdAt' | 'updatedAt'>
): Promise<OptimizationRule> {
  const [rule] = await db.insert(optimizationRules).values(data).returning();
  return rule;
}

/**
 * Initialize built-in rules
 */
export async function initializeBuiltInRules(): Promise<number> {
  let count = 0;

  for (const rule of BUILT_IN_RULES) {
    const existing = await db
      .select()
      .from(optimizationRules)
      .where(
        and(
          eq(optimizationRules.name, rule.name),
          eq(optimizationRules.isBuiltIn, true)
        )
      )
      .execute();

    if (existing.length === 0) {
      await db.insert(optimizationRules).values(rule);
      count++;
    }
  }

  return count;
}

// ============================================================================
// COMPONENT ANALYSIS
// ============================================================================

/**
 * Analyze a component for optimization opportunities
 */
export function analyzeComponent(
  code: string,
  componentName: string,
  rules: OptimizationRule[]
): ComponentAnalysis {
  const issues: ComponentIssue[] = [];
  const suggestions: OptimizationSuggestion[] = [];

  for (const rule of rules) {
    const pattern = rule.detectionPattern as {
      type: string;
      pattern: string;
      threshold?: number;
    };

    if (!pattern?.pattern) continue;

    const regex = new RegExp(pattern.pattern, 'g');
    const matches = code.match(regex);

    if (matches && matches.length > 0) {
      issues.push({
        type: rule.optimizationType as OptimizationType,
        severity: rule.severity as 'low' | 'medium' | 'high',
        description: rule.description ?? rule.name,
        code: matches[0],
      });

      const fix = rule.fixSuggestion as {
        description: string;
        codeTemplate?: string;
        autoApplicable: boolean;
      };

      if (fix) {
        suggestions.push({
          title: rule.name,
          description: fix.description,
          type: rule.optimizationType as OptimizationType,
          beforeCode: rule.exampleBefore ?? '',
          afterCode: rule.exampleAfter ?? '',
          autoApplicable: fix.autoApplicable,
        });
      }
    }
  }

  // Calculate estimated improvements
  const expectedImprovements = rules
    .filter((r) =>
      issues.some((i) => i.type === r.optimizationType)
    )
    .map((r) => r.expectedImprovement as Record<string, number> | null)
    .filter(Boolean);

  const estimatedImprovement = {
    renderTime: expectedImprovements.reduce(
      (sum, e) => sum + (e?.renderTimeReduction ?? 0),
      0
    ),
    reRenders: expectedImprovements.reduce(
      (sum, e) => sum + (e?.renderTimeReduction ?? 0) / 10,
      0
    ),
    memoryMb: expectedImprovements.reduce(
      (sum, e) => sum + (e?.memoryReduction ?? 0),
      0
    ),
  };

  return {
    componentName,
    issues,
    suggestions,
    estimatedImprovement,
  };
}

/**
 * Generate optimized component code
 */
export function generateOptimizedComponent(
  originalCode: string,
  suggestions: OptimizationSuggestion[]
): string {
  let optimizedCode = originalCode;

  // Add necessary imports
  const imports = new Set<string>();
  for (const suggestion of suggestions) {
    if (suggestion.type === 'memoization' || suggestion.type === 'render_prevention') {
      imports.add("import React, { memo, useCallback, useMemo } from 'react';");
    }
  }

  // This is a simplified transformation - real implementation would use AST
  for (const suggestion of suggestions) {
    if (suggestion.autoApplicable && suggestion.beforeCode && suggestion.afterCode) {
      optimizedCode = optimizedCode.replace(
        suggestion.beforeCode,
        suggestion.afterCode
      );
    }
  }

  // Prepend imports if needed
  if (imports.size > 0) {
    const importStatements = Array.from(imports).join('\n');
    if (!optimizedCode.includes('import React')) {
      optimizedCode = importStatements + '\n\n' + optimizedCode;
    }
  }

  return optimizedCode;
}

// ============================================================================
// BRIDGE ANALYTICS
// ============================================================================

/**
 * Record bridge call analytics
 */
export async function recordBridgeCall(
  data: Omit<NewBridgeAnalytic, 'id' | 'timestamp'>
): Promise<BridgeAnalytic> {
  const [analytic] = await db.insert(bridgeAnalytics).values(data).returning();
  return analytic;
}

/**
 * Get bridge analytics for a session
 */
export async function getSessionBridgeAnalytics(
  sessionId: string
): Promise<BridgeAnalytic[]> {
  return db
    .select()
    .from(bridgeAnalytics)
    .where(eq(bridgeAnalytics.sessionId, sessionId))
    .orderBy(desc(bridgeAnalytics.callCount))
    .execute();
}

/**
 * Analyze bridge calls and provide optimization suggestions
 */
export function analyzeBridgeCalls(
  analytics: BridgeAnalytic[]
): BridgeOptimization[] {
  const optimizations: BridgeOptimization[] = [];

  // Group by module
  const byModule = new Map<string, BridgeAnalytic[]>();
  for (const a of analytics) {
    const existing = byModule.get(a.moduleName) ?? [];
    existing.push(a);
    byModule.set(a.moduleName, existing);
  }

  for (const [moduleName, calls] of byModule) {
    const totalCalls = calls.reduce((sum, c) => sum + c.callCount, 0);
    const totalLatency = calls.reduce(
      (sum, c) => sum + (c.totalDurationMs ?? 0),
      0
    );

    // High frequency callers
    if (totalCalls > 100) {
      optimizations.push({
        moduleName,
        callCount: totalCalls,
        totalLatency,
        suggestion: 'Batch these calls using InteractionManager or debounce',
        batchableWith: calls
          .filter((c) => c.isOptimizable)
          .map((c) => c.methodName),
        priority: totalCalls > 500 ? 'high' : 'medium',
      });
    }

    // High latency calls
    const avgLatency = totalLatency / totalCalls;
    if (avgLatency > 10) {
      optimizations.push({
        moduleName,
        callCount: totalCalls,
        totalLatency,
        suggestion: 'Consider using Turbo Modules or JSI for faster native access',
        priority: avgLatency > 50 ? 'high' : 'medium',
      });
    }
  }

  return optimizations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Generate bridge batching code
 */
export function generateBatchingCode(moduleName: string, methods: string[]): string {
  return `import { InteractionManager } from 'react-native';

class ${moduleName}Batcher {
  private queue: Array<{ method: string; args: any[]; resolve: Function }> = [];
  private isProcessing = false;

  async call(method: string, ...args: any[]) {
    return new Promise((resolve) => {
      this.queue.push({ method, args, resolve });
      this.processQueue();
    });
  }

  private processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    InteractionManager.runAfterInteractions(async () => {
      const batch = this.queue.splice(0, 10); // Process up to 10 at a time

      const results = await Promise.all(
        batch.map(({ method, args }) =>
          NativeModules.${moduleName}[method](...args)
        )
      );

      batch.forEach(({ resolve }, i) => resolve(results[i]));

      this.isProcessing = false;
      if (this.queue.length > 0) this.processQueue();
    });
  }
}

export const ${moduleName.toLowerCase()}Batcher = new ${moduleName}Batcher();

// Usage:
// ${methods.map((m) => `await ${moduleName.toLowerCase()}Batcher.call('${m}', arg1, arg2);`).join('\n// ')}
`;
}

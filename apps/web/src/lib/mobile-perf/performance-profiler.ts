/**
 * Performance Profiler Service
 *
 * Implements knowledge-08-mobile-performance profiling and analysis.
 * Tracks FPS, memory, renders, and provides optimization recommendations.
 *
 * Features:
 * - Profile management for different app configurations
 * - Real-time metrics collection and analysis
 * - Performance threshold monitoring
 * - Optimization recommendations
 *
 * @see knowledge-08-mobile-performance for architecture details
 */

import { db } from '@/lib/db';
import { eq, desc, and, sql, gte, lte } from 'drizzle-orm';
import {
  perfProfiles,
  perfMetrics,
  type PerfProfile,
  type NewPerfProfile,
  type PerfMetric,
  type NewPerfMetric,
} from '@/db/schema/mobile-perf';

// ============================================================================
// TYPES
// ============================================================================

export type Platform = 'ios' | 'android' | 'both';
export type DeviceTier = 'low_end' | 'mid_range' | 'high_end' | 'flagship';
export type PerformanceGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface ListConfig {
  windowSize: number;
  maxToRenderPerBatch: number;
  updateCellsBatchingPeriod: number;
  removeClippedSubviews: boolean;
  initialNumToRender: number;
  getItemLayout: boolean;
}

export interface ImageConfig {
  cachePolicy: 'memory' | 'disk' | 'both';
  maxCacheSizeMb: number;
  compressionQuality: number;
  lazyLoadThreshold: number;
  placeholderStrategy: 'blur' | 'skeleton' | 'none';
}

export interface BridgeConfig {
  batchingEnabled: boolean;
  batchingInterval: number;
  maxBatchSize: number;
  priorityQueue: boolean;
}

export interface PerformanceThresholds {
  fpsWarning: number;
  fpsCritical: number;
  memoryWarning: number;
  memoryCritical: number;
  renderTimeWarning: number;
  renderTimeCritical: number;
}

export interface PerformanceAnalysis {
  grade: PerformanceGrade;
  score: number;
  summary: string;
  issues: PerformanceIssue[];
  recommendations: Recommendation[];
}

export interface PerformanceIssue {
  type: 'fps' | 'memory' | 'render' | 'bridge' | 'battery';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  metric: string;
  value: number;
  threshold: number;
}

export interface Recommendation {
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  category: string;
  codeExample?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default profile configuration
 */
export const DEFAULT_PROFILE: Partial<NewPerfProfile> = {
  platform: 'both',
  targetFps: 60,
  maxMemoryMb: 256,
  maxBundleSizeKb: 5000,
  enableHermes: true,
  enableNewArchitecture: false,
  listConfig: {
    windowSize: 21,
    maxToRenderPerBatch: 10,
    updateCellsBatchingPeriod: 50,
    removeClippedSubviews: true,
    initialNumToRender: 10,
    getItemLayout: false,
  },
  imageConfig: {
    cachePolicy: 'both',
    maxCacheSizeMb: 100,
    compressionQuality: 0.8,
    lazyLoadThreshold: 500,
    placeholderStrategy: 'blur',
  },
  bridgeConfig: {
    batchingEnabled: true,
    batchingInterval: 5,
    maxBatchSize: 100,
    priorityQueue: true,
  },
  thresholds: {
    fpsWarning: 55,
    fpsCritical: 45,
    memoryWarning: 200,
    memoryCritical: 350,
    renderTimeWarning: 16,
    renderTimeCritical: 32,
  },
};

/**
 * Platform-specific defaults
 */
export const PLATFORM_DEFAULTS: Record<Platform, Partial<ListConfig>> = {
  ios: {
    windowSize: 21,
    maxToRenderPerBatch: 10,
    removeClippedSubviews: false, // iOS handles this better natively
  },
  android: {
    windowSize: 11, // Android needs smaller window
    maxToRenderPerBatch: 5,
    removeClippedSubviews: true,
  },
  both: {
    windowSize: 15,
    maxToRenderPerBatch: 7,
    removeClippedSubviews: true,
  },
};

/**
 * Performance grade thresholds
 */
export const GRADE_THRESHOLDS: Record<PerformanceGrade, number> = {
  A: 90,
  B: 80,
  C: 70,
  D: 60,
  F: 0,
};

// ============================================================================
// PROFILE MANAGEMENT
// ============================================================================

/**
 * Create a new performance profile
 */
export async function createProfile(
  data: Omit<NewPerfProfile, 'id' | 'createdAt' | 'updatedAt'>
): Promise<PerfProfile> {
  const [profile] = await db
    .insert(perfProfiles)
    .values({
      ...DEFAULT_PROFILE,
      ...data,
    })
    .returning();

  return profile;
}

/**
 * Get profile by ID
 */
export async function getProfile(profileId: string): Promise<PerfProfile | null> {
  const [profile] = await db
    .select()
    .from(perfProfiles)
    .where(eq(perfProfiles.id, profileId))
    .execute();

  return profile ?? null;
}

/**
 * Get profiles for a user
 */
export async function getUserProfiles(
  userId: string,
  options: { limit?: number } = {}
): Promise<PerfProfile[]> {
  const { limit = 50 } = options;

  return db
    .select()
    .from(perfProfiles)
    .where(eq(perfProfiles.userId, userId))
    .orderBy(desc(perfProfiles.updatedAt))
    .limit(limit)
    .execute();
}

/**
 * Get profiles for a project
 */
export async function getProjectProfiles(
  projectId: string,
  options: { limit?: number } = {}
): Promise<PerfProfile[]> {
  const { limit = 50 } = options;

  return db
    .select()
    .from(perfProfiles)
    .where(eq(perfProfiles.projectId, projectId))
    .orderBy(desc(perfProfiles.updatedAt))
    .limit(limit)
    .execute();
}

/**
 * Update a profile
 */
export async function updateProfile(
  profileId: string,
  updates: Partial<NewPerfProfile>
): Promise<PerfProfile | null> {
  const [updated] = await db
    .update(perfProfiles)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(perfProfiles.id, profileId))
    .returning();

  return updated ?? null;
}

/**
 * Delete a profile
 */
export async function deleteProfile(profileId: string): Promise<boolean> {
  const result = await db
    .delete(perfProfiles)
    .where(eq(perfProfiles.id, profileId))
    .returning({ id: perfProfiles.id });

  return result.length > 0;
}

// ============================================================================
// METRICS COLLECTION
// ============================================================================

/**
 * Record performance metrics
 */
export async function recordMetrics(
  data: Omit<NewPerfMetric, 'id' | 'timestamp'>
): Promise<PerfMetric> {
  const [metric] = await db.insert(perfMetrics).values(data).returning();
  return metric;
}

/**
 * Get metrics for a session
 */
export async function getSessionMetrics(sessionId: string): Promise<PerfMetric[]> {
  return db
    .select()
    .from(perfMetrics)
    .where(eq(perfMetrics.sessionId, sessionId))
    .orderBy(perfMetrics.timestamp)
    .execute();
}

/**
 * Get metrics for a profile
 */
export async function getProfileMetrics(
  profileId: string,
  options: {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}
): Promise<PerfMetric[]> {
  const { startDate, endDate, limit = 100 } = options;

  const conditions = [eq(perfMetrics.profileId, profileId)];

  if (startDate) {
    conditions.push(gte(perfMetrics.timestamp, startDate));
  }
  if (endDate) {
    conditions.push(lte(perfMetrics.timestamp, endDate));
  }

  return db
    .select()
    .from(perfMetrics)
    .where(and(...conditions))
    .orderBy(desc(perfMetrics.timestamp))
    .limit(limit)
    .execute();
}

/**
 * Get aggregated metrics summary
 */
export async function getMetricsSummary(
  profileId: string,
  options: {
    startDate?: Date;
    endDate?: Date;
  } = {}
): Promise<{
  avgFps: number;
  avgMemory: number;
  avgRenderTime: number;
  totalSessions: number;
  issueCount: number;
}> {
  const metrics = await getProfileMetrics(profileId, { ...options, limit: 1000 });

  if (metrics.length === 0) {
    return {
      avgFps: 0,
      avgMemory: 0,
      avgRenderTime: 0,
      totalSessions: 0,
      issueCount: 0,
    };
  }

  const avgFps =
    metrics.reduce((sum, m) => sum + (m.avgFps ?? 0), 0) / metrics.length;
  const avgMemory =
    metrics.reduce((sum, m) => sum + (m.avgMemoryMb ?? 0), 0) / metrics.length;
  const avgRenderTime =
    metrics.reduce((sum, m) => sum + (m.avgRenderTimeMs ?? 0), 0) / metrics.length;

  const uniqueSessions = new Set(metrics.map((m) => m.sessionId)).size;
  const issueCount = metrics.filter(
    (m) => m.memoryLeakSuspected || (m.unnecessaryRenders ?? 0) > 10
  ).length;

  return {
    avgFps,
    avgMemory,
    avgRenderTime,
    totalSessions: uniqueSessions,
    issueCount,
  };
}

// ============================================================================
// PERFORMANCE ANALYSIS
// ============================================================================

/**
 * Analyze performance metrics and provide recommendations
 */
export function analyzePerformance(
  metrics: PerfMetric[],
  thresholds: PerformanceThresholds = DEFAULT_PROFILE.thresholds!
): PerformanceAnalysis {
  const issues: PerformanceIssue[] = [];
  const recommendations: Recommendation[] = [];

  // Calculate averages
  const avgFps = metrics.reduce((sum, m) => sum + (m.avgFps ?? 60), 0) / (metrics.length || 1);
  const avgMemory = metrics.reduce((sum, m) => sum + (m.avgMemoryMb ?? 0), 0) / (metrics.length || 1);
  const avgRenderTime = metrics.reduce((sum, m) => sum + (m.avgRenderTimeMs ?? 0), 0) / (metrics.length || 1);
  const totalUnnecessaryRenders = metrics.reduce((sum, m) => sum + (m.unnecessaryRenders ?? 0), 0);
  const avgBridgeLatency = metrics.reduce((sum, m) => sum + (m.avgBridgeLatencyMs ?? 0), 0) / (metrics.length || 1);

  // FPS analysis
  if (avgFps < thresholds.fpsCritical) {
    issues.push({
      type: 'fps',
      severity: 'critical',
      description: 'Frame rate is critically low, causing severe jank',
      metric: 'avgFps',
      value: avgFps,
      threshold: thresholds.fpsCritical,
    });
    recommendations.push({
      title: 'Enable Hermes Engine',
      description: 'Hermes significantly improves JavaScript execution speed',
      impact: 'high',
      effort: 'low',
      category: 'hermes',
      codeExample: '// In app.json\n"jsEngine": "hermes"',
    });
  } else if (avgFps < thresholds.fpsWarning) {
    issues.push({
      type: 'fps',
      severity: 'medium',
      description: 'Frame rate is below target, may cause noticeable lag',
      metric: 'avgFps',
      value: avgFps,
      threshold: thresholds.fpsWarning,
    });
  }

  // Memory analysis
  if (avgMemory > thresholds.memoryCritical) {
    issues.push({
      type: 'memory',
      severity: 'critical',
      description: 'Memory usage is critically high, app may crash',
      metric: 'avgMemoryMb',
      value: avgMemory,
      threshold: thresholds.memoryCritical,
    });
    recommendations.push({
      title: 'Implement Image Caching',
      description: 'Use expo-image or fast-image with proper cache policies',
      impact: 'high',
      effort: 'medium',
      category: 'memory',
      codeExample: `import { Image } from 'expo-image';
<Image
  source={{ uri: imageUrl }}
  cachePolicy="memory-disk"
  recyclingKey={itemId}
/>`,
    });
  } else if (avgMemory > thresholds.memoryWarning) {
    issues.push({
      type: 'memory',
      severity: 'medium',
      description: 'Memory usage is elevated',
      metric: 'avgMemoryMb',
      value: avgMemory,
      threshold: thresholds.memoryWarning,
    });
  }

  // Render time analysis
  if (avgRenderTime > thresholds.renderTimeCritical) {
    issues.push({
      type: 'render',
      severity: 'high',
      description: 'Render time exceeds frame budget (16ms)',
      metric: 'avgRenderTimeMs',
      value: avgRenderTime,
      threshold: thresholds.renderTimeCritical,
    });
    recommendations.push({
      title: 'Use React.memo for List Items',
      description: 'Memoize list item components to prevent unnecessary re-renders',
      impact: 'high',
      effort: 'low',
      category: 'render_prevention',
      codeExample: `const CardItem = React.memo(({ card }) => (
  <View>
    <Text>{card.name}</Text>
  </View>
));`,
    });
  }

  // Unnecessary renders analysis
  if (totalUnnecessaryRenders > 50) {
    issues.push({
      type: 'render',
      severity: 'medium',
      description: 'High number of unnecessary re-renders detected',
      metric: 'unnecessaryRenders',
      value: totalUnnecessaryRenders,
      threshold: 50,
    });
    recommendations.push({
      title: 'Use useMemo and useCallback',
      description: 'Memoize expensive calculations and callback functions',
      impact: 'medium',
      effort: 'low',
      category: 'memoization',
      codeExample: `const expensiveValue = useMemo(() =>
  computeExpensiveValue(data),
  [data]
);

const handlePress = useCallback(() => {
  onItemPress(item.id);
}, [item.id, onItemPress]);`,
    });
  }

  // Bridge latency analysis
  if (avgBridgeLatency > 10) {
    issues.push({
      type: 'bridge',
      severity: avgBridgeLatency > 20 ? 'high' : 'medium',
      description: 'High JS-Native bridge latency',
      metric: 'avgBridgeLatencyMs',
      value: avgBridgeLatency,
      threshold: 10,
    });
    recommendations.push({
      title: 'Batch Bridge Calls',
      description: 'Group multiple native calls to reduce bridge overhead',
      impact: 'high',
      effort: 'medium',
      category: 'bridge',
    });
  }

  // Calculate score
  let score = 100;
  for (const issue of issues) {
    switch (issue.severity) {
      case 'critical':
        score -= 25;
        break;
      case 'high':
        score -= 15;
        break;
      case 'medium':
        score -= 10;
        break;
      case 'low':
        score -= 5;
        break;
    }
  }
  score = Math.max(0, Math.min(100, score));

  // Determine grade
  let grade: PerformanceGrade = 'F';
  for (const [g, threshold] of Object.entries(GRADE_THRESHOLDS) as [PerformanceGrade, number][]) {
    if (score >= threshold) {
      grade = g;
      break;
    }
  }

  // Generate summary
  let summary: string;
  if (grade === 'A') {
    summary = 'Excellent performance! Your app is well-optimized.';
  } else if (grade === 'B') {
    summary = 'Good performance with minor areas for improvement.';
  } else if (grade === 'C') {
    summary = 'Average performance. Consider implementing recommendations.';
  } else if (grade === 'D') {
    summary = 'Below average performance. Several optimizations needed.';
  } else {
    summary = 'Poor performance. Critical issues need immediate attention.';
  }

  return {
    grade,
    score,
    summary,
    issues,
    recommendations,
  };
}

/**
 * Generate optimized configuration based on metrics
 */
export function generateOptimizedConfig(
  metrics: PerfMetric[],
  currentProfile: PerfProfile
): Partial<PerfProfile> {
  const analysis = analyzePerformance(
    metrics,
    currentProfile.thresholds as PerformanceThresholds
  );

  const optimized: Partial<PerfProfile> = {};

  // Adjust list config based on issues
  if (analysis.issues.some((i) => i.type === 'fps' || i.type === 'render')) {
    const currentList = currentProfile.listConfig as ListConfig;
    optimized.listConfig = {
      ...currentList,
      windowSize: Math.max(5, currentList.windowSize - 4),
      maxToRenderPerBatch: Math.max(2, currentList.maxToRenderPerBatch - 3),
      removeClippedSubviews: true,
      getItemLayout: true,
    };
  }

  // Adjust image config for memory issues
  if (analysis.issues.some((i) => i.type === 'memory')) {
    const currentImage = currentProfile.imageConfig as ImageConfig;
    optimized.imageConfig = {
      ...currentImage,
      compressionQuality: Math.max(0.5, currentImage.compressionQuality - 0.2),
      maxCacheSizeMb: Math.max(50, currentImage.maxCacheSizeMb - 25),
      lazyLoadThreshold: currentImage.lazyLoadThreshold + 200,
    };
  }

  // Adjust bridge config for bridge issues
  if (analysis.issues.some((i) => i.type === 'bridge')) {
    const currentBridge = currentProfile.bridgeConfig as BridgeConfig;
    optimized.bridgeConfig = {
      ...currentBridge,
      batchingEnabled: true,
      batchingInterval: Math.max(10, currentBridge.batchingInterval + 5),
      maxBatchSize: Math.min(200, currentBridge.maxBatchSize + 50),
      priorityQueue: true,
    };
  }

  return optimized;
}

/**
 * Generate FlatList optimization code
 */
export function generateFlatListCode(config: ListConfig, itemType: string = 'Item'): string {
  return `import React, { useCallback, useMemo } from 'react';
import { FlatList, View, Text } from 'react-native';

const ${itemType}Component = React.memo(({ item, onPress }) => (
  <View>
    <Text>{item.name}</Text>
  </View>
));

export function Optimized${itemType}List({ data, onItemPress }) {
  const renderItem = useCallback(({ item }) => (
    <${itemType}Component item={item} onPress={onItemPress} />
  ), [onItemPress]);

  const keyExtractor = useCallback((item) => item.id, []);

  ${config.getItemLayout ? `const getItemLayout = useCallback((data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), []);` : ''}

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ${config.getItemLayout ? 'getItemLayout={getItemLayout}' : ''}
      windowSize={${config.windowSize}}
      maxToRenderPerBatch={${config.maxToRenderPerBatch}}
      updateCellsBatchingPeriod={${config.updateCellsBatchingPeriod}}
      removeClippedSubviews={${config.removeClippedSubviews}}
      initialNumToRender={${config.initialNumToRender}}
    />
  );
}`;
}

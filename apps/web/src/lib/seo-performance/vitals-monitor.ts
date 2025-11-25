/**
 * Core Web Vitals Monitor Service
 *
 * Implements knowledge-07-seo-performance vitals tracking and analysis.
 * Monitors LCP, INP, CLS, FCP, TTFB with threshold-based grading.
 *
 * Features:
 * - Real-time vitals collection
 * - Performance grading (Good/Needs Improvement/Poor)
 * - Attribution analysis
 * - Historical tracking
 *
 * @see knowledge-07-seo-performance for architecture details
 */

import { db } from '@/lib/db';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';
import {
  vitalsMetrics,
  type VitalsMetric,
  type NewVitalsMetric,
} from '@/db/schema/seo-performance';

// ============================================================================
// TYPES
// ============================================================================

export type VitalType = 'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB' | 'FID';
export type VitalRating = 'good' | 'needs_improvement' | 'poor';

export interface VitalThreshold {
  good: number;
  needsImprovement: number;
}

export interface VitalsSummary {
  lcp: { p75: number; rating: VitalRating };
  inp: { p75: number; rating: VitalRating };
  cls: { p75: number; rating: VitalRating };
  fcp: { p75: number; rating: VitalRating };
  ttfb: { p75: number; rating: VitalRating };
  overallScore: number;
  overallRating: VitalRating;
}

export interface VitalAttribution {
  element?: string;
  url?: string;
  timeToFirstByte?: number;
  resourceLoadDelay?: number;
  elementRenderDelay?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Core Web Vitals thresholds (as of 2024)
 * @see https://web.dev/vitals/
 */
export const VITAL_THRESHOLDS: Record<VitalType, VitalThreshold> = {
  LCP: { good: 2500, needsImprovement: 4000 }, // ms
  INP: { good: 200, needsImprovement: 500 }, // ms
  CLS: { good: 0.1, needsImprovement: 0.25 }, // score
  FCP: { good: 1800, needsImprovement: 3000 }, // ms
  TTFB: { good: 800, needsImprovement: 1800 }, // ms
  FID: { good: 100, needsImprovement: 300 }, // ms (legacy)
};

/**
 * Vital descriptions
 */
export const VITAL_INFO: Record<VitalType, { name: string; description: string; unit: string }> = {
  LCP: {
    name: 'Largest Contentful Paint',
    description: 'Time until the largest content element is visible',
    unit: 'ms',
  },
  INP: {
    name: 'Interaction to Next Paint',
    description: 'Responsiveness to user interactions',
    unit: 'ms',
  },
  CLS: {
    name: 'Cumulative Layout Shift',
    description: 'Visual stability - unexpected layout shifts',
    unit: 'score',
  },
  FCP: {
    name: 'First Contentful Paint',
    description: 'Time until first content is visible',
    unit: 'ms',
  },
  TTFB: {
    name: 'Time to First Byte',
    description: 'Server response time',
    unit: 'ms',
  },
  FID: {
    name: 'First Input Delay',
    description: 'Time to respond to first interaction (legacy)',
    unit: 'ms',
  },
};

// ============================================================================
// RATING FUNCTIONS
// ============================================================================

/**
 * Get rating for a vital value
 */
export function getVitalRating(type: VitalType, value: number): VitalRating {
  const thresholds = VITAL_THRESHOLDS[type];

  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.needsImprovement) return 'needs_improvement';
  return 'poor';
}

/**
 * Get color for rating
 */
export function getRatingColor(rating: VitalRating): string {
  switch (rating) {
    case 'good':
      return '#0CCE6B'; // green
    case 'needs_improvement':
      return '#FFA400'; // orange
    case 'poor':
      return '#FF4E42'; // red
  }
}

/**
 * Calculate overall score from vitals
 */
export function calculateOverallScore(vitals: Partial<Record<VitalType, number>>): number {
  const weights: Record<VitalType, number> = {
    LCP: 25,
    INP: 25,
    CLS: 25,
    FCP: 15,
    TTFB: 10,
    FID: 0, // Legacy, not counted
  };

  let totalWeight = 0;
  let weightedScore = 0;

  for (const [type, value] of Object.entries(vitals) as [VitalType, number][]) {
    if (value === undefined || weights[type] === 0) continue;

    const weight = weights[type];
    totalWeight += weight;

    const threshold = VITAL_THRESHOLDS[type];
    // Score: 100 if good, 50 if needs improvement, 0 if poor
    let score: number;
    if (value <= threshold.good) {
      score = 100;
    } else if (value <= threshold.needsImprovement) {
      // Linear interpolation between good and needs improvement
      score = 50 + 50 * (1 - (value - threshold.good) / (threshold.needsImprovement - threshold.good));
    } else {
      // Below needs improvement
      score = Math.max(0, 50 * (1 - (value - threshold.needsImprovement) / threshold.needsImprovement));
    }

    weightedScore += score * weight;
  }

  return totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;
}

// ============================================================================
// METRICS COLLECTION
// ============================================================================

/**
 * Record a vitals metric
 */
export async function recordVital(
  data: Omit<NewVitalsMetric, 'id' | 'timestamp' | 'rating'>
): Promise<VitalsMetric> {
  const rating = getVitalRating(data.vitalType as VitalType, data.value);

  const [metric] = await db
    .insert(vitalsMetrics)
    .values({
      ...data,
      rating,
    })
    .returning();

  return metric;
}

/**
 * Record multiple vitals at once
 */
export async function recordVitals(
  pageUrl: string,
  vitals: Partial<Record<VitalType, number>>,
  context?: {
    pageId?: string;
    userId?: string;
    sessionId?: string;
    deviceType?: string;
    connectionType?: string;
    viewportWidth?: number;
    viewportHeight?: number;
    navigationType?: string;
  }
): Promise<VitalsMetric[]> {
  const metrics: VitalsMetric[] = [];

  for (const [type, value] of Object.entries(vitals) as [VitalType, number][]) {
    if (value === undefined) continue;

    const metric = await recordVital({
      pageUrl,
      pageId: context?.pageId,
      userId: context?.userId,
      sessionId: context?.sessionId,
      vitalType: type,
      value,
      deviceType: context?.deviceType,
      connectionType: context?.connectionType,
      viewportWidth: context?.viewportWidth,
      viewportHeight: context?.viewportHeight,
      navigationType: context?.navigationType,
    });

    metrics.push(metric);
  }

  return metrics;
}

/**
 * Get metrics for a page
 */
export async function getPageMetrics(
  pageUrl: string,
  options: {
    vitalType?: VitalType;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}
): Promise<VitalsMetric[]> {
  const { vitalType, startDate, endDate, limit = 100 } = options;

  const conditions = [eq(vitalsMetrics.pageUrl, pageUrl)];

  if (vitalType) {
    conditions.push(eq(vitalsMetrics.vitalType, vitalType));
  }
  if (startDate) {
    conditions.push(gte(vitalsMetrics.timestamp, startDate));
  }
  if (endDate) {
    conditions.push(lte(vitalsMetrics.timestamp, endDate));
  }

  return db
    .select()
    .from(vitalsMetrics)
    .where(and(...conditions))
    .orderBy(desc(vitalsMetrics.timestamp))
    .limit(limit)
    .execute();
}

/**
 * Get vitals summary for a page (p75 values)
 */
export async function getPageVitalsSummary(
  pageUrl: string,
  options: {
    startDate?: Date;
    endDate?: Date;
  } = {}
): Promise<VitalsSummary> {
  const metrics = await getPageMetrics(pageUrl, { ...options, limit: 1000 });

  // Group by vital type
  const byType: Record<VitalType, number[]> = {
    LCP: [],
    INP: [],
    CLS: [],
    FCP: [],
    TTFB: [],
    FID: [],
  };

  for (const metric of metrics) {
    const type = metric.vitalType as VitalType;
    if (byType[type]) {
      byType[type].push(metric.value);
    }
  }

  // Calculate p75 for each
  const calculateP75 = (values: number[]): number => {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * 0.75);
    return sorted[index] ?? 0;
  };

  const summary: VitalsSummary = {
    lcp: { p75: calculateP75(byType.LCP), rating: 'good' },
    inp: { p75: calculateP75(byType.INP), rating: 'good' },
    cls: { p75: calculateP75(byType.CLS), rating: 'good' },
    fcp: { p75: calculateP75(byType.FCP), rating: 'good' },
    ttfb: { p75: calculateP75(byType.TTFB), rating: 'good' },
    overallScore: 0,
    overallRating: 'good',
  };

  // Set ratings
  summary.lcp.rating = getVitalRating('LCP', summary.lcp.p75);
  summary.inp.rating = getVitalRating('INP', summary.inp.p75);
  summary.cls.rating = getVitalRating('CLS', summary.cls.p75);
  summary.fcp.rating = getVitalRating('FCP', summary.fcp.p75);
  summary.ttfb.rating = getVitalRating('TTFB', summary.ttfb.p75);

  // Calculate overall
  summary.overallScore = calculateOverallScore({
    LCP: summary.lcp.p75,
    INP: summary.inp.p75,
    CLS: summary.cls.p75,
    FCP: summary.fcp.p75,
    TTFB: summary.ttfb.p75,
  });

  summary.overallRating =
    summary.overallScore >= 90 ? 'good' : summary.overallScore >= 50 ? 'needs_improvement' : 'poor';

  return summary;
}

// ============================================================================
// OPTIMIZATION SUGGESTIONS
// ============================================================================

export interface OptimizationSuggestion {
  vital: VitalType;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  implementation: string;
}

/**
 * Get optimization suggestions based on vitals
 */
export function getOptimizationSuggestions(summary: VitalsSummary): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];

  // LCP suggestions
  if (summary.lcp.rating !== 'good') {
    suggestions.push({
      vital: 'LCP',
      title: 'Optimize Largest Contentful Paint',
      description: `LCP is ${summary.lcp.p75}ms (target: <2500ms)`,
      impact: 'high',
      implementation: `// Use next/image for optimized images
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority // Preload LCP image
  placeholder="blur"
/>

// Preload critical fonts
<link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />`,
    });
  }

  // INP suggestions
  if (summary.inp.rating !== 'good') {
    suggestions.push({
      vital: 'INP',
      title: 'Improve Interaction Responsiveness',
      description: `INP is ${summary.inp.p75}ms (target: <200ms)`,
      impact: 'high',
      implementation: `// Use React.startTransition for non-urgent updates
import { startTransition } from 'react';

function handleClick() {
  startTransition(() => {
    setFilteredItems(filter(items));
  });
}

// Use useDeferredValue for expensive renders
const deferredQuery = useDeferredValue(query);`,
    });
  }

  // CLS suggestions
  if (summary.cls.rating !== 'good') {
    suggestions.push({
      vital: 'CLS',
      title: 'Reduce Layout Shifts',
      description: `CLS is ${summary.cls.p75} (target: <0.1)`,
      impact: 'high',
      implementation: `// Always set dimensions on images
<Image width={400} height={300} ... />

// Reserve space for dynamic content
<div style={{ minHeight: '200px' }}>
  {loading ? <Skeleton /> : <Content />}
</div>

// Use CSS aspect-ratio
.video-container {
  aspect-ratio: 16 / 9;
}`,
    });
  }

  // FCP suggestions
  if (summary.fcp.rating !== 'good') {
    suggestions.push({
      vital: 'FCP',
      title: 'Speed Up First Paint',
      description: `FCP is ${summary.fcp.p75}ms (target: <1800ms)`,
      impact: 'medium',
      implementation: `// Inline critical CSS
<style dangerouslySetInnerHTML={{ __html: criticalCss }} />

// Use streaming SSR
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

// Remove render-blocking resources
<script defer src="..." />`,
    });
  }

  // TTFB suggestions
  if (summary.ttfb.rating !== 'good') {
    suggestions.push({
      vital: 'TTFB',
      title: 'Reduce Server Response Time',
      description: `TTFB is ${summary.ttfb.p75}ms (target: <800ms)`,
      impact: 'medium',
      implementation: `// Use ISR for static pages
export const revalidate = 60; // seconds

// Use edge runtime for global performance
export const runtime = 'edge';

// Cache database queries
const data = await unstable_cache(
  async () => fetchData(),
  ['cache-key'],
  { revalidate: 60 }
)();`,
    });
  }

  return suggestions;
}

/**
 * Generate client-side vitals collection code
 */
export function generateVitalsCollectionCode(endpoint: string): string {
  return `import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals';

function sendVital(metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
    attribution: metric.attribution,
  });

  // Use sendBeacon for reliable delivery
  if (navigator.sendBeacon) {
    navigator.sendBeacon('${endpoint}', body);
  } else {
    fetch('${endpoint}', { body, method: 'POST', keepalive: true });
  }
}

// Collect all Core Web Vitals
onCLS(sendVital);
onINP(sendVital);
onLCP(sendVital);
onFCP(sendVital);
onTTFB(sendVital);`;
}

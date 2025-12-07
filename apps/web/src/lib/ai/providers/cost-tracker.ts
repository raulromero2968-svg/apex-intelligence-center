/**
 * AI Cost Tracking and Optimization
 *
 * Tracks LLM usage costs per user and globally, with budget alerts
 * and cost optimization recommendations.
 *
 * Projections from Multi-LLM Integration Plan:
 * - Current: $0.20/transformation (GPT-4, 1k tokens)
 * - At 10,000/day: $60,000/month without optimization
 * - Optimized: Route 70% cheap, 20% local, 10% premium = $20,000/month
 * - Break-even for self-hosted: ~5,000 transformations/day
 *
 * References:
 * - Multi-LLM Integration Plan Section 4: AI Cost Projections
 * - Ethical Safeguards Framework (cost monitoring)
 */

import { redis } from '@/server/redis/client';
import type { LLMProvider, LLMResponse, CostTracking } from './types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const COST_CONFIG = {
  /** Key prefix for cost tracking */
  KEY_PREFIX: 'llm:cost:',
  /** Daily budget alert threshold in USD */
  DAILY_BUDGET_ALERT: 100,
  /** Monthly budget limit in USD */
  MONTHLY_BUDGET_LIMIT: 5000,
  /** Cost tracking window in seconds (30 days) */
  TRACKING_WINDOW_SECONDS: 30 * 24 * 60 * 60,
  /** Alert check interval in ms */
  ALERT_CHECK_INTERVAL_MS: 60000,
};

// ============================================================================
// COST TRACKING KEYS
// ============================================================================

function getUserDailyKey(userId: string, date: string): string {
  return `${COST_CONFIG.KEY_PREFIX}user:${userId}:daily:${date}`;
}

function getUserMonthlyKey(userId: string, month: string): string {
  return `${COST_CONFIG.KEY_PREFIX}user:${userId}:monthly:${month}`;
}

function getGlobalDailyKey(date: string): string {
  return `${COST_CONFIG.KEY_PREFIX}global:daily:${date}`;
}

function getGlobalMonthlyKey(month: string): string {
  return `${COST_CONFIG.KEY_PREFIX}global:monthly:${month}`;
}

function getProviderKey(provider: LLMProvider, period: string): string {
  return `${COST_CONFIG.KEY_PREFIX}provider:${provider}:${period}`;
}

// ============================================================================
// DATE HELPERS
// ============================================================================

function getCurrentDateKey(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// ============================================================================
// COST TRACKING DATA STRUCTURE
// ============================================================================

interface CostEntry {
  cost: number;
  inputTokens: number;
  outputTokens: number;
  requests: number;
  updatedAt: string;
}

// ============================================================================
// TRACKING FUNCTIONS
// ============================================================================

/**
 * Record cost for an LLM response
 */
export async function trackCost(
  response: LLMResponse,
  userId?: string
): Promise<void> {
  const date = getCurrentDateKey();
  const month = getCurrentMonthKey();

  const costEntry: CostEntry = {
    cost: response.cost,
    inputTokens: response.inputTokens,
    outputTokens: response.outputTokens,
    requests: 1,
    updatedAt: new Date().toISOString(),
  };

  try {
    // Track global daily
    await updateCostEntry(getGlobalDailyKey(date), costEntry);

    // Track global monthly
    await updateCostEntry(getGlobalMonthlyKey(month), costEntry);

    // Track per-provider
    await updateCostEntry(getProviderKey(response.provider, month), costEntry);

    // Track per-user if userId provided
    if (userId) {
      await updateCostEntry(getUserDailyKey(userId, date), costEntry);
      await updateCostEntry(getUserMonthlyKey(userId, month), costEntry);
    }

    // Check budget alerts
    await checkBudgetAlerts(date, month, userId);
  } catch (error) {
    console.error('[COST_TRACKER] Error tracking cost:', error);
  }
}

async function updateCostEntry(key: string, entry: CostEntry): Promise<void> {
  const existing = await redis.get<CostEntry>(key);

  const updated: CostEntry = {
    cost: (existing?.cost || 0) + entry.cost,
    inputTokens: (existing?.inputTokens || 0) + entry.inputTokens,
    outputTokens: (existing?.outputTokens || 0) + entry.outputTokens,
    requests: (existing?.requests || 0) + entry.requests,
    updatedAt: entry.updatedAt,
  };

  await redis.set(key, updated, { ex: COST_CONFIG.TRACKING_WINDOW_SECONDS });
}

// ============================================================================
// COST RETRIEVAL
// ============================================================================

/**
 * Get cost tracking for a user
 */
export async function getUserCosts(userId: string): Promise<CostTracking> {
  const month = getCurrentMonthKey();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const monthlyData = await redis.get<CostEntry>(getUserMonthlyKey(userId, month));

  // Get provider breakdown
  const providers: LLMProvider[] = ['openai', 'anthropic', 'google', 'local'];
  const providerBreakdown: CostTracking['providerBreakdown'] = {
    openai: { cost: 0, requests: 0, tokens: 0 },
    anthropic: { cost: 0, requests: 0, tokens: 0 },
    google: { cost: 0, requests: 0, tokens: 0 },
    local: { cost: 0, requests: 0, tokens: 0 },
  };

  await Promise.all(
    providers.map(async (provider) => {
      const data = await redis.get<CostEntry>(getProviderKey(provider, month));
      if (data) {
        providerBreakdown[provider] = {
          cost: data.cost,
          requests: data.requests,
          tokens: data.inputTokens + data.outputTokens,
        };
      }
    })
  );

  return {
    userId,
    periodStart: startOfMonth,
    periodEnd: new Date(),
    totalCost: monthlyData?.cost || 0,
    totalInputTokens: monthlyData?.inputTokens || 0,
    totalOutputTokens: monthlyData?.outputTokens || 0,
    requestCount: monthlyData?.requests || 0,
    providerBreakdown,
  };
}

/**
 * Get global cost summary
 */
export async function getGlobalCosts(): Promise<{
  daily: CostEntry | null;
  monthly: CostEntry | null;
  providerBreakdown: Record<LLMProvider, CostEntry | null>;
}> {
  const date = getCurrentDateKey();
  const month = getCurrentMonthKey();

  const [daily, monthly] = await Promise.all([
    redis.get<CostEntry>(getGlobalDailyKey(date)),
    redis.get<CostEntry>(getGlobalMonthlyKey(month)),
  ]);

  const providers: LLMProvider[] = ['openai', 'anthropic', 'google', 'local'];
  const providerBreakdown: Record<LLMProvider, CostEntry | null> = {
    openai: null,
    anthropic: null,
    google: null,
    local: null,
  };

  await Promise.all(
    providers.map(async (provider) => {
      providerBreakdown[provider] = await redis.get<CostEntry>(
        getProviderKey(provider, month)
      );
    })
  );

  return { daily, monthly, providerBreakdown };
}

// ============================================================================
// BUDGET ALERTS
// ============================================================================

interface BudgetAlert {
  type: 'daily_threshold' | 'monthly_limit' | 'user_spike';
  message: string;
  currentCost: number;
  threshold: number;
  userId?: string;
  timestamp: string;
}

const alertQueue: BudgetAlert[] = [];

async function checkBudgetAlerts(
  date: string,
  month: string,
  userId?: string
): Promise<void> {
  try {
    // Check global daily threshold
    const daily = await redis.get<CostEntry>(getGlobalDailyKey(date));
    if (daily && daily.cost >= COST_CONFIG.DAILY_BUDGET_ALERT) {
      emitAlert({
        type: 'daily_threshold',
        message: `Daily AI cost threshold exceeded: $${daily.cost.toFixed(2)}`,
        currentCost: daily.cost,
        threshold: COST_CONFIG.DAILY_BUDGET_ALERT,
        timestamp: new Date().toISOString(),
      });
    }

    // Check global monthly limit
    const monthly = await redis.get<CostEntry>(getGlobalMonthlyKey(month));
    if (monthly && monthly.cost >= COST_CONFIG.MONTHLY_BUDGET_LIMIT) {
      emitAlert({
        type: 'monthly_limit',
        message: `Monthly AI budget limit reached: $${monthly.cost.toFixed(2)}`,
        currentCost: monthly.cost,
        threshold: COST_CONFIG.MONTHLY_BUDGET_LIMIT,
        timestamp: new Date().toISOString(),
      });
    }

    // Check user spike (10x average)
    if (userId) {
      const userDaily = await redis.get<CostEntry>(getUserDailyKey(userId, date));
      if (userDaily && userDaily.cost > 10) {
        emitAlert({
          type: 'user_spike',
          message: `User ${userId} has unusual AI usage: $${userDaily.cost.toFixed(2)}`,
          currentCost: userDaily.cost,
          threshold: 10,
          userId,
          timestamp: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    console.error('[COST_TRACKER] Error checking budget alerts:', error);
  }
}

function emitAlert(alert: BudgetAlert): void {
  // Dedupe alerts (same type within 1 hour)
  const recentSimilar = alertQueue.find(
    (a) =>
      a.type === alert.type &&
      a.userId === alert.userId &&
      new Date(a.timestamp).getTime() > Date.now() - 3600000
  );

  if (!recentSimilar) {
    alertQueue.push(alert);
    console.warn('[COST_ALERT]', alert.message);
    // TODO: Send to notification system (Sentry, Slack, etc.)
  }
}

/**
 * Get pending budget alerts
 */
export function getPendingAlerts(): BudgetAlert[] {
  return [...alertQueue];
}

/**
 * Clear processed alerts
 */
export function clearAlerts(): void {
  alertQueue.length = 0;
}

// ============================================================================
// COST OPTIMIZATION RECOMMENDATIONS
// ============================================================================

interface OptimizationRecommendation {
  type: 'switch_provider' | 'enable_caching' | 'use_local' | 'batch_requests';
  impact: 'high' | 'medium' | 'low';
  estimatedSavings: number;
  description: string;
}

/**
 * Generate cost optimization recommendations based on usage patterns
 */
export async function getOptimizationRecommendations(): Promise<OptimizationRecommendation[]> {
  const recommendations: OptimizationRecommendation[] = [];
  const { monthly, providerBreakdown } = await getGlobalCosts();

  if (!monthly) return recommendations;

  // Check if mostly using expensive providers
  const openaiCost = providerBreakdown.openai?.cost || 0;
  const totalCost = monthly.cost || 1;

  if (openaiCost / totalCost > 0.7) {
    recommendations.push({
      type: 'switch_provider',
      impact: 'high',
      estimatedSavings: openaiCost * 0.5, // Anthropic Claude is often 50% cheaper
      description: 'Consider routing non-critical requests to Anthropic Claude for 50% cost reduction',
    });
  }

  // Check if local models could help
  const totalRequests = monthly.requests || 0;
  if (totalRequests > 5000) {
    recommendations.push({
      type: 'use_local',
      impact: 'high',
      estimatedSavings: totalCost * 0.7, // Local is ~90% cheaper
      description: 'High volume detected. Self-hosted Llama 3 could reduce costs by 70%+',
    });
  }

  // Always recommend caching
  recommendations.push({
    type: 'enable_caching',
    impact: 'medium',
    estimatedSavings: totalCost * 0.3,
    description: 'Enable prompt caching to reduce costs by 30-50% for repeated queries',
  });

  return recommendations;
}

// ============================================================================
// COST PROJECTION
// ============================================================================

/**
 * Project monthly costs based on current usage
 */
export async function projectMonthlyCost(): Promise<{
  projected: number;
  current: number;
  daysRemaining: number;
  dailyAverage: number;
}> {
  const month = getCurrentMonthKey();
  const monthly = await redis.get<CostEntry>(getGlobalMonthlyKey(month));

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysPassed = now.getDate();
  const daysRemaining = daysInMonth - daysPassed;

  const current = monthly?.cost || 0;
  const dailyAverage = daysPassed > 0 ? current / daysPassed : 0;
  const projected = current + dailyAverage * daysRemaining;

  return {
    projected,
    current,
    daysRemaining,
    dailyAverage,
  };
}

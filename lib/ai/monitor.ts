/**
 * AI Provider Monitor and Failover Module
 * Handles automatic failover between AI providers when primary fails
 * Reference: docs/security/DISASTER_RECOVERY_PLAYBOOK.md
 */

export type AIProvider = 'openai' | 'anthropic' | 'local';

export interface ProviderHealth {
  provider: AIProvider;
  healthy: boolean;
  lastCheck: Date;
  latencyMs: number;
  errorRate: number;
  consecutiveFailures: number;
}

export interface AIMonitorConfig {
  primaryProvider: AIProvider;
  fallbackProviders: AIProvider[];
  healthCheckIntervalMs: number;
  failureThreshold: number;
  errorRateThreshold: number;
  localLLMUrl?: string;
}

const DEFAULT_CONFIG: AIMonitorConfig = {
  primaryProvider: (process.env.PREFERRED_AI_PROVIDER as AIProvider) || 'openai',
  fallbackProviders: ['anthropic', 'local'],
  healthCheckIntervalMs: 30000,
  failureThreshold: 3,
  errorRateThreshold: 0.1,
  localLLMUrl: process.env.LOCAL_LLM_URL || 'http://localhost:11434',
};

class AIProviderMonitor {
  private config: AIMonitorConfig;
  private healthStatus: Map<AIProvider, ProviderHealth> = new Map();
  private currentProvider: AIProvider;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private requestCounts: Map<AIProvider, { success: number; failure: number }> =
    new Map();

  constructor(config: Partial<AIMonitorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.currentProvider = this.config.primaryProvider;
    this.initializeHealthStatus();
  }

  private initializeHealthStatus(): void {
    const allProviders = [
      this.config.primaryProvider,
      ...this.config.fallbackProviders,
    ];
    for (const provider of allProviders) {
      this.healthStatus.set(provider, {
        provider,
        healthy: true,
        lastCheck: new Date(),
        latencyMs: 0,
        errorRate: 0,
        consecutiveFailures: 0,
      });
      this.requestCounts.set(provider, { success: 0, failure: 0 });
    }
  }

  /**
   * Start the health monitoring loop
   */
  startMonitoring(): void {
    if (this.healthCheckInterval) return;

    this.healthCheckInterval = setInterval(async () => {
      await this.checkAllProviders();
    }, this.config.healthCheckIntervalMs);

    console.log('[AIMonitor] Started health monitoring');
  }

  /**
   * Stop the health monitoring loop
   */
  stopMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      console.log('[AIMonitor] Stopped health monitoring');
    }
  }

  /**
   * Check health of all providers
   */
  private async checkAllProviders(): Promise<void> {
    const providers = [
      this.config.primaryProvider,
      ...this.config.fallbackProviders,
    ];

    await Promise.all(
      providers.map((provider) => this.checkProviderHealth(provider))
    );

    // Update error rates
    this.updateErrorRates();

    // Check if we need to failover
    await this.evaluateFailover();
  }

  /**
   * Check health of a specific provider
   */
  private async checkProviderHealth(provider: AIProvider): Promise<void> {
    const startTime = Date.now();
    let healthy = false;

    try {
      healthy = await this.pingProvider(provider);
    } catch {
      healthy = false;
    }

    const latencyMs = Date.now() - startTime;
    const currentHealth = this.healthStatus.get(provider)!;

    this.healthStatus.set(provider, {
      ...currentHealth,
      healthy,
      lastCheck: new Date(),
      latencyMs,
      consecutiveFailures: healthy ? 0 : currentHealth.consecutiveFailures + 1,
    });
  }

  /**
   * Ping a provider to check if it's responsive
   */
  private async pingProvider(provider: AIProvider): Promise<boolean> {
    const testPrompt = 'ping';

    try {
      switch (provider) {
        case 'openai':
          return await this.pingOpenAI();
        case 'anthropic':
          return await this.pingAnthropic();
        case 'local':
          return await this.pingLocal();
        default:
          return false;
      }
    } catch {
      return false;
    }
  }

  private async pingOpenAI(): Promise<boolean> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return false;

    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(5000),
    });

    return response.ok;
  }

  private async pingAnthropic(): Promise<boolean> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return false;

    // Simple validation request
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'ping' }],
      }),
      signal: AbortSignal.timeout(5000),
    });

    return response.ok || response.status === 400; // 400 means API is reachable
  }

  private async pingLocal(): Promise<boolean> {
    const url = this.config.localLLMUrl;
    if (!url) return false;

    const response = await fetch(`${url}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    return response.ok;
  }

  /**
   * Update error rates based on request counts
   */
  private updateErrorRates(): void {
    for (const [provider, counts] of this.requestCounts) {
      const total = counts.success + counts.failure;
      if (total > 0) {
        const health = this.healthStatus.get(provider)!;
        health.errorRate = counts.failure / total;
        this.healthStatus.set(provider, health);
      }
    }
  }

  /**
   * Evaluate if failover is needed
   */
  private async evaluateFailover(): Promise<void> {
    const currentHealth = this.healthStatus.get(this.currentProvider);

    if (!currentHealth) return;

    const needsFailover =
      !currentHealth.healthy ||
      currentHealth.consecutiveFailures >= this.config.failureThreshold ||
      currentHealth.errorRate >= this.config.errorRateThreshold;

    if (needsFailover) {
      console.warn(
        `[AIMonitor] Provider ${this.currentProvider} unhealthy, initiating failover`
      );
      await this.failover();
    }
  }

  /**
   * Perform failover to next healthy provider
   */
  private async failover(): Promise<void> {
    const candidates = [
      this.config.primaryProvider,
      ...this.config.fallbackProviders,
    ].filter((p) => p !== this.currentProvider);

    for (const candidate of candidates) {
      const health = this.healthStatus.get(candidate);
      if (health?.healthy) {
        const oldProvider = this.currentProvider;
        this.currentProvider = candidate;
        console.log(
          `[AIMonitor] Failover: ${oldProvider} -> ${this.currentProvider}`
        );
        return;
      }
    }

    console.error('[AIMonitor] No healthy providers available!');
  }

  /**
   * Record a successful request
   */
  recordSuccess(provider?: AIProvider): void {
    const p = provider || this.currentProvider;
    const counts = this.requestCounts.get(p) || { success: 0, failure: 0 };
    counts.success++;
    this.requestCounts.set(p, counts);
  }

  /**
   * Record a failed request
   */
  recordFailure(provider?: AIProvider): void {
    const p = provider || this.currentProvider;
    const counts = this.requestCounts.get(p) || { success: 0, failure: 0 };
    counts.failure++;
    this.requestCounts.set(p, counts);

    // Check for immediate failover on high failure
    const health = this.healthStatus.get(p)!;
    health.consecutiveFailures++;
    this.healthStatus.set(p, health);

    if (health.consecutiveFailures >= this.config.failureThreshold) {
      this.evaluateFailover();
    }
  }

  /**
   * Get current active provider
   */
  getCurrentProvider(): AIProvider {
    return this.currentProvider;
  }

  /**
   * Get health status of all providers
   */
  getHealthStatus(): Map<AIProvider, ProviderHealth> {
    return new Map(this.healthStatus);
  }

  /**
   * Manually switch to a specific provider
   */
  switchProvider(provider: AIProvider): void {
    console.log(
      `[AIMonitor] Manual switch: ${this.currentProvider} -> ${provider}`
    );
    this.currentProvider = provider;
  }

  /**
   * Reset failure counts (e.g., after manual intervention)
   */
  resetFailures(provider?: AIProvider): void {
    if (provider) {
      const health = this.healthStatus.get(provider);
      if (health) {
        health.consecutiveFailures = 0;
        health.errorRate = 0;
        this.healthStatus.set(provider, health);
      }
      this.requestCounts.set(provider, { success: 0, failure: 0 });
    } else {
      for (const p of this.healthStatus.keys()) {
        this.resetFailures(p);
      }
    }
  }
}

// Singleton instance
let monitorInstance: AIProviderMonitor | null = null;

/**
 * Get or create the AI monitor instance
 */
export function getAIMonitor(
  config?: Partial<AIMonitorConfig>
): AIProviderMonitor {
  if (!monitorInstance) {
    monitorInstance = new AIProviderMonitor(config);
  }
  return monitorInstance;
}

/**
 * Handle AI outage - convenience function
 */
export async function handleAIOutage(): Promise<AIProvider> {
  const monitor = getAIMonitor();

  // Force health check
  const currentProvider = monitor.getCurrentProvider();
  monitor.recordFailure(currentProvider);

  // Get new provider
  return monitor.getCurrentProvider();
}

export { AIProviderMonitor };

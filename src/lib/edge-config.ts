/**
 * Vercel Edge Config - Dynamic Configuration Without Deployment
 *
 * Allows updating alert thresholds, feature flags, and other runtime config
 * without requiring a full deployment. Perfect for A/B testing and gradual rollouts.
 *
 * Setup:
 * 1. Install: pnpm add @vercel/edge-config
 * 2. Create Edge Config in Vercel dashboard
 * 3. Set EDGE_CONFIG environment variable
 * 4. Update values via Vercel CLI or dashboard
 *
 * Example CLI usage:
 * vercel env pull
 * vercel edge-config write watchlist_min_change_percent 3.5
 *
 * Reference: knowledge-04-devops-vercel-advanced.md
 */

/**
 * Watchlist alert configuration
 * Falls back to sensible defaults if Edge Config is unavailable
 */
export const WatchlistConfig = {
  /**
   * Minimum price change percentage to trigger an alert
   * Default: 5% (prevents spam from minor fluctuations)
   */
  getMinChangePercent: async (): Promise<number> => {
    try {
      // Try to load Edge Config dynamically (only available in production)
      const { get } = await import('@vercel/edge-config');
      const value = await get<number>('watchlist_min_change_percent');
      return value ?? 5;
    } catch (error) {
      // Edge Config not available (dev environment or not configured)
      return 5;
    }
  },

  /**
   * Cooldown period in minutes between repeated alerts for the same card
   * Default: 60 minutes (prevents alert fatigue)
   */
  getCooldownMinutes: async (): Promise<number> => {
    try {
      const { get } = await import('@vercel/edge-config');
      const value = await get<number>('watchlist_cooldown_minutes');
      return value ?? 60;
    } catch (error) {
      return 60;
    }
  },

  /**
   * Maximum number of watchlist items per user
   * Default: 50 (free tier), can be increased via Edge Config for pro users
   */
  getMaxItemsPerUser: async (): Promise<number> => {
    try {
      const { get } = await import('@vercel/edge-config');
      const value = await get<number>('watchlist_max_items');
      return value ?? 50;
    } catch (error) {
      return 50;
    }
  },

  /**
   * Enable/disable web push notifications
   * Default: true
   */
  isPushEnabled: async (): Promise<boolean> => {
    try {
      const { get } = await import('@vercel/edge-config');
      const value = await get<boolean>('watchlist_push_enabled');
      return value ?? true;
    } catch (error) {
      return true;
    }
  },

  /**
   * Enable/disable email notifications
   * Default: true
   */
  isEmailEnabled: async (): Promise<boolean> => {
    try {
      const { get } = await import('@vercel/edge-config');
      const value = await get<boolean>('watchlist_email_enabled');
      return value ?? true;
    } catch (error) {
      return true;
    }
  },
};

/**
 * Feature flags for gradual rollouts
 */
export const FeatureFlags = {
  /**
   * Enable watchlist system globally
   */
  isWatchlistEnabled: async (): Promise<boolean> => {
    try {
      const { get } = await import('@vercel/edge-config');
      const value = await get<boolean>('feature_watchlist_enabled');
      return value ?? true;
    } catch (error) {
      return true;
    }
  },

  /**
   * Enable SSE streaming for real-time updates
   */
  isStreamingEnabled: async (): Promise<boolean> => {
    try {
      const { get } = await import('@vercel/edge-config');
      const value = await get<boolean>('feature_streaming_enabled');
      return value ?? true;
    } catch (error) {
      return true;
    }
  },
};

/**
 * Helper to check if Edge Config is available
 */
export async function isEdgeConfigAvailable(): Promise<boolean> {
  try {
    const { get } = await import('@vercel/edge-config');
    await get('_health_check');
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Session Tracker with Redis Heartbeat
 *
 * Tracks active session time using:
 * - Page Visibility API (pauses when tab is hidden)
 * - Client-side heartbeat (1s intervals to localStorage)
 * - Server-side heartbeat (2s intervals to Redis)
 * - Triggers reality check modal every 2 hours of active time
 *
 * Success criteria:
 * - Modal cannot be closed until 10s countdown completes
 * - Cannot be disabled in settings
 * - Forced via Redis pub/sub + SSE
 */

const HEARTBEAT_INTERVAL = 1000; // 1 second (client-side)
const REDIS_HEARTBEAT_INTERVAL = 2000; // 2 seconds (server-side)
const REALITY_CHECK_INTERVAL = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
const STORAGE_KEY = 'apex_session_activity';

export interface SessionData {
  startTime: number;
  totalActiveTime: number; // Total active milliseconds
  lastHeartbeat: number;
  lastRealityCheck: number; // Last time reality check was shown
  lastRedisSync: number; // Last time synced to Redis
}

export type RealityCheckCallback = (sessionData: SessionData) => void;

class SessionTracker {
  private sessionData: SessionData;
  private heartbeatTimer: number | null = null;
  private redisHeartbeatTimer: number | null = null;
  private isPageVisible: boolean = true;
  private realityCheckCallback: RealityCheckCallback | null = null;
  private userId: string | null = null;

  constructor() {
    // Load or initialize session data
    this.sessionData = this.loadSessionData();

    // Get or create user ID
    this.userId = this.getUserId();

    // Set up page visibility listener
    this.setupVisibilityListener();

    // Start heartbeats
    this.startHeartbeat();
    this.startRedisHeartbeat();
  }

  /**
   * Get or create a unique user ID from cookies
   */
  private getUserId(): string {
    if (typeof document === 'undefined') return 'anonymous';

    // Try to get existing client ID from cookie
    const match = document.cookie.match(/apex_client_id=([^;]+)/);
    if (match) {
      return match[1];
    }

    // Create new client ID
    const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Set cookie with 1 year expiry
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `apex_client_id=${clientId}; expires=${expires.toUTCString()}; path=/; SameSite=Strict`;

    return clientId;
  }

  /**
   * Load session data from localStorage or create new session
   */
  private loadSessionData(): SessionData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as SessionData;
        // Validate data
        if (data.startTime && data.totalActiveTime !== undefined) {
          // Update lastHeartbeat to now
          data.lastHeartbeat = Date.now();
          data.lastRedisSync = data.lastRedisSync || Date.now();
          return data;
        }
      }
    } catch (error) {
      console.error('Failed to load session data:', error);
    }

    // Create new session
    const now = Date.now();
    return {
      startTime: now,
      totalActiveTime: 0,
      lastHeartbeat: now,
      lastRealityCheck: 0,
      lastRedisSync: now,
    };
  }

  /**
   * Save session data to localStorage
   */
  private saveSessionData(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.sessionData));
    } catch (error) {
      console.error('Failed to save session data:', error);
    }
  }

  /**
   * Set up page visibility API listener
   */
  private setupVisibilityListener(): void {
    if (typeof document === 'undefined') return;

    // Check initial visibility state
    this.isPageVisible = document.visibilityState === 'visible';

    // Listen for visibility changes
    document.addEventListener('visibilitychange', () => {
      this.isPageVisible = document.visibilityState === 'visible';

      if (this.isPageVisible) {
        // Page became visible - update last heartbeat and sync to Redis
        this.sessionData.lastHeartbeat = Date.now();
        this.syncToRedis();
      }
    });
  }

  /**
   * Start the client-side heartbeat timer
   */
  private startHeartbeat(): void {
    if (typeof window === 'undefined') return;

    this.heartbeatTimer = window.setInterval(() => {
      if (this.isPageVisible) {
        // Increment active time
        this.sessionData.totalActiveTime += HEARTBEAT_INTERVAL;
        this.sessionData.lastHeartbeat = Date.now();

        // Save to localStorage
        this.saveSessionData();

        // Check if we need to trigger reality check
        this.checkRealityCheck();
      }
    }, HEARTBEAT_INTERVAL);
  }

  /**
   * Start the Redis heartbeat timer (server-side sync)
   */
  private startRedisHeartbeat(): void {
    if (typeof window === 'undefined') return;

    this.redisHeartbeatTimer = window.setInterval(() => {
      if (this.isPageVisible) {
        this.syncToRedis();
      }
    }, REDIS_HEARTBEAT_INTERVAL);
  }

  /**
   * Sync session data to Redis via API endpoint
   */
  private async syncToRedis(): Promise<void> {
    if (!this.userId) return;

    try {
      const response = await fetch('/api/session/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.userId,
          totalActiveTime: this.sessionData.totalActiveTime,
          lastHeartbeat: this.sessionData.lastHeartbeat,
        }),
        // Don't wait for response, fire and forget
        keepalive: true,
      });

      if (response.ok) {
        this.sessionData.lastRedisSync = Date.now();
        this.saveSessionData();
      }
    } catch (error) {
      // Silently fail - don't interrupt user experience
      console.debug('Redis heartbeat failed:', error);
    }
  }

  /**
   * Check if reality check should be triggered
   */
  private checkRealityCheck(): void {
    const timeSinceLastCheck = this.sessionData.totalActiveTime - this.sessionData.lastRealityCheck;

    if (timeSinceLastCheck >= REALITY_CHECK_INTERVAL) {
      // Trigger reality check
      this.sessionData.lastRealityCheck = this.sessionData.totalActiveTime;
      this.saveSessionData();

      // Call callback if set
      if (this.realityCheckCallback) {
        this.realityCheckCallback(this.getSessionData());
      }
    }
  }

  /**
   * Register callback for reality check trigger
   */
  public onRealityCheck(callback: RealityCheckCallback): void {
    this.realityCheckCallback = callback;
  }

  /**
   * Get current session data
   */
  public getSessionData(): SessionData {
    return { ...this.sessionData };
  }

  /**
   * Get formatted active time string
   */
  public getFormattedActiveTime(): string {
    const totalMinutes = Math.floor(this.sessionData.totalActiveTime / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Get active time in hours (decimal)
   */
  public getActiveHours(): number {
    return this.sessionData.totalActiveTime / (60 * 60 * 1000);
  }

  /**
   * Get user ID
   */
  public getUserId(): string | null {
    return this.userId;
  }

  /**
   * Reset session (for testing purposes)
   */
  public resetSession(): void {
    const now = Date.now();
    this.sessionData = {
      startTime: now,
      totalActiveTime: 0,
      lastHeartbeat: now,
      lastRealityCheck: 0,
      lastRedisSync: now,
    };
    this.saveSessionData();
    this.syncToRedis();
  }

  /**
   * Stop tracking (cleanup)
   */
  public stop(): void {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.redisHeartbeatTimer !== null) {
      clearInterval(this.redisHeartbeatTimer);
      this.redisHeartbeatTimer = null;
    }
    this.saveSessionData();
    this.syncToRedis();
  }
}

// Global singleton instance
let trackerInstance: SessionTracker | null = null;

/**
 * Get or create the session tracker instance
 */
export function getSessionTracker(): SessionTracker {
  if (typeof window === 'undefined') {
    // Server-side rendering - return a mock tracker
    return {
      onRealityCheck: () => {},
      getSessionData: () => ({
        startTime: Date.now(),
        totalActiveTime: 0,
        lastHeartbeat: Date.now(),
        lastRealityCheck: 0,
        lastRedisSync: Date.now(),
      }),
      getFormattedActiveTime: () => '0m',
      getActiveHours: () => 0,
      getUserId: () => null,
      resetSession: () => {},
      stop: () => {},
    } as SessionTracker;
  }

  if (!trackerInstance) {
    trackerInstance = new SessionTracker();

    // Expose globally for testing/debugging
    if (typeof window !== 'undefined') {
      (window as any).__APEX_SESSION_TRACKER__ = trackerInstance;
    }
  }

  return trackerInstance;
}

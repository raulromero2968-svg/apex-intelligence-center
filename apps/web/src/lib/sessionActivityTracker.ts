/**
 * Session Activity Tracker
 *
 * Tracks active session time using:
 * - Page Visibility API (pauses when tab is hidden)
 * - Heartbeat mechanism (1s intervals)
 * - LocalStorage persistence (survives page refreshes)
 *
 * Triggers reality check modal every 2 hours of active time.
 */

const HEARTBEAT_INTERVAL = 1000; // 1 second
const REALITY_CHECK_INTERVAL = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
const STORAGE_KEY = 'apex_session_activity';

export interface SessionData {
  startTime: number;
  totalActiveTime: number; // Total active milliseconds
  lastHeartbeat: number;
  lastRealityCheck: number; // Last time reality check was shown
}

export type RealityCheckCallback = (sessionData: SessionData) => void;

class SessionActivityTracker {
  private sessionData: SessionData;
  private heartbeatTimer: number | null = null;
  private isPageVisible: boolean = true;
  private realityCheckCallback: RealityCheckCallback | null = null;

  constructor() {
    // Load or initialize session data
    this.sessionData = this.loadSessionData();

    // Set up page visibility listener
    this.setupVisibilityListener();

    // Start heartbeat
    this.startHeartbeat();
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
        // Page became visible - update last heartbeat
        this.sessionData.lastHeartbeat = Date.now();
      }
    });
  }

  /**
   * Start the heartbeat timer
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
   * Reset session (for testing purposes)
   */
  public resetSession(): void {
    const now = Date.now();
    this.sessionData = {
      startTime: now,
      totalActiveTime: 0,
      lastHeartbeat: now,
      lastRealityCheck: 0,
    };
    this.saveSessionData();
  }

  /**
   * Stop tracking (cleanup)
   */
  public stop(): void {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.saveSessionData();
  }
}

// Global singleton instance
let trackerInstance: SessionActivityTracker | null = null;

/**
 * Get or create the session activity tracker instance
 */
export function getSessionTracker(): SessionActivityTracker {
  if (typeof window === 'undefined') {
    // Server-side rendering - return a mock tracker
    return {
      onRealityCheck: () => {},
      getSessionData: () => ({
        startTime: Date.now(),
        totalActiveTime: 0,
        lastHeartbeat: Date.now(),
        lastRealityCheck: 0,
      }),
      getFormattedActiveTime: () => '0m',
      getActiveHours: () => 0,
      resetSession: () => {},
      stop: () => {},
    } as SessionActivityTracker;
  }

  if (!trackerInstance) {
    trackerInstance = new SessionActivityTracker();

    // Expose globally for testing/debugging
    if (typeof window !== 'undefined') {
      (window as any).__APEX_SESSION_TRACKER__ = trackerInstance;
    }
  }

  return trackerInstance;
}

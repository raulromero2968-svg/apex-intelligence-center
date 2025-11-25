/**
 * Resilient Mobile-Defense Sync
 *
 * DDIL-aware synchronization for mobile devices.
 * Integrates knowledge-08 (mobile) with pack-ai-defense-001 (defense).
 *
 * Features:
 * - Offline-first sync with delta operations
 * - DDIL (Denied, Degraded, Intermittent, Limited) detection
 * - Automatic retry with exponential backoff
 * - Conflict resolution strategies
 * - Performance monitoring
 */

// ============================================================================
// TYPES
// ============================================================================

export type SyncStatus = 'idle' | 'syncing' | 'queued' | 'failed' | 'success';
export type OperationType = 'insert' | 'update' | 'delete';
export type ConflictStrategy = 'client_wins' | 'server_wins' | 'latest_wins' | 'merge';
export type ConnectionState = 'online' | 'offline' | 'degraded' | 'disrupted';

export interface SyncOperation {
  id: string;
  type: OperationType;
  table: string;
  data: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
  priority: number;
}

export interface SyncDelta {
  table: string;
  operations: SyncOperation[];
  deviceId: string;
  timestamp: number;
}

export interface SyncResult {
  status: SyncStatus;
  synced: number;
  queued: number;
  failed: number;
  conflicts: number;
  latencyMs: number;
  message: string;
}

export interface ConnectionStatus {
  state: ConnectionState;
  latencyMs: number;
  bandwidth: number; // kbps
  lastChecked: Date;
  edgeNodeStatus?: 'active' | 'degraded' | 'disrupted';
}

export interface SyncConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  batchSize: number;
  conflictStrategy: ConflictStrategy;
  priorityTables: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const DEFAULT_SYNC_CONFIG: SyncConfig = {
  maxRetries: 5,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  batchSize: 50,
  conflictStrategy: 'latest_wins',
  priorityTables: ['sensorData', 'alertEvents', 'threatIntelligence'],
};

export const DDIL_THRESHOLDS = {
  degraded: { latencyMs: 2000, bandwidth: 100 },
  disrupted: { latencyMs: 10000, bandwidth: 10 },
};

// ============================================================================
// CONNECTION MONITORING
// ============================================================================

/**
 * Check connection status
 */
export async function checkConnectionStatus(): Promise<ConnectionStatus> {
  const startTime = performance.now();

  try {
    // Simulate connection check (in production, ping actual endpoints)
    const response = await Promise.race([
      fetch('/api/health', { method: 'HEAD' }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 5000)
      ),
    ]);

    const latencyMs = performance.now() - startTime;

    // Estimate bandwidth (simplified)
    const bandwidth = latencyMs < 100 ? 1000 : latencyMs < 500 ? 500 : latencyMs < 2000 ? 100 : 10;

    let state: ConnectionState;
    if (latencyMs < DDIL_THRESHOLDS.degraded.latencyMs) {
      state = 'online';
    } else if (latencyMs < DDIL_THRESHOLDS.disrupted.latencyMs) {
      state = 'degraded';
    } else {
      state = 'disrupted';
    }

    return {
      state,
      latencyMs,
      bandwidth,
      lastChecked: new Date(),
    };
  } catch {
    return {
      state: 'offline',
      latencyMs: -1,
      bandwidth: 0,
      lastChecked: new Date(),
    };
  }
}

/**
 * Detect DDIL condition
 */
export function detectDdilCondition(status: ConnectionStatus): {
  isDdil: boolean;
  severity: 'none' | 'degraded' | 'disrupted' | 'denied';
  recommendation: string;
} {
  if (status.state === 'offline') {
    return {
      isDdil: true,
      severity: 'denied',
      recommendation: 'Queue all operations locally. Enable offline mode.',
    };
  }

  if (status.state === 'disrupted') {
    return {
      isDdil: true,
      severity: 'disrupted',
      recommendation: 'Use minimal sync. Prioritize critical data only.',
    };
  }

  if (status.state === 'degraded') {
    return {
      isDdil: true,
      severity: 'degraded',
      recommendation: 'Reduce sync frequency. Batch operations.',
    };
  }

  return {
    isDdil: false,
    severity: 'none',
    recommendation: 'Normal sync operations.',
  };
}

// ============================================================================
// SYNC QUEUE MANAGEMENT
// ============================================================================

// In-memory queue (in production, use persistent storage)
let syncQueue: SyncOperation[] = [];

/**
 * Add operation to sync queue
 */
export function queueOperation(operation: Omit<SyncOperation, 'id' | 'retryCount'>): SyncOperation {
  const op: SyncOperation = {
    ...operation,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    retryCount: 0,
  };

  syncQueue.push(op);

  // Sort by priority (higher first) and timestamp (older first)
  syncQueue.sort((a, b) => {
    if (a.priority !== b.priority) return b.priority - a.priority;
    return a.timestamp - b.timestamp;
  });

  return op;
}

/**
 * Get pending operations
 */
export function getPendingOperations(limit?: number): SyncOperation[] {
  const pending = syncQueue.filter((op) => op.retryCount < DEFAULT_SYNC_CONFIG.maxRetries);
  return limit ? pending.slice(0, limit) : pending;
}

/**
 * Remove operation from queue
 */
export function removeFromQueue(operationId: string): boolean {
  const index = syncQueue.findIndex((op) => op.id === operationId);
  if (index !== -1) {
    syncQueue.splice(index, 1);
    return true;
  }
  return false;
}

/**
 * Clear failed operations
 */
export function clearFailedOperations(): number {
  const failed = syncQueue.filter((op) => op.retryCount >= DEFAULT_SYNC_CONFIG.maxRetries);
  syncQueue = syncQueue.filter((op) => op.retryCount < DEFAULT_SYNC_CONFIG.maxRetries);
  return failed.length;
}

// ============================================================================
// SYNC EXECUTION
// ============================================================================

/**
 * Calculate exponential backoff delay
 */
export function calculateBackoff(retryCount: number, config: SyncConfig = DEFAULT_SYNC_CONFIG): number {
  const delay = config.baseDelayMs * Math.pow(2, retryCount);
  return Math.min(delay, config.maxDelayMs);
}

/**
 * Execute single sync operation
 */
async function executeSyncOperation(
  operation: SyncOperation,
  endpoint: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(operation),
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Resilient mobile sync with DDIL awareness
 */
export async function resilientMobileSync(
  delta: SyncDelta,
  config: SyncConfig = DEFAULT_SYNC_CONFIG
): Promise<SyncResult> {
  const startTime = performance.now();
  let synced = 0;
  let queued = 0;
  let failed = 0;
  let conflicts = 0;

  // Check connection status
  const connectionStatus = await checkConnectionStatus();
  const ddilCondition = detectDdilCondition(connectionStatus);

  // If DDIL detected, queue for later
  if (ddilCondition.isDdil && ddilCondition.severity !== 'degraded') {
    for (const op of delta.operations) {
      const priority = config.priorityTables.includes(delta.table) ? 10 : 1;
      queueOperation({ ...op, table: delta.table, priority });
      queued++;
    }

    return {
      status: 'queued',
      synced: 0,
      queued,
      failed: 0,
      conflicts: 0,
      latencyMs: performance.now() - startTime,
      message: `DDIL detected (${ddilCondition.severity}): ${ddilCondition.recommendation}`,
    };
  }

  // Process operations
  for (const operation of delta.operations) {
    const result = await executeSyncOperation(operation, `/api/sync/${delta.table}`);

    if (result.success) {
      synced++;
      removeFromQueue(operation.id);
    } else {
      // Handle conflict
      if (result.error?.includes('conflict')) {
        conflicts++;
        // Apply conflict resolution strategy
        await resolveConflict(operation, config.conflictStrategy);
      } else {
        // Queue for retry
        operation.retryCount++;
        if (operation.retryCount < config.maxRetries) {
          queueOperation({ ...operation, table: delta.table, priority: 5 });
          queued++;
        } else {
          failed++;
        }
      }
    }
  }

  // Log performance metrics
  const latencyMs = performance.now() - startTime;
  await logSyncMetrics({
    table: delta.table,
    synced,
    queued,
    failed,
    conflicts,
    latencyMs,
    connectionState: connectionStatus.state,
  });

  return {
    status: failed > 0 ? 'failed' : queued > 0 ? 'queued' : 'success',
    synced,
    queued,
    failed,
    conflicts,
    latencyMs,
    message: `Sync completed: ${synced} synced, ${queued} queued, ${failed} failed`,
  };
}

// ============================================================================
// CONFLICT RESOLUTION
// ============================================================================

/**
 * Resolve sync conflict
 */
async function resolveConflict(
  operation: SyncOperation,
  strategy: ConflictStrategy
): Promise<void> {
  switch (strategy) {
    case 'client_wins':
      // Force client version
      await executeSyncOperation(
        { ...operation, data: { ...operation.data, _forceOverwrite: true } },
        `/api/sync/${operation.table}`
      );
      break;

    case 'server_wins':
      // Discard client changes
      removeFromQueue(operation.id);
      break;

    case 'latest_wins':
      // Compare timestamps and keep latest
      // This would require fetching server version
      break;

    case 'merge':
      // Merge changes (field-level)
      // Complex merge logic here
      break;
  }
}

// ============================================================================
// METRICS & MONITORING
// ============================================================================

interface SyncMetrics {
  table: string;
  synced: number;
  queued: number;
  failed: number;
  conflicts: number;
  latencyMs: number;
  connectionState: ConnectionState;
}

/**
 * Log sync metrics for monitoring
 */
async function logSyncMetrics(metrics: SyncMetrics): Promise<void> {
  // In production, send to analytics/monitoring
  console.log('Sync metrics:', {
    ...metrics,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Get sync health status
 */
export function getSyncHealthStatus(): {
  queueSize: number;
  failedCount: number;
  oldestPending: Date | null;
  isHealthy: boolean;
} {
  const pending = getPendingOperations();
  const failed = syncQueue.filter((op) => op.retryCount >= DEFAULT_SYNC_CONFIG.maxRetries);

  const oldestTimestamp = pending.length > 0 ? Math.min(...pending.map((op) => op.timestamp)) : null;

  return {
    queueSize: pending.length,
    failedCount: failed.length,
    oldestPending: oldestTimestamp ? new Date(oldestTimestamp) : null,
    isHealthy: pending.length < 100 && failed.length < 10,
  };
}

// ============================================================================
// OFFLINE STORAGE
// ============================================================================

/**
 * Persist queue to local storage
 */
export function persistQueue(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('syncQueue', JSON.stringify(syncQueue));
  }
}

/**
 * Restore queue from local storage
 */
export function restoreQueue(): void {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('syncQueue');
    if (stored) {
      try {
        syncQueue = JSON.parse(stored);
      } catch {
        syncQueue = [];
      }
    }
  }
}

/**
 * Process queued operations when back online
 */
export async function processQueue(
  config: SyncConfig = DEFAULT_SYNC_CONFIG
): Promise<SyncResult> {
  const pending = getPendingOperations(config.batchSize);

  if (pending.length === 0) {
    return {
      status: 'idle',
      synced: 0,
      queued: 0,
      failed: 0,
      conflicts: 0,
      latencyMs: 0,
      message: 'No pending operations',
    };
  }

  // Group by table
  const byTable = new Map<string, SyncOperation[]>();
  for (const op of pending) {
    const existing = byTable.get(op.table) || [];
    existing.push(op);
    byTable.set(op.table, existing);
  }

  // Process each table
  let totalResult: SyncResult = {
    status: 'success',
    synced: 0,
    queued: 0,
    failed: 0,
    conflicts: 0,
    latencyMs: 0,
    message: '',
  };

  for (const [table, operations] of byTable) {
    const result = await resilientMobileSync(
      { table, operations, deviceId: 'device', timestamp: Date.now() },
      config
    );

    totalResult.synced += result.synced;
    totalResult.queued += result.queued;
    totalResult.failed += result.failed;
    totalResult.conflicts += result.conflicts;
    totalResult.latencyMs += result.latencyMs;
  }

  // Persist updated queue
  persistQueue();

  totalResult.message = `Processed ${pending.length} operations: ${totalResult.synced} synced`;
  return totalResult;
}

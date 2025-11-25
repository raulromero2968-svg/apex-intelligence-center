/**
 * @apex/core/sync
 *
 * Resilient synchronization primitives for DDIL (Denied, Degraded, Intermittent, Limited) environments.
 * Supports offline-first patterns with automatic conflict resolution.
 */

// ============================================================================
// TYPES
// ============================================================================

export type ConnectionStatus = 'online' | 'degraded' | 'offline' | 'limited';
export type SyncState = 'idle' | 'syncing' | 'queued' | 'error' | 'conflict';
export type ConflictStrategy = 'client-wins' | 'server-wins' | 'merge' | 'manual';

export interface SyncOperation<T = unknown> {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string;
  data: T;
  timestamp: Date;
  retryCount: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
}

export interface SyncResult {
  success: boolean;
  operationId: string;
  syncedAt?: Date;
  error?: string;
  conflict?: ConflictInfo;
}

export interface ConflictInfo {
  localData: unknown;
  remoteData: unknown;
  strategy: ConflictStrategy;
  resolved: boolean;
}

export interface DDILStatus {
  connection: ConnectionStatus;
  latencyMs: number;
  packetLoss: number;
  bandwidth: 'high' | 'medium' | 'low' | 'minimal';
  lastCheck: Date;
}

export interface SyncQueueStats {
  pending: number;
  syncing: number;
  failed: number;
  completed: number;
  oldestPending?: Date;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff
export const MAX_RETRIES = 5;
export const SYNC_BATCH_SIZE = 50;
export const OFFLINE_QUEUE_LIMIT = 1000;

export const DDIL_THRESHOLDS = {
  online: { latencyMs: 100, packetLoss: 0.01 },
  degraded: { latencyMs: 500, packetLoss: 0.05 },
  limited: { latencyMs: 2000, packetLoss: 0.15 },
  offline: { latencyMs: Infinity, packetLoss: 1 },
};

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Detect DDIL status from network metrics
 */
export function detectDDILStatus(latencyMs: number, packetLoss: number): ConnectionStatus {
  if (packetLoss >= DDIL_THRESHOLDS.offline.packetLoss) return 'offline';
  if (latencyMs >= DDIL_THRESHOLDS.limited.latencyMs || packetLoss >= DDIL_THRESHOLDS.limited.packetLoss) return 'limited';
  if (latencyMs >= DDIL_THRESHOLDS.degraded.latencyMs || packetLoss >= DDIL_THRESHOLDS.degraded.packetLoss) return 'degraded';
  return 'online';
}

/**
 * Create sync operation
 */
export function createSyncOperation<T>(
  type: SyncOperation['type'],
  entity: string,
  data: T,
  priority: SyncOperation['priority'] = 'normal'
): SyncOperation<T> {
  return {
    id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    entity,
    data,
    timestamp: new Date(),
    retryCount: 0,
    priority,
  };
}

/**
 * Get retry delay with exponential backoff
 */
export function getRetryDelay(retryCount: number): number {
  return RETRY_DELAYS[Math.min(retryCount, RETRY_DELAYS.length - 1)];
}

/**
 * Check if operation should be retried
 */
export function shouldRetry(operation: SyncOperation): boolean {
  return operation.retryCount < MAX_RETRIES;
}

/**
 * Resolve conflict between local and remote data
 */
export function resolveConflict<T>(
  local: T & { updatedAt: Date },
  remote: T & { updatedAt: Date },
  strategy: ConflictStrategy
): { resolved: T; strategy: ConflictStrategy } {
  switch (strategy) {
    case 'client-wins':
      return { resolved: local, strategy };

    case 'server-wins':
      return { resolved: remote, strategy };

    case 'merge':
      // Simple merge: newer timestamp wins for each field
      const merged = { ...remote };
      if (local.updatedAt > remote.updatedAt) {
        Object.assign(merged, local);
      }
      return { resolved: merged as T, strategy };

    case 'manual':
    default:
      // Return local but mark as unresolved
      return { resolved: local, strategy: 'manual' };
  }
}

/**
 * Prioritize operations for sync
 */
export function prioritizeOperations(operations: SyncOperation[]): SyncOperation[] {
  const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
  return [...operations].sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return a.timestamp.getTime() - b.timestamp.getTime();
  });
}

/**
 * Simple in-memory sync queue manager
 */
export class SyncQueue {
  private queue: SyncOperation[] = [];
  private processing = new Set<string>();

  enqueue<T>(operation: SyncOperation<T>): void {
    if (this.queue.length >= OFFLINE_QUEUE_LIMIT) {
      // Remove oldest low-priority operation
      const lowPriorityIdx = this.queue.findIndex((op) => op.priority === 'low');
      if (lowPriorityIdx >= 0) {
        this.queue.splice(lowPriorityIdx, 1);
      }
    }
    this.queue.push(operation as SyncOperation);
  }

  dequeue(count: number = SYNC_BATCH_SIZE): SyncOperation[] {
    const sorted = prioritizeOperations(this.queue);
    const batch = sorted.slice(0, count).filter((op) => !this.processing.has(op.id));
    batch.forEach((op) => this.processing.add(op.id));
    return batch;
  }

  complete(operationId: string): void {
    this.queue = this.queue.filter((op) => op.id !== operationId);
    this.processing.delete(operationId);
  }

  retry(operation: SyncOperation): void {
    operation.retryCount++;
    this.processing.delete(operation.id);
  }

  getStats(): SyncQueueStats {
    return {
      pending: this.queue.length - this.processing.size,
      syncing: this.processing.size,
      failed: this.queue.filter((op) => op.retryCount >= MAX_RETRIES).length,
      completed: 0,
      oldestPending: this.queue[0]?.timestamp,
    };
  }
}

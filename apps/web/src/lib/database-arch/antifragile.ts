/**
 * Antifragile Database Architecture
 *
 * Implements multi-region replication monitoring, backup/recovery utilities,
 * and migration path support for PostgreSQL to YugabyteDB evolution.
 *
 * @see Antifragile Database Architecture Spec v1.0
 */

import { sql } from 'drizzle-orm';
import { db, pool } from '@/db';
import * as Sentry from '@sentry/nextjs';

// =============================================================================
// REPLICATION MONITORING
// =============================================================================

/**
 * Replication status information from pg_stat_replication
 */
export interface ReplicationStatus {
  /** Client address of the replica */
  clientAddr: string | null;
  /** Application name of the replica */
  applicationName: string;
  /** Current replication state */
  state: 'startup' | 'catchup' | 'streaming' | 'backup' | 'stopping';
  /** Sync state: async, sync, potential, quorum */
  syncState: string;
  /** Bytes behind primary */
  lagBytes: number;
  /** Estimated lag in seconds (approximate) */
  lagSeconds: number;
  /** Last WAL position sent */
  sentLsn: string | null;
  /** Last WAL position written on replica */
  writeLsn: string | null;
  /** Last WAL position flushed on replica */
  flushLsn: string | null;
  /** Last WAL position replayed on replica */
  replayLsn: string | null;
}

/**
 * Database health status
 */
export interface DatabaseHealth {
  status: 'healthy' | 'degraded' | 'critical';
  isPrimary: boolean;
  isInRecovery: boolean;
  replicationLag: number | null;
  replicas: ReplicationStatus[];
  lastCheckAt: Date;
  warnings: string[];
}

/**
 * Thresholds for replication lag alerts (in bytes)
 */
export const REPLICATION_LAG_THRESHOLDS = {
  /** Warning threshold: 100MB */
  warning: 100 * 1024 * 1024,
  /** Critical threshold: 1GB */
  critical: 1024 * 1024 * 1024,
} as const;

/**
 * Check if the current database is in recovery mode (replica)
 */
export async function isInRecovery(): Promise<boolean> {
  try {
    const result = await db.execute<{ in_recovery: boolean }>(
      sql`SELECT pg_is_in_recovery() as in_recovery`
    );
    return result.rows[0]?.in_recovery ?? false;
  } catch (error) {
    Sentry.captureException(error, { tags: { component: 'antifragile-db' } });
    throw new Error('Failed to check recovery status');
  }
}

/**
 * Get replication lag in bytes for a replica
 * Returns null if not a replica or if lag cannot be determined
 */
export async function getReplicationLagBytes(): Promise<number | null> {
  try {
    const isReplica = await isInRecovery();
    if (!isReplica) {
      return null; // Primary has no lag
    }

    // Calculate lag as difference between received and replayed LSN
    const result = await db.execute<{ lag: string | null }>(
      sql`SELECT pg_wal_lsn_diff(pg_last_wal_receive_lsn(), pg_last_wal_replay_lsn()) as lag`
    );

    const lag = result.rows[0]?.lag;
    return lag ? parseInt(lag, 10) : 0;
  } catch (error) {
    Sentry.captureException(error, { tags: { component: 'antifragile-db' } });
    console.error('[antifragile] Replication lag check failed:', error);
    return null;
  }
}

/**
 * Get replication lag in seconds (estimated based on WAL write rate)
 */
export async function getReplicationLagSeconds(): Promise<number | null> {
  try {
    const isReplica = await isInRecovery();
    if (!isReplica) {
      return null;
    }

    const result = await db.execute<{ lag_seconds: string | null }>(
      sql`
        SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()))::integer as lag_seconds
        WHERE pg_last_xact_replay_timestamp() IS NOT NULL
      `
    );

    const lag = result.rows[0]?.lag_seconds;
    return lag ? parseInt(lag, 10) : 0;
  } catch (error) {
    Sentry.captureException(error, { tags: { component: 'antifragile-db' } });
    return null;
  }
}

/**
 * Get status of all streaming replicas (for primary only)
 */
export async function getReplicaStatuses(): Promise<ReplicationStatus[]> {
  try {
    const isReplica = await isInRecovery();
    if (isReplica) {
      return []; // Replicas don't have replicas
    }

    const result = await db.execute<{
      client_addr: string | null;
      application_name: string;
      state: string;
      sync_state: string;
      sent_lsn: string | null;
      write_lsn: string | null;
      flush_lsn: string | null;
      replay_lsn: string | null;
      lag_bytes: string | null;
    }>(sql`
      SELECT
        client_addr,
        application_name,
        state,
        sync_state,
        sent_lsn::text,
        write_lsn::text,
        flush_lsn::text,
        replay_lsn::text,
        pg_wal_lsn_diff(sent_lsn, replay_lsn)::bigint as lag_bytes
      FROM pg_stat_replication
      ORDER BY client_addr
    `);

    return result.rows.map((row) => ({
      clientAddr: row.client_addr,
      applicationName: row.application_name || 'unknown',
      state: row.state as ReplicationStatus['state'],
      syncState: row.sync_state || 'unknown',
      sentLsn: row.sent_lsn,
      writeLsn: row.write_lsn,
      flushLsn: row.flush_lsn,
      replayLsn: row.replay_lsn,
      lagBytes: row.lag_bytes ? parseInt(row.lag_bytes, 10) : 0,
      // Estimate: assume 100MB/s WAL write rate
      lagSeconds: row.lag_bytes
        ? Math.round(parseInt(row.lag_bytes, 10) / (100 * 1024 * 1024))
        : 0,
    }));
  } catch (error) {
    Sentry.captureException(error, { tags: { component: 'antifragile-db' } });
    console.error('[antifragile] Failed to get replica statuses:', error);
    return [];
  }
}

/**
 * Comprehensive database health check
 * Returns status suitable for API health endpoints
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  const warnings: string[] = [];
  let status: DatabaseHealth['status'] = 'healthy';

  try {
    const isReplica = await isInRecovery();
    const lagBytes = await getReplicationLagBytes();
    const replicas = await getReplicaStatuses();

    // Check replication lag for replicas
    if (isReplica && lagBytes !== null) {
      if (lagBytes > REPLICATION_LAG_THRESHOLDS.critical) {
        status = 'critical';
        warnings.push(`Replication lag critical: ${formatBytes(lagBytes)}`);
      } else if (lagBytes > REPLICATION_LAG_THRESHOLDS.warning) {
        status = 'degraded';
        warnings.push(`Replication lag warning: ${formatBytes(lagBytes)}`);
      }
    }

    // Check replica health for primaries
    if (!isReplica && replicas.length > 0) {
      for (const replica of replicas) {
        if (replica.state !== 'streaming') {
          status = status === 'critical' ? 'critical' : 'degraded';
          warnings.push(
            `Replica ${replica.clientAddr || replica.applicationName} not streaming: ${replica.state}`
          );
        }
        if (replica.lagBytes > REPLICATION_LAG_THRESHOLDS.critical) {
          status = 'critical';
          warnings.push(
            `Replica ${replica.clientAddr || replica.applicationName} lag critical: ${formatBytes(replica.lagBytes)}`
          );
        } else if (replica.lagBytes > REPLICATION_LAG_THRESHOLDS.warning) {
          status = status === 'critical' ? 'critical' : 'degraded';
          warnings.push(
            `Replica ${replica.clientAddr || replica.applicationName} lag warning: ${formatBytes(replica.lagBytes)}`
          );
        }
      }
    }

    return {
      status,
      isPrimary: !isReplica,
      isInRecovery: isReplica,
      replicationLag: lagBytes,
      replicas,
      lastCheckAt: new Date(),
      warnings,
    };
  } catch (error) {
    Sentry.captureException(error, { tags: { component: 'antifragile-db' } });
    return {
      status: 'critical',
      isPrimary: false,
      isInRecovery: false,
      replicationLag: null,
      replicas: [],
      lastCheckAt: new Date(),
      warnings: ['Database health check failed: ' + String(error)],
    };
  }
}

// =============================================================================
// BACKUP & RECOVERY UTILITIES
// =============================================================================

/**
 * Backup status information
 */
export interface BackupInfo {
  /** Backup type: full, incremental, wal */
  type: 'full' | 'incremental' | 'wal';
  /** Backup start time */
  startedAt: Date;
  /** Backup end time (null if in progress) */
  completedAt: Date | null;
  /** Backup size in bytes */
  sizeBytes: number;
  /** Storage location */
  location: string;
  /** Whether backup was successful */
  success: boolean;
  /** Error message if failed */
  error?: string;
}

/**
 * Recovery point information for PITR
 */
export interface RecoveryPoint {
  /** Earliest recovery point */
  earliestRecoveryTime: Date | null;
  /** Latest recovery point */
  latestRecoveryTime: Date | null;
  /** WAL segments available */
  walSegmentsAvailable: number;
  /** Estimated recovery time */
  estimatedRecoveryMinutes: number;
}

/**
 * Get current WAL position for backup reference
 */
export async function getCurrentWalPosition(): Promise<string | null> {
  try {
    const isReplica = await isInRecovery();

    const result = isReplica
      ? await db.execute<{ lsn: string }>(
          sql`SELECT pg_last_wal_replay_lsn()::text as lsn`
        )
      : await db.execute<{ lsn: string }>(
          sql`SELECT pg_current_wal_lsn()::text as lsn`
        );

    return result.rows[0]?.lsn ?? null;
  } catch (error) {
    Sentry.captureException(error, { tags: { component: 'antifragile-db' } });
    return null;
  }
}

/**
 * Get database size for backup estimation
 */
export async function getDatabaseSize(): Promise<{
  total: number;
  data: number;
  indexes: number;
}> {
  try {
    const result = await db.execute<{
      total: string;
      data: string;
      indexes: string;
    }>(sql`
      SELECT
        pg_database_size(current_database()) as total,
        (SELECT sum(pg_table_size(schemaname || '.' || tablename))
         FROM pg_tables
         WHERE schemaname = 'public') as data,
        (SELECT sum(pg_indexes_size(schemaname || '.' || tablename))
         FROM pg_tables
         WHERE schemaname = 'public') as indexes
    `);

    const row = result.rows[0];
    return {
      total: parseInt(row?.total ?? '0', 10),
      data: parseInt(row?.data ?? '0', 10),
      indexes: parseInt(row?.indexes ?? '0', 10),
    };
  } catch (error) {
    Sentry.captureException(error, { tags: { component: 'antifragile-db' } });
    return { total: 0, data: 0, indexes: 0 };
  }
}

/**
 * Estimate backup time based on database size
 * Assumes ~100MB/s backup throughput
 */
export function estimateBackupTime(sizeBytes: number): number {
  const throughputBytesPerSecond = 100 * 1024 * 1024; // 100MB/s
  return Math.ceil(sizeBytes / throughputBytesPerSecond / 60); // Returns minutes
}

/**
 * Get last checkpoint information for backup timing
 */
export async function getLastCheckpoint(): Promise<{
  checkpointTime: Date | null;
  redoLsn: string | null;
}> {
  try {
    const result = await db.execute<{
      checkpoint_time: Date;
      redo_lsn: string;
    }>(sql`
      SELECT
        checkpoint_time,
        redo_lsn::text
      FROM pg_control_checkpoint()
    `);

    const row = result.rows[0];
    return {
      checkpointTime: row?.checkpoint_time ?? null,
      redoLsn: row?.redo_lsn ?? null,
    };
  } catch (error) {
    // pg_control_checkpoint requires superuser, return null for non-superuser
    return { checkpointTime: null, redoLsn: null };
  }
}

// =============================================================================
// MIGRATION PATH UTILITIES
// =============================================================================

/**
 * Database migration phases
 */
export type MigrationPhase =
  | 'managed_postgres'
  | 'self_hosted_postgres'
  | 'distributed_yugabyte'
  | 'user_hostable';

/**
 * Current migration phase detection
 */
export interface MigrationStatus {
  phase: MigrationPhase;
  version: string;
  isDistributed: boolean;
  nodeCount: number;
  features: {
    hasReplication: boolean;
    hasPartitioning: boolean;
    hasPgVector: boolean;
    hasLogicalReplication: boolean;
  };
}

/**
 * Detect current database capabilities and migration phase
 */
export async function detectMigrationPhase(): Promise<MigrationStatus> {
  try {
    // Get PostgreSQL version
    const versionResult = await db.execute<{ version: string }>(
      sql`SELECT version()`
    );
    const version = versionResult.rows[0]?.version ?? 'unknown';

    // Check for YugabyteDB
    const isYugabyte = version.toLowerCase().includes('yugabyte');

    // Check for replication
    const replicationResult = await db.execute<{ count: string }>(
      sql`SELECT count(*) as count FROM pg_stat_replication`
    );
    const hasReplication = parseInt(replicationResult.rows[0]?.count ?? '0', 10) > 0;

    // Check for partitioned tables
    const partitionResult = await db.execute<{ count: string }>(
      sql`SELECT count(*) as count FROM pg_partitioned_table`
    );
    const hasPartitioning = parseInt(partitionResult.rows[0]?.count ?? '0', 10) > 0;

    // Check for pgvector extension
    let hasPgVector = false;
    try {
      await db.execute(sql`SELECT 'vector'::regtype`);
      hasPgVector = true;
    } catch {
      // pgvector not installed
    }

    // Check for logical replication
    const logicalRepResult = await db.execute<{ count: string }>(
      sql`SELECT count(*) as count FROM pg_publication`
    );
    const hasLogicalReplication =
      parseInt(logicalRepResult.rows[0]?.count ?? '0', 10) > 0;

    // Determine phase
    let phase: MigrationPhase = 'managed_postgres';
    let nodeCount = 1;

    if (isYugabyte) {
      phase = 'distributed_yugabyte';
      // Try to get node count for YugabyteDB
      try {
        const nodesResult = await db.execute<{ count: string }>(
          sql`SELECT count(*) as count FROM yb_servers()`
        );
        nodeCount = parseInt(nodesResult.rows[0]?.count ?? '1', 10);
      } catch {
        // Not a YugabyteDB feature
      }
    } else if (hasReplication || hasLogicalReplication) {
      phase = 'self_hosted_postgres';
    }

    return {
      phase,
      version,
      isDistributed: isYugabyte,
      nodeCount,
      features: {
        hasReplication,
        hasPartitioning,
        hasPgVector,
        hasLogicalReplication,
      },
    };
  } catch (error) {
    Sentry.captureException(error, { tags: { component: 'antifragile-db' } });
    return {
      phase: 'managed_postgres',
      version: 'unknown',
      isDistributed: false,
      nodeCount: 1,
      features: {
        hasReplication: false,
        hasPartitioning: false,
        hasPgVector: false,
        hasLogicalReplication: false,
      },
    };
  }
}

/**
 * Check compatibility with YugabyteDB for migration planning
 */
export async function checkYugabyteCompatibility(): Promise<{
  compatible: boolean;
  issues: string[];
  recommendations: string[];
}> {
  const issues: string[] = [];
  const recommendations: string[] = [];

  try {
    // Check for unsupported features
    // 1. Check for sequences (YugabyteDB has different sequence handling)
    const sequenceResult = await db.execute<{ count: string }>(
      sql`SELECT count(*) as count FROM pg_sequences`
    );
    const sequenceCount = parseInt(sequenceResult.rows[0]?.count ?? '0', 10);
    if (sequenceCount > 0) {
      recommendations.push(
        `Found ${sequenceCount} sequences. Use UUID or explicit ID generation for YugabyteDB.`
      );
    }

    // 2. Check for BRIN indexes (not supported)
    const brinResult = await db.execute<{ count: string }>(
      sql`SELECT count(*) as count FROM pg_indexes WHERE indexdef LIKE '%USING brin%'`
    );
    const brinCount = parseInt(brinResult.rows[0]?.count ?? '0', 10);
    if (brinCount > 0) {
      issues.push(
        `Found ${brinCount} BRIN indexes. Convert to B-tree or hash indexes.`
      );
    }

    // 3. Check for GiST indexes (limited support)
    const gistResult = await db.execute<{ count: string }>(
      sql`SELECT count(*) as count FROM pg_indexes WHERE indexdef LIKE '%USING gist%'`
    );
    const gistCount = parseInt(gistResult.rows[0]?.count ?? '0', 10);
    if (gistCount > 0) {
      recommendations.push(
        `Found ${gistCount} GiST indexes. Test compatibility with YugabyteDB.`
      );
    }

    // 4. Check table sizes for sharding recommendations
    const largeTables = await db.execute<{ tablename: string; size: string }>(
      sql`
        SELECT tablename, pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) as size
        FROM pg_tables
        WHERE schemaname = 'public'
          AND pg_total_relation_size(schemaname || '.' || tablename) > 1073741824
        ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC
      `
    );
    if (largeTables.rows.length > 0) {
      recommendations.push(
        `Large tables found (>1GB): ${largeTables.rows.map((r) => `${r.tablename} (${r.size})`).join(', ')}. Consider sharding strategy.`
      );
    }

    return {
      compatible: issues.length === 0,
      issues,
      recommendations,
    };
  } catch (error) {
    Sentry.captureException(error, { tags: { component: 'antifragile-db' } });
    return {
      compatible: false,
      issues: ['Failed to check compatibility: ' + String(error)],
      recommendations: [],
    };
  }
}

// =============================================================================
// AUDIT LOGGING UTILITIES
// =============================================================================

import {
  auditLogs,
  MULTISIG_REQUIRED_ACTIONS,
  MULTISIG_THRESHOLDS,
  type AuditActionType,
  type AuditSeverity,
  type NewAuditLog,
} from '@apex/db';

/**
 * Log an admin action to the audit trail
 * Automatically determines if multi-sig is required based on action type
 */
export async function logAdminAction(params: {
  adminId: string;
  action: AuditActionType;
  targetId?: string;
  targetType?: string;
  reason: string;
  severity?: AuditSeverity;
  metadata?: Record<string, unknown>;
}): Promise<{ id: string; requiresMultiSig: boolean }> {
  const severity = params.severity ?? inferSeverity(params.action);
  const requiresMultiSig = MULTISIG_REQUIRED_ACTIONS.includes(params.action);

  try {
    const [result] = await db
      .insert(auditLogs)
      .values({
        adminId: params.adminId,
        action: params.action,
        severity,
        targetId: params.targetId,
        targetType: params.targetType,
        reason: params.reason,
        metadata: params.metadata,
        requiresMultiSig,
        multiSigSignatures: requiresMultiSig
          ? { required: MULTISIG_THRESHOLDS[severity], collected: [] }
          : null,
        multiSigComplete: !requiresMultiSig,
      })
      .returning({ id: auditLogs.id });

    // Log to Sentry for monitoring
    Sentry.addBreadcrumb({
      category: 'audit',
      level: severity === 'emergency' ? 'error' : 'info',
      message: `Admin action: ${params.action}`,
      data: {
        adminId: params.adminId,
        action: params.action,
        targetId: params.targetId,
        requiresMultiSig,
      },
    });

    // Alert on critical/emergency actions
    if (severity === 'critical' || severity === 'emergency') {
      Sentry.captureMessage(`Critical admin action: ${params.action}`, {
        level: 'warning',
        tags: { adminId: params.adminId, action: params.action },
      });
    }

    return { id: result.id, requiresMultiSig };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: 'antifragile-db', action: 'audit-log' },
    });
    throw new Error('Failed to log admin action');
  }
}

/**
 * Infer severity based on action type
 */
function inferSeverity(action: AuditActionType): AuditSeverity {
  if (MULTISIG_REQUIRED_ACTIONS.includes(action)) {
    return 'emergency';
  }

  const criticalActions: AuditActionType[] = [
    'ban_user',
    'adjust_rc',
    'freeze_rc',
    'data_export',
  ];
  if (criticalActions.includes(action)) {
    return 'critical';
  }

  const warningActions: AuditActionType[] = [
    'suspend_user',
    'warn_user',
    'remove_resource',
    'rate_limit_override',
  ];
  if (warningActions.includes(action)) {
    return 'warning';
  }

  return 'info';
}

// =============================================================================
// HELPER UTILITIES
// =============================================================================

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Connection pool stats for monitoring
 */
export async function getConnectionPoolStats(): Promise<{
  total: number;
  idle: number;
  waiting: number;
}> {
  return {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
  };
}

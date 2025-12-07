/**
 * Backup and Recovery Utilities
 *
 * Provides programmatic access to pgBackRest backup operations
 * with PITR (Point-in-Time Recovery) support.
 *
 * @see Antifragile Database Architecture Spec v1.0
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as Sentry from '@sentry/nextjs';
import { logAdminAction } from './antifragile';

const execAsync = promisify(exec);

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * pgBackRest configuration
 */
export interface PgBackRestConfig {
  /** Stanza name (typically database name) */
  stanza: string;
  /** Repository path or S3 bucket */
  repoPath: string;
  /** Repository type: posix, s3, azure, gcs */
  repoType: 's3' | 'posix' | 'azure' | 'gcs';
  /** Number of parallel processes for backup */
  processMax: number;
  /** Enable compression */
  compress: boolean;
  /** Encryption cipher (none, aes-256-cbc) */
  cipher: 'none' | 'aes-256-cbc';
}

/**
 * Default pgBackRest configuration
 * Override via environment variables
 */
export const DEFAULT_PGBACKREST_CONFIG: PgBackRestConfig = {
  stanza: process.env.PGBACKREST_STANZA || 'apexdb',
  repoPath: process.env.PGBACKREST_REPO_PATH || '/var/lib/pgbackrest',
  repoType: (process.env.PGBACKREST_REPO_TYPE as PgBackRestConfig['repoType']) || 's3',
  processMax: parseInt(process.env.PGBACKREST_PROCESS_MAX || '4', 10),
  compress: process.env.PGBACKREST_COMPRESS !== 'false',
  cipher: (process.env.PGBACKREST_CIPHER as PgBackRestConfig['cipher']) || 'aes-256-cbc',
};

// =============================================================================
// BACKUP OPERATIONS
// =============================================================================

/**
 * Backup types supported by pgBackRest
 */
export type BackupType = 'full' | 'diff' | 'incr';

/**
 * Backup result information
 */
export interface BackupResult {
  success: boolean;
  type: BackupType;
  label: string;
  startTime: Date;
  endTime: Date;
  durationSeconds: number;
  sizeBytes: number;
  walSegments: number;
  error?: string;
}

/**
 * Trigger a backup operation
 * Note: This requires pgBackRest to be installed and configured on the server
 *
 * @param type - Backup type (full, differential, or incremental)
 * @param adminId - Admin ID for audit logging
 * @param reason - Reason for manual backup
 */
export async function triggerBackup(
  type: BackupType = 'incr',
  adminId?: string,
  reason?: string
): Promise<BackupResult> {
  const startTime = new Date();
  const config = DEFAULT_PGBACKREST_CONFIG;

  try {
    // Log admin action if adminId provided
    if (adminId) {
      await logAdminAction({
        adminId,
        action: 'backup_restore',
        reason: reason || `Manual ${type} backup triggered`,
        severity: 'info',
        metadata: { backupType: type, config: { stanza: config.stanza } },
      });
    }

    // Build pgBackRest command
    const cmd = buildBackupCommand(type, config);

    // Execute backup
    const { stdout, stderr } = await execAsync(cmd, {
      timeout: 3600000, // 1 hour timeout
      env: {
        ...process.env,
        PGBACKREST_STANZA: config.stanza,
      },
    });

    const endTime = new Date();

    // Parse backup info from stdout
    const backupInfo = parseBackupOutput(stdout);

    Sentry.addBreadcrumb({
      category: 'backup',
      level: 'info',
      message: `Backup completed: ${type}`,
      data: { durationSeconds: (endTime.getTime() - startTime.getTime()) / 1000 },
    });

    return {
      success: true,
      type,
      label: backupInfo.label || `${type}-${startTime.toISOString()}`,
      startTime,
      endTime,
      durationSeconds: (endTime.getTime() - startTime.getTime()) / 1000,
      sizeBytes: backupInfo.sizeBytes || 0,
      walSegments: backupInfo.walSegments || 0,
    };
  } catch (error) {
    const endTime = new Date();
    const errorMessage = error instanceof Error ? error.message : String(error);

    Sentry.captureException(error, {
      tags: { component: 'backup-recovery', operation: 'backup' },
      extra: { type, config: { stanza: config.stanza } },
    });

    return {
      success: false,
      type,
      label: '',
      startTime,
      endTime,
      durationSeconds: (endTime.getTime() - startTime.getTime()) / 1000,
      sizeBytes: 0,
      walSegments: 0,
      error: errorMessage,
    };
  }
}

/**
 * Build pgBackRest backup command
 */
function buildBackupCommand(type: BackupType, config: PgBackRestConfig): string {
  const args = [
    'pgbackrest',
    '--stanza=' + config.stanza,
    '--type=' + type,
    '--process-max=' + config.processMax,
    'backup',
  ];

  if (!config.compress) {
    args.splice(args.length - 1, 0, '--no-compress');
  }

  return args.join(' ');
}

/**
 * Parse backup output for info extraction
 */
function parseBackupOutput(output: string): {
  label?: string;
  sizeBytes?: number;
  walSegments?: number;
} {
  const labelMatch = output.match(/backup label: ([^\n]+)/i);
  const sizeMatch = output.match(/backup size: ([0-9.]+)\s*(KB|MB|GB|TB)/i);
  const walMatch = output.match(/wal segments: (\d+)/i);

  let sizeBytes = 0;
  if (sizeMatch) {
    const size = parseFloat(sizeMatch[1]);
    const unit = sizeMatch[2].toUpperCase();
    const multipliers: Record<string, number> = {
      KB: 1024,
      MB: 1024 * 1024,
      GB: 1024 * 1024 * 1024,
      TB: 1024 * 1024 * 1024 * 1024,
    };
    sizeBytes = Math.round(size * (multipliers[unit] || 1));
  }

  return {
    label: labelMatch?.[1],
    sizeBytes,
    walSegments: walMatch ? parseInt(walMatch[1], 10) : undefined,
  };
}

// =============================================================================
// RECOVERY OPERATIONS
// =============================================================================

/**
 * Recovery options for PITR
 */
export interface RecoveryOptions {
  /** Target timestamp for PITR */
  targetTime?: string;
  /** Target transaction ID */
  targetXid?: string;
  /** Target recovery name (restore point) */
  targetName?: string;
  /** Target LSN position */
  targetLsn?: string;
  /** Whether to pause at recovery target */
  targetAction?: 'pause' | 'promote' | 'shutdown';
  /** Specific backup label to restore from */
  backupLabel?: string;
}

/**
 * Recovery result information
 */
export interface RecoveryResult {
  success: boolean;
  startTime: Date;
  endTime: Date;
  durationSeconds: number;
  targetTime?: string;
  restoredLsn?: string;
  error?: string;
}

/**
 * Initiate a point-in-time recovery
 *
 * WARNING: This is a destructive operation that will overwrite the current database.
 * Always ensure proper authorization and backup before proceeding.
 *
 * @param options - Recovery target options
 * @param adminId - Admin ID for audit logging (required)
 * @param reason - Reason for recovery (required)
 */
export async function initiateRecovery(
  options: RecoveryOptions,
  adminId: string,
  reason: string
): Promise<RecoveryResult> {
  const startTime = new Date();
  const config = DEFAULT_PGBACKREST_CONFIG;

  // Log admin action - this is a critical operation
  await logAdminAction({
    adminId,
    action: 'backup_restore',
    reason,
    severity: 'emergency',
    metadata: { recoveryOptions: options },
  });

  try {
    // Build recovery command
    const cmd = buildRecoveryCommand(options, config);

    // Execute recovery
    const { stdout, stderr } = await execAsync(cmd, {
      timeout: 7200000, // 2 hour timeout for large databases
      env: {
        ...process.env,
        PGBACKREST_STANZA: config.stanza,
      },
    });

    const endTime = new Date();

    Sentry.captureMessage('Database recovery completed', {
      level: 'warning',
      tags: { component: 'backup-recovery', operation: 'recovery' },
      extra: { options, durationSeconds: (endTime.getTime() - startTime.getTime()) / 1000 },
    });

    return {
      success: true,
      startTime,
      endTime,
      durationSeconds: (endTime.getTime() - startTime.getTime()) / 1000,
      targetTime: options.targetTime,
    };
  } catch (error) {
    const endTime = new Date();
    const errorMessage = error instanceof Error ? error.message : String(error);

    Sentry.captureException(error, {
      tags: { component: 'backup-recovery', operation: 'recovery' },
      extra: { options },
    });

    return {
      success: false,
      startTime,
      endTime,
      durationSeconds: (endTime.getTime() - startTime.getTime()) / 1000,
      error: errorMessage,
    };
  }
}

/**
 * Build pgBackRest restore command
 */
function buildRecoveryCommand(options: RecoveryOptions, config: PgBackRestConfig): string {
  const args = [
    'pgbackrest',
    '--stanza=' + config.stanza,
    '--process-max=' + config.processMax,
  ];

  // Add recovery target
  if (options.targetTime) {
    args.push('--type=time');
    args.push(`--target="${options.targetTime}"`);
  } else if (options.targetXid) {
    args.push('--type=xid');
    args.push(`--target=${options.targetXid}`);
  } else if (options.targetName) {
    args.push('--type=name');
    args.push(`--target="${options.targetName}"`);
  } else if (options.targetLsn) {
    args.push('--type=lsn');
    args.push(`--target=${options.targetLsn}`);
  }

  if (options.targetAction) {
    args.push(`--target-action=${options.targetAction}`);
  }

  if (options.backupLabel) {
    args.push(`--set=${options.backupLabel}`);
  }

  args.push('restore');

  return args.join(' ');
}

// =============================================================================
// BACKUP INFO & LISTING
// =============================================================================

/**
 * Backup information from pgBackRest info
 */
export interface BackupInfo {
  label: string;
  type: BackupType;
  timestamp: Date;
  prior: string | null;
  sizeDatabase: number;
  sizeBackup: number;
  walStart: string;
  walStop: string;
}

/**
 * List available backups
 */
export async function listBackups(): Promise<BackupInfo[]> {
  const config = DEFAULT_PGBACKREST_CONFIG;

  try {
    const cmd = `pgbackrest --stanza=${config.stanza} --output=json info`;
    const { stdout } = await execAsync(cmd);

    const info = JSON.parse(stdout);
    const backups: BackupInfo[] = [];

    // Parse pgBackRest info JSON output
    if (info?.[0]?.backup) {
      for (const backup of info[0].backup) {
        backups.push({
          label: backup.label,
          type: backup.type as BackupType,
          timestamp: new Date(backup.timestamp.stop * 1000),
          prior: backup.prior || null,
          sizeDatabase: backup.info.size,
          sizeBackup: backup.info.delta,
          walStart: backup.lsn.start,
          walStop: backup.lsn.stop,
        });
      }
    }

    return backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: 'backup-recovery', operation: 'list-backups' },
    });

    // Return empty array on error (pgBackRest may not be installed)
    return [];
  }
}

/**
 * Get latest backup info
 */
export async function getLatestBackup(): Promise<BackupInfo | null> {
  const backups = await listBackups();
  return backups[0] || null;
}

/**
 * Verify backup integrity
 */
export async function verifyBackups(): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const config = DEFAULT_PGBACKREST_CONFIG;

  try {
    const cmd = `pgbackrest --stanza=${config.stanza} check`;
    await execAsync(cmd, { timeout: 300000 }); // 5 minute timeout

    return { valid: true, errors: [] };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      valid: false,
      errors: [errorMessage],
    };
  }
}

// =============================================================================
// WAL ARCHIVING
// =============================================================================

/**
 * WAL archive status
 */
export interface WalArchiveStatus {
  archiveMode: boolean;
  archiveCommand: string | null;
  lastArchivedWal: string | null;
  lastArchivedTime: Date | null;
  failedCount: number;
  lastFailedWal: string | null;
  lastFailedTime: Date | null;
}

/**
 * Get WAL archive status from pg_stat_archiver
 */
export async function getWalArchiveStatus(): Promise<WalArchiveStatus | null> {
  try {
    const { db } = await import('@/db');
    const { sql } = await import('drizzle-orm');

    // Check archive mode
    const modeResult = await db.execute<{ archive_mode: string }>(
      sql`SHOW archive_mode`
    );
    const archiveMode = modeResult.rows[0]?.archive_mode === 'on';

    // Get archive command
    const cmdResult = await db.execute<{ archive_command: string }>(
      sql`SHOW archive_command`
    );
    const archiveCommand = cmdResult.rows[0]?.archive_command || null;

    // Get archiver stats
    const statsResult = await db.execute<{
      archived_count: string;
      last_archived_wal: string | null;
      last_archived_time: Date | null;
      failed_count: string;
      last_failed_wal: string | null;
      last_failed_time: Date | null;
    }>(sql`SELECT * FROM pg_stat_archiver`);

    const stats = statsResult.rows[0];

    return {
      archiveMode,
      archiveCommand,
      lastArchivedWal: stats?.last_archived_wal ?? null,
      lastArchivedTime: stats?.last_archived_time ?? null,
      failedCount: parseInt(stats?.failed_count ?? '0', 10),
      lastFailedWal: stats?.last_failed_wal ?? null,
      lastFailedTime: stats?.last_failed_time ?? null,
    };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: 'backup-recovery', operation: 'wal-status' },
    });
    return null;
  }
}

// =============================================================================
// BACKUP SCHEDULING
// =============================================================================

/**
 * Backup schedule configuration
 */
export interface BackupSchedule {
  /** Cron expression for full backups */
  fullCron: string;
  /** Cron expression for differential backups */
  diffCron: string;
  /** Cron expression for incremental backups */
  incrCron: string;
  /** Retention days for backups */
  retentionDays: number;
  /** Retention count for full backups */
  retentionFull: number;
}

/**
 * Default backup schedule
 * - Full: Weekly on Sunday at 2 AM
 * - Differential: Daily at 2 AM (except Sunday)
 * - Incremental: Every 4 hours
 */
export const DEFAULT_BACKUP_SCHEDULE: BackupSchedule = {
  fullCron: '0 2 * * 0', // Sunday 2 AM
  diffCron: '0 2 * * 1-6', // Mon-Sat 2 AM
  incrCron: '0 */4 * * *', // Every 4 hours
  retentionDays: 30,
  retentionFull: 4, // Keep 4 full backups
};

/**
 * Calculate next backup time based on schedule
 */
export function getNextBackupTime(
  schedule: BackupSchedule = DEFAULT_BACKUP_SCHEDULE
): { type: BackupType; time: Date } | null {
  // Simplified calculation - in production, use a proper cron parser
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();

  // Next incremental (every 4 hours)
  const nextIncrHour = Math.ceil((hour + 1) / 4) * 4;
  const nextIncr = new Date(now);
  nextIncr.setHours(nextIncrHour, 0, 0, 0);
  if (nextIncrHour >= 24) {
    nextIncr.setDate(nextIncr.getDate() + 1);
    nextIncr.setHours(0, 0, 0, 0);
  }

  return { type: 'incr', time: nextIncr };
}

/**
 * Multi-Signature Action Utilities
 *
 * Implements multi-sig approval for critical operations using:
 * - Internal database-backed signature collection
 * - Optional Ethereum Gnosis Safe integration for on-chain governance
 *
 * @see API Infrastructure Blueprint v1.0
 * @see Ethical Safeguards Framework
 */

import { db } from '@/db';
import {
  auditLogs,
  MULTISIG_REQUIRED_ACTIONS,
  MULTISIG_THRESHOLDS,
  type AuditActionType,
  type AuditSeverity,
} from '@apex/db/schema/auditLogs';
import { eq, and } from 'drizzle-orm';
import * as Sentry from '@sentry/nextjs';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Multi-sig proposal status
 */
export type MultiSigStatus = 'pending' | 'approved' | 'rejected' | 'executed' | 'expired';

/**
 * Signature record
 */
export interface Signature {
  signerId: string;
  signerName?: string;
  timestamp: string;
  signature: string; // Cryptographic signature or approval token
  comment?: string;
}

/**
 * Multi-sig proposal
 */
export interface MultiSigProposal {
  id: string;
  action: AuditActionType;
  severity: AuditSeverity;
  targetId?: string;
  targetType?: string;
  reason: string;
  metadata?: Record<string, unknown>;
  requiredSignatures: number;
  collectedSignatures: Signature[];
  status: MultiSigStatus;
  proposerId: string;
  createdAt: Date;
  expiresAt: Date;
  executedAt?: Date;
  executedById?: string;
  ethereumTxHash?: string;
}

/**
 * Multi-sig action result
 */
export interface MultiSigResult {
  success: boolean;
  proposal?: MultiSigProposal;
  error?: string;
  signaturesNeeded?: number;
  signaturesCollected?: number;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Multi-sig configuration
 */
export const MULTISIG_CONFIG = {
  /** Default expiration time for proposals (24 hours) */
  proposalExpirationHours: 24,
  /** Minimum time between signature and execution (cooling period) */
  coolingPeriodMinutes: 15,
  /** Whether to require on-chain signatures for emergency actions */
  requireOnChainForEmergency: false,
  /** Gnosis Safe contract address (if using on-chain) */
  safeAddress: process.env.GNOSIS_SAFE_ADDRESS,
} as const;

// =============================================================================
// PROPOSAL MANAGEMENT
// =============================================================================

/**
 * Create a new multi-sig proposal for a critical action
 *
 * @param proposerId - ID of the admin proposing the action
 * @param action - The action type requiring multi-sig
 * @param params - Action parameters
 * @returns Multi-sig result with proposal details
 */
export async function createMultiSigProposal(
  proposerId: string,
  action: AuditActionType,
  params: {
    targetId?: string;
    targetType?: string;
    reason: string;
    metadata?: Record<string, unknown>;
    severity?: AuditSeverity;
  }
): Promise<MultiSigResult> {
  // Validate action requires multi-sig
  if (!MULTISIG_REQUIRED_ACTIONS.includes(action)) {
    return {
      success: false,
      error: `Action "${action}" does not require multi-signature approval`,
    };
  }

  const severity = params.severity ?? inferSeverity(action);
  const requiredSignatures = MULTISIG_THRESHOLDS[severity];
  const expiresAt = new Date(
    Date.now() + MULTISIG_CONFIG.proposalExpirationHours * 60 * 60 * 1000
  );

  try {
    // Create audit log entry with multi-sig metadata
    const [result] = await db
      .insert(auditLogs)
      .values({
        adminId: proposerId,
        action,
        severity,
        targetId: params.targetId,
        targetType: params.targetType,
        reason: params.reason,
        metadata: {
          ...params.metadata,
          proposalType: 'multi_sig',
          expiresAt: expiresAt.toISOString(),
        },
        requiresMultiSig: true,
        multiSigSignatures: {
          required: requiredSignatures,
          collected: [],
        },
        multiSigComplete: false,
      })
      .returning();

    const proposal: MultiSigProposal = {
      id: result.id,
      action,
      severity,
      targetId: params.targetId ?? undefined,
      targetType: params.targetType ?? undefined,
      reason: params.reason,
      metadata: params.metadata,
      requiredSignatures,
      collectedSignatures: [],
      status: 'pending',
      proposerId,
      createdAt: result.createdAt,
      expiresAt,
    };

    // Log proposal creation
    Sentry.addBreadcrumb({
      category: 'multi-sig',
      message: 'Multi-sig proposal created',
      level: 'info',
      data: { proposalId: result.id, action, requiredSignatures },
    });

    return {
      success: true,
      proposal,
      signaturesNeeded: requiredSignatures,
      signaturesCollected: 0,
    };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: 'multi-sig', action: 'create-proposal' },
    });
    return {
      success: false,
      error: 'Failed to create multi-sig proposal',
    };
  }
}

/**
 * Add a signature to a multi-sig proposal
 *
 * @param proposalId - ID of the proposal
 * @param signerId - ID of the signing admin
 * @param signature - Cryptographic signature or approval token
 * @param comment - Optional comment
 */
export async function addSignature(
  proposalId: string,
  signerId: string,
  signature: string,
  comment?: string
): Promise<MultiSigResult> {
  try {
    // Fetch current proposal state
    const [auditLog] = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.id, proposalId))
      .limit(1);

    if (!auditLog) {
      return { success: false, error: 'Proposal not found' };
    }

    if (!auditLog.requiresMultiSig) {
      return { success: false, error: 'This action does not require multi-sig' };
    }

    if (auditLog.multiSigComplete) {
      return { success: false, error: 'Proposal already completed' };
    }

    // Check expiration
    const metadata = auditLog.metadata as Record<string, unknown> | null;
    const expiresAt = metadata?.expiresAt
      ? new Date(metadata.expiresAt as string)
      : null;

    if (expiresAt && expiresAt < new Date()) {
      return { success: false, error: 'Proposal has expired' };
    }

    // Check if already signed by this admin
    const currentSignatures = auditLog.multiSigSignatures as {
      required: number;
      collected: Signature[];
    } | null;

    if (currentSignatures?.collected.some((s) => s.signerId === signerId)) {
      return { success: false, error: 'You have already signed this proposal' };
    }

    // Prevent proposer from being the only signer
    if (
      auditLog.adminId === signerId &&
      (currentSignatures?.collected.length || 0) === 0 &&
      (currentSignatures?.required || 1) > 1
    ) {
      return {
        success: false,
        error: 'Proposer cannot be the first signer when multiple signatures are required',
      };
    }

    // Add signature
    const newSignature: Signature = {
      signerId,
      timestamp: new Date().toISOString(),
      signature,
      comment,
    };

    const updatedSignatures = {
      required: currentSignatures?.required || 1,
      collected: [...(currentSignatures?.collected || []), newSignature],
    };

    const isComplete = updatedSignatures.collected.length >= updatedSignatures.required;

    // Update proposal
    await db
      .update(auditLogs)
      .set({
        multiSigSignatures: updatedSignatures,
        multiSigComplete: isComplete,
      })
      .where(eq(auditLogs.id, proposalId));

    // Log signature
    Sentry.addBreadcrumb({
      category: 'multi-sig',
      message: 'Signature added to proposal',
      level: 'info',
      data: {
        proposalId,
        signerId,
        signaturesCollected: updatedSignatures.collected.length,
        signaturesRequired: updatedSignatures.required,
        isComplete,
      },
    });

    const proposal: MultiSigProposal = {
      id: proposalId,
      action: auditLog.action,
      severity: auditLog.severity,
      targetId: auditLog.targetId ?? undefined,
      targetType: auditLog.targetType ?? undefined,
      reason: auditLog.reason,
      metadata: metadata ?? undefined,
      requiredSignatures: updatedSignatures.required,
      collectedSignatures: updatedSignatures.collected,
      status: isComplete ? 'approved' : 'pending',
      proposerId: auditLog.adminId,
      createdAt: auditLog.createdAt,
      expiresAt: expiresAt || new Date(Date.now() + 86400000),
    };

    return {
      success: true,
      proposal,
      signaturesNeeded: updatedSignatures.required,
      signaturesCollected: updatedSignatures.collected.length,
    };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: 'multi-sig', action: 'add-signature' },
    });
    return {
      success: false,
      error: 'Failed to add signature',
    };
  }
}

/**
 * Execute an approved multi-sig proposal
 *
 * @param proposalId - ID of the proposal
 * @param executorId - ID of the admin executing
 * @param executor - Function to execute the actual action
 */
export async function executeMultiSigProposal<T>(
  proposalId: string,
  executorId: string,
  executor: (proposal: MultiSigProposal) => Promise<T>
): Promise<{ success: boolean; result?: T; error?: string }> {
  try {
    // Fetch proposal
    const [auditLog] = await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.id, proposalId),
          eq(auditLogs.requiresMultiSig, true)
        )
      )
      .limit(1);

    if (!auditLog) {
      return { success: false, error: 'Proposal not found' };
    }

    if (!auditLog.multiSigComplete) {
      return { success: false, error: 'Proposal does not have enough signatures' };
    }

    const metadata = auditLog.metadata as Record<string, unknown> | null;

    // Check if already executed
    if (metadata?.executedAt) {
      return { success: false, error: 'Proposal already executed' };
    }

    // Check expiration
    const expiresAt = metadata?.expiresAt
      ? new Date(metadata.expiresAt as string)
      : null;

    if (expiresAt && expiresAt < new Date()) {
      return { success: false, error: 'Proposal has expired' };
    }

    // Check cooling period
    const signatures = auditLog.multiSigSignatures as {
      required: number;
      collected: Signature[];
    };
    const lastSignature = signatures.collected[signatures.collected.length - 1];
    const lastSignatureTime = new Date(lastSignature.timestamp);
    const coolingPeriodEnd = new Date(
      lastSignatureTime.getTime() + MULTISIG_CONFIG.coolingPeriodMinutes * 60 * 1000
    );

    if (new Date() < coolingPeriodEnd) {
      const waitMinutes = Math.ceil(
        (coolingPeriodEnd.getTime() - Date.now()) / (60 * 1000)
      );
      return {
        success: false,
        error: `Cooling period active. Please wait ${waitMinutes} more minutes.`,
      };
    }

    // Build proposal object
    const proposal: MultiSigProposal = {
      id: proposalId,
      action: auditLog.action,
      severity: auditLog.severity,
      targetId: auditLog.targetId ?? undefined,
      targetType: auditLog.targetType ?? undefined,
      reason: auditLog.reason,
      metadata: metadata ?? undefined,
      requiredSignatures: signatures.required,
      collectedSignatures: signatures.collected,
      status: 'approved',
      proposerId: auditLog.adminId,
      createdAt: auditLog.createdAt,
      expiresAt: expiresAt || new Date(Date.now() + 86400000),
    };

    // Execute the action
    const result = await executor(proposal);

    // Update proposal as executed
    await db
      .update(auditLogs)
      .set({
        metadata: {
          ...metadata,
          executedAt: new Date().toISOString(),
          executedById: executorId,
        },
      })
      .where(eq(auditLogs.id, proposalId));

    // Log execution
    Sentry.captureMessage('Multi-sig proposal executed', {
      level: 'warning',
      tags: { proposalId, action: auditLog.action },
      extra: { executorId, signatures: signatures.collected.length },
    });

    return { success: true, result };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: 'multi-sig', action: 'execute' },
    });
    return { success: false, error: 'Failed to execute proposal' };
  }
}

/**
 * Get pending multi-sig proposals for an admin
 */
export async function getPendingProposals(adminId?: string): Promise<MultiSigProposal[]> {
  try {
    const results = await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.requiresMultiSig, true),
          eq(auditLogs.multiSigComplete, false)
        )
      )
      .limit(100);

    return results.map((log) => {
      const metadata = log.metadata as Record<string, unknown> | null;
      const signatures = log.multiSigSignatures as {
        required: number;
        collected: Signature[];
      } | null;

      return {
        id: log.id,
        action: log.action,
        severity: log.severity,
        targetId: log.targetId ?? undefined,
        targetType: log.targetType ?? undefined,
        reason: log.reason,
        metadata: metadata ?? undefined,
        requiredSignatures: signatures?.required ?? 1,
        collectedSignatures: signatures?.collected ?? [],
        status: 'pending' as MultiSigStatus,
        proposerId: log.adminId,
        createdAt: log.createdAt,
        expiresAt: metadata?.expiresAt
          ? new Date(metadata.expiresAt as string)
          : new Date(log.createdAt.getTime() + 86400000),
      };
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: 'multi-sig', action: 'get-pending' },
    });
    return [];
  }
}

/**
 * Reject a multi-sig proposal
 */
export async function rejectProposal(
  proposalId: string,
  rejecterId: string,
  reason: string
): Promise<MultiSigResult> {
  try {
    const [auditLog] = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.id, proposalId))
      .limit(1);

    if (!auditLog) {
      return { success: false, error: 'Proposal not found' };
    }

    const metadata = auditLog.metadata as Record<string, unknown> | null;

    await db
      .update(auditLogs)
      .set({
        isRolledBack: true,
        rollbackReason: reason,
        rollbackById: rejecterId,
        rollbackAt: new Date(),
        metadata: {
          ...metadata,
          rejectedAt: new Date().toISOString(),
          rejectedById: rejecterId,
          rejectionReason: reason,
        },
      })
      .where(eq(auditLogs.id, proposalId));

    Sentry.addBreadcrumb({
      category: 'multi-sig',
      message: 'Proposal rejected',
      level: 'info',
      data: { proposalId, rejecterId },
    });

    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: 'multi-sig', action: 'reject' },
    });
    return { success: false, error: 'Failed to reject proposal' };
  }
}

// =============================================================================
// ETHEREUM INTEGRATION (Optional)
// =============================================================================

/**
 * Create an on-chain multi-sig transaction via Gnosis Safe
 *
 * NOTE: This is a simplified interface. Real implementation would
 * use the Gnosis Safe SDK and require proper wallet integration.
 */
export async function createOnChainMultiSig(
  action: AuditActionType,
  data: Record<string, unknown>
): Promise<{ txHash?: string; error?: string }> {
  if (!MULTISIG_CONFIG.safeAddress) {
    return { error: 'Gnosis Safe not configured' };
  }

  // This would integrate with the actual Gnosis Safe SDK
  // For now, return a placeholder
  Sentry.addBreadcrumb({
    category: 'multi-sig',
    message: 'On-chain multi-sig requested (not implemented)',
    level: 'info',
    data: { action, safeAddress: MULTISIG_CONFIG.safeAddress },
  });

  return { error: 'On-chain multi-sig not yet implemented' };
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Infer severity based on action type
 */
function inferSeverity(action: AuditActionType): AuditSeverity {
  if (MULTISIG_REQUIRED_ACTIONS.includes(action)) {
    return 'emergency';
  }
  return 'critical';
}

/**
 * Check if an action requires multi-sig approval
 */
export function requiresMultiSig(action: AuditActionType): boolean {
  return MULTISIG_REQUIRED_ACTIONS.includes(action);
}

/**
 * Get required signature count for an action
 */
export function getRequiredSignatures(
  action: AuditActionType,
  severity?: AuditSeverity
): number {
  const effectiveSeverity = severity ?? inferSeverity(action);
  return MULTISIG_THRESHOLDS[effectiveSeverity];
}

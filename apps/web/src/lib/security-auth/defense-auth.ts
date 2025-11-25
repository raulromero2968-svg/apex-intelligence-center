/**
 * Defense-Grade Authentication
 *
 * Enhanced security for defense module access.
 * Implements knowledge-05-security-oauth2-jwt with defense compliance.
 *
 * Features:
 * - MFA requirement for sensitive actions
 * - Token rotation on defense access
 * - Security audit logging
 * - Risk assessment
 */

import { createHash, randomBytes } from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export type MfaMethod = 'totp' | 'sms' | 'email' | 'webauthn' | 'backup';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type AuditAction =
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'mfa_enabled'
  | 'mfa_disabled'
  | 'mfa_verified'
  | 'mfa_failed'
  | 'password_changed'
  | 'password_reset'
  | 'token_rotated'
  | 'token_revoked'
  | 'api_key_created'
  | 'api_key_revoked'
  | 'permission_changed'
  | 'suspicious_activity'
  | 'defense_access'
  | 'sensitive_action';

export interface Session {
  id: string;
  userId: string;
  sessionToken: string;
  refreshToken?: string;
  mfaVerified: boolean;
  deviceId?: string;
  ipAddress?: string;
  expiresAt: Date;
  rotationCount: number;
}

export interface SecurityContext {
  session: Session;
  userId: string;
  roles: string[];
  permissions: string[];
  defenseCleared: boolean;
  riskLevel: RiskLevel;
}

export interface DefenseAccessResult {
  allowed: boolean;
  reason: string;
  requiresMfa: boolean;
  riskLevel: RiskLevel;
  auditId?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const DEFENSE_ACTIONS = [
  'simulate_ddil',
  'access_edge_nodes',
  'modify_anomaly_rules',
  'view_threat_intelligence',
  'export_sensor_data',
  'configure_encryption',
] as const;

export type DefenseAction = (typeof DEFENSE_ACTIONS)[number];

export const ACTION_RISK_LEVELS: Record<DefenseAction, RiskLevel> = {
  simulate_ddil: 'high',
  access_edge_nodes: 'medium',
  modify_anomaly_rules: 'high',
  view_threat_intelligence: 'medium',
  export_sensor_data: 'critical',
  configure_encryption: 'critical',
};

export const MFA_REQUIRED_ACTIONS: DefenseAction[] = [
  'simulate_ddil',
  'modify_anomaly_rules',
  'export_sensor_data',
  'configure_encryption',
];

export const TOKEN_ROTATION_ACTIONS: DefenseAction[] = [
  'export_sensor_data',
  'configure_encryption',
];

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

/**
 * Generate secure token
 */
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('base64url');
}

/**
 * Hash token for storage
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Generate token pair (access + refresh)
 */
export function generateTokenPair(): { accessToken: string; refreshToken: string } {
  return {
    accessToken: generateSecureToken(32),
    refreshToken: generateSecureToken(64),
  };
}

/**
 * Rotate refresh token
 */
export async function rotateRefreshToken(
  currentToken: string,
  session: Session
): Promise<{ newToken: string; session: Session }> {
  const newToken = generateSecureToken(64);

  const updatedSession: Session = {
    ...session,
    refreshToken: hashToken(newToken),
    rotationCount: session.rotationCount + 1,
  };

  // In production, update database
  console.log(`Rotated refresh token for session ${session.id}`);

  return { newToken, session: updatedSession };
}

// ============================================================================
// MFA VERIFICATION
// ============================================================================

/**
 * Generate TOTP secret
 */
export function generateTotpSecret(): string {
  return randomBytes(20).toString('base32');
}

/**
 * Verify TOTP code (simplified - use speakeasy in production)
 */
export function verifyTotpCode(secret: string, code: string): boolean {
  // In production, use speakeasy or otplib
  // This is a placeholder
  const timeWindow = Math.floor(Date.now() / 30000);
  const expectedCode = createHash('sha1')
    .update(`${secret}:${timeWindow}`)
    .digest('hex')
    .slice(0, 6);

  return code === expectedCode;
}

/**
 * Generate backup codes
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(randomBytes(4).toString('hex').toUpperCase());
  }
  return codes;
}

/**
 * Verify backup code
 */
export function verifyBackupCode(code: string, hashedCodes: string[]): boolean {
  const hashedInput = hashToken(code.toUpperCase());
  return hashedCodes.includes(hashedInput);
}

// ============================================================================
// DEFENSE ACCESS CONTROL
// ============================================================================

/**
 * Check if MFA is required for action
 */
export function requiresMfa(action: DefenseAction): boolean {
  return MFA_REQUIRED_ACTIONS.includes(action);
}

/**
 * Check if token rotation is required
 */
export function requiresTokenRotation(action: DefenseAction): boolean {
  return TOKEN_ROTATION_ACTIONS.includes(action);
}

/**
 * Get action risk level
 */
export function getActionRiskLevel(action: DefenseAction): RiskLevel {
  return ACTION_RISK_LEVELS[action] ?? 'low';
}

/**
 * Secure defense access with MFA verification
 */
export async function secureDefenseAccess(
  action: DefenseAction,
  context: SecurityContext
): Promise<DefenseAccessResult> {
  const riskLevel = getActionRiskLevel(action);

  // Check if defense module access is allowed
  if (!context.defenseCleared) {
    return {
      allowed: false,
      reason: 'Defense clearance required for this action',
      requiresMfa: true,
      riskLevel,
    };
  }

  // Check MFA requirement
  if (requiresMfa(action) && !context.session.mfaVerified) {
    return {
      allowed: false,
      reason: 'MFA verification required for this action',
      requiresMfa: true,
      riskLevel,
    };
  }

  // Check permission
  const requiredPermission = `defense:${action}`;
  if (!context.permissions.includes(requiredPermission) && !context.permissions.includes('defense:*')) {
    return {
      allowed: false,
      reason: `Missing permission: ${requiredPermission}`,
      requiresMfa: false,
      riskLevel,
    };
  }

  // Token rotation for critical actions
  if (requiresTokenRotation(action) && context.session.refreshToken) {
    await rotateRefreshToken(context.session.refreshToken, context.session);
  }

  // Create audit log
  const auditId = await createAuditLog({
    userId: context.userId,
    sessionId: context.session.id,
    action: 'defense_access',
    resource: action,
    riskLevel,
    success: true,
    details: { defenseAction: action },
  });

  return {
    allowed: true,
    reason: 'Access granted',
    requiresMfa: false,
    riskLevel,
    auditId,
  };
}

// ============================================================================
// RISK ASSESSMENT
// ============================================================================

export interface RiskFactors {
  newDevice: boolean;
  newLocation: boolean;
  unusualTime: boolean;
  failedAttempts: number;
  sensitiveAction: boolean;
  highVelocity: boolean;
}

/**
 * Calculate risk score
 */
export function calculateRiskScore(factors: RiskFactors): { score: number; level: RiskLevel } {
  let score = 0;

  if (factors.newDevice) score += 20;
  if (factors.newLocation) score += 15;
  if (factors.unusualTime) score += 10;
  if (factors.highVelocity) score += 25;
  if (factors.sensitiveAction) score += 15;

  // Failed attempts heavily weighted
  score += Math.min(factors.failedAttempts * 10, 30);

  let level: RiskLevel;
  if (score >= 70) level = 'critical';
  else if (score >= 50) level = 'high';
  else if (score >= 25) level = 'medium';
  else level = 'low';

  return { score, level };
}

/**
 * Check if additional verification is needed
 */
export function needsAdditionalVerification(riskLevel: RiskLevel, action: string): boolean {
  if (riskLevel === 'critical') return true;
  if (riskLevel === 'high' && DEFENSE_ACTIONS.includes(action as DefenseAction)) return true;
  return false;
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

export interface AuditLogEntry {
  userId: string;
  sessionId?: string;
  action: AuditAction;
  resource?: string;
  resourceId?: string;
  riskLevel?: RiskLevel;
  success: boolean;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create audit log entry
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<string> {
  const auditId = randomBytes(16).toString('hex');

  // In production, insert into database
  console.log('Audit log:', {
    id: auditId,
    ...entry,
    occurredAt: new Date().toISOString(),
  });

  return auditId;
}

/**
 * Log suspicious activity
 */
export async function logSuspiciousActivity(
  userId: string,
  reason: string,
  details: Record<string, unknown>
): Promise<void> {
  await createAuditLog({
    userId,
    action: 'suspicious_activity',
    riskLevel: 'high',
    success: false,
    details: { reason, ...details },
  });
}

// ============================================================================
// SESSION SECURITY
// ============================================================================

/**
 * Validate session security
 */
export function validateSessionSecurity(
  session: Session,
  currentIp?: string,
  currentDevice?: string
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  // Check expiration
  if (new Date() > session.expiresAt) {
    return { valid: false, warnings: ['Session expired'] };
  }

  // Check IP change
  if (session.ipAddress && currentIp && session.ipAddress !== currentIp) {
    warnings.push('IP address changed during session');
  }

  // Check device change
  if (session.deviceId && currentDevice && session.deviceId !== currentDevice) {
    warnings.push('Device changed during session');
  }

  // High rotation count might indicate token theft attempt
  if (session.rotationCount > 10) {
    warnings.push('Unusual token rotation frequency');
  }

  return { valid: true, warnings };
}

/**
 * Check if session needs re-authentication
 */
export function needsReauthentication(
  session: Session,
  lastActivity: Date,
  action?: DefenseAction
): boolean {
  const now = new Date();
  const hoursSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

  // Re-auth after 4 hours of inactivity
  if (hoursSinceActivity > 4) return true;

  // Re-auth for critical actions without recent MFA
  if (action && getActionRiskLevel(action) === 'critical' && !session.mfaVerified) {
    return true;
  }

  return false;
}

/**
 * Defense Access Security API Routes
 *
 * Endpoints for defense-grade authentication.
 * Implements knowledge-05-security-oauth2-jwt.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  secureDefenseAccess,
  calculateRiskScore,
  createAuditLog,
  generateTokenPair,
  generateTotpSecret,
  generateBackupCodes,
  hashToken,
  type SecurityContext,
  type DefenseAction,
  type RiskFactors,
  DEFENSE_ACTIONS,
  getActionRiskLevel,
  requiresMfa,
} from '@/lib/security-auth';

/**
 * POST /api/security/defense-access
 * Request defense module access
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, securityContext } = body as {
      action: string;
      securityContext: SecurityContext;
    };

    // Validate action
    if (!DEFENSE_ACTIONS.includes(action as DefenseAction)) {
      return NextResponse.json(
        { error: `Invalid defense action: ${action}` },
        { status: 400 }
      );
    }

    // Check access
    const result = await secureDefenseAccess(action as DefenseAction, securityContext);

    // Log the attempt
    await createAuditLog({
      userId: securityContext.userId,
      sessionId: securityContext.session.id,
      action: 'defense_access',
      resource: action,
      riskLevel: result.riskLevel,
      success: result.allowed,
      details: { defenseAction: action, reason: result.reason },
    });

    if (!result.allowed) {
      return NextResponse.json(
        {
          allowed: false,
          reason: result.reason,
          requiresMfa: result.requiresMfa,
          riskLevel: result.riskLevel,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      allowed: true,
      reason: result.reason,
      riskLevel: result.riskLevel,
      auditId: result.auditId,
    });
  } catch (error) {
    console.error('Error processing defense access:', error);
    return NextResponse.json(
      { error: 'Failed to process defense access' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/security/defense-access
 * Get defense access information
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    switch (type) {
      case 'actions': {
        // Return available defense actions with requirements
        const actions = DEFENSE_ACTIONS.map((action) => ({
          action,
          riskLevel: getActionRiskLevel(action),
          requiresMfa: requiresMfa(action),
        }));

        return NextResponse.json({
          success: true,
          actions,
        });
      }

      case 'requirements': {
        const action = searchParams.get('action');
        if (!action || !DEFENSE_ACTIONS.includes(action as DefenseAction)) {
          return NextResponse.json(
            { error: 'Valid action required' },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          action,
          requirements: {
            mfa: requiresMfa(action as DefenseAction),
            riskLevel: getActionRiskLevel(action as DefenseAction),
            defenseCleared: true,
          },
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid type. Use: actions or requirements' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching defense access info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch defense access info' },
      { status: 500 }
    );
  }
}

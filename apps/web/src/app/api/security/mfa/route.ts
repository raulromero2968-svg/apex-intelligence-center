/**
 * MFA Management API Routes
 *
 * Endpoints for multi-factor authentication.
 * Implements knowledge-05-security-oauth2-jwt.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generateTotpSecret,
  generateBackupCodes,
  verifyTotpCode,
  verifyBackupCode,
  hashToken,
  createAuditLog,
} from '@/lib/security-auth';

/**
 * POST /api/security/mfa
 * MFA operations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId } = body;

    switch (action) {
      case 'setup-totp': {
        // Generate TOTP secret
        const secret = generateTotpSecret();

        // Generate QR code URL (otpauth format)
        const issuer = 'ApexIntelligence';
        const accountName = body.email || userId;
        const otpauthUrl = `otpauth://totp/${issuer}:${accountName}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;

        return NextResponse.json({
          success: true,
          secret,
          otpauthUrl,
          message: 'Scan QR code with authenticator app',
        });
      }

      case 'verify-totp': {
        const { secret, code } = body;

        if (!secret || !code) {
          return NextResponse.json(
            { error: 'Secret and code required' },
            { status: 400 }
          );
        }

        const isValid = verifyTotpCode(secret, code);

        await createAuditLog({
          userId,
          action: isValid ? 'mfa_verified' : 'mfa_failed',
          success: isValid,
          details: { method: 'totp' },
        });

        return NextResponse.json({
          success: true,
          verified: isValid,
        });
      }

      case 'generate-backup-codes': {
        const codes = generateBackupCodes(10);
        const hashedCodes = codes.map((c) => hashToken(c));

        return NextResponse.json({
          success: true,
          codes, // Return plain codes to user (one time only)
          hashedCodes, // Store these in database
          message: 'Save these codes securely. Each can only be used once.',
        });
      }

      case 'verify-backup-code': {
        const { code, hashedCodes } = body;

        if (!code || !hashedCodes) {
          return NextResponse.json(
            { error: 'Code and hashedCodes required' },
            { status: 400 }
          );
        }

        const isValid = verifyBackupCode(code, hashedCodes);

        await createAuditLog({
          userId,
          action: isValid ? 'mfa_verified' : 'mfa_failed',
          success: isValid,
          details: { method: 'backup_code' },
        });

        return NextResponse.json({
          success: true,
          verified: isValid,
          // Note: If valid, remove this code from hashedCodes in database
        });
      }

      case 'enable': {
        await createAuditLog({
          userId,
          action: 'mfa_enabled',
          success: true,
          details: { method: body.method || 'totp' },
        });

        return NextResponse.json({
          success: true,
          message: 'MFA enabled successfully',
        });
      }

      case 'disable': {
        // Should require re-authentication in production
        await createAuditLog({
          userId,
          action: 'mfa_disabled',
          success: true,
          details: { reason: body.reason },
        });

        return NextResponse.json({
          success: true,
          message: 'MFA disabled',
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: setup-totp, verify-totp, generate-backup-codes, verify-backup-code, enable, or disable' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing MFA request:', error);
    return NextResponse.json(
      { error: 'Failed to process MFA request' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/security/mfa
 * Get MFA status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId required' },
        { status: 400 }
      );
    }

    // In production, fetch from database
    return NextResponse.json({
      success: true,
      userId,
      mfaEnabled: false, // From database
      methods: [], // Enabled methods
      backupCodesRemaining: 0, // Count of unused backup codes
    });
  } catch (error) {
    console.error('Error fetching MFA status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MFA status' },
      { status: 500 }
    );
  }
}

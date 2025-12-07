/**
 * GDPR Data Deletion API
 *
 * Implements the "Right to Erasure" (Article 17) as recommended
 * by the Security Audit Report (Section 3)
 *
 * POST /api/gdpr/delete - Request account deletion
 * GET /api/gdpr/delete/status - Check deletion request status
 *
 * @module app/api/gdpr/delete
 * @see Security Audit Report - Compliance Requirements
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';

// =============================================================================
// TYPES
// =============================================================================

interface DeletionRequest {
  id: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestedAt: Date;
  completedAt?: Date;
  verificationToken?: string;
  verifiedAt?: Date;
}

interface DeletionResponse {
  success: boolean;
  requestId?: string;
  status?: string;
  message: string;
  verificationRequired?: boolean;
  estimatedCompletion?: string;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Extract user from request (placeholder - integrate with your auth)
 */
async function getUserFromRequest(req: NextRequest): Promise<{ id: string; email: string } | null> {
  // In production, this would:
  // 1. Check the session cookie or Bearer token
  // 2. Validate with Supabase/your auth provider
  // 3. Return the authenticated user

  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  // Placeholder: In production, validate the token
  // For now, return a mock user for development
  return {
    id: 'user_placeholder',
    email: 'placeholder@example.com',
  };
}

/**
 * Generate a secure verification token
 */
function generateVerificationToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Hash verification token for storage
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Send verification email (placeholder)
 */
async function sendDeletionVerificationEmail(
  email: string,
  verificationToken: string
): Promise<boolean> {
  // In production, integrate with your email provider (SendGrid, Resend, etc.)
  console.log(`[GDPR] Would send deletion verification to ${email}`);
  console.log(`[GDPR] Verification link: /api/gdpr/delete/verify?token=${verificationToken}`);

  // Placeholder success
  return true;
}

/**
 * Create deletion request in database (placeholder)
 */
async function createDeletionRequest(
  userId: string,
  verificationTokenHash: string,
  ipAddress: string
): Promise<string> {
  // In production, insert into gdpr_requests table
  // For now, return a mock request ID
  const requestId = `gdpr_del_${randomBytes(8).toString('hex')}`;

  console.log(`[GDPR] Created deletion request: ${requestId} for user ${userId}`);

  return requestId;
}

/**
 * Get deletion request by ID (placeholder)
 */
async function getDeletionRequest(
  requestId: string,
  userId: string
): Promise<DeletionRequest | null> {
  // In production, query gdpr_requests table
  // Placeholder response
  return null;
}

/**
 * Execute data deletion (placeholder)
 */
async function executeDataDeletion(userId: string): Promise<void> {
  // In production, this would:
  // 1. Soft delete user record
  // 2. Anonymize or delete related data
  // 3. Remove from third-party services (Stripe, etc.)
  // 4. Log the deletion for compliance

  console.log(`[GDPR] Executing deletion for user ${userId}`);

  // Tables to process:
  // - users (anonymize)
  // - portfolio (delete)
  // - watchlist (delete)
  // - notification_preferences (delete)
  // - user_sessions (delete)
  // - user_encrypted_data (delete)
  // - push_tokens (delete)
  // - e2e_messages (delete sent messages, anonymize received)
}

// =============================================================================
// API HANDLERS
// =============================================================================

/**
 * POST /api/gdpr/delete
 * Request account deletion
 */
export async function POST(req: NextRequest): Promise<NextResponse<DeletionResponse>> {
  try {
    // Authenticate user
    const user = await getUserFromRequest(req);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentication required to request deletion',
        },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { confirmation, reason } = body as {
      confirmation?: string;
      reason?: string;
    };

    // Require explicit confirmation
    if (confirmation !== 'DELETE_MY_ACCOUNT') {
      return NextResponse.json(
        {
          success: false,
          message: 'Please confirm deletion by setting confirmation to "DELETE_MY_ACCOUNT"',
        },
        { status: 400 }
      );
    }

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const tokenHash = hashToken(verificationToken);

    // Get client IP
    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      'unknown';

    // Create deletion request
    const requestId = await createDeletionRequest(user.id, tokenHash, ipAddress);

    // Send verification email
    await sendDeletionVerificationEmail(user.email, verificationToken);

    // Log the request (for audit)
    console.log(`[GDPR] Deletion request ${requestId} created for ${user.id}`);
    console.log(`[GDPR] Reason: ${reason || 'not provided'}`);
    console.log(`[GDPR] IP: ${ipAddress}`);

    return NextResponse.json(
      {
        success: true,
        requestId,
        status: 'pending_verification',
        message:
          'Deletion request received. Please check your email to verify this request.',
        verificationRequired: true,
        estimatedCompletion: '30 days',
      },
      { status: 202 }
    );
  } catch (error) {
    console.error('[GDPR] Deletion request error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred processing your request. Please try again.',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/gdpr/delete
 * Check deletion request status
 */
export async function GET(req: NextRequest): Promise<NextResponse<DeletionResponse>> {
  try {
    // Authenticate user
    const user = await getUserFromRequest(req);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentication required',
        },
        { status: 401 }
      );
    }

    // Get request ID from query params
    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get('requestId');

    if (!requestId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Request ID is required',
        },
        { status: 400 }
      );
    }

    // Fetch deletion request
    const request = await getDeletionRequest(requestId, user.id);

    if (!request) {
      return NextResponse.json(
        {
          success: false,
          message: 'Deletion request not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      requestId: request.id,
      status: request.status,
      message: getStatusMessage(request.status),
    });
  } catch (error) {
    console.error('[GDPR] Status check error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * Get human-readable status message
 */
function getStatusMessage(status: string): string {
  switch (status) {
    case 'pending':
      return 'Your deletion request is pending verification.';
    case 'pending_verification':
      return 'Please check your email to verify your deletion request.';
    case 'processing':
      return 'Your deletion request is being processed. This may take up to 30 days.';
    case 'completed':
      return 'Your data has been deleted.';
    case 'rejected':
      return 'Your deletion request was rejected. Please contact support.';
    default:
      return 'Unknown status';
  }
}

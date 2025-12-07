/**
 * GDPR Data Export API
 *
 * Implements the "Right to Data Portability" (Article 20) as recommended
 * by the Security Audit Report (Section 3)
 *
 * POST /api/gdpr/export - Request data export
 * GET /api/gdpr/export - Download exported data
 *
 * @module app/api/gdpr/export
 * @see Security Audit Report - Compliance Requirements
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

// =============================================================================
// TYPES
// =============================================================================

interface UserExportData {
  metadata: {
    exportVersion: string;
    exportDate: string;
    userId: string;
    requestId: string;
    format: string;
  };
  profile: {
    id: string;
    email: string;
    name?: string;
    createdAt: string;
    tier: string;
    preferences?: Record<string, unknown>;
  };
  portfolio: Array<{
    id: string;
    cardId: string;
    game: string;
    quantity: number;
    purchasePrice?: number;
    purchaseDate?: string;
    notes?: string;
    createdAt: string;
  }>;
  watchlist: Array<{
    id: string;
    cardId: string;
    game: string;
    targetPrice?: number;
    notes?: string;
    createdAt: string;
  }>;
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
  }>;
  securityEvents: Array<{
    eventType: string;
    createdAt: string;
    ipAddress?: string;
  }>;
  consents: Array<{
    consentType: string;
    granted: boolean;
    createdAt: string;
    withdrawnAt?: string;
  }>;
}

interface ExportResponse {
  success: boolean;
  message: string;
  requestId?: string;
  status?: string;
  downloadUrl?: string;
  expiresAt?: string;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Extract user from request (placeholder - integrate with your auth)
 */
async function getUserFromRequest(req: NextRequest): Promise<{
  id: string;
  email: string;
  name?: string;
  tier: string;
  createdAt: string;
} | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  // Placeholder: In production, validate the token and fetch user data
  return {
    id: 'user_placeholder',
    email: 'placeholder@example.com',
    name: 'Placeholder User',
    tier: 'free',
    createdAt: new Date().toISOString(),
  };
}

/**
 * Fetch user's portfolio data (placeholder)
 */
async function fetchPortfolioData(userId: string): Promise<UserExportData['portfolio']> {
  // In production, query the portfolio table
  return [];
}

/**
 * Fetch user's watchlist data (placeholder)
 */
async function fetchWatchlistData(userId: string): Promise<UserExportData['watchlist']> {
  // In production, query the watchlist table
  return [];
}

/**
 * Fetch user's transaction data (placeholder)
 */
async function fetchTransactionData(userId: string): Promise<UserExportData['transactions']> {
  // In production, query transaction/payment tables
  return [];
}

/**
 * Fetch user's security events (placeholder)
 */
async function fetchSecurityEvents(userId: string): Promise<UserExportData['securityEvents']> {
  // In production, query security_events table (limited to user-relevant events)
  return [];
}

/**
 * Fetch user's consent records (placeholder)
 */
async function fetchConsentRecords(userId: string): Promise<UserExportData['consents']> {
  // In production, query user_consents table
  return [];
}

/**
 * Generate complete export data for a user
 */
async function generateExportData(user: {
  id: string;
  email: string;
  name?: string;
  tier: string;
  createdAt: string;
}): Promise<UserExportData> {
  const requestId = `gdpr_exp_${randomBytes(8).toString('hex')}`;

  const [portfolio, watchlist, transactions, securityEvents, consents] = await Promise.all([
    fetchPortfolioData(user.id),
    fetchWatchlistData(user.id),
    fetchTransactionData(user.id),
    fetchSecurityEvents(user.id),
    fetchConsentRecords(user.id),
  ]);

  return {
    metadata: {
      exportVersion: '1.0',
      exportDate: new Date().toISOString(),
      userId: user.id,
      requestId,
      format: 'json',
    },
    profile: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      tier: user.tier,
    },
    portfolio,
    watchlist,
    transactions,
    securityEvents,
    consents,
  };
}

/**
 * Log export request (for compliance)
 */
async function logExportRequest(
  userId: string,
  requestId: string,
  ipAddress: string
): Promise<void> {
  console.log(`[GDPR] Export request ${requestId} for user ${userId} from IP ${ipAddress}`);
  // In production, insert into gdpr_requests table
}

/**
 * Rate limit check (placeholder)
 */
async function checkRateLimit(userId: string): Promise<boolean> {
  // In production, check rate limits (e.g., 1 export per 24 hours)
  return true;
}

// =============================================================================
// API HANDLERS
// =============================================================================

/**
 * POST /api/gdpr/export
 * Request data export (for async processing of large datasets)
 */
export async function POST(req: NextRequest): Promise<NextResponse<ExportResponse>> {
  try {
    // Authenticate user
    const user = await getUserFromRequest(req);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentication required to request data export',
        },
        { status: 401 }
      );
    }

    // Check rate limits
    const withinLimits = await checkRateLimit(user.id);
    if (!withinLimits) {
      return NextResponse.json(
        {
          success: false,
          message: 'Export rate limit exceeded. Please try again later.',
        },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { format = 'json' } = body as { format?: 'json' | 'csv' };

    // Get client IP for logging
    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      'unknown';

    // Generate request ID
    const requestId = `gdpr_exp_${randomBytes(8).toString('hex')}`;

    // Log the request
    await logExportRequest(user.id, requestId, ipAddress);

    // For small datasets, we can return immediately
    // For large datasets, queue the job and return a status URL
    const exportData = await generateExportData(user);

    // In production, you might want to:
    // 1. Queue the export job for background processing
    // 2. Store the result in a secure location with expiry
    // 3. Send an email when ready with download link

    return NextResponse.json(
      {
        success: true,
        message: 'Export request received. Your data is being prepared.',
        requestId,
        status: 'processing',
      },
      { status: 202 }
    );
  } catch (error) {
    console.error('[GDPR] Export request error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred processing your request.',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/gdpr/export
 * Download exported data (immediate for small datasets)
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
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

    // Check rate limits
    const withinLimits = await checkRateLimit(user.id);
    if (!withinLimits) {
      return NextResponse.json(
        {
          success: false,
          message: 'Export rate limit exceeded. Please try again later.',
        },
        { status: 429 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'json';

    // Get client IP for logging
    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      'unknown';

    // Generate request ID and log
    const requestId = `gdpr_exp_${randomBytes(8).toString('hex')}`;
    await logExportRequest(user.id, requestId, ipAddress);

    // Generate export data
    const exportData = await generateExportData(user);

    if (format === 'json') {
      // Return JSON export
      return new NextResponse(JSON.stringify(exportData, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="apex-data-export-${user.id}-${new Date().toISOString().split('T')[0]}.json"`,
          'X-Request-Id': requestId,
        },
      });
    } else if (format === 'csv') {
      // Convert to CSV format
      const csvContent = convertToCSV(exportData);

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="apex-data-export-${user.id}-${new Date().toISOString().split('T')[0]}.csv"`,
          'X-Request-Id': requestId,
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid format. Supported formats: json, csv',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[GDPR] Export error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred generating your export.',
      },
      { status: 500 }
    );
  }
}

/**
 * Convert export data to CSV format
 */
function convertToCSV(data: UserExportData): string {
  const sections: string[] = [];

  // Metadata section
  sections.push('# EXPORT METADATA');
  sections.push(`Export Version,${data.metadata.exportVersion}`);
  sections.push(`Export Date,${data.metadata.exportDate}`);
  sections.push(`User ID,${data.metadata.userId}`);
  sections.push(`Request ID,${data.metadata.requestId}`);
  sections.push('');

  // Profile section
  sections.push('# PROFILE');
  sections.push('ID,Email,Name,Created At,Tier');
  sections.push(
    `${data.profile.id},${data.profile.email},${data.profile.name || ''},${data.profile.createdAt},${data.profile.tier}`
  );
  sections.push('');

  // Portfolio section
  sections.push('# PORTFOLIO');
  sections.push('ID,Card ID,Game,Quantity,Purchase Price,Purchase Date,Notes,Created At');
  for (const item of data.portfolio) {
    sections.push(
      `${item.id},${item.cardId},${item.game},${item.quantity},${item.purchasePrice || ''},${item.purchaseDate || ''},"${(item.notes || '').replace(/"/g, '""')}",${item.createdAt}`
    );
  }
  sections.push('');

  // Watchlist section
  sections.push('# WATCHLIST');
  sections.push('ID,Card ID,Game,Target Price,Notes,Created At');
  for (const item of data.watchlist) {
    sections.push(
      `${item.id},${item.cardId},${item.game},${item.targetPrice || ''},"${(item.notes || '').replace(/"/g, '""')}",${item.createdAt}`
    );
  }
  sections.push('');

  // Transactions section
  sections.push('# TRANSACTIONS');
  sections.push('ID,Type,Amount,Currency,Status,Created At');
  for (const tx of data.transactions) {
    sections.push(
      `${tx.id},${tx.type},${tx.amount},${tx.currency},${tx.status},${tx.createdAt}`
    );
  }
  sections.push('');

  // Security Events section (limited info for privacy)
  sections.push('# SECURITY EVENTS');
  sections.push('Event Type,Created At');
  for (const event of data.securityEvents) {
    sections.push(`${event.eventType},${event.createdAt}`);
  }
  sections.push('');

  // Consents section
  sections.push('# CONSENTS');
  sections.push('Consent Type,Granted,Created At,Withdrawn At');
  for (const consent of data.consents) {
    sections.push(
      `${consent.consentType},${consent.granted},${consent.createdAt},${consent.withdrawnAt || ''}`
    );
  }

  return sections.join('\n');
}

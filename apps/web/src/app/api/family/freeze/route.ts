/**
 * API Route: /api/family/freeze
 *
 * Freeze or unfreeze a child account (parent only)
 * Child accounts cannot unfreeze themselves
 *
 * POST /api/family/freeze
 * Body: { childId: string, freeze: boolean }
 * Returns: { success: boolean, accountFrozen: boolean }
 */

import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering - do not attempt static analysis during build
export const dynamic = 'force-dynamic';
import { db } from '@/db';
import { users } from '@/db/schema';
import { getUserFromRequest } from '@/lib/auth/jwt';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    // Authenticate the requesting user (must be parent)
    const parent = await getUserFromRequest(req);
    if (!parent) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { childId, freeze } = body;

    if (!childId || typeof freeze !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
    }

    // Verify child account exists and is linked to this parent
    const child = await db.query.users.findFirst({
      where: eq(users.id, childId),
    });

    if (!child) {
      return NextResponse.json({ error: 'Child account not found' }, { status: 404 });
    }

    if (child.parentId !== parent.id) {
      return NextResponse.json({ error: 'You do not have permission to freeze this account' }, { status: 403 });
    }

    // Update freeze status
    await db
      .update(users)
      .set({
        accountFrozen: freeze,
        accountFrozenAt: freeze ? new Date() : null,
        accountFrozenBy: freeze ? parent.id : null,
      })
      .where(eq(users.id, childId));

    return NextResponse.json({
      success: true,
      accountFrozen: freeze,
      message: freeze ? 'Account frozen successfully' : 'Account unfrozen successfully',
    });
  } catch (error) {
    console.error('Error freezing/unfreezing account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/family/freeze?childId=xxx
 * Get freeze status for a child account
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const childId = searchParams.get('childId');

    if (!childId) {
      return NextResponse.json({ error: 'Child ID is required' }, { status: 400 });
    }

    // Verify permission (must be parent or the child themselves)
    const child = await db.query.users.findFirst({
      where: eq(users.id, childId),
      columns: {
        id: true,
        parentId: true,
        accountFrozen: true,
        accountFrozenAt: true,
        accountFrozenBy: true,
      },
    });

    if (!child) {
      return NextResponse.json({ error: 'Child account not found' }, { status: 404 });
    }

    if (child.parentId !== user.id && child.id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({
      accountFrozen: child.accountFrozen,
      accountFrozenAt: child.accountFrozenAt,
      accountFrozenBy: child.accountFrozenBy,
    });
  } catch (error) {
    console.error('Error fetching freeze status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

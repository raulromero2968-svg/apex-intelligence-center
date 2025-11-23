/**
 * API Route: /api/family/controls
 *
 * Manage parental controls (bedtime, cooldown, spending limits)
 *
 * POST /api/family/controls
 * Body: {
 *   childId: string,
 *   bedtimeEnabled?: boolean,
 *   bedtimeStart?: string (HH:MM),
 *   bedtimeEnd?: string (HH:MM),
 *   cooldownEnabled?: boolean,
 *   spendingLimitCents?: number (always 0 for child accounts)
 * }
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
    const { childId, bedtimeEnabled, bedtimeStart, bedtimeEnd, cooldownEnabled, spendingLimitCents } = body;

    if (!childId) {
      return NextResponse.json({ error: 'Child ID is required' }, { status: 400 });
    }

    // Verify child account exists and is linked to this parent
    const child = await db.query.users.findFirst({
      where: eq(users.id, childId),
    });

    if (!child) {
      return NextResponse.json({ error: 'Child account not found' }, { status: 404 });
    }

    if (child.parentId !== parent.id) {
      return NextResponse.json({ error: 'You do not have permission to control this account' }, { status: 403 });
    }

    // Validate bedtime format if provided
    if (bedtimeStart && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(bedtimeStart)) {
      return NextResponse.json({ error: 'Invalid bedtime start format (use HH:MM)' }, { status: 400 });
    }
    if (bedtimeEnd && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(bedtimeEnd)) {
      return NextResponse.json({ error: 'Invalid bedtime end format (use HH:MM)' }, { status: 400 });
    }

    // Build update object with only provided fields
    const updateData: any = {};
    if (typeof bedtimeEnabled === 'boolean') updateData.bedtimeEnabled = bedtimeEnabled;
    if (bedtimeStart !== undefined) updateData.bedtimeStart = bedtimeStart;
    if (bedtimeEnd !== undefined) updateData.bedtimeEnd = bedtimeEnd;
    if (typeof cooldownEnabled === 'boolean') updateData.cooldownEnabled = cooldownEnabled;
    // Always enforce spending limit of $0 for child accounts
    if (spendingLimitCents !== undefined) updateData.spendingLimitCents = 0;

    // Update controls
    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, childId));

    // Fetch updated child data
    const updatedChild = await db.query.users.findFirst({
      where: eq(users.id, childId),
      columns: {
        bedtimeEnabled: true,
        bedtimeStart: true,
        bedtimeEnd: true,
        cooldownEnabled: true,
        spendingLimitCents: true,
      },
    });

    return NextResponse.json({
      success: true,
      controls: updatedChild,
      message: 'Parental controls updated successfully',
    });
  } catch (error) {
    console.error('Error updating parental controls:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/family/controls?childId=xxx
 * Get current parental control settings for a child account
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
        bedtimeEnabled: true,
        bedtimeStart: true,
        bedtimeEnd: true,
        cooldownEnabled: true,
        spendingLimitCents: true,
      },
    });

    if (!child) {
      return NextResponse.json({ error: 'Child account not found' }, { status: 404 });
    }

    if (child.parentId !== user.id && child.id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({
      bedtimeEnabled: child.bedtimeEnabled,
      bedtimeStart: child.bedtimeStart,
      bedtimeEnd: child.bedtimeEnd,
      cooldownEnabled: child.cooldownEnabled,
      spendingLimitCents: child.spendingLimitCents,
    });
  } catch (error) {
    console.error('Error fetching parental controls:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

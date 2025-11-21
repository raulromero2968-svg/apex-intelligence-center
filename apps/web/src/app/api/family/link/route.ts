/**
 * API Route: /api/family/link
 *
 * Link a child account to a parent account using OAuth-style family linking
 *
 * POST /api/family/link
 * Body: { childId: string }
 * Returns: { success: boolean, childId: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { getUserFromRequest } from '@/lib/auth/jwt';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    // Authenticate the requesting user (parent)
    const parent = await getUserFromRequest(req);
    if (!parent) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { childId } = body;

    if (!childId) {
      return NextResponse.json({ error: 'Child ID is required' }, { status: 400 });
    }

    // Verify child account exists
    const child = await db.query.users.findFirst({
      where: eq(users.id, childId),
    });

    if (!child) {
      return NextResponse.json({ error: 'Child account not found' }, { status: 404 });
    }

    // Check if child already has a parent
    if (child.parentId) {
      return NextResponse.json({ error: 'Child account already linked to a parent' }, { status: 400 });
    }

    // Link child to parent
    await db
      .update(users)
      .set({
        parentId: parent.id,
        accountType: 'child',
        spendingLimitCents: 0, // Always $0 for child accounts
      })
      .where(eq(users.id, childId));

    // Update parent account type if needed
    if (parent.subscriptionTier !== 'parent') {
      await db
        .update(users)
        .set({ accountType: 'parent' })
        .where(eq(users.id, parent.id));
    }

    return NextResponse.json({
      success: true,
      childId,
      message: 'Child account successfully linked',
    });
  } catch (error) {
    console.error('Error linking child account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/family/link
 * Get all linked children for the authenticated parent
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all children linked to this parent
    const children = await db.query.users.findMany({
      where: eq(users.parentId, user.id),
      columns: {
        id: true,
        name: true,
        email: true,
        accountType: true,
        accountFrozen: true,
        accountFrozenAt: true,
        bedtimeEnabled: true,
        bedtimeStart: true,
        bedtimeEnd: true,
        cooldownEnabled: true,
        spendingLimitCents: true,
        breakModeUntil: true,
        breakModeActivatedBy: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ children });
  } catch (error) {
    console.error('Error fetching linked children:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/family/link
 * Unlink a child account from the parent
 * Body: { childId: string }
 */
export async function DELETE(req: NextRequest) {
  try {
    const parent = await getUserFromRequest(req);
    if (!parent) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { childId } = body;

    if (!childId) {
      return NextResponse.json({ error: 'Child ID is required' }, { status: 400 });
    }

    // Verify the child is linked to this parent
    const child = await db.query.users.findFirst({
      where: eq(users.id, childId),
    });

    if (!child || child.parentId !== parent.id) {
      return NextResponse.json({ error: 'Child not found or not linked to this parent' }, { status: 404 });
    }

    // Unlink the child
    await db
      .update(users)
      .set({
        parentId: null,
        accountType: 'independent',
        accountFrozen: false,
        accountFrozenAt: null,
        accountFrozenBy: null,
      })
      .where(eq(users.id, childId));

    return NextResponse.json({
      success: true,
      message: 'Child account unlinked successfully',
    });
  } catch (error) {
    console.error('Error unlinking child account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

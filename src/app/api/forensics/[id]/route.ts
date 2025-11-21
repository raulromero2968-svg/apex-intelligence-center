/**
 * GET /api/forensics/[id]
 * Fetch a forensic report (compliance log) by ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { complianceLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }

    // Fetch the compliance log (forensic report)
    const report = await db.query.complianceLogs.findFirst({
      where: eq(complianceLogs.id, id),
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Forensic report not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error fetching forensic report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

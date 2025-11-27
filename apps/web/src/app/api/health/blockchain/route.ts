import { NextResponse } from 'next/server';
import { db } from '@/db';
import { blockchainFloorPrices } from '@apex/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Check database connectivity
    await db.execute(sql`SELECT 1`);

    // Get last observed block per chain
    const lastBlocks = await db
      .select({
        chain: blockchainFloorPrices.chain,
        blockNumber: sql<number>`MAX(${blockchainFloorPrices.blockNumber})`.as('block_number'),
        observedAt: sql<Date>`MAX(${blockchainFloorPrices.observedAt})`.as('observed_at'),
      })
      .from(blockchainFloorPrices)
      .groupBy(blockchainFloorPrices.chain);

    const chainStatus = lastBlocks.reduce(
      (acc, row) => {
        acc[row.chain] = {
          lastBlock: Number(row.blockNumber),
          lastObservedAt: row.observedAt.toISOString(),
        };
        return acc;
      },
      {} as Record<string, { lastBlock: number; lastObservedAt: string }>
    );

    // Get total record count
    const totalRecords = await db
      .select({ count: sql<number>`COUNT(*)`.as('count') })
      .from(blockchainFloorPrices)
      .then((rows) => Number(rows[0]?.count ?? 0));

    return NextResponse.json({
      status: 'healthy',
      database: {
        connected: true,
        totalRecords,
      },
      chains: {
        immutable_zkevm: chainStatus.immutable_zkevm ?? {
          lastBlock: 0,
          lastObservedAt: null,
        },
        ronin: chainStatus.ronin ?? {
          lastBlock: 0,
          lastObservedAt: null,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}



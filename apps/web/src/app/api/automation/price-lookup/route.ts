/**
 * Automation Proof-of-Concept: TCG Price Lookup
 *
 * This API demonstrates Fara-7B's ability to automate TCG price lookups.
 * Part of Phase 1 AI Scientist integration.
 *
 * The endpoint accepts a card search request and uses Fara-7B to:
 * 1. Navigate to TCGPlayer/eBay
 * 2. Search for the specified card
 * 3. Extract pricing data
 * 4. Return structured results
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  FaraClient,
  createFaraClient,
  Task,
  TaskResult,
  ActionLog,
} from '@apex/knowledge-graph';
import { Neo4jClient, createNeo4jClient } from '@apex/knowledge-graph';
import { v4 as uuidv4 } from 'uuid';

// In-memory task storage for demo purposes
// In production, use PostgreSQL via the tasks table
const taskStorage = new Map<string, {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  request: PriceLookupRequest;
  result?: PriceLookupResult;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}>();

interface PriceLookupRequest {
  cardName: string;
  set?: string;
  grading?: string;
  condition?: string;
  marketplace?: 'TCGPlayer' | 'eBay' | 'CardMarket' | 'all';
  saveToGraph?: boolean;
}

interface PriceData {
  marketplace: string;
  price: number;
  currency: string;
  condition: string;
  grading: string;
  seller?: string;
  listingUrl?: string;
  timestamp: string;
}

interface PriceLookupResult {
  cardName: string;
  set?: string;
  prices: PriceData[];
  lowestPrice?: PriceData;
  highestPrice?: PriceData;
  averagePrice?: number;
  priceRange?: { min: number; max: number };
  executionMetrics: {
    actionCount: number;
    durationMs: number;
    estimatedCost: number;
  };
  savedToGraph: boolean;
}

let faraClient: FaraClient | null = null;
let neo4jClient: Neo4jClient | null = null;

function getFaraClient(): FaraClient {
  if (!faraClient) {
    try {
      faraClient = createFaraClient();
    } catch {
      // Return a mock client for demo if API key is not set
      return new MockFaraClient();
    }
  }
  return faraClient;
}

function getNeo4jClient(): Neo4jClient {
  if (!neo4jClient) {
    neo4jClient = createNeo4jClient();
  }
  return neo4jClient;
}

/**
 * Mock Fara client for demonstration when API is not available
 */
class MockFaraClient {
  async searchCardPrice(
    cardName: string,
    marketplace: string,
    options?: { grading?: string; condition?: string }
  ): Promise<TaskResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate mock price data based on card name
    const basePrice = cardName.toLowerCase().includes('charizard')
      ? 350
      : cardName.toLowerCase().includes('black lotus')
      ? 250000
      : cardName.toLowerCase().includes('pikachu')
      ? 25
      : 50;

    const gradeMultiplier = options?.grading?.includes('10') ? 3.5
      : options?.grading?.includes('9') ? 1.5
      : 1.0;

    const price = basePrice * gradeMultiplier * (0.9 + Math.random() * 0.2);

    return {
      taskId: uuidv4(),
      status: 'completed',
      result: {
        prices: [
          {
            marketplace,
            price: Math.round(price * 100) / 100,
            currency: 'USD',
            condition: options?.condition || 'Near Mint',
            grading: options?.grading || 'Raw',
            seller: 'DemoSeller123',
            listingUrl: `https://example.com/listing/${uuidv4().slice(0, 8)}`,
            timestamp: new Date().toISOString(),
          },
        ],
      },
      actionCount: Math.floor(Math.random() * 10) + 5,
      duration: Math.floor(Math.random() * 5000) + 2000,
      cost: 0.002,
      screenshots: [],
    };
  }
}

/**
 * GET /api/automation/price-lookup
 *
 * Get the status of a price lookup task
 *
 * Query params:
 *   - taskId: The task ID to check
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const action = searchParams.get('action') ?? 'status';

    if (action === 'list') {
      // List recent tasks
      const tasks = Array.from(taskStorage.values())
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 20)
        .map(t => ({
          id: t.id,
          cardName: t.request.cardName,
          status: t.status,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        }));

      return NextResponse.json({ tasks });
    }

    if (!taskId) {
      return NextResponse.json(
        { error: 'Missing required parameter: taskId' },
        { status: 400 }
      );
    }

    const task = taskStorage.get(taskId);
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: task.id,
      status: task.status,
      request: task.request,
      result: task.result,
      error: task.error,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    });
  } catch (error) {
    console.error('Error getting price lookup task:', error);
    return NextResponse.json(
      { error: 'Failed to get task', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/automation/price-lookup
 *
 * Submit a new price lookup task
 */
export async function POST(request: NextRequest) {
  try {
    const body: PriceLookupRequest = await request.json();

    // Validate required fields
    if (!body.cardName) {
      return NextResponse.json(
        { error: 'Missing required field: cardName' },
        { status: 400 }
      );
    }

    const taskId = uuidv4();
    const marketplace = body.marketplace || 'TCGPlayer';

    // Create task entry
    const task = {
      id: taskId,
      status: 'pending' as const,
      request: body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    taskStorage.set(taskId, task);

    // Update to running
    task.status = 'running';
    task.updatedAt = new Date();

    // Execute the price lookup (async)
    executePriceLookup(taskId, body).catch(error => {
      console.error('Price lookup failed:', error);
      const t = taskStorage.get(taskId);
      if (t) {
        t.status = 'failed';
        t.error = error instanceof Error ? error.message : 'Unknown error';
        t.updatedAt = new Date();
      }
    });

    return NextResponse.json({
      taskId,
      status: 'running',
      message: `Price lookup for "${body.cardName}" started. Use GET /api/automation/price-lookup?taskId=${taskId} to check status.`,
    }, { status: 202 });
  } catch (error) {
    console.error('Error creating price lookup task:', error);
    return NextResponse.json(
      { error: 'Failed to create task', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Execute the price lookup using Fara-7B
 */
async function executePriceLookup(taskId: string, request: PriceLookupRequest): Promise<void> {
  const task = taskStorage.get(taskId);
  if (!task) return;

  const client = getFaraClient();
  const allPrices: PriceData[] = [];
  let totalActions = 0;
  let totalDuration = 0;
  let totalCost = 0;

  const marketplaces = request.marketplace === 'all'
    ? ['TCGPlayer', 'eBay', 'CardMarket']
    : [request.marketplace || 'TCGPlayer'];

  for (const marketplace of marketplaces) {
    try {
      const result = await client.searchCardPrice(
        request.cardName,
        marketplace,
        {
          grading: request.grading,
          condition: request.condition,
        }
      );

      if (result.status === 'completed' && result.result?.prices) {
        allPrices.push(...result.result.prices);
      }

      totalActions += result.actionCount;
      totalDuration += result.duration;
      totalCost += result.cost;
    } catch (error) {
      console.error(`Failed to lookup price on ${marketplace}:`, error);
    }
  }

  // Calculate statistics
  const prices = allPrices.map(p => p.price);
  const lowestPrice = allPrices.reduce((min, p) => p.price < (min?.price ?? Infinity) ? p : min, allPrices[0]);
  const highestPrice = allPrices.reduce((max, p) => p.price > (max?.price ?? -Infinity) ? p : max, allPrices[0]);
  const averagePrice = prices.length > 0
    ? Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100
    : undefined;

  const lookupResult: PriceLookupResult = {
    cardName: request.cardName,
    set: request.set,
    prices: allPrices,
    lowestPrice,
    highestPrice,
    averagePrice,
    priceRange: prices.length > 0
      ? { min: Math.min(...prices), max: Math.max(...prices) }
      : undefined,
    executionMetrics: {
      actionCount: totalActions,
      durationMs: totalDuration,
      estimatedCost: Math.round(totalCost * 10000) / 10000,
    },
    savedToGraph: false,
  };

  // Save to knowledge graph if requested
  if (request.saveToGraph && allPrices.length > 0) {
    try {
      const neo4j = getNeo4jClient();

      // Check if card exists, create if not
      const cardQuery = `
        MERGE (c:Card {name: $cardName})
        ON CREATE SET
          c.id = $cardId,
          c.set = $set,
          c.type = 'Pokemon',
          c.createdAt = datetime(),
          c.updatedAt = datetime()
        RETURN c.id AS cardId
      `;

      const cardResult = await neo4j.write(cardQuery, {
        cardName: request.cardName,
        cardId: uuidv4(),
        set: request.set || 'Unknown',
      });

      const cardId = cardResult[0]?.cardId;

      // Save transactions
      for (const priceData of allPrices) {
        const marketId = `market-${priceData.marketplace.toLowerCase().replace(/\s+/g, '')}`;

        await neo4j.createTransaction(cardId, marketId, {
          price: priceData.price,
          currency: priceData.currency,
          condition: priceData.condition,
          grading: priceData.grading,
          quantity: 1,
          date: new Date(priceData.timestamp),
          source: 'Fara-7B Automation',
        });
      }

      lookupResult.savedToGraph = true;
    } catch (error) {
      console.error('Failed to save to knowledge graph:', error);
    }
  }

  // Update task with result
  task.status = 'completed';
  task.result = lookupResult;
  task.updatedAt = new Date();
}

/**
 * DELETE /api/automation/price-lookup
 *
 * Cancel a running task or delete a completed task
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        { error: 'Missing required parameter: taskId' },
        { status: 400 }
      );
    }

    const task = taskStorage.get(taskId);
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    taskStorage.delete(taskId);

    return NextResponse.json({
      success: true,
      message: `Task ${taskId} deleted`,
    });
  } catch (error) {
    console.error('Error deleting price lookup task:', error);
    return NextResponse.json(
      { error: 'Failed to delete task', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Knowledge Graph Transactions API
 *
 * Endpoints for managing price transactions in the Neo4j knowledge graph.
 * Part of Phase 1 AI Scientist integration.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Neo4jClient, createNeo4jClient } from '@apex/knowledge-graph';

let neo4jClient: Neo4jClient | null = null;

function getClient(): Neo4jClient {
  if (!neo4jClient) {
    neo4jClient = createNeo4jClient();
  }
  return neo4jClient;
}

/**
 * GET /api/knowledge-graph/transactions
 *
 * Query transactions from the knowledge graph
 *
 * Query params:
 *   - action: 'list' | 'by-card' | 'by-market' | 'stats' | 'recent'
 *   - cardId: Filter by card ID
 *   - marketId: Filter by market ID
 *   - minPrice: Minimum price filter
 *   - maxPrice: Maximum price filter
 *   - grading: Filter by grading (PSA 10, BGS 9.5, etc.)
 *   - limit: Number of results (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const client = getClient();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') ?? 'list';
    const cardId = searchParams.get('cardId');
    const marketId = searchParams.get('marketId');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const grading = searchParams.get('grading');
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);

    switch (action) {
      case 'list': {
        // List transactions with optional filters
        const conditions: string[] = [];
        const params: Record<string, unknown> = { limit };

        if (minPrice) {
          conditions.push('t.price >= $minPrice');
          params.minPrice = parseFloat(minPrice);
        }
        if (maxPrice) {
          conditions.push('t.price <= $maxPrice');
          params.maxPrice = parseFloat(maxPrice);
        }
        if (grading) {
          conditions.push('t.grading = $grading');
          params.grading = grading;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const query = `
          MATCH (c:Card)-[:PRICED_AT]->(t:Transaction)-[:OCCURRED_ON]->(m:Market)
          ${whereClause}
          RETURN t, c.name AS cardName, c.set AS cardSet, m.name AS marketName
          ORDER BY t.date DESC
          LIMIT $limit
        `;

        const transactions = await client.read(query, params);
        return NextResponse.json({
          transactions: transactions.map(r => ({
            ...r.t,
            cardName: r.cardName,
            cardSet: r.cardSet,
            marketName: r.marketName,
          })),
          count: transactions.length,
        });
      }

      case 'by-card': {
        if (!cardId) {
          return NextResponse.json(
            { error: 'Missing required parameter: cardId' },
            { status: 400 }
          );
        }

        const history = await client.getCardPriceHistory(cardId, limit);
        return NextResponse.json({
          cardId,
          transactions: history,
          count: history.length,
        });
      }

      case 'by-market': {
        if (!marketId) {
          return NextResponse.json(
            { error: 'Missing required parameter: marketId' },
            { status: 400 }
          );
        }

        const query = `
          MATCH (c:Card)-[:PRICED_AT]->(t:Transaction)-[:OCCURRED_ON]->(m:Market {id: $marketId})
          RETURN t, c.name AS cardName, c.set AS cardSet
          ORDER BY t.date DESC
          LIMIT $limit
        `;

        const transactions = await client.read(query, { marketId, limit });
        return NextResponse.json({
          marketId,
          transactions: transactions.map(r => ({
            ...r.t,
            cardName: r.cardName,
            cardSet: r.cardSet,
          })),
          count: transactions.length,
        });
      }

      case 'recent': {
        // Get most recent transactions across all cards
        const query = `
          MATCH (c:Card)-[:PRICED_AT]->(t:Transaction)-[:OCCURRED_ON]->(m:Market)
          RETURN t, c.name AS cardName, c.set AS cardSet, c.id AS cardId, m.name AS marketName
          ORDER BY t.date DESC
          LIMIT $limit
        `;

        const transactions = await client.read(query, { limit });
        return NextResponse.json({
          transactions: transactions.map(r => ({
            ...r.t,
            cardName: r.cardName,
            cardSet: r.cardSet,
            cardId: r.cardId,
            marketName: r.marketName,
          })),
          count: transactions.length,
        });
      }

      case 'stats': {
        // Get transaction statistics
        const query = `
          MATCH (t:Transaction)
          RETURN
            count(t) AS totalTransactions,
            round(sum(t.price) * 100) / 100 AS totalVolume,
            round(avg(t.price) * 100) / 100 AS avgPrice,
            min(t.price) AS minPrice,
            max(t.price) AS maxPrice
        `;

        const stats = await client.read(query, {});

        // Get by grading breakdown
        const gradingQuery = `
          MATCH (t:Transaction)
          RETURN t.grading AS grading, count(t) AS count, round(avg(t.price) * 100) / 100 AS avgPrice
          ORDER BY avgPrice DESC
        `;

        const gradingStats = await client.read(gradingQuery, {});

        // Get by market breakdown
        const marketQuery = `
          MATCH (t:Transaction)-[:OCCURRED_ON]->(m:Market)
          RETURN m.name AS market, count(t) AS count, round(sum(t.price) * 100) / 100 AS volume
          ORDER BY volume DESC
        `;

        const marketStats = await client.read(marketQuery, {});

        return NextResponse.json({
          overview: stats[0] || {},
          byGrading: gradingStats,
          byMarket: marketStats,
        });
      }

      case 'high-value': {
        // Find high-value transactions (over $10,000)
        const threshold = parseFloat(searchParams.get('threshold') ?? '10000');

        const query = `
          MATCH (c:Card)-[:PRICED_AT]->(t:Transaction)-[:OCCURRED_ON]->(m:Market)
          WHERE t.price >= $threshold
          RETURN t, c.name AS cardName, c.set AS cardSet, c.id AS cardId, m.name AS marketName
          ORDER BY t.price DESC
          LIMIT $limit
        `;

        const transactions = await client.read(query, { threshold, limit });
        return NextResponse.json({
          threshold,
          transactions: transactions.map(r => ({
            ...r.t,
            cardName: r.cardName,
            cardSet: r.cardSet,
            cardId: r.cardId,
            marketName: r.marketName,
          })),
          count: transactions.length,
        });
      }

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Valid actions: list, by-card, by-market, recent, stats, high-value` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error querying transactions:', error);
    return NextResponse.json(
      { error: 'Failed to query transactions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/knowledge-graph/transactions
 *
 * Create a new transaction in the knowledge graph
 */
export async function POST(request: NextRequest) {
  try {
    const client = getClient();
    const body = await request.json();

    // Validate required fields
    if (!body.cardId) {
      return NextResponse.json(
        { error: 'Missing required field: cardId' },
        { status: 400 }
      );
    }
    if (!body.marketId) {
      return NextResponse.json(
        { error: 'Missing required field: marketId' },
        { status: 400 }
      );
    }
    if (!body.price) {
      return NextResponse.json(
        { error: 'Missing required field: price' },
        { status: 400 }
      );
    }

    const transaction = await client.createTransaction(
      body.cardId,
      body.marketId,
      {
        price: body.price,
        currency: body.currency || 'USD',
        condition: body.condition || 'Near Mint',
        grading: body.grading || 'Raw',
        quantity: body.quantity || 1,
        date: body.date ? new Date(body.date) : new Date(),
        source: body.source || 'API',
      }
    );

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/knowledge-graph/transactions
 *
 * Delete a transaction from the knowledge graph
 */
export async function DELETE(request: NextRequest) {
  try {
    const client = getClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }

    // Delete transaction and its relationships
    const query = `
      MATCH (t:Transaction {id: $id})
      OPTIONAL MATCH (t)-[r]-()
      DELETE r, t
      RETURN count(t) AS deleted
    `;

    const result = await client.write(query, { id });

    if (result[0]?.deleted === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json(
      { error: 'Failed to delete transaction', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

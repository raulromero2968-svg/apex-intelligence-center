/**
 * Knowledge Graph Cards API
 *
 * Endpoints for managing TCG cards in the Neo4j knowledge graph.
 * Part of Phase 1 AI Scientist integration.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Neo4jClient, createNeo4jClient, CardNode } from '@apex/knowledge-graph';

let neo4jClient: Neo4jClient | null = null;

function getClient(): Neo4jClient {
  if (!neo4jClient) {
    neo4jClient = createNeo4jClient();
  }
  return neo4jClient;
}

/**
 * GET /api/knowledge-graph/cards
 *
 * Query cards from the knowledge graph
 *
 * Query params:
 *   - action: 'list' | 'search' | 'get' | 'price-history'
 *   - name: Card name for search
 *   - id: Card ID for specific card
 *   - set: Filter by set name
 *   - limit: Number of results (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const client = getClient();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') ?? 'list';
    const name = searchParams.get('name');
    const id = searchParams.get('id');
    const set = searchParams.get('set');
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);

    switch (action) {
      case 'list': {
        // List all cards with optional set filter
        let query = `
          MATCH (c:Card)
          ${set ? 'WHERE c.set = $set' : ''}
          RETURN c
          ORDER BY c.name
          LIMIT $limit
        `;

        const cards = await client.read<{ c: CardNode }>(query, { set, limit });
        return NextResponse.json({
          cards: cards.map(r => r.c),
          count: cards.length,
        });
      }

      case 'search': {
        if (!name) {
          return NextResponse.json(
            { error: 'Missing required parameter: name' },
            { status: 400 }
          );
        }

        const cards = await client.findCardsByName(name);
        return NextResponse.json({
          cards,
          count: cards.length,
          query: name,
        });
      }

      case 'get': {
        if (!id) {
          return NextResponse.json(
            { error: 'Missing required parameter: id' },
            { status: 400 }
          );
        }

        const query = `
          MATCH (c:Card {id: $id})
          OPTIONAL MATCH (c)-[:SOLD_ON]->(m:Market)
          OPTIONAL MATCH (c)-[:PRICED_AT]->(t:Transaction)
          WITH c, collect(DISTINCT m.name) AS markets, count(t) AS transactionCount
          RETURN c, markets, transactionCount
        `;

        const result = await client.read(query, { id });
        if (result.length === 0) {
          return NextResponse.json({ error: 'Card not found' }, { status: 404 });
        }

        return NextResponse.json({
          card: result[0].c,
          markets: result[0].markets,
          transactionCount: result[0].transactionCount,
        });
      }

      case 'price-history': {
        if (!id) {
          return NextResponse.json(
            { error: 'Missing required parameter: id' },
            { status: 400 }
          );
        }

        const history = await client.getCardPriceHistory(id, limit);
        return NextResponse.json({
          cardId: id,
          priceHistory: history,
          count: history.length,
        });
      }

      case 'stats': {
        // Get card statistics
        const query = `
          MATCH (c:Card)
          WITH c.type AS cardType, count(c) AS count
          RETURN cardType, count
          ORDER BY count DESC
        `;

        const stats = await client.read(query, {});

        const totalQuery = `
          MATCH (c:Card)
          RETURN count(c) AS total
        `;
        const totalResult = await client.read(totalQuery, {});

        return NextResponse.json({
          total: totalResult[0]?.total || 0,
          byType: stats,
        });
      }

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Valid actions: list, search, get, price-history, stats` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error querying cards:', error);
    return NextResponse.json(
      { error: 'Failed to query cards', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/knowledge-graph/cards
 *
 * Create a new card in the knowledge graph
 */
export async function POST(request: NextRequest) {
  try {
    const client = getClient();
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['name', 'set', 'rarity', 'cardNumber', 'releaseDate', 'type'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const card = await client.createCard({
      name: body.name,
      set: body.set,
      rarity: body.rarity,
      cardNumber: body.cardNumber,
      releaseDate: new Date(body.releaseDate),
      description: body.description || '',
      type: body.type,
      attributes: body.attributes || {},
      imageUrl: body.imageUrl,
    });

    return NextResponse.json({ card }, { status: 201 });
  } catch (error) {
    console.error('Error creating card:', error);
    return NextResponse.json(
      { error: 'Failed to create card', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/knowledge-graph/cards
 *
 * Update a card in the knowledge graph
 */
export async function PUT(request: NextRequest) {
  try {
    const client = getClient();
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    // Build dynamic update query
    const updates: string[] = [];
    const params: Record<string, unknown> = { id: body.id };

    if (body.name) { updates.push('c.name = $name'); params.name = body.name; }
    if (body.set) { updates.push('c.set = $set'); params.set = body.set; }
    if (body.rarity) { updates.push('c.rarity = $rarity'); params.rarity = body.rarity; }
    if (body.description) { updates.push('c.description = $description'); params.description = body.description; }
    if (body.attributes) { updates.push('c.attributes = $attributes'); params.attributes = body.attributes; }
    if (body.imageUrl) { updates.push('c.imageUrl = $imageUrl'); params.imageUrl = body.imageUrl; }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    updates.push('c.updatedAt = datetime()');

    const query = `
      MATCH (c:Card {id: $id})
      SET ${updates.join(', ')}
      RETURN c
    `;

    const result = await client.write(query, params);

    if (result.length === 0) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    return NextResponse.json({ card: result[0].c });
  } catch (error) {
    console.error('Error updating card:', error);
    return NextResponse.json(
      { error: 'Failed to update card', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/knowledge-graph/cards
 *
 * Delete a card from the knowledge graph
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

    // Delete card and its relationships
    const query = `
      MATCH (c:Card {id: $id})
      OPTIONAL MATCH (c)-[r]-()
      DELETE r, c
      RETURN count(c) AS deleted
    `;

    const result = await client.write(query, { id });

    if (result[0]?.deleted === 0) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error deleting card:', error);
    return NextResponse.json(
      { error: 'Failed to delete card', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

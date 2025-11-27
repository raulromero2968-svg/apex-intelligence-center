/**
 * Knowledge Graph Concepts API
 *
 * Endpoints for managing concepts/keywords in the Neo4j knowledge graph.
 * Part of Phase 1 AI Scientist integration.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Neo4jClient, createNeo4jClient, ConceptNode } from '@apex/knowledge-graph';

let neo4jClient: Neo4jClient | null = null;

function getClient(): Neo4jClient {
  if (!neo4jClient) {
    neo4jClient = createNeo4jClient();
  }
  return neo4jClient;
}

/**
 * GET /api/knowledge-graph/concepts
 *
 * Query concepts from the knowledge graph
 *
 * Query params:
 *   - action: 'list' | 'search' | 'get' | 'related' | 'co-occurrence' | 'stats'
 *   - name: Concept name
 *   - category: Filter by category
 *   - limit: Number of results (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const client = getClient();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') ?? 'list';
    const name = searchParams.get('name');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);

    switch (action) {
      case 'list': {
        // List all concepts with optional category filter
        let query = `
          MATCH (c:Concept)
          ${category ? 'WHERE c.category = $category' : ''}
          RETURN c
          ORDER BY c.frequency DESC
          LIMIT $limit
        `;

        const concepts = await client.read<{ c: ConceptNode }>(query, { category, limit });
        return NextResponse.json({
          concepts: concepts.map(r => r.c),
          count: concepts.length,
        });
      }

      case 'search': {
        if (!name) {
          return NextResponse.json(
            { error: 'Missing required parameter: name' },
            { status: 400 }
          );
        }

        // Use full-text search or pattern matching
        const query = `
          CALL db.index.fulltext.queryNodes('concept_fulltext_index', $searchTerm)
          YIELD node, score
          RETURN node as c, score
          ORDER BY score DESC
          LIMIT $limit
        `;

        try {
          const concepts = await client.read(query, { searchTerm: name, limit });
          return NextResponse.json({
            concepts: concepts.map(r => ({ ...r.c, score: r.score })),
            count: concepts.length,
            query: name,
          });
        } catch {
          // Fallback to pattern matching if full-text index doesn't exist
          const fallbackQuery = `
            MATCH (c:Concept)
            WHERE c.name CONTAINS $name OR c.definition CONTAINS $name
            RETURN c
            ORDER BY c.frequency DESC
            LIMIT $limit
          `;
          const concepts = await client.read(fallbackQuery, { name, limit });
          return NextResponse.json({
            concepts: concepts.map(r => r.c),
            count: concepts.length,
            query: name,
          });
        }
      }

      case 'get': {
        if (!name) {
          return NextResponse.json(
            { error: 'Missing required parameter: name' },
            { status: 400 }
          );
        }

        const query = `
          MATCH (c:Concept {name: $name})
          OPTIONAL MATCH (r:Research)-[m:MENTIONS]->(c)
          OPTIONAL MATCH (c)-[co:CO_OCCURS_WITH]-(related:Concept)
          WITH c,
               count(DISTINCT r) AS mentionCount,
               collect(DISTINCT {name: related.name, frequency: co.frequency}) AS relatedConcepts
          RETURN c, mentionCount, relatedConcepts
        `;

        const result = await client.read(query, { name });
        if (result.length === 0) {
          return NextResponse.json({ error: 'Concept not found' }, { status: 404 });
        }

        return NextResponse.json({
          concept: result[0].c,
          mentionCount: result[0].mentionCount,
          relatedConcepts: result[0].relatedConcepts,
        });
      }

      case 'related': {
        if (!name) {
          return NextResponse.json(
            { error: 'Missing required parameter: name' },
            { status: 400 }
          );
        }

        const related = await client.findRelatedConcepts(name, limit);
        return NextResponse.json({
          concept: name,
          relatedConcepts: related,
          count: related.length,
        });
      }

      case 'co-occurrence': {
        // Get full co-occurrence network for visualization
        const query = `
          MATCH (c1:Concept)-[r:CO_OCCURS_WITH]-(c2:Concept)
          WHERE id(c1) < id(c2)  // Avoid duplicates
          RETURN c1.name AS concept1, c2.name AS concept2, r.frequency AS frequency, r.strength AS strength
          ORDER BY r.frequency DESC
          LIMIT $limit
        `;

        const coOccurrences = await client.read(query, { limit });
        return NextResponse.json({
          coOccurrences,
          count: coOccurrences.length,
        });
      }

      case 'stats': {
        // Get concept statistics
        const overviewQuery = `
          MATCH (c:Concept)
          RETURN
            count(c) AS totalConcepts,
            sum(c.frequency) AS totalMentions,
            round(avg(c.frequency) * 100) / 100 AS avgFrequency
        `;

        const overview = await client.read(overviewQuery, {});

        // Get by category breakdown
        const categoryQuery = `
          MATCH (c:Concept)
          RETURN c.category AS category, count(c) AS count, sum(c.frequency) AS totalFrequency
          ORDER BY count DESC
        `;

        const byCategory = await client.read(categoryQuery, {});

        // Get top concepts
        const topQuery = `
          MATCH (c:Concept)
          RETURN c.name AS concept, c.frequency AS frequency, c.category AS category
          ORDER BY c.frequency DESC
          LIMIT 10
        `;

        const topConcepts = await client.read(topQuery, {});

        return NextResponse.json({
          overview: overview[0] || {},
          byCategory,
          topConcepts,
        });
      }

      case 'network': {
        // Get concept network for visualization
        const nodesQuery = `
          MATCH (c:Concept)
          RETURN c.id AS id, c.name AS name, c.category AS category, c.frequency AS frequency
          ORDER BY c.frequency DESC
          LIMIT $limit
        `;

        const nodes = await client.read(nodesQuery, { limit });

        const edgesQuery = `
          MATCH (c1:Concept)-[r:CO_OCCURS_WITH]-(c2:Concept)
          WHERE id(c1) < id(c2)
          RETURN c1.name AS source, c2.name AS target, r.frequency AS weight, r.strength AS strength
          ORDER BY r.frequency DESC
          LIMIT $limit
        `;

        const edges = await client.read(edgesQuery, { limit });

        return NextResponse.json({
          nodes,
          edges,
        });
      }

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Valid actions: list, search, get, related, co-occurrence, stats, network` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error querying concepts:', error);
    return NextResponse.json(
      { error: 'Failed to query concepts', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/knowledge-graph/concepts
 *
 * Create a new concept or co-occurrence relationship
 */
export async function POST(request: NextRequest) {
  try {
    const client = getClient();
    const body = await request.json();
    const action = body.action ?? 'create';

    switch (action) {
      case 'create': {
        // Validate required fields
        if (!body.name) {
          return NextResponse.json(
            { error: 'Missing required field: name' },
            { status: 400 }
          );
        }

        const concept = await client.createConcept({
          name: body.name,
          definition: body.definition || '',
          category: body.category || 'general',
          frequency: body.frequency || 1,
        });

        return NextResponse.json({ concept }, { status: 201 });
      }

      case 'co-occur': {
        // Create a co-occurrence relationship
        if (!body.concept1 || !body.concept2) {
          return NextResponse.json(
            { error: 'Missing required fields: concept1 and concept2' },
            { status: 400 }
          );
        }

        await client.createConceptCoOccurrence(
          body.concept1,
          body.concept2,
          body.paperId || 'manual'
        );

        return NextResponse.json({
          success: true,
          concept1: body.concept1,
          concept2: body.concept2,
        }, { status: 201 });
      }

      case 'link-research': {
        // Link a concept to a research paper
        if (!body.conceptName || !body.paperId) {
          return NextResponse.json(
            { error: 'Missing required fields: conceptName and paperId' },
            { status: 400 }
          );
        }

        const query = `
          MATCH (r:Research {id: $paperId}), (c:Concept {name: $conceptName})
          MERGE (r)-[m:MENTIONS]->(c)
          ON CREATE SET m.frequency = 1, m.importance = $importance
          ON MATCH SET m.frequency = m.frequency + 1
          RETURN r.title AS paper, c.name AS concept
        `;

        const result = await client.write(query, {
          paperId: body.paperId,
          conceptName: body.conceptName,
          importance: body.importance || 0.5,
        });

        if (result.length === 0) {
          return NextResponse.json(
            { error: 'Paper or concept not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          paper: result[0].paper,
          concept: result[0].concept,
        }, { status: 201 });
      }

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Valid actions: create, co-occur, link-research` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error creating concept:', error);
    return NextResponse.json(
      { error: 'Failed to create concept', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/knowledge-graph/concepts
 *
 * Update a concept
 */
export async function PUT(request: NextRequest) {
  try {
    const client = getClient();
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: 'Missing required field: name (to identify the concept)' },
        { status: 400 }
      );
    }

    // Build dynamic update query
    const updates: string[] = [];
    const params: Record<string, unknown> = { name: body.name };

    if (body.definition) { updates.push('c.definition = $definition'); params.definition = body.definition; }
    if (body.category) { updates.push('c.category = $category'); params.category = body.category; }
    if (body.frequency !== undefined) { updates.push('c.frequency = $frequency'); params.frequency = body.frequency; }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    updates.push('c.updatedAt = datetime()');

    const query = `
      MATCH (c:Concept {name: $name})
      SET ${updates.join(', ')}
      RETURN c
    `;

    const result = await client.write(query, params);

    if (result.length === 0) {
      return NextResponse.json({ error: 'Concept not found' }, { status: 404 });
    }

    return NextResponse.json({ concept: result[0].c });
  } catch (error) {
    console.error('Error updating concept:', error);
    return NextResponse.json(
      { error: 'Failed to update concept', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/knowledge-graph/concepts
 *
 * Delete a concept
 */
export async function DELETE(request: NextRequest) {
  try {
    const client = getClient();
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json(
        { error: 'Missing required parameter: name' },
        { status: 400 }
      );
    }

    // Delete concept and its relationships
    const query = `
      MATCH (c:Concept {name: $name})
      OPTIONAL MATCH (c)-[r]-()
      DELETE r, c
      RETURN count(c) AS deleted
    `;

    const result = await client.write(query, { name });

    if (result[0]?.deleted === 0) {
      return NextResponse.json({ error: 'Concept not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, name });
  } catch (error) {
    console.error('Error deleting concept:', error);
    return NextResponse.json(
      { error: 'Failed to delete concept', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

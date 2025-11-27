/**
 * Knowledge Graph Research API
 *
 * Endpoints for managing research papers in the Neo4j knowledge graph.
 * Part of Phase 1 AI Scientist integration.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Neo4jClient, createNeo4jClient, ResearchNode } from '@apex/knowledge-graph';

let neo4jClient: Neo4jClient | null = null;

function getClient(): Neo4jClient {
  if (!neo4jClient) {
    neo4jClient = createNeo4jClient();
  }
  return neo4jClient;
}

/**
 * GET /api/knowledge-graph/research
 *
 * Query research papers from the knowledge graph
 *
 * Query params:
 *   - action: 'list' | 'search' | 'get' | 'citations' | 'citing' | 'by-concept' | 'stats'
 *   - query: Search query for full-text search
 *   - id: Paper ID for specific paper
 *   - concept: Concept name for filtering
 *   - year: Filter by year
 *   - limit: Number of results (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const client = getClient();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') ?? 'list';
    const query = searchParams.get('query');
    const id = searchParams.get('id');
    const concept = searchParams.get('concept');
    const year = searchParams.get('year');
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);

    switch (action) {
      case 'list': {
        // List all research papers with optional year filter
        let cypherQuery = `
          MATCH (r:Research)
          ${year ? 'WHERE r.year = $year' : ''}
          RETURN r
          ORDER BY r.year DESC, r.citationCount DESC
          LIMIT $limit
        `;

        const params: Record<string, unknown> = { limit };
        if (year) params.year = parseInt(year, 10);

        const papers = await client.read<{ r: ResearchNode }>(cypherQuery, params);
        return NextResponse.json({
          papers: papers.map(p => p.r),
          count: papers.length,
        });
      }

      case 'search': {
        if (!query) {
          return NextResponse.json(
            { error: 'Missing required parameter: query' },
            { status: 400 }
          );
        }

        // Use full-text search
        const cypherQuery = `
          CALL db.index.fulltext.queryNodes('research_fulltext_index', $searchTerm)
          YIELD node, score
          RETURN node as r, score
          ORDER BY score DESC
          LIMIT $limit
        `;

        const papers = await client.read(cypherQuery, { searchTerm: query, limit });
        return NextResponse.json({
          papers: papers.map(p => ({ ...p.r, score: p.score })),
          count: papers.length,
          query,
        });
      }

      case 'get': {
        if (!id) {
          return NextResponse.json(
            { error: 'Missing required parameter: id' },
            { status: 400 }
          );
        }

        const cypherQuery = `
          MATCH (r:Research {id: $id})
          OPTIONAL MATCH (r)-[:MENTIONS]->(c:Concept)
          OPTIONAL MATCH (r)-[:CITES]->(cited:Research)
          OPTIONAL MATCH (r)<-[:CITES]-(citing:Research)
          WITH r,
               collect(DISTINCT c.name) AS concepts,
               count(DISTINCT cited) AS citedCount,
               count(DISTINCT citing) AS citingCount
          RETURN r, concepts, citedCount, citingCount
        `;

        const result = await client.read(cypherQuery, { id });
        if (result.length === 0) {
          return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
        }

        return NextResponse.json({
          paper: result[0].r,
          concepts: result[0].concepts,
          citedPapersCount: result[0].citedCount,
          citingPapersCount: result[0].citingCount,
        });
      }

      case 'citations': {
        // Get papers cited by a given paper
        if (!id) {
          return NextResponse.json(
            { error: 'Missing required parameter: id' },
            { status: 400 }
          );
        }

        const cypherQuery = `
          MATCH (r:Research {id: $id})-[c:CITES]->(cited:Research)
          RETURN cited as paper, c.context AS context, c.section AS section, c.sentiment AS sentiment
          ORDER BY cited.year DESC
        `;

        const citations = await client.read(cypherQuery, { id });
        return NextResponse.json({
          paperId: id,
          citations: citations.map(c => ({
            paper: c.paper,
            context: c.context,
            section: c.section,
            sentiment: c.sentiment,
          })),
          count: citations.length,
        });
      }

      case 'citing': {
        // Get papers that cite a given paper
        if (!id) {
          return NextResponse.json(
            { error: 'Missing required parameter: id' },
            { status: 400 }
          );
        }

        const papers = await client.findCitingPapers(id);
        return NextResponse.json({
          paperId: id,
          citingPapers: papers,
          count: papers.length,
        });
      }

      case 'by-concept': {
        if (!concept) {
          return NextResponse.json(
            { error: 'Missing required parameter: concept' },
            { status: 400 }
          );
        }

        const cypherQuery = `
          MATCH (r:Research)-[m:MENTIONS]->(c:Concept {name: $concept})
          RETURN r, m.importance AS relevance
          ORDER BY m.importance DESC, r.year DESC
          LIMIT $limit
        `;

        const papers = await client.read(cypherQuery, { concept, limit });
        return NextResponse.json({
          concept,
          papers: papers.map(p => ({ ...p.r, relevance: p.relevance })),
          count: papers.length,
        });
      }

      case 'stats': {
        // Get research paper statistics
        const overviewQuery = `
          MATCH (r:Research)
          RETURN
            count(r) AS totalPapers,
            sum(r.citationCount) AS totalCitations,
            round(avg(r.citationCount) * 100) / 100 AS avgCitations
        `;

        const overview = await client.read(overviewQuery, {});

        // Get by year breakdown
        const yearQuery = `
          MATCH (r:Research)
          RETURN r.year AS year, count(r) AS count
          ORDER BY year DESC
        `;

        const byYear = await client.read(yearQuery, {});

        // Get by venue breakdown
        const venueQuery = `
          MATCH (r:Research)
          RETURN r.venue AS venue, count(r) AS count
          ORDER BY count DESC
          LIMIT 10
        `;

        const byVenue = await client.read(venueQuery, {});

        return NextResponse.json({
          overview: overview[0] || {},
          byYear,
          byVenue,
        });
      }

      case 'network': {
        // Get citation network for visualization
        const cypherQuery = `
          MATCH (r1:Research)-[c:CITES]->(r2:Research)
          RETURN r1.id AS source, r2.id AS target, r1.title AS sourceTitle, r2.title AS targetTitle
          LIMIT $limit
        `;

        const edges = await client.read(cypherQuery, { limit });

        const nodesQuery = `
          MATCH (r:Research)
          RETURN r.id AS id, r.title AS title, r.year AS year, r.citationCount AS citations
          ORDER BY r.citationCount DESC
          LIMIT $limit
        `;

        const nodes = await client.read(nodesQuery, { limit });

        return NextResponse.json({
          nodes,
          edges,
        });
      }

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Valid actions: list, search, get, citations, citing, by-concept, stats, network` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error querying research:', error);
    return NextResponse.json(
      { error: 'Failed to query research', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/knowledge-graph/research
 *
 * Create a new research paper or citation
 */
export async function POST(request: NextRequest) {
  try {
    const client = getClient();
    const body = await request.json();
    const action = body.action ?? 'create';

    switch (action) {
      case 'create': {
        // Validate required fields
        const requiredFields = ['title', 'abstract', 'authors', 'year', 'venue', 'url'];
        for (const field of requiredFields) {
          if (!body[field]) {
            return NextResponse.json(
              { error: `Missing required field: ${field}` },
              { status: 400 }
            );
          }
        }

        const paper = await client.createResearch({
          title: body.title,
          abstract: body.abstract,
          authors: body.authors,
          year: body.year,
          venue: body.venue,
          url: body.url,
          doi: body.doi,
          keywords: body.keywords || [],
          fullText: body.fullText,
          citationCount: body.citationCount || 0,
        });

        return NextResponse.json({ paper }, { status: 201 });
      }

      case 'cite': {
        // Create a citation relationship
        if (!body.citingPaperId || !body.citedPaperId) {
          return NextResponse.json(
            { error: 'Missing required fields: citingPaperId and citedPaperId' },
            { status: 400 }
          );
        }

        await client.createCitation(
          body.citingPaperId,
          body.citedPaperId,
          body.context || '',
          body.section || 'References'
        );

        return NextResponse.json({
          success: true,
          citingPaperId: body.citingPaperId,
          citedPaperId: body.citedPaperId,
        }, { status: 201 });
      }

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Valid actions: create, cite` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error creating research:', error);
    return NextResponse.json(
      { error: 'Failed to create research', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/knowledge-graph/research
 *
 * Update a research paper
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

    if (body.title) { updates.push('r.title = $title'); params.title = body.title; }
    if (body.abstract) { updates.push('r.abstract = $abstract'); params.abstract = body.abstract; }
    if (body.authors) { updates.push('r.authors = $authors'); params.authors = body.authors; }
    if (body.keywords) { updates.push('r.keywords = $keywords'); params.keywords = body.keywords; }
    if (body.citationCount !== undefined) { updates.push('r.citationCount = $citationCount'); params.citationCount = body.citationCount; }
    if (body.fullText) { updates.push('r.fullText = $fullText'); params.fullText = body.fullText; }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    updates.push('r.updatedAt = datetime()');

    const cypherQuery = `
      MATCH (r:Research {id: $id})
      SET ${updates.join(', ')}
      RETURN r
    `;

    const result = await client.write(cypherQuery, params);

    if (result.length === 0) {
      return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
    }

    return NextResponse.json({ paper: result[0].r });
  } catch (error) {
    console.error('Error updating research:', error);
    return NextResponse.json(
      { error: 'Failed to update research', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/knowledge-graph/research
 *
 * Delete a research paper
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

    // Delete paper and its relationships
    const cypherQuery = `
      MATCH (r:Research {id: $id})
      OPTIONAL MATCH (r)-[rel]-()
      DELETE rel, r
      RETURN count(r) AS deleted
    `;

    const result = await client.write(cypherQuery, { id });

    if (result[0]?.deleted === 0) {
      return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error deleting research:', error);
    return NextResponse.json(
      { error: 'Failed to delete research', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

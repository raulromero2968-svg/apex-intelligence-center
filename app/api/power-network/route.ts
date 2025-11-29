/**
 * Power Network API - Graph Data Endpoint
 *
 * Returns entities and relationships for the network visualization.
 * Transforms database records into force-graph compatible format.
 *
 * @module api/power-network
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// =============================================================================
// TYPES
// =============================================================================

interface PowerEntity {
  id: string;
  name: string;
  type: string;
  evidenceTier: string;
  primaryDomain: string;
  summary: string | null;
  scandalNotes: string | null;
}

interface PowerRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  relationshipType: string;
  domain: string;
  evidenceTier: string;
  description: string | null;
  evidenceLink: string | null;
  significance: string | null;
  startDate: string | null;
  endDate: string | null;
}

interface GraphNode {
  id: string;
  name: string;
  type: string;
  evidenceTier: string;
  primaryDomain: string;
  summary?: string;
  scandalNotes?: string;
}

interface GraphLink {
  source: string;
  target: string;
  relationshipType: string;
  domain: string;
  evidenceTier: string;
  description?: string;
  evidenceLink?: string;
  significance?: string;
  startDate?: string;
  endDate?: string;
}

// =============================================================================
// DATABASE CONNECTION
// =============================================================================

function getPool() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error('Database connection string not configured');
  }
  return new Pool({ connectionString });
}

// =============================================================================
// ROUTE HANDLERS
// =============================================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain');
  const entityType = searchParams.get('type');
  const evidenceTier = searchParams.get('tier');

  let pool: Pool | null = null;

  try {
    pool = getPool();

    // Build entity query with filters
    let entityQuery = `
      SELECT
        id,
        name,
        type,
        evidence_tier as "evidenceTier",
        primary_domain as "primaryDomain",
        summary,
        scandal_notes as "scandalNotes"
      FROM power_entities
      WHERE 1=1
    `;
    const entityParams: string[] = [];

    if (domain) {
      entityParams.push(domain);
      entityQuery += ` AND primary_domain = $${entityParams.length}`;
    }

    if (entityType) {
      entityParams.push(entityType);
      entityQuery += ` AND type = $${entityParams.length}`;
    }

    if (evidenceTier) {
      entityParams.push(evidenceTier);
      entityQuery += ` AND evidence_tier = $${entityParams.length}`;
    }

    entityQuery += ' ORDER BY name';

    // Build relationship query with filters
    let relationshipQuery = `
      SELECT
        r.id,
        r.source_id as "sourceId",
        r.target_id as "targetId",
        r.relationship_type as "relationshipType",
        r.domain,
        r.evidence_tier as "evidenceTier",
        r.description,
        r.evidence_link as "evidenceLink",
        r.significance,
        r.start_date as "startDate",
        r.end_date as "endDate"
      FROM power_relationships r
    `;

    if (domain) {
      relationshipQuery += ` WHERE r.domain = $1`;
    }

    relationshipQuery += ' ORDER BY r.created_at DESC';

    // Execute queries
    const [entitiesResult, relationshipsResult] = await Promise.all([
      pool.query(entityQuery, entityParams),
      pool.query(relationshipQuery, domain ? [domain] : []),
    ]);

    const entities: PowerEntity[] = entitiesResult.rows;
    const relationships: PowerRelationship[] = relationshipsResult.rows;

    // Transform to graph format
    const nodes: GraphNode[] = entities.map((entity) => ({
      id: entity.id,
      name: entity.name,
      type: entity.type,
      evidenceTier: entity.evidenceTier,
      primaryDomain: entity.primaryDomain,
      summary: entity.summary || undefined,
      scandalNotes: entity.scandalNotes || undefined,
    }));

    // Filter relationships to only include those with valid nodes
    const nodeIds = new Set(nodes.map((n) => n.id));
    const links: GraphLink[] = relationships
      .filter((rel) => nodeIds.has(rel.sourceId) && nodeIds.has(rel.targetId))
      .map((rel) => ({
        source: rel.sourceId,
        target: rel.targetId,
        relationshipType: rel.relationshipType,
        domain: rel.domain,
        evidenceTier: rel.evidenceTier,
        description: rel.description || undefined,
        evidenceLink: rel.evidenceLink || undefined,
        significance: rel.significance || 'medium',
        startDate: rel.startDate ? new Date(rel.startDate).toISOString() : undefined,
        endDate: rel.endDate ? new Date(rel.endDate).toISOString() : undefined,
      }));

    return NextResponse.json({
      nodes,
      links,
      meta: {
        totalNodes: nodes.length,
        totalLinks: links.length,
        filters: {
          domain,
          entityType,
          evidenceTier,
        },
      },
    });
  } catch (error) {
    console.error('Power Network API Error:', error);

    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes('Database connection')) {
      return NextResponse.json(
        { error: 'Database not configured', message: error.message },
        { status: 503 }
      );
    }

    // Return demo data if database is not available
    return NextResponse.json(getDemoData());
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// =============================================================================
// DEMO DATA (For development without database)
// =============================================================================

function getDemoData() {
  const nodes: GraphNode[] = [
    {
      id: '1',
      name: 'Luminous Jellyfish Principle',
      type: 'CONCEPT',
      evidenceTier: 'CONFIRMED',
      primaryDomain: 'ARTS',
      summary: 'The proof that beauty is possible in the abyss. The guiding philosophy of Apex Intelligence.',
    },
    {
      id: '2',
      name: 'Jeffrey Epstein',
      type: 'PERSON',
      evidenceTier: 'CONFIRMED',
      primaryDomain: 'BUSINESS',
      summary: 'Financier and convicted sex offender. Central node of the network.',
      scandalNotes: 'Federal indictment for sex trafficking of minors (2019). Previous conviction (2008) with controversial NPA.',
    },
    {
      id: '3',
      name: 'Ghislaine Maxwell',
      type: 'PERSON',
      evidenceTier: 'CONFIRMED',
      primaryDomain: 'BUSINESS',
      summary: 'Convicted sex trafficker. Primary associate and facilitator.',
      scandalNotes: 'Convicted December 2021 on five federal counts including sex trafficking of a minor.',
    },
    {
      id: '4',
      name: 'Donald Trump',
      type: 'PERSON',
      evidenceTier: 'DOCUMENTED',
      primaryDomain: 'GOVERNMENT',
      summary: '45th President of the United States. Documented social associate (1987-2004).',
    },
    {
      id: '5',
      name: 'Bill Clinton',
      type: 'PERSON',
      evidenceTier: 'DOCUMENTED',
      primaryDomain: 'GOVERNMENT',
      summary: '42nd President of the United States. Documented associate and flight passenger.',
    },
    {
      id: '6',
      name: 'Prince Andrew',
      type: 'PERSON',
      evidenceTier: 'DOCUMENTED',
      primaryDomain: 'FAMILY',
      summary: 'Duke of York. Stripped of HRH titles due to Epstein association.',
    },
    {
      id: '7',
      name: 'Alexander Acosta',
      type: 'PERSON',
      evidenceTier: 'CONFIRMED',
      primaryDomain: 'GOVERNMENT',
      summary: 'Former US Attorney (S.D. Florida) and Labor Secretary. Arranged the 2008 NPA.',
    },
    {
      id: '8',
      name: '2008 Non-Prosecution Agreement',
      type: 'EVENT',
      evidenceTier: 'CONFIRMED',
      primaryDomain: 'GOVERNMENT',
      summary: 'The controversial immunity deal granting protection to unnamed co-conspirators.',
    },
    {
      id: '9',
      name: 'JPMorgan Chase',
      type: 'ORGANIZATION',
      evidenceTier: 'CONFIRMED',
      primaryDomain: 'BUSINESS',
      summary: 'Global financial institution. Paid $290M settlement regarding Epstein banking relationship.',
    },
    {
      id: '10',
      name: 'Deutsche Bank',
      type: 'ORGANIZATION',
      evidenceTier: 'CONFIRMED',
      primaryDomain: 'BUSINESS',
      summary: 'German multinational bank. Paid $75M settlement regarding Epstein accounts.',
    },
    {
      id: '11',
      name: 'Victims (Collective)',
      type: 'ORGANIZATION',
      evidenceTier: 'CONFIRMED',
      primaryDomain: 'FAMILY',
      summary: 'The survivors and victims of the trafficking ring.',
    },
  ];

  const links: GraphLink[] = [
    {
      source: '2',
      target: '3',
      relationshipType: 'SOCIAL',
      domain: 'BUSINESS',
      evidenceTier: 'CONFIRMED',
      description: 'Partner and co-conspirator in sex trafficking ring.',
      significance: 'critical',
      startDate: '1991-01-01',
      endDate: '2019-07-01',
    },
    {
      source: '7',
      target: '8',
      relationshipType: 'LEGAL',
      domain: 'GOVERNMENT',
      evidenceTier: 'CONFIRMED',
      description: 'Acosta authorized the NPA granting blanket immunity to potential co-conspirators.',
      significance: 'critical',
    },
    {
      source: '8',
      target: '2',
      relationshipType: 'LEGAL',
      domain: 'GOVERNMENT',
      evidenceTier: 'CONFIRMED',
      description: 'Granted Epstein immunity from federal prosecution for trafficking charges.',
      significance: 'critical',
    },
    {
      source: '4',
      target: '2',
      relationshipType: 'SOCIAL',
      domain: 'MEDIA',
      evidenceTier: 'DOCUMENTED',
      description: "Close social friendship. Trump called him a 'terrific guy' in 2002 New York Magazine profile.",
      significance: 'medium',
      startDate: '1987-01-01',
      endDate: '2004-01-01',
    },
    {
      source: '5',
      target: '2',
      relationshipType: 'SOCIAL',
      domain: 'BUSINESS',
      evidenceTier: 'DOCUMENTED',
      description: "Clinton flew on Epstein's jet multiple times for Africa/Asia trips per flight logs.",
      significance: 'medium',
    },
    {
      source: '9',
      target: '2',
      relationshipType: 'FINANCIAL',
      domain: 'BUSINESS',
      evidenceTier: 'CONFIRMED',
      description: 'Facilitated financial transactions. Paid $290M settlement to trafficking victims.',
      significance: 'critical',
    },
    {
      source: '10',
      target: '2',
      relationshipType: 'FINANCIAL',
      domain: 'BUSINESS',
      evidenceTier: 'CONFIRMED',
      description: 'Maintained banking relationship post-conviction. Paid $75M regulatory settlement.',
      significance: 'high',
    },
    {
      source: '6',
      target: '2',
      relationshipType: 'SOCIAL',
      domain: 'FAMILY',
      evidenceTier: 'ALLEGED',
      description: 'Close social ties documented. Stayed at Epstein properties. Civil settlement with accuser.',
      significance: 'high',
    },
    {
      source: '2',
      target: '11',
      relationshipType: 'LEGAL',
      domain: 'FAMILY',
      evidenceTier: 'CONFIRMED',
      description: 'Systematic abuse and trafficking of minors. Documented in federal indictment.',
      significance: 'critical',
    },
    {
      source: '3',
      target: '11',
      relationshipType: 'LEGAL',
      domain: 'FAMILY',
      evidenceTier: 'CONFIRMED',
      description: 'Facilitated trafficking and abuse. Convicted on five federal counts.',
      significance: 'critical',
    },
    {
      source: '1',
      target: '11',
      relationshipType: 'IDEOLOGICAL',
      domain: 'ARTS',
      evidenceTier: 'CONFIRMED',
      description: 'The Luminous Jellyfish Principle exists in service to survivors. Light persists for them.',
      significance: 'critical',
    },
  ];

  return {
    nodes,
    links,
    meta: {
      totalNodes: nodes.length,
      totalLinks: links.length,
      source: 'demo',
      message: 'Using demo data. Connect database for live data.',
    },
  };
}

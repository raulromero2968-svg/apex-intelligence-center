/**
 * Civilizational Analytics Client for Apex Intelligence Center
 *
 * This module extends the knowledge graph to map elite power networks,
 * institutional influence, and cross-domain relationships using the
 * "Seven Mountains" framework.
 *
 * The core thesis: The same mechanisms that drive TCG market manipulation
 * (artificial scarcity, insider knowledge, wash trading, gatekeeping)
 * operate at civilizational scale in elite power networks.
 *
 * @module civilizational-client
 * @version 1.0.0
 */

import neo4j, { Driver, Session } from 'neo4j-driver';
import { v4 as uuidv4 } from 'uuid';

/**
 * The Seven Mountains of Societal Influence
 * Framework for categorizing domains of power
 */
export const SEVEN_MOUNTAINS = {
  GOVERNMENT: 'government',
  MEDIA: 'media',
  BUSINESS: 'business',
  EDUCATION: 'education',
  RELIGION: 'religion',
  FAMILY: 'family',
  ARTS: 'arts',
} as const;

export type SevenMountain = (typeof SEVEN_MOUNTAINS)[keyof typeof SEVEN_MOUNTAINS];

/**
 * Entity types in the power network
 */
export type EntityType =
  | 'person'
  | 'corporation'
  | 'foundation'
  | 'government_agency'
  | 'think_tank'
  | 'university'
  | 'media_outlet'
  | 'political_party'
  | 'religious_org'
  | 'ngo'
  | 'investment_fund';

/**
 * Event types for tracking interactions
 */
export type EventType =
  | 'meeting'
  | 'donation'
  | 'appointment'
  | 'transaction'
  | 'speech'
  | 'legislation'
  | 'scandal'
  | 'acquisition'
  | 'partnership'
  | 'litigation';

/**
 * Influence mechanism types - parallel to TCG market mechanisms
 */
export type InfluenceMechanism =
  | 'artificial_scarcity' // Rentism, IP feudalism
  | 'insider_knowledge' // Kompromat, advance warning
  | 'gatekeeping' // Institutional legitimacy control
  | 'wash_trading' // Circular donations, foundation grants
  | 'market_making' // State capture, rule rewriting
  | 'narrative_control' // Media manipulation, manufactured consent
  | 'network_leverage'; // Social capital, mutual vulnerability

/**
 * Narrative stance types
 */
export type NarrativeStance =
  | 'supportive'
  | 'critical'
  | 'neutral'
  | 'obfuscating'
  | 'contradicting';

/**
 * Base node interface
 */
export interface CivilizationalBaseNode {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  sourceUrls: string[];
  confidence: number; // 0-1 confidence in data accuracy
  verifiedAt?: Date;
}

/**
 * Entity node - represents a person, organization, or institution
 */
export interface EntityNode extends CivilizationalBaseNode {
  name: string;
  type: EntityType;
  aliases: string[];
  description: string;
  foundedYear?: number;
  headquarters?: string;
  netWorth?: number;
  currency?: string;
  domains: SevenMountain[]; // Which mountains they operate in
  publicProfile: boolean; // Is this a public figure/org?
  faraRegistered?: boolean; // Foreign Agent Registration Act
  tags: string[];
}

/**
 * Domain node - represents one of the Seven Mountains
 */
export interface DomainNode extends CivilizationalBaseNode {
  name: SevenMountain;
  displayName: string;
  description: string;
  keyInstitutions: string[];
  influenceMetrics: {
    gdpPercentage?: number;
    employmentPercentage?: number;
    mediaReachPercentage?: number;
  };
}

/**
 * Event node - represents a significant interaction or occurrence
 */
export interface EventNode extends CivilizationalBaseNode {
  name: string;
  type: EventType;
  date: Date;
  endDate?: Date;
  location?: string;
  description: string;
  monetaryValue?: number;
  currency?: string;
  isPublic: boolean;
  sourceDocuments: string[];
}

/**
 * Narrative node - represents a media narrative or information pattern
 */
export interface NarrativeNode extends CivilizationalBaseNode {
  title: string;
  summary: string;
  startDate: Date;
  peakDate?: Date;
  endDate?: Date;
  mediaOutlets: string[];
  reachEstimate?: number;
  stance: NarrativeStance;
  keywords: string[];
  contradictions: string[]; // IDs of contradicting narratives
}

/**
 * Unified Asset node - bridges TCG assets and civilizational assets
 * This enables cross-domain analysis: Charizard prices ↔ cobalt mining
 */
export interface UnifiedAssetNode extends CivilizationalBaseNode {
  name: string;
  category: 'tcg_card' | 'commodity' | 'real_estate' | 'equity' | 'ip' | 'political_capital';
  currentValue?: number;
  currency?: string;
  supplyMetrics?: {
    totalSupply?: number;
    circulatingSupply?: number;
    artificialScarcity: boolean;
  };
  ethicalFlags?: string[]; // e.g., "child labor in supply chain"
  linkedTcgCardId?: string; // Link to existing Card node if applicable
}

/**
 * Relationship types for power network edges
 */
export type CivilizationalRelationshipType =
  // Entity relationships
  | 'OPERATES_IN' // Entity → Domain
  | 'INFLUENCES' // Entity → Entity (with mechanism)
  | 'AFFILIATED_WITH' // Entity ↔ Entity (bidirectional)
  | 'FUNDS' // Entity → Entity (financial flow)
  | 'CONTROLS' // Entity → Entity (ownership/control)
  | 'EMPLOYS' // Entity → Entity (employment)
  | 'FOUNDED' // Entity → Entity (creation)
  | 'BOARD_MEMBER' // Person → Organization
  // Event relationships
  | 'PARTICIPATED_IN' // Entity → Event
  | 'ORGANIZED' // Entity → Event
  | 'RESULTED_IN' // Event → Event (causal chain)
  // Narrative relationships
  | 'REPORTED_BY' // Narrative → Entity (media outlet)
  | 'FEATURES' // Narrative → Entity (subject)
  | 'CONTRADICTS' // Narrative ↔ Narrative
  | 'AMPLIFIES' // Narrative → Narrative
  // Asset relationships
  | 'OWNS' // Entity → Asset
  | 'TRADES' // Entity → Asset
  | 'SUPPLIES' // Entity → Asset (supply chain)
  | 'DEPENDS_ON'; // Asset → Asset (supply chain)

/**
 * Influence edge properties
 */
export interface InfluenceEdgeProperties {
  mechanism: InfluenceMechanism;
  strength: number; // 0-1
  bidirectional: boolean;
  startDate?: Date;
  endDate?: Date;
  evidence: string[];
  publiclyKnown: boolean;
}

/**
 * Funding edge properties
 */
export interface FundingEdgeProperties {
  amount: number;
  currency: string;
  date: Date;
  recurring: boolean;
  purpose?: string;
  disclosed: boolean;
  sourceDocument?: string;
}

/**
 * Configuration for Civilizational Analytics client
 */
export interface CivilizationalConfig {
  uri: string;
  username: string;
  password: string;
  database?: string;
}

/**
 * Civilizational Analytics Client
 */
export class CivilizationalClient {
  private driver: Driver;
  private database: string;

  constructor(config: CivilizationalConfig) {
    this.driver = neo4j.driver(config.uri, neo4j.auth.basic(config.username, config.password));
    this.database = config.database || 'neo4j';
  }

  private getSession(): Session {
    return this.driver.session({ database: this.database });
  }

  /**
   * Initialize schema and constraints for civilizational analytics
   */
  async initializeSchema(): Promise<void> {
    const session = this.getSession();
    try {
      // Create constraints
      const constraints = [
        'CREATE CONSTRAINT entity_id IF NOT EXISTS FOR (e:Entity) REQUIRE e.id IS UNIQUE',
        'CREATE CONSTRAINT domain_name IF NOT EXISTS FOR (d:Domain) REQUIRE d.name IS UNIQUE',
        'CREATE CONSTRAINT event_id IF NOT EXISTS FOR (e:Event) REQUIRE e.id IS UNIQUE',
        'CREATE CONSTRAINT narrative_id IF NOT EXISTS FOR (n:Narrative) REQUIRE n.id IS UNIQUE',
        'CREATE CONSTRAINT unified_asset_id IF NOT EXISTS FOR (a:UnifiedAsset) REQUIRE a.id IS UNIQUE',
      ];

      for (const constraint of constraints) {
        try {
          await session.run(constraint);
        } catch (e) {
          // Constraint may already exist
        }
      }

      // Create indexes for common queries
      const indexes = [
        'CREATE INDEX entity_name IF NOT EXISTS FOR (e:Entity) ON (e.name)',
        'CREATE INDEX entity_type IF NOT EXISTS FOR (e:Entity) ON (e.type)',
        'CREATE INDEX event_date IF NOT EXISTS FOR (e:Event) ON (e.date)',
        'CREATE INDEX event_type IF NOT EXISTS FOR (e:Event) ON (e.type)',
        'CREATE INDEX narrative_start IF NOT EXISTS FOR (n:Narrative) ON (n.startDate)',
      ];

      for (const index of indexes) {
        try {
          await session.run(index);
        } catch (e) {
          // Index may already exist
        }
      }

      // Create full-text search indexes
      try {
        await session.run(`
          CREATE FULLTEXT INDEX entity_search IF NOT EXISTS
          FOR (e:Entity)
          ON EACH [e.name, e.description, e.aliases]
        `);
      } catch (e) {
        // Index may already exist
      }

      console.log('Civilizational analytics schema initialized');
    } finally {
      await session.close();
    }
  }

  /**
   * Seed the Seven Mountains domain nodes
   */
  async seedDomains(): Promise<void> {
    const domains: Omit<DomainNode, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: SEVEN_MOUNTAINS.GOVERNMENT,
        displayName: 'Government & Military',
        description:
          'Legislative, executive, judicial branches; military; intelligence agencies; regulatory bodies',
        keyInstitutions: [
          'US Congress',
          'White House',
          'Supreme Court',
          'Pentagon',
          'CIA',
          'FBI',
          'Federal Reserve',
        ],
        influenceMetrics: { gdpPercentage: 24, employmentPercentage: 15 },
        sourceUrls: [],
        confidence: 1.0,
      },
      {
        name: SEVEN_MOUNTAINS.MEDIA,
        displayName: 'Media & Entertainment',
        description:
          'News media, social media platforms, entertainment industry, publishing, advertising',
        keyInstitutions: [
          'New York Times',
          'Washington Post',
          'Fox News',
          'CNN',
          'Google',
          'Meta',
          'Disney',
          'Netflix',
        ],
        influenceMetrics: { gdpPercentage: 6, mediaReachPercentage: 95 },
        sourceUrls: [],
        confidence: 1.0,
      },
      {
        name: SEVEN_MOUNTAINS.BUSINESS,
        displayName: 'Business & Finance',
        description:
          'Corporations, banks, investment firms, private equity, venture capital, trade associations',
        keyInstitutions: [
          'Goldman Sachs',
          'BlackRock',
          'JPMorgan',
          'Berkshire Hathaway',
          'US Chamber of Commerce',
        ],
        influenceMetrics: { gdpPercentage: 55, employmentPercentage: 70 },
        sourceUrls: [],
        confidence: 1.0,
      },
      {
        name: SEVEN_MOUNTAINS.EDUCATION,
        displayName: 'Education & Academia',
        description:
          'Universities, research institutions, think tanks, public schools, professional training',
        keyInstitutions: [
          'Harvard',
          'Stanford',
          'MIT',
          'Brookings Institution',
          'RAND Corporation',
          'Council on Foreign Relations',
        ],
        influenceMetrics: { gdpPercentage: 7, employmentPercentage: 10 },
        sourceUrls: [],
        confidence: 1.0,
      },
      {
        name: SEVEN_MOUNTAINS.RELIGION,
        displayName: 'Religion & Philosophy',
        description:
          'Religious institutions, spiritual movements, ethical frameworks, moral authority',
        keyInstitutions: [
          'Catholic Church',
          'Southern Baptist Convention',
          'Evangelical Council',
          'Major denominations',
        ],
        influenceMetrics: { gdpPercentage: 1.2 },
        sourceUrls: [],
        confidence: 1.0,
      },
      {
        name: SEVEN_MOUNTAINS.FAMILY,
        displayName: 'Family & Community',
        description: 'Family structures, community organizations, social services, local governance',
        keyInstitutions: ['Local governments', 'Community organizations', 'Social services'],
        influenceMetrics: {},
        sourceUrls: [],
        confidence: 1.0,
      },
      {
        name: SEVEN_MOUNTAINS.ARTS,
        displayName: 'Arts & Culture',
        description: 'Visual arts, music, literature, cultural institutions, sports, fashion',
        keyInstitutions: [
          'Metropolitan Museum',
          'Smithsonian',
          'Major sports leagues',
          'Fashion houses',
        ],
        influenceMetrics: { gdpPercentage: 4.3 },
        sourceUrls: [],
        confidence: 1.0,
      },
    ];

    const session = this.getSession();
    try {
      for (const domain of domains) {
        await session.run(
          `
          MERGE (d:Domain {name: $name})
          ON CREATE SET
            d.id = $id,
            d.displayName = $displayName,
            d.description = $description,
            d.keyInstitutions = $keyInstitutions,
            d.influenceMetrics = $influenceMetrics,
            d.sourceUrls = $sourceUrls,
            d.confidence = $confidence,
            d.createdAt = datetime(),
            d.updatedAt = datetime()
          ON MATCH SET
            d.updatedAt = datetime()
        `,
          {
            id: uuidv4(),
            ...domain,
            influenceMetrics: JSON.stringify(domain.influenceMetrics),
          }
        );
      }
      console.log('Seven Mountains domains seeded');
    } finally {
      await session.close();
    }
  }

  /**
   * Create an Entity node
   */
  async createEntity(
    entity: Omit<EntityNode, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<EntityNode> {
    const session = this.getSession();
    try {
      const id = uuidv4();
      const result = await session.run(
        `
        CREATE (e:Entity {
          id: $id,
          name: $name,
          type: $type,
          aliases: $aliases,
          description: $description,
          foundedYear: $foundedYear,
          headquarters: $headquarters,
          netWorth: $netWorth,
          currency: $currency,
          domains: $domains,
          publicProfile: $publicProfile,
          faraRegistered: $faraRegistered,
          tags: $tags,
          sourceUrls: $sourceUrls,
          confidence: $confidence,
          createdAt: datetime(),
          updatedAt: datetime()
        })
        RETURN e
      `,
        { id, ...entity }
      );

      // Create OPERATES_IN relationships to domains
      for (const domain of entity.domains) {
        await session.run(
          `
          MATCH (e:Entity {id: $entityId}), (d:Domain {name: $domainName})
          CREATE (e)-[:OPERATES_IN {since: datetime(), primaryDomain: $isPrimary}]->(d)
        `,
          {
            entityId: id,
            domainName: domain,
            isPrimary: entity.domains[0] === domain,
          }
        );
      }

      return this.transformNode(result.records[0].get('e')) as EntityNode;
    } finally {
      await session.close();
    }
  }

  /**
   * Create an Event node
   */
  async createEvent(event: Omit<EventNode, 'id' | 'createdAt' | 'updatedAt'>): Promise<EventNode> {
    const session = this.getSession();
    try {
      const id = uuidv4();
      const result = await session.run(
        `
        CREATE (e:Event {
          id: $id,
          name: $name,
          type: $type,
          date: datetime($date),
          endDate: $endDate,
          location: $location,
          description: $description,
          monetaryValue: $monetaryValue,
          currency: $currency,
          isPublic: $isPublic,
          sourceDocuments: $sourceDocuments,
          sourceUrls: $sourceUrls,
          confidence: $confidence,
          createdAt: datetime(),
          updatedAt: datetime()
        })
        RETURN e
      `,
        {
          id,
          ...event,
          date: event.date.toISOString(),
          endDate: event.endDate?.toISOString() || null,
        }
      );

      return this.transformNode(result.records[0].get('e')) as EventNode;
    } finally {
      await session.close();
    }
  }

  /**
   * Create an influence relationship between entities
   */
  async createInfluenceRelationship(
    fromEntityId: string,
    toEntityId: string,
    properties: InfluenceEdgeProperties
  ): Promise<void> {
    const session = this.getSession();
    try {
      await session.run(
        `
        MATCH (from:Entity {id: $fromId}), (to:Entity {id: $toId})
        CREATE (from)-[:INFLUENCES {
          mechanism: $mechanism,
          strength: $strength,
          bidirectional: $bidirectional,
          startDate: $startDate,
          endDate: $endDate,
          evidence: $evidence,
          publiclyKnown: $publiclyKnown,
          createdAt: datetime()
        }]->(to)
      `,
        {
          fromId: fromEntityId,
          toId: toEntityId,
          ...properties,
          startDate: properties.startDate?.toISOString() || null,
          endDate: properties.endDate?.toISOString() || null,
        }
      );

      // If bidirectional, create reverse relationship
      if (properties.bidirectional) {
        await session.run(
          `
          MATCH (from:Entity {id: $fromId}), (to:Entity {id: $toId})
          CREATE (to)-[:INFLUENCES {
            mechanism: $mechanism,
            strength: $strength,
            bidirectional: true,
            startDate: $startDate,
            endDate: $endDate,
            evidence: $evidence,
            publiclyKnown: $publiclyKnown,
            createdAt: datetime()
          }]->(from)
        `,
          {
            fromId: fromEntityId,
            toId: toEntityId,
            ...properties,
            startDate: properties.startDate?.toISOString() || null,
            endDate: properties.endDate?.toISOString() || null,
          }
        );
      }
    } finally {
      await session.close();
    }
  }

  /**
   * Create a funding relationship between entities
   */
  async createFundingRelationship(
    fromEntityId: string,
    toEntityId: string,
    properties: FundingEdgeProperties
  ): Promise<void> {
    const session = this.getSession();
    try {
      await session.run(
        `
        MATCH (from:Entity {id: $fromId}), (to:Entity {id: $toId})
        CREATE (from)-[:FUNDS {
          amount: $amount,
          currency: $currency,
          date: datetime($date),
          recurring: $recurring,
          purpose: $purpose,
          disclosed: $disclosed,
          sourceDocument: $sourceDocument,
          createdAt: datetime()
        }]->(to)
      `,
        {
          fromId: fromEntityId,
          toId: toEntityId,
          ...properties,
          date: properties.date.toISOString(),
        }
      );
    } finally {
      await session.close();
    }
  }

  /**
   * Link entity to event participation
   */
  async linkEntityToEvent(
    entityId: string,
    eventId: string,
    role: 'participant' | 'organizer' | 'subject' | 'beneficiary'
  ): Promise<void> {
    const session = this.getSession();
    const relType = role === 'organizer' ? 'ORGANIZED' : 'PARTICIPATED_IN';
    try {
      await session.run(
        `
        MATCH (e:Entity {id: $entityId}), (ev:Event {id: $eventId})
        CREATE (e)-[:${relType} {role: $role, createdAt: datetime()}]->(ev)
      `,
        { entityId, eventId, role }
      );
    } finally {
      await session.close();
    }
  }

  /**
   * Query: Find all entities connected to a given entity within N hops
   */
  async findNetworkNeighbors(entityId: string, maxHops: number = 2): Promise<any[]> {
    const session = this.getSession();
    try {
      const result = await session.run(
        `
        MATCH path = (start:Entity {id: $entityId})-[*1..${maxHops}]-(connected:Entity)
        WHERE start <> connected
        WITH connected, min(length(path)) as distance
        RETURN connected, distance
        ORDER BY distance, connected.name
        LIMIT 100
      `,
        { entityId }
      );

      return result.records.map((r) => ({
        entity: this.transformNode(r.get('connected')),
        distance: r.get('distance').toNumber(),
      }));
    } finally {
      await session.close();
    }
  }

  /**
   * Query: Find shortest path between two entities
   */
  async findShortestPath(fromEntityId: string, toEntityId: string): Promise<any> {
    const session = this.getSession();
    try {
      const result = await session.run(
        `
        MATCH path = shortestPath(
          (from:Entity {id: $fromId})-[*..10]-(to:Entity {id: $toId})
        )
        RETURN path, length(path) as pathLength
      `,
        { fromId: fromEntityId, toId: toEntityId }
      );

      if (result.records.length === 0) {
        return null;
      }

      const path = result.records[0].get('path');
      return {
        length: result.records[0].get('pathLength').toNumber(),
        nodes: path.segments.map((s: any) => ({
          from: this.transformNode(s.start),
          to: this.transformNode(s.end),
          relationship: s.relationship.type,
          properties: s.relationship.properties,
        })),
      };
    } finally {
      await session.close();
    }
  }

  /**
   * Query: Find entities by influence mechanism (parallel to TCG manipulation patterns)
   */
  async findByInfluenceMechanism(mechanism: InfluenceMechanism): Promise<any[]> {
    const session = this.getSession();
    try {
      const result = await session.run(
        `
        MATCH (from:Entity)-[r:INFLUENCES {mechanism: $mechanism}]->(to:Entity)
        RETURN from, r, to, r.strength as strength
        ORDER BY strength DESC
        LIMIT 50
      `,
        { mechanism }
      );

      return result.records.map((r) => ({
        from: this.transformNode(r.get('from')),
        to: this.transformNode(r.get('to')),
        relationship: r.get('r').properties,
        strength: r.get('strength'),
      }));
    } finally {
      await session.close();
    }
  }

  /**
   * Query: Find entities operating in multiple domains (cross-mountain influence)
   */
  async findCrossDomainEntities(minDomains: number = 3): Promise<EntityNode[]> {
    const session = this.getSession();
    try {
      const result = await session.run(
        `
        MATCH (e:Entity)-[:OPERATES_IN]->(d:Domain)
        WITH e, count(d) as domainCount, collect(d.name) as domains
        WHERE domainCount >= $minDomains
        RETURN e, domainCount, domains
        ORDER BY domainCount DESC
        LIMIT 50
      `,
        { minDomains }
      );

      return result.records.map((r) => ({
        ...this.transformNode(r.get('e')),
        domainCount: r.get('domainCount').toNumber(),
        activeDomains: r.get('domains'),
      })) as EntityNode[];
    } finally {
      await session.close();
    }
  }

  /**
   * Query: Calculate centrality scores for entities
   */
  async calculateCentrality(): Promise<any[]> {
    const session = this.getSession();
    try {
      // Using degree centrality as a proxy
      const result = await session.run(`
        MATCH (e:Entity)
        OPTIONAL MATCH (e)-[r]-()
        WITH e, count(r) as connections
        RETURN e.id as id, e.name as name, e.type as type, connections
        ORDER BY connections DESC
        LIMIT 50
      `);

      return result.records.map((r) => ({
        id: r.get('id'),
        name: r.get('name'),
        type: r.get('type'),
        connections: r.get('connections').toNumber(),
      }));
    } finally {
      await session.close();
    }
  }

  /**
   * Link a TCG card to its supply chain entities
   * This bridges the microcosm (TCG) and macrocosm (civilizational) analysis
   */
  async linkCardToSupplyChain(cardId: string, supplyChainEntityIds: string[]): Promise<void> {
    const session = this.getSession();
    try {
      for (const entityId of supplyChainEntityIds) {
        await session.run(
          `
          MATCH (c:Card {id: $cardId}), (e:Entity {id: $entityId})
          CREATE (c)-[:SUPPLY_CHAIN {
            relationship: 'manufactured_using_resources_from',
            createdAt: datetime()
          }]->(e)
        `,
          { cardId, entityId }
        );
      }
    } finally {
      await session.close();
    }
  }

  /**
   * Transform Neo4j node to plain object
   */
  private transformNode(node: any): any {
    if (!node) return null;
    const props = { ...node.properties };
    if (node.labels) {
      props._labels = node.labels;
    }
    return props;
  }

  /**
   * Close the driver connection
   */
  async close(): Promise<void> {
    await this.driver.close();
  }

  /**
   * Verify connectivity
   */
  async verifyConnectivity(): Promise<boolean> {
    const session = this.getSession();
    try {
      await session.run('RETURN 1');
      return true;
    } catch (error) {
      console.error('Civilizational client connectivity check failed:', error);
      return false;
    } finally {
      await session.close();
    }
  }
}

/**
 * Create a Civilizational Analytics client from environment variables
 */
export function createCivilizationalClient(): CivilizationalClient {
  const config: CivilizationalConfig = {
    uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
    username: process.env.NEO4J_USERNAME || 'neo4j',
    password: process.env.NEO4J_PASSWORD || 'password',
    database: process.env.NEO4J_DATABASE || 'neo4j',
  };

  return new CivilizationalClient(config);
}

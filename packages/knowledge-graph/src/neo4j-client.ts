/**
 * Neo4j Client for Apex Intelligence Center Knowledge Graph
 * 
 * This module provides a type-safe interface for interacting with the Neo4j knowledge graph.
 * It handles connection management, query execution, and data transformation.
 * 
 * @module neo4j-client
 * @version 1.0.0
 */

import neo4j, { Driver, Session, Result, Integer } from 'neo4j-driver';
import { v4 as uuidv4 } from 'uuid';

/**
 * Configuration for Neo4j connection
 */
export interface Neo4jConfig {
  uri: string;
  username: string;
  password: string;
  database?: string;
}

/**
 * Base node interface - all nodes extend this
 */
export interface BaseNode {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Card node representing a TCG card
 */
export interface CardNode extends BaseNode {
  name: string;
  set: string;
  rarity: string;
  cardNumber: string;
  releaseDate: Date;
  description: string;
  type: string;
  attributes: Record<string, any>;
  imageUrl?: string;
}

/**
 * Market node representing a marketplace
 */
export interface MarketNode extends BaseNode {
  name: string;
  url: string;
  region: string;
  currency: string;
  apiAvailable: boolean;
}

/**
 * Transaction node representing a price point
 */
export interface TransactionNode {
  id: string;
  price: number;
  currency: string;
  condition: string;
  grading: string;
  quantity: number;
  date: Date;
  source: string;
  createdAt: Date;
}

/**
 * Research node representing an academic paper or article
 */
export interface ResearchNode extends BaseNode {
  title: string;
  abstract: string;
  authors: string[];
  year: number;
  venue: string;
  url: string;
  doi?: string;
  keywords: string[];
  fullText?: string;
  citationCount: number;
}

/**
 * Concept node representing a keyword or topic
 */
export interface ConceptNode extends BaseNode {
  name: string;
  definition: string;
  category: string;
  frequency: number;
}

/**
 * Agent node representing a human or AI collaborator
 */
export interface AgentNode extends BaseNode {
  name: string;
  type: 'human' | 'ai_model' | 'multi_agent_system';
  model?: string;
  capabilities: string[];
  status: 'active' | 'inactive' | 'archived';
}

/**
 * Relationship types
 */
export type RelationshipType =
  | 'SOLD_ON'
  | 'PRICED_AT'
  | 'OCCURRED_ON'
  | 'CITES'
  | 'MENTIONS'
  | 'CO_OCCURS_WITH'
  | 'CONTRIBUTED_BY'
  | 'COLLABORATED_WITH';

/**
 * Neo4j Client class
 */
export class Neo4jClient {
  private driver: Driver;
  private database: string;

  constructor(config: Neo4jConfig) {
    this.driver = neo4j.driver(
      config.uri,
      neo4j.auth.basic(config.username, config.password)
    );
    this.database = config.database || 'neo4j';
  }

  /**
   * Get a new session
   */
  private getSession(): Session {
    return this.driver.session({ database: this.database });
  }

  /**
   * Execute a read query
   */
  async read<T = any>(query: string, params: Record<string, any> = {}): Promise<T[]> {
    const session = this.getSession();
    try {
      const result: Result = await session.run(query, params);
      return result.records.map((record) => this.transformRecord(record));
    } finally {
      await session.close();
    }
  }

  /**
   * Execute a write query
   */
  async write<T = any>(query: string, params: Record<string, any> = {}): Promise<T[]> {
    const session = this.getSession();
    try {
      const result: Result = await session.run(query, params);
      return result.records.map((record) => this.transformRecord(record));
    } finally {
      await session.close();
    }
  }

  /**
   * Transform a Neo4j record to a plain JavaScript object
   */
  private transformRecord(record: any): any {
    const obj: any = {};
    record.keys.forEach((key: string) => {
      const value = record.get(key);
      obj[key] = this.transformValue(value);
    });
    return obj;
  }

  /**
   * Transform Neo4j values to JavaScript values
   */
  private transformValue(value: any): any {
    if (value === null || value === undefined) {
      return value;
    }

    // Handle Neo4j Integer
    if (neo4j.isInt(value)) {
      return value.toNumber();
    }

    // Handle Neo4j Date/Time
    if (value instanceof Date) {
      return value;
    }

    // Handle Neo4j Node
    if (value.labels) {
      return {
        ...value.properties,
        labels: value.labels,
        identity: value.identity.toNumber(),
      };
    }

    // Handle Neo4j Relationship
    if (value.type) {
      return {
        ...value.properties,
        type: value.type,
        start: value.start.toNumber(),
        end: value.end.toNumber(),
      };
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return value.map((v) => this.transformValue(v));
    }

    // Handle objects
    if (typeof value === 'object') {
      const obj: any = {};
      for (const [k, v] of Object.entries(value)) {
        obj[k] = this.transformValue(v);
      }
      return obj;
    }

    return value;
  }

  /**
   * Create a Card node
   */
  async createCard(card: Omit<CardNode, 'id' | 'createdAt' | 'updatedAt'>): Promise<CardNode> {
    const query = `
      CREATE (c:Card {
        id: $id,
        name: $name,
        set: $set,
        rarity: $rarity,
        cardNumber: $cardNumber,
        releaseDate: date($releaseDate),
        description: $description,
        type: $type,
        attributes: $attributes,
        imageUrl: $imageUrl,
        createdAt: datetime(),
        updatedAt: datetime()
      })
      RETURN c
    `;

    const params = {
      id: uuidv4(),
      ...card,
      releaseDate: card.releaseDate.toISOString().split('T')[0],
    };

    const result = await this.write(query, params);
    return result[0].c as CardNode;
  }

  /**
   * Find cards by name (fuzzy search)
   */
  async findCardsByName(name: string): Promise<CardNode[]> {
    const query = `
      CALL db.index.fulltext.queryNodes('card_fulltext_index', $searchTerm)
      YIELD node, score
      RETURN node as c, score
      ORDER BY score DESC
      LIMIT 20
    `;

    const result = await this.read(query, { searchTerm: `${name}~` });
    return result.map((r) => r.c as CardNode);
  }

  /**
   * Create a Transaction and link it to a Card and Market
   */
  async createTransaction(
    cardId: string,
    marketId: string,
    transaction: Omit<TransactionNode, 'id' | 'createdAt'>
  ): Promise<TransactionNode> {
    const query = `
      MATCH (c:Card {id: $cardId}), (m:Market {id: $marketId})
      CREATE (t:Transaction {
        id: $id,
        price: $price,
        currency: $currency,
        condition: $condition,
        grading: $grading,
        quantity: $quantity,
        date: datetime($date),
        source: $source,
        createdAt: datetime()
      })
      CREATE (c)-[:PRICED_AT {source: $source, verified: true}]->(t)
      CREATE (t)-[:OCCURRED_ON {listingId: $listingId}]->(m)
      RETURN t
    `;

    const params = {
      id: uuidv4(),
      cardId,
      marketId,
      ...transaction,
      date: transaction.date.toISOString(),
      listingId: `${marketId}-${Date.now()}`,
    };

    const result = await this.write(query, params);
    return result[0].t as TransactionNode;
  }

  /**
   * Get price history for a card
   */
  async getCardPriceHistory(cardId: string, limit: number = 100): Promise<any[]> {
    const query = `
      MATCH (c:Card {id: $cardId})-[:PRICED_AT]->(t:Transaction)
      RETURN t.date as date, t.price as price, t.grading as grading, t.condition as condition
      ORDER BY t.date DESC
      LIMIT $limit
    `;

    return this.read(query, { cardId, limit });
  }

  /**
   * Create a Research node
   */
  async createResearch(
    research: Omit<ResearchNode, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ResearchNode> {
    const query = `
      CREATE (r:Research {
        id: $id,
        title: $title,
        abstract: $abstract,
        authors: $authors,
        year: $year,
        venue: $venue,
        url: $url,
        doi: $doi,
        keywords: $keywords,
        fullText: $fullText,
        citationCount: $citationCount,
        createdAt: datetime(),
        updatedAt: datetime()
      })
      RETURN r
    `;

    const params = {
      id: uuidv4(),
      ...research,
    };

    const result = await this.write(query, params);
    return result[0].r as ResearchNode;
  }

  /**
   * Create a citation relationship between two research papers
   */
  async createCitation(
    citingPaperId: string,
    citedPaperId: string,
    context: string,
    section: string
  ): Promise<void> {
    const query = `
      MATCH (r1:Research {id: $citingPaperId}), (r2:Research {id: $citedPaperId})
      CREATE (r1)-[:CITES {
        context: $context,
        section: $section,
        sentiment: 'neutral'
      }]->(r2)
    `;

    await this.write(query, {
      citingPaperId,
      citedPaperId,
      context,
      section,
    });
  }

  /**
   * Find papers that cite a given paper
   */
  async findCitingPapers(paperId: string): Promise<ResearchNode[]> {
    const query = `
      MATCH (r1:Research)-[:CITES]->(r2:Research {id: $paperId})
      RETURN r1 as paper
      ORDER BY r1.year DESC
    `;

    const result = await this.read(query, { paperId });
    return result.map((r) => r.paper as ResearchNode);
  }

  /**
   * Create a Concept node
   */
  async createConcept(
    concept: Omit<ConceptNode, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ConceptNode> {
    const query = `
      MERGE (c:Concept {name: $name})
      ON CREATE SET
        c.id = $id,
        c.definition = $definition,
        c.category = $category,
        c.frequency = $frequency,
        c.createdAt = datetime(),
        c.updatedAt = datetime()
      ON MATCH SET
        c.frequency = c.frequency + $frequency,
        c.updatedAt = datetime()
      RETURN c
    `;

    const params = {
      id: uuidv4(),
      ...concept,
    };

    const result = await this.write(query, params);
    return result[0].c as ConceptNode;
  }

  /**
   * Create a co-occurrence relationship between two concepts
   */
  async createConceptCoOccurrence(
    concept1Name: string,
    concept2Name: string,
    paperId: string
  ): Promise<void> {
    const query = `
      MATCH (c1:Concept {name: $concept1Name}), (c2:Concept {name: $concept2Name})
      MERGE (c1)-[r:CO_OCCURS_WITH]-(c2)
      ON CREATE SET
        r.frequency = 1,
        r.papers = [$paperId]
      ON MATCH SET
        r.frequency = r.frequency + 1,
        r.papers = r.papers + $paperId
    `;

    await this.write(query, {
      concept1Name,
      concept2Name,
      paperId,
    });
  }

  /**
   * Find concepts that frequently co-occur with a given concept
   */
  async findRelatedConcepts(conceptName: string, limit: number = 10): Promise<any[]> {
    const query = `
      MATCH (c1:Concept {name: $conceptName})-[r:CO_OCCURS_WITH]-(c2:Concept)
      RETURN c2.name as concept, r.frequency as frequency
      ORDER BY r.frequency DESC
      LIMIT $limit
    `;

    return this.read(query, { conceptName, limit });
  }

  /**
   * Close the driver connection
   */
  async close(): Promise<void> {
    await this.driver.close();
  }

  /**
   * Verify connectivity to Neo4j
   */
  async verifyConnectivity(): Promise<boolean> {
    const session = this.getSession();
    try {
      await session.run('RETURN 1');
      return true;
    } catch (error) {
      console.error('Neo4j connectivity check failed:', error);
      return false;
    } finally {
      await session.close();
    }
  }
}

/**
 * Create a Neo4j client instance from environment variables
 */
export function createNeo4jClient(): Neo4jClient {
  const config: Neo4jConfig = {
    uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
    username: process.env.NEO4J_USERNAME || 'neo4j',
    password: process.env.NEO4J_PASSWORD || 'password',
    database: process.env.NEO4J_DATABASE || 'neo4j',
  };

  return new Neo4jClient(config);
}

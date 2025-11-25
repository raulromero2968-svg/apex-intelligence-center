#!/usr/bin/env tsx
/**
 * Neo4j Initialization Script
 *
 * This script initializes the Neo4j database with the required schema,
 * constraints, indexes, and initial data structures.
 *
 * Usage: pnpm neo4j:init
 *
 * @module init-neo4j
 */

import 'dotenv/config';
import neo4j, { Driver } from 'neo4j-driver';

interface InitConfig {
  uri: string;
  username: string;
  password: string;
  database: string;
}

const config: InitConfig = {
  uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
  username: process.env.NEO4J_USERNAME || 'neo4j',
  password: process.env.NEO4J_PASSWORD || 'password',
  database: process.env.NEO4J_DATABASE || 'neo4j',
};

/**
 * Schema constraints for unique identifiers
 */
const CONSTRAINTS = [
  // Card constraints
  'CREATE CONSTRAINT card_id_unique IF NOT EXISTS FOR (c:Card) REQUIRE c.id IS UNIQUE',
  // Market constraints
  'CREATE CONSTRAINT market_id_unique IF NOT EXISTS FOR (m:Market) REQUIRE m.id IS UNIQUE',
  // Transaction constraints
  'CREATE CONSTRAINT transaction_id_unique IF NOT EXISTS FOR (t:Transaction) REQUIRE t.id IS UNIQUE',
  // Research constraints
  'CREATE CONSTRAINT research_id_unique IF NOT EXISTS FOR (r:Research) REQUIRE r.id IS UNIQUE',
  // Concept constraints
  'CREATE CONSTRAINT concept_id_unique IF NOT EXISTS FOR (c:Concept) REQUIRE c.id IS UNIQUE',
  // Agent constraints
  'CREATE CONSTRAINT agent_id_unique IF NOT EXISTS FOR (a:Agent) REQUIRE a.id IS UNIQUE',
];

/**
 * Indexes for fast lookups
 */
const INDEXES = [
  // Card indexes
  'CREATE INDEX card_name_index IF NOT EXISTS FOR (c:Card) ON (c.name)',
  'CREATE INDEX card_set_index IF NOT EXISTS FOR (c:Card) ON (c.set)',
  // Market indexes
  'CREATE INDEX market_name_index IF NOT EXISTS FOR (m:Market) ON (m.name)',
  // Transaction indexes
  'CREATE INDEX transaction_date_index IF NOT EXISTS FOR (t:Transaction) ON (t.date)',
  'CREATE INDEX transaction_price_index IF NOT EXISTS FOR (t:Transaction) ON (t.price)',
  // Research indexes
  'CREATE INDEX research_title_index IF NOT EXISTS FOR (r:Research) ON (r.title)',
  'CREATE INDEX research_year_index IF NOT EXISTS FOR (r:Research) ON (r.year)',
  // Concept indexes
  'CREATE INDEX concept_name_index IF NOT EXISTS FOR (c:Concept) ON (c.name)',
  // Agent indexes
  'CREATE INDEX agent_name_index IF NOT EXISTS FOR (a:Agent) ON (a.name)',
  'CREATE INDEX agent_type_index IF NOT EXISTS FOR (a:Agent) ON (a.type)',
];

/**
 * Full-text indexes for natural language search
 */
const FULLTEXT_INDEXES = [
  `CREATE FULLTEXT INDEX card_fulltext_index IF NOT EXISTS FOR (c:Card) ON EACH [c.name, c.description, c.set]`,
  `CREATE FULLTEXT INDEX research_fulltext_index IF NOT EXISTS FOR (r:Research) ON EACH [r.title, r.abstract]`,
  `CREATE FULLTEXT INDEX concept_fulltext_index IF NOT EXISTS FOR (c:Concept) ON EACH [c.name, c.definition]`,
];

/**
 * Initial marketplace nodes
 */
const INITIAL_MARKETS = [
  {
    id: 'market-tcgplayer',
    name: 'TCGPlayer',
    url: 'https://www.tcgplayer.com',
    region: 'North America',
    currency: 'USD',
    apiAvailable: true,
  },
  {
    id: 'market-ebay',
    name: 'eBay',
    url: 'https://www.ebay.com',
    region: 'Global',
    currency: 'USD',
    apiAvailable: true,
  },
  {
    id: 'market-cardmarket',
    name: 'CardMarket',
    url: 'https://www.cardmarket.com',
    region: 'Europe',
    currency: 'EUR',
    apiAvailable: true,
  },
  {
    id: 'market-pwccauctions',
    name: 'PWCC Auctions',
    url: 'https://www.pwccmarketplace.com',
    region: 'North America',
    currency: 'USD',
    apiAvailable: false,
  },
];

/**
 * Initial AI agent nodes
 */
const INITIAL_AGENTS = [
  {
    id: 'agent-fara-7b',
    name: 'Fara-7B',
    type: 'ai_model',
    model: 'microsoft/fara-7b',
    capabilities: ['web_automation', 'data_extraction', 'price_lookup', 'research_mining'],
    status: 'active',
  },
  {
    id: 'agent-apex-orchestrator',
    name: 'Apex Orchestrator',
    type: 'multi_agent_system',
    model: 'apex/orchestrator-v1',
    capabilities: ['task_coordination', 'workflow_management', 'quality_control'],
    status: 'active',
  },
  {
    id: 'agent-data-curator',
    name: 'Data Curator',
    type: 'ai_model',
    model: 'apex/curator-v1',
    capabilities: ['data_validation', 'deduplication', 'enrichment'],
    status: 'active',
  },
];

async function runQuery(driver: Driver, query: string, params: Record<string, unknown> = {}): Promise<void> {
  const session = driver.session({ database: config.database });
  try {
    await session.run(query, params);
  } finally {
    await session.close();
  }
}

async function initializeSchema(driver: Driver): Promise<void> {
  console.log('Creating constraints...');
  for (const constraint of CONSTRAINTS) {
    try {
      await runQuery(driver, constraint);
      console.log(`  ✓ ${constraint.substring(0, 60)}...`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('already exists')) {
        console.log(`  ○ Constraint already exists, skipping...`);
      } else {
        console.error(`  ✗ Error: ${errorMessage}`);
      }
    }
  }

  console.log('\nCreating indexes...');
  for (const index of INDEXES) {
    try {
      await runQuery(driver, index);
      console.log(`  ✓ ${index.substring(0, 60)}...`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('already exists')) {
        console.log(`  ○ Index already exists, skipping...`);
      } else {
        console.error(`  ✗ Error: ${errorMessage}`);
      }
    }
  }

  console.log('\nCreating full-text indexes...');
  for (const ftIndex of FULLTEXT_INDEXES) {
    try {
      await runQuery(driver, ftIndex);
      console.log(`  ✓ Full-text index created`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('already exists')) {
        console.log(`  ○ Full-text index already exists, skipping...`);
      } else {
        console.error(`  ✗ Error: ${errorMessage}`);
      }
    }
  }
}

async function createInitialMarkets(driver: Driver): Promise<void> {
  console.log('\nCreating initial marketplace nodes...');

  for (const market of INITIAL_MARKETS) {
    const query = `
      MERGE (m:Market {id: $id})
      ON CREATE SET
        m.name = $name,
        m.url = $url,
        m.region = $region,
        m.currency = $currency,
        m.apiAvailable = $apiAvailable,
        m.createdAt = datetime(),
        m.updatedAt = datetime()
      ON MATCH SET
        m.updatedAt = datetime()
      RETURN m
    `;

    try {
      await runQuery(driver, query, market);
      console.log(`  ✓ Market: ${market.name}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`  ✗ Error creating market ${market.name}: ${errorMessage}`);
    }
  }
}

async function createInitialAgents(driver: Driver): Promise<void> {
  console.log('\nCreating initial AI agent nodes...');

  for (const agent of INITIAL_AGENTS) {
    const query = `
      MERGE (a:Agent {id: $id})
      ON CREATE SET
        a.name = $name,
        a.type = $type,
        a.model = $model,
        a.capabilities = $capabilities,
        a.status = $status,
        a.createdAt = datetime(),
        a.updatedAt = datetime()
      ON MATCH SET
        a.updatedAt = datetime()
      RETURN a
    `;

    try {
      await runQuery(driver, query, agent);
      console.log(`  ✓ Agent: ${agent.name}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`  ✗ Error creating agent ${agent.name}: ${errorMessage}`);
    }
  }
}

async function verifySetup(driver: Driver): Promise<void> {
  console.log('\nVerifying setup...');

  const session = driver.session({ database: config.database });
  try {
    // Count nodes by label
    const labelCountQuery = `
      CALL db.labels() YIELD label
      CALL apoc.cypher.run('MATCH (n:' + label + ') RETURN count(n) as count', {})
      YIELD value
      RETURN label, value.count as count
    `;

    // Fallback for when APOC is not available
    const simpleLabelQuery = `
      MATCH (n)
      WITH labels(n) AS labels
      UNWIND labels AS label
      RETURN DISTINCT label, count(*) AS count
      ORDER BY count DESC
    `;

    try {
      const result = await session.run(simpleLabelQuery);
      console.log('\nNode counts by label:');
      for (const record of result.records) {
        const label = record.get('label');
        const count = record.get('count').toNumber();
        console.log(`  ${label}: ${count}`);
      }
    } catch {
      console.log('  Could not retrieve node counts');
    }

    // Show indexes
    const indexQuery = 'SHOW INDEXES';
    try {
      const indexResult = await session.run(indexQuery);
      console.log(`\nIndexes created: ${indexResult.records.length}`);
    } catch {
      console.log('  Could not retrieve index information');
    }

    // Show constraints
    const constraintQuery = 'SHOW CONSTRAINTS';
    try {
      const constraintResult = await session.run(constraintQuery);
      console.log(`Constraints created: ${constraintResult.records.length}`);
    } catch {
      console.log('  Could not retrieve constraint information');
    }

  } finally {
    await session.close();
  }
}

async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('Apex Intelligence Center - Neo4j Initialization');
  console.log('='.repeat(60));
  console.log(`\nConnecting to Neo4j at ${config.uri}...`);

  const driver = neo4j.driver(
    config.uri,
    neo4j.auth.basic(config.username, config.password)
  );

  try {
    // Verify connectivity
    await driver.verifyConnectivity();
    console.log('Connected successfully!\n');

    // Initialize schema
    await initializeSchema(driver);

    // Create initial data
    await createInitialMarkets(driver);
    await createInitialAgents(driver);

    // Verify setup
    await verifySetup(driver);

    console.log('\n' + '='.repeat(60));
    console.log('Neo4j initialization complete!');
    console.log('='.repeat(60));
    console.log('\nNext steps:');
    console.log('  1. Run pnpm neo4j:seed to populate sample data');
    console.log('  2. Run pnpm neo4j:query to test queries');
    console.log('  3. Connect your application using the Neo4jClient');

  } catch (error) {
    console.error('\nInitialization failed:', error);
    process.exit(1);
  } finally {
    await driver.close();
  }
}

main();

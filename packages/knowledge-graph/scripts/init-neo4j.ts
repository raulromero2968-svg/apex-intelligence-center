#!/usr/bin/env tsx
/**
 * Initialize Neo4j Schema for Apex Knowledge Graph
 *
 * This script creates all necessary constraints, indexes, and fulltext indexes
 * in the Neo4j database as defined in schema.cypher.
 *
 * Usage: pnpm neo4j:init
 */

import 'dotenv/config';
import neo4j, { Driver, Session } from 'neo4j-driver';

interface Neo4jConfig {
  uri: string;
  username: string;
  password: string;
  database?: string;
}

const SCHEMA_STATEMENTS = [
  // Card Nodes
  `CREATE CONSTRAINT card_id_unique IF NOT EXISTS FOR (c:Card) REQUIRE c.id IS UNIQUE`,
  `CREATE INDEX card_name_index IF NOT EXISTS FOR (c:Card) ON (c.name)`,
  `CREATE INDEX card_set_index IF NOT EXISTS FOR (c:Card) ON (c.set)`,
  `CREATE FULLTEXT INDEX card_fulltext_index IF NOT EXISTS FOR (c:Card) ON EACH [c.name, c.description, c.set]`,

  // Market Nodes
  `CREATE CONSTRAINT market_id_unique IF NOT EXISTS FOR (m:Market) REQUIRE m.id IS UNIQUE`,
  `CREATE INDEX market_name_index IF NOT EXISTS FOR (m:Market) ON (m.name)`,

  // Transaction Nodes
  `CREATE CONSTRAINT transaction_id_unique IF NOT EXISTS FOR (t:Transaction) REQUIRE t.id IS UNIQUE`,
  `CREATE INDEX transaction_date_index IF NOT EXISTS FOR (t:Transaction) ON (t.date)`,
  `CREATE INDEX transaction_price_index IF NOT EXISTS FOR (t:Transaction) ON (t.price)`,

  // Research Nodes
  `CREATE CONSTRAINT research_id_unique IF NOT EXISTS FOR (r:Research) REQUIRE r.id IS UNIQUE`,
  `CREATE INDEX research_title_index IF NOT EXISTS FOR (r:Research) ON (r.title)`,
  `CREATE INDEX research_year_index IF NOT EXISTS FOR (r:Research) ON (r.year)`,
  `CREATE FULLTEXT INDEX research_fulltext_index IF NOT EXISTS FOR (r:Research) ON EACH [r.title, r.abstract, r.keywords]`,

  // Concept Nodes
  `CREATE CONSTRAINT concept_id_unique IF NOT EXISTS FOR (c:Concept) REQUIRE c.id IS UNIQUE`,
  `CREATE INDEX concept_name_index IF NOT EXISTS FOR (c:Concept) ON (c.name)`,

  // Agent Nodes
  `CREATE CONSTRAINT agent_id_unique IF NOT EXISTS FOR (a:Agent) REQUIRE a.id IS UNIQUE`,
  `CREATE INDEX agent_name_index IF NOT EXISTS FOR (a:Agent) ON (a.name)`,
  `CREATE INDEX agent_type_index IF NOT EXISTS FOR (a:Agent) ON (a.type)`,
];

async function initializeNeo4j(): Promise<void> {
  const config: Neo4jConfig = {
    uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
    username: process.env.NEO4J_USERNAME || 'neo4j',
    password: process.env.NEO4J_PASSWORD || 'password',
    database: process.env.NEO4J_DATABASE || 'neo4j',
  };

  console.log('Apex Knowledge Graph - Neo4j Schema Initialization');
  console.log('='.repeat(50));
  console.log(`Connecting to: ${config.uri}`);
  console.log(`Database: ${config.database}`);
  console.log('');

  const driver: Driver = neo4j.driver(
    config.uri,
    neo4j.auth.basic(config.username, config.password)
  );

  const session: Session = driver.session({ database: config.database });

  try {
    // Test connectivity
    console.log('Testing connection...');
    await session.run('RETURN 1');
    console.log('Connected successfully!\n');

    // Execute schema statements
    console.log('Creating schema...\n');
    let successCount = 0;
    let skipCount = 0;

    for (const statement of SCHEMA_STATEMENTS) {
      const shortStatement = statement.length > 60
        ? statement.substring(0, 60) + '...'
        : statement;

      try {
        await session.run(statement);
        console.log(`  [OK] ${shortStatement}`);
        successCount++;
      } catch (error: any) {
        if (error.code === 'Neo.ClientError.Schema.EquivalentSchemaRuleAlreadyExists') {
          console.log(`  [SKIP] ${shortStatement} (already exists)`);
          skipCount++;
        } else {
          console.error(`  [ERROR] ${shortStatement}`);
          console.error(`          ${error.message}`);
        }
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('Schema Initialization Complete');
    console.log(`  Created: ${successCount}`);
    console.log(`  Skipped: ${skipCount}`);
    console.log(`  Total: ${SCHEMA_STATEMENTS.length}`);

    // Show current schema
    console.log('\nCurrent Indexes:');
    const indexResult = await session.run('SHOW INDEXES');
    indexResult.records.forEach((record) => {
      const name = record.get('name');
      const type = record.get('type');
      const labelsOrTypes = record.get('labelsOrTypes');
      console.log(`  - ${name} (${type}) on ${labelsOrTypes?.join(', ') || 'N/A'}`);
    });

    console.log('\nCurrent Constraints:');
    const constraintResult = await session.run('SHOW CONSTRAINTS');
    constraintResult.records.forEach((record) => {
      const name = record.get('name');
      const type = record.get('type');
      console.log(`  - ${name} (${type})`);
    });

  } catch (error: any) {
    console.error('\nFailed to initialize schema:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await session.close();
    await driver.close();
  }

  console.log('\nDone!');
}

initializeNeo4j();

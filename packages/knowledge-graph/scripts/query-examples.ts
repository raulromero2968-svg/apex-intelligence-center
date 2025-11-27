#!/usr/bin/env tsx
/**
 * Neo4j Query Examples Script
 *
 * This script demonstrates common queries against the Apex Intelligence Center
 * knowledge graph. Use it to test your Neo4j setup and learn the query patterns.
 *
 * Usage: pnpm neo4j:query
 *
 * @module query-examples
 */

import 'dotenv/config';
import neo4j, { Driver, Session } from 'neo4j-driver';

interface QueryConfig {
  uri: string;
  username: string;
  password: string;
  database: string;
}

const config: QueryConfig = {
  uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
  username: process.env.NEO4J_USERNAME || 'neo4j',
  password: process.env.NEO4J_PASSWORD || 'password',
  database: process.env.NEO4J_DATABASE || 'neo4j',
};

interface QueryExample {
  name: string;
  description: string;
  query: string;
  params?: Record<string, unknown>;
}

/**
 * Example queries demonstrating knowledge graph capabilities
 */
const QUERY_EXAMPLES: QueryExample[] = [
  // ============================================================================
  // TCG Market Queries
  // ============================================================================
  {
    name: 'Find High-Value Cards',
    description: 'Find cards with recent transactions over $1000',
    query: `
      MATCH (c:Card)-[:PRICED_AT]->(t:Transaction)
      WHERE t.price > 1000
      RETURN c.name AS card, c.set AS set, t.price AS price, t.grading AS grading, t.date AS date
      ORDER BY t.price DESC
      LIMIT 10
    `,
  },
  {
    name: 'Card Price History',
    description: 'Get price history for Charizard',
    query: `
      MATCH (c:Card {name: 'Charizard'})-[:PRICED_AT]->(t:Transaction)
      RETURN c.name AS card, c.set AS set, t.price AS price, t.grading AS grading, t.date AS date, t.source AS source
      ORDER BY t.date DESC
    `,
  },
  {
    name: 'Price by Grading',
    description: 'Average price by grading for a specific card',
    query: `
      MATCH (c:Card {name: 'Charizard'})-[:PRICED_AT]->(t:Transaction)
      RETURN t.grading AS grading,
             round(avg(t.price) * 100) / 100 AS avgPrice,
             min(t.price) AS minPrice,
             max(t.price) AS maxPrice,
             count(t) AS transactionCount
      ORDER BY avgPrice DESC
    `,
  },
  {
    name: 'Market Activity',
    description: 'Transaction volume by marketplace',
    query: `
      MATCH (t:Transaction)-[:OCCURRED_ON]->(m:Market)
      RETURN m.name AS market,
             count(t) AS transactions,
             round(sum(t.price) * 100) / 100 AS totalVolume,
             round(avg(t.price) * 100) / 100 AS avgPrice
      ORDER BY totalVolume DESC
    `,
  },
  {
    name: 'Cards on Multiple Markets',
    description: 'Find cards sold on multiple marketplaces',
    query: `
      MATCH (c:Card)-[:SOLD_ON]->(m:Market)
      WITH c, collect(m.name) AS markets, count(m) AS marketCount
      WHERE marketCount > 1
      RETURN c.name AS card, c.set AS set, markets, marketCount
      ORDER BY marketCount DESC
      LIMIT 10
    `,
  },

  // ============================================================================
  // Research & Literature Queries
  // ============================================================================
  {
    name: 'Recent Research Papers',
    description: 'Find recent research papers ordered by citations',
    query: `
      MATCH (r:Research)
      RETURN r.title AS title, r.year AS year, r.venue AS venue, r.citationCount AS citations, r.url AS url
      ORDER BY r.year DESC, r.citationCount DESC
      LIMIT 10
    `,
  },
  {
    name: 'Citation Network',
    description: 'Find papers that cite other papers in the knowledge graph',
    query: `
      MATCH (r1:Research)-[c:CITES]->(r2:Research)
      RETURN r1.title AS citingPaper,
             r2.title AS citedPaper,
             c.context AS citationContext,
             c.sentiment AS sentiment
    `,
  },
  {
    name: 'Most Cited Papers',
    description: 'Find papers with the most citations (from our graph)',
    query: `
      MATCH (r:Research)<-[:CITES]-(citing:Research)
      RETURN r.title AS paper, r.year AS year, count(citing) AS inGraphCitations
      ORDER BY inGraphCitations DESC
      LIMIT 5
    `,
  },
  {
    name: 'Papers by Keyword',
    description: 'Find papers mentioning specific concepts',
    query: `
      MATCH (r:Research)-[:MENTIONS]->(c:Concept)
      WHERE c.name = 'computer-using agent'
      RETURN r.title AS paper, r.year AS year, r.venue AS venue
      ORDER BY r.year DESC
    `,
  },

  // ============================================================================
  // Concept & Knowledge Queries
  // ============================================================================
  {
    name: 'All Concepts',
    description: 'List all concepts in the knowledge graph',
    query: `
      MATCH (c:Concept)
      RETURN c.name AS concept, c.category AS category, c.definition AS definition, c.frequency AS frequency
      ORDER BY c.frequency DESC
    `,
  },
  {
    name: 'Related Concepts',
    description: 'Find concepts that frequently co-occur',
    query: `
      MATCH (c1:Concept)-[r:CO_OCCURS_WITH]-(c2:Concept)
      RETURN c1.name AS concept1, c2.name AS concept2, r.frequency AS frequency, r.strength AS strength
      ORDER BY r.strength DESC
    `,
  },
  {
    name: 'Concept Network',
    description: 'Build a concept co-occurrence network for visualization',
    query: `
      MATCH (c:Concept)
      OPTIONAL MATCH (c)-[r:CO_OCCURS_WITH]-(other:Concept)
      RETURN c.name AS concept,
             c.category AS category,
             collect({name: other.name, strength: r.strength}) AS connections
      ORDER BY c.frequency DESC
    `,
  },

  // ============================================================================
  // Agent & Contribution Queries
  // ============================================================================
  {
    name: 'Active Agents',
    description: 'List all AI agents in the system',
    query: `
      MATCH (a:Agent)
      RETURN a.name AS agent, a.type AS type, a.model AS model, a.capabilities AS capabilities, a.status AS status
      ORDER BY a.name
    `,
  },
  {
    name: 'Agent Contributions',
    description: 'Find research papers associated with agents',
    query: `
      MATCH (r:Research)-[c:CONTRIBUTED_BY]->(a:Agent)
      RETURN a.name AS agent, r.title AS paper, c.role AS role, c.action AS action
    `,
  },

  // ============================================================================
  // Cross-Domain Queries
  // ============================================================================
  {
    name: 'Full-Text Search Cards',
    description: 'Search cards using full-text index',
    query: `
      CALL db.index.fulltext.queryNodes('card_fulltext_index', 'dragon OR fire')
      YIELD node, score
      RETURN node.name AS card, node.set AS set, node.type AS type, score
      ORDER BY score DESC
      LIMIT 5
    `,
  },
  {
    name: 'Full-Text Search Research',
    description: 'Search research papers using full-text index',
    query: `
      CALL db.index.fulltext.queryNodes('research_fulltext_index', 'agent automation')
      YIELD node, score
      RETURN node.title AS title, node.year AS year, score
      ORDER BY score DESC
      LIMIT 5
    `,
  },
  {
    name: 'Knowledge Graph Statistics',
    description: 'Get overall statistics about the knowledge graph',
    query: `
      MATCH (n)
      WITH labels(n) AS labels
      UNWIND labels AS label
      WITH label, count(*) AS count
      RETURN label, count
      ORDER BY count DESC
    `,
  },
  {
    name: 'Relationship Statistics',
    description: 'Count relationships by type',
    query: `
      MATCH ()-[r]->()
      RETURN type(r) AS relationshipType, count(*) AS count
      ORDER BY count DESC
    `,
  },
];

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'null';
  }
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return JSON.stringify(value.slice(0, 3)) + (value.length > 3 ? '...' : '');
    }
    if ('toNumber' in (value as object)) {
      return String((value as { toNumber: () => number }).toNumber());
    }
    return JSON.stringify(value).slice(0, 50) + '...';
  }
  if (typeof value === 'string' && value.length > 60) {
    return value.slice(0, 57) + '...';
  }
  return String(value);
}

async function runExampleQuery(
  session: Session,
  example: QueryExample
): Promise<void> {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📊 ${example.name}`);
  console.log(`   ${example.description}`);
  console.log(`${'─'.repeat(60)}`);

  try {
    const result = await session.run(example.query, example.params || {});

    if (result.records.length === 0) {
      console.log('  (No results)');
      return;
    }

    // Get column headers
    const keys = result.records[0].keys;
    const colWidths = keys.map((key) => {
      const maxValueWidth = Math.max(
        ...result.records.map((r) => formatValue(r.get(key)).length)
      );
      return Math.min(Math.max(key.length, maxValueWidth), 30);
    });

    // Print header
    const header = keys.map((key, i) => key.padEnd(colWidths[i])).join(' | ');
    console.log(`\n  ${header}`);
    console.log(`  ${colWidths.map((w) => '─'.repeat(w)).join('─┼─')}`);

    // Print rows
    for (const record of result.records.slice(0, 10)) {
      const row = keys.map((key, i) => {
        const value = formatValue(record.get(key));
        return value.padEnd(colWidths[i]);
      }).join(' | ');
      console.log(`  ${row}`);
    }

    if (result.records.length > 10) {
      console.log(`  ... and ${result.records.length - 10} more rows`);
    }

    console.log(`\n  Total: ${result.records.length} rows`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('no such index')) {
      console.log('  ⚠️  Full-text index not available. Run pnpm neo4j:init first.');
    } else {
      console.log(`  ❌ Error: ${errorMessage}`);
    }
  }
}

async function interactiveMode(driver: Driver): Promise<void> {
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('\n📝 Interactive Query Mode');
  console.log('   Type a Cypher query and press Enter to execute.');
  console.log('   Type "exit" to quit.\n');

  const session = driver.session({ database: config.database });

  const question = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(prompt, resolve);
    });
  };

  try {
    let running = true;
    while (running) {
      const query = await question('cypher> ');

      if (query.toLowerCase() === 'exit' || query.toLowerCase() === 'quit') {
        running = false;
        continue;
      }

      if (!query.trim()) {
        continue;
      }

      try {
        const result = await session.run(query);

        if (result.records.length === 0) {
          console.log('(No results)\n');
          continue;
        }

        const keys = result.records[0].keys;
        for (const record of result.records) {
          const obj: Record<string, unknown> = {};
          keys.forEach((key) => {
            obj[key] = record.get(key);
          });
          console.log(JSON.stringify(obj, null, 2));
        }
        console.log(`\nTotal: ${result.records.length} rows\n`);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`Error: ${errorMessage}\n`);
      }
    }
  } finally {
    rl.close();
    await session.close();
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const interactive = args.includes('--interactive') || args.includes('-i');
  const queryName = args.find((a) => !a.startsWith('-'));

  console.log('='.repeat(60));
  console.log('Apex Intelligence Center - Knowledge Graph Query Examples');
  console.log('='.repeat(60));
  console.log(`\nConnecting to Neo4j at ${config.uri}...`);

  const driver = neo4j.driver(
    config.uri,
    neo4j.auth.basic(config.username, config.password)
  );

  try {
    await driver.verifyConnectivity();
    console.log('Connected successfully!');

    if (interactive) {
      await interactiveMode(driver);
      return;
    }

    const session = driver.session({ database: config.database });

    try {
      if (queryName) {
        // Run specific query
        const example = QUERY_EXAMPLES.find(
          (e) => e.name.toLowerCase().includes(queryName.toLowerCase())
        );
        if (example) {
          await runExampleQuery(session, example);
        } else {
          console.log(`\nQuery "${queryName}" not found. Available queries:`);
          QUERY_EXAMPLES.forEach((e) => console.log(`  - ${e.name}`));
        }
      } else {
        // Run all queries
        console.log(`\nRunning ${QUERY_EXAMPLES.length} example queries...\n`);

        for (const example of QUERY_EXAMPLES) {
          await runExampleQuery(session, example);
        }
      }

      console.log('\n' + '='.repeat(60));
      console.log('Query examples complete!');
      console.log('='.repeat(60));
      console.log('\nUsage:');
      console.log('  pnpm neo4j:query                    # Run all examples');
      console.log('  pnpm neo4j:query "price history"    # Run specific query');
      console.log('  pnpm neo4j:query --interactive      # Interactive mode');

    } finally {
      await session.close();
    }

  } catch (error) {
    console.error('\nQuery execution failed:', error);
    process.exit(1);
  } finally {
    await driver.close();
  }
}

main();

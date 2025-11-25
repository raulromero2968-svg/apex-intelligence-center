#!/usr/bin/env tsx
/**
 * Example Queries for Neo4j Knowledge Graph
 *
 * This script demonstrates various query patterns for the Apex Knowledge Graph,
 * including card searches, price analysis, research discovery, and concept exploration.
 *
 * Usage: pnpm neo4j:query
 */

import 'dotenv/config';
import { createNeo4jClient, Neo4jClient } from '../src/neo4j-client';

interface QueryExample {
  name: string;
  description: string;
  query: string;
  params?: Record<string, any>;
}

const QUERY_EXAMPLES: QueryExample[] = [
  // Card Queries
  {
    name: 'All Cards',
    description: 'List all cards in the database',
    query: `
      MATCH (c:Card)
      RETURN c.name as name, c.set as set, c.rarity as rarity, c.type as type
      ORDER BY c.name
      LIMIT 10
    `,
  },
  {
    name: 'Holo Rare Cards',
    description: 'Find all Holo Rare cards',
    query: `
      MATCH (c:Card {rarity: 'Holo Rare'})
      RETURN c.name as name, c.set as set, c.description as description
      ORDER BY c.releaseDate
    `,
  },
  {
    name: 'Card with Price History',
    description: 'Get price history for a specific card',
    query: `
      MATCH (c:Card {name: $cardName})-[:PRICED_AT]->(t:Transaction)
      RETURN c.name as card, t.price as price, t.grading as grading,
             t.condition as condition, t.date as date
      ORDER BY t.date DESC
    `,
    params: { cardName: 'Charizard' },
  },
  {
    name: 'Average Price by Grading',
    description: 'Calculate average card prices by grading level',
    query: `
      MATCH (c:Card)-[:PRICED_AT]->(t:Transaction)
      RETURN c.name as card, t.grading as grading,
             AVG(t.price) as avgPrice, COUNT(t) as transactionCount
      ORDER BY avgPrice DESC
    `,
  },
  {
    name: 'Cards by Market',
    description: 'Find all cards sold on a specific market',
    query: `
      MATCH (c:Card)-[:PRICED_AT]->(t:Transaction)-[:OCCURRED_ON]->(m:Market {name: $market})
      RETURN DISTINCT c.name as card, c.set as set, m.name as market
      ORDER BY c.name
    `,
    params: { market: 'TCGPlayer' },
  },

  // Research Queries
  {
    name: 'All Research Papers',
    description: 'List all research papers',
    query: `
      MATCH (r:Research)
      RETURN r.title as title, r.year as year, r.venue as venue, r.citationCount as citations
      ORDER BY r.citationCount DESC
    `,
  },
  {
    name: 'Citation Network',
    description: 'Show papers and their citations',
    query: `
      MATCH (r1:Research)-[c:CITES]->(r2:Research)
      RETURN r1.title as citingPaper, r2.title as citedPaper,
             c.section as section, c.context as context
    `,
  },
  {
    name: 'Papers by Concept',
    description: 'Find papers mentioning a specific concept',
    query: `
      MATCH (c:Concept {name: $concept})<-[:MENTIONS]-(r:Research)
      RETURN r.title as paper, r.year as year, r.url as url
      ORDER BY r.year DESC
    `,
    params: { concept: 'multi-agent systems' },
  },
  {
    name: 'Most Cited Papers',
    description: 'Find papers with the most citations in the graph',
    query: `
      MATCH (r:Research)
      OPTIONAL MATCH (r)<-[:CITES]-(citing:Research)
      WITH r, COUNT(citing) as inGraphCitations
      RETURN r.title as title, r.citationCount as externalCitations,
             inGraphCitations, r.year as year
      ORDER BY inGraphCitations DESC, r.citationCount DESC
      LIMIT 5
    `,
  },

  // Concept Queries
  {
    name: 'All Concepts',
    description: 'List all concepts by category',
    query: `
      MATCH (c:Concept)
      RETURN c.name as name, c.category as category,
             c.definition as definition, c.frequency as frequency
      ORDER BY c.category, c.frequency DESC
    `,
  },
  {
    name: 'Related Concepts',
    description: 'Find concepts that co-occur with a given concept',
    query: `
      MATCH (c1:Concept {name: $concept})-[r:CO_OCCURS_WITH]-(c2:Concept)
      RETURN c2.name as relatedConcept, r.frequency as coOccurrenceCount
      ORDER BY r.frequency DESC
    `,
    params: { concept: 'knowledge graphs' },
  },
  {
    name: 'Concept Clusters',
    description: 'Find highly connected concept clusters',
    query: `
      MATCH (c:Concept)-[r:CO_OCCURS_WITH]-()
      WITH c, COUNT(r) as connections
      WHERE connections > 0
      RETURN c.name as concept, connections
      ORDER BY connections DESC
      LIMIT 10
    `,
  },

  // Market Queries
  {
    name: 'All Markets',
    description: 'List all markets with their details',
    query: `
      MATCH (m:Market)
      RETURN m.name as name, m.url as url, m.region as region,
             m.currency as currency, m.apiAvailable as hasAPI
      ORDER BY m.name
    `,
  },
  {
    name: 'Market Activity',
    description: 'Show transaction count by market',
    query: `
      MATCH (m:Market)<-[:OCCURRED_ON]-(t:Transaction)
      RETURN m.name as market, COUNT(t) as transactions,
             SUM(t.price) as totalVolume, AVG(t.price) as avgPrice
      ORDER BY transactions DESC
    `,
  },

  // Graph Statistics
  {
    name: 'Graph Statistics',
    description: 'Get overall graph statistics',
    query: `
      MATCH (n)
      WITH labels(n) as nodeLabels
      UNWIND nodeLabels as label
      RETURN label, COUNT(*) as count
      ORDER BY count DESC
    `,
  },
  {
    name: 'Relationship Statistics',
    description: 'Count relationships by type',
    query: `
      MATCH ()-[r]->()
      RETURN type(r) as relationshipType, COUNT(r) as count
      ORDER BY count DESC
    `,
  },
];

async function runQueries(): Promise<void> {
  console.log('Apex Knowledge Graph - Query Examples');
  console.log('='.repeat(60));
  console.log('');

  let client: Neo4jClient;
  try {
    client = createNeo4jClient();
  } catch (error: any) {
    console.error('Failed to create Neo4j client:', error.message);
    process.exit(1);
  }

  try {
    // Test connectivity
    console.log('Testing connection...');
    const connected = await client.verifyConnectivity();
    if (!connected) {
      console.error('Failed to connect to Neo4j');
      process.exit(1);
    }
    console.log('Connected successfully!\n');

    // Run each query
    for (const example of QUERY_EXAMPLES) {
      console.log('-'.repeat(60));
      console.log(`Query: ${example.name}`);
      console.log(`Description: ${example.description}`);
      if (example.params) {
        console.log(`Parameters: ${JSON.stringify(example.params)}`);
      }
      console.log('');

      try {
        const results = await client.read(example.query, example.params || {});

        if (results.length === 0) {
          console.log('  (No results)\n');
        } else {
          // Print results in a simple table format
          const keys = Object.keys(results[0]);

          // Print header
          console.log('  ' + keys.map(k => k.padEnd(25)).join(' | '));
          console.log('  ' + keys.map(() => '-'.repeat(25)).join('-+-'));

          // Print rows (limited to 5 for readability)
          const displayResults = results.slice(0, 5);
          for (const row of displayResults) {
            const values = keys.map(k => {
              const val = row[k];
              const strVal = val === null ? 'null' : String(val);
              return strVal.substring(0, 25).padEnd(25);
            });
            console.log('  ' + values.join(' | '));
          }

          if (results.length > 5) {
            console.log(`  ... and ${results.length - 5} more rows`);
          }
          console.log(`  Total: ${results.length} rows\n`);
        }
      } catch (error: any) {
        console.log(`  Error: ${error.message}\n`);
      }
    }

    console.log('='.repeat(60));
    console.log('Query examples completed!');

  } finally {
    await client.close();
  }
}

runQueries();

#!/usr/bin/env tsx
/**
 * Neo4j Seed Data Script
 *
 * This script populates the Neo4j database with sample TCG market data,
 * research papers, and concepts for testing and development.
 *
 * Usage: pnpm neo4j:seed
 *
 * @module seed-data
 */

import 'dotenv/config';
import neo4j, { Driver } from 'neo4j-driver';
import { v4 as uuidv4 } from 'uuid';

interface SeedConfig {
  uri: string;
  username: string;
  password: string;
  database: string;
}

const config: SeedConfig = {
  uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
  username: process.env.NEO4J_USERNAME || 'neo4j',
  password: process.env.NEO4J_PASSWORD || 'password',
  database: process.env.NEO4J_DATABASE || 'neo4j',
};

/**
 * Sample TCG Cards
 */
const SAMPLE_CARDS = [
  {
    id: uuidv4(),
    name: 'Charizard',
    set: 'Base Set',
    rarity: 'Holo Rare',
    cardNumber: '4/102',
    releaseDate: '1999-01-09',
    description: 'Spits fire that is hot enough to melt boulders. Known to unintentionally cause forest fires.',
    type: 'Pokemon',
    attributes: JSON.stringify({ hp: 120, type: 'Fire', stage: 'Stage 2', weakness: 'Water' }),
    imageUrl: 'https://images.pokemontcg.io/base1/4.png',
  },
  {
    id: uuidv4(),
    name: 'Charizard',
    set: 'Base Set',
    rarity: 'Holo Rare',
    cardNumber: '4/102',
    releaseDate: '1999-01-09',
    description: '1st Edition shadowless variant - extremely rare and valuable.',
    type: 'Pokemon',
    attributes: JSON.stringify({ hp: 120, type: 'Fire', stage: 'Stage 2', edition: '1st Edition', shadowless: true }),
    imageUrl: 'https://images.pokemontcg.io/base1/4.png',
    variant: '1st Edition Shadowless',
  },
  {
    id: uuidv4(),
    name: 'Pikachu',
    set: 'Base Set',
    rarity: 'Common',
    cardNumber: '58/102',
    releaseDate: '1999-01-09',
    description: 'When several of these Pokemon gather, their electricity could build and cause lightning storms.',
    type: 'Pokemon',
    attributes: JSON.stringify({ hp: 40, type: 'Electric', stage: 'Basic' }),
    imageUrl: 'https://images.pokemontcg.io/base1/58.png',
  },
  {
    id: uuidv4(),
    name: 'Black Lotus',
    set: 'Alpha',
    rarity: 'Rare',
    cardNumber: '232',
    releaseDate: '1993-08-05',
    description: 'The most iconic and valuable Magic: The Gathering card. Add 3 mana of any single color.',
    type: 'Magic',
    attributes: JSON.stringify({ manaCost: 0, type: 'Artifact', ability: 'Add 3 mana of any single color' }),
    imageUrl: 'https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=3&type=card',
  },
  {
    id: uuidv4(),
    name: 'Blue-Eyes White Dragon',
    set: 'Legend of Blue Eyes White Dragon',
    rarity: 'Ultra Rare',
    cardNumber: 'LOB-001',
    releaseDate: '2002-03-08',
    description: 'This legendary dragon is a powerful engine of destruction.',
    type: 'Yu-Gi-Oh',
    attributes: JSON.stringify({ attack: 3000, defense: 2500, level: 8, attribute: 'LIGHT' }),
    imageUrl: 'https://images.ygoprodeck.com/images/cards/89631139.jpg',
  },
  {
    id: uuidv4(),
    name: 'Mew',
    set: 'Fossil',
    rarity: 'Rare Holo',
    cardNumber: '8/62',
    releaseDate: '1999-10-10',
    description: 'So rare that it is still said to be a mirage by many experts.',
    type: 'Pokemon',
    attributes: JSON.stringify({ hp: 50, type: 'Psychic', stage: 'Basic' }),
    imageUrl: 'https://images.pokemontcg.io/fossil/8.png',
  },
  {
    id: uuidv4(),
    name: 'Umbreon',
    set: 'Neo Discovery',
    rarity: 'Holo Rare',
    cardNumber: '13/75',
    releaseDate: '2001-06-01',
    description: 'When darkness falls, the rings on the body glow.',
    type: 'Pokemon',
    attributes: JSON.stringify({ hp: 70, type: 'Dark', stage: 'Stage 1' }),
    imageUrl: 'https://images.pokemontcg.io/neo2/13.png',
  },
  {
    id: uuidv4(),
    name: 'Lugia',
    set: 'Neo Genesis',
    rarity: 'Holo Rare',
    cardNumber: '9/111',
    releaseDate: '2000-12-16',
    description: 'It is said to be the guardian of the seas.',
    type: 'Pokemon',
    attributes: JSON.stringify({ hp: 90, type: 'Psychic', stage: 'Basic' }),
    imageUrl: 'https://images.pokemontcg.io/neo1/9.png',
  },
];

/**
 * Sample Transactions (price data)
 */
const SAMPLE_TRANSACTIONS = [
  // Charizard Base Set - various grades
  { cardIndex: 0, price: 450.00, condition: 'Near Mint', grading: 'PSA 9', source: 'TCGPlayer', daysAgo: 1 },
  { cardIndex: 0, price: 1250.00, condition: 'Gem Mint', grading: 'PSA 10', source: 'eBay', daysAgo: 3 },
  { cardIndex: 0, price: 380.00, condition: 'Excellent', grading: 'PSA 8', source: 'TCGPlayer', daysAgo: 5 },
  { cardIndex: 0, price: 425.00, condition: 'Near Mint', grading: 'BGS 9', source: 'PWCC', daysAgo: 7 },

  // 1st Edition Charizard - extremely high value
  { cardIndex: 1, price: 125000.00, condition: 'Gem Mint', grading: 'PSA 10', source: 'PWCC', daysAgo: 14 },
  { cardIndex: 1, price: 85000.00, condition: 'Near Mint', grading: 'PSA 9', source: 'eBay', daysAgo: 30 },
  { cardIndex: 1, price: 45000.00, condition: 'Excellent', grading: 'PSA 8', source: 'Heritage', daysAgo: 45 },

  // Pikachu - affordable common
  { cardIndex: 2, price: 15.00, condition: 'Near Mint', grading: 'Raw', source: 'TCGPlayer', daysAgo: 1 },
  { cardIndex: 2, price: 75.00, condition: 'Gem Mint', grading: 'PSA 10', source: 'eBay', daysAgo: 5 },

  // Black Lotus - ultra high value
  { cardIndex: 3, price: 450000.00, condition: 'Near Mint', grading: 'BGS 9.5', source: 'PWCC', daysAgo: 60 },
  { cardIndex: 3, price: 180000.00, condition: 'Lightly Played', grading: 'CGC 7', source: 'eBay', daysAgo: 90 },

  // Blue-Eyes White Dragon
  { cardIndex: 4, price: 8500.00, condition: 'Near Mint', grading: 'PSA 9', source: 'eBay', daysAgo: 10 },
  { cardIndex: 4, price: 2500.00, condition: 'Excellent', grading: 'PSA 8', source: 'TCGPlayer', daysAgo: 15 },

  // Mew Fossil
  { cardIndex: 5, price: 250.00, condition: 'Near Mint', grading: 'PSA 9', source: 'TCGPlayer', daysAgo: 7 },
  { cardIndex: 5, price: 650.00, condition: 'Gem Mint', grading: 'PSA 10', source: 'eBay', daysAgo: 14 },

  // Umbreon Neo Discovery
  { cardIndex: 6, price: 1800.00, condition: 'Near Mint', grading: 'PSA 9', source: 'eBay', daysAgo: 21 },
  { cardIndex: 6, price: 4500.00, condition: 'Gem Mint', grading: 'PSA 10', source: 'PWCC', daysAgo: 35 },

  // Lugia Neo Genesis
  { cardIndex: 7, price: 950.00, condition: 'Near Mint', grading: 'PSA 9', source: 'TCGPlayer', daysAgo: 3 },
  { cardIndex: 7, price: 3200.00, condition: 'Gem Mint', grading: 'PSA 10', source: 'eBay', daysAgo: 10 },
];

/**
 * Sample Research Papers
 */
const SAMPLE_RESEARCH = [
  {
    id: uuidv4(),
    title: 'OmniScientist: AI-Driven Scientific Discovery with Multi-Agent Systems',
    abstract: 'We present OmniScientist, a framework for automated scientific discovery using large language models and multi-agent systems. The system combines deep ideation, iterative refinement, and autonomous experimentation.',
    authors: ['Zhang, L.', 'Wang, X.', 'Liu, Y.'],
    year: 2025,
    venue: 'NeurIPS',
    url: 'https://arxiv.org/abs/2501.12345',
    keywords: ['multi-agent systems', 'scientific discovery', 'LLM', 'automation'],
    citationCount: 45,
  },
  {
    id: uuidv4(),
    title: 'Computer-Using Agents for Web Automation: A Survey',
    abstract: 'This survey reviews the state-of-the-art in computer-using agents (CUAs) for web automation, including vision-language models, action prediction, and safety considerations.',
    authors: ['Chen, M.', 'Patel, R.', 'Kim, S.'],
    year: 2024,
    venue: 'ACM Computing Surveys',
    url: 'https://arxiv.org/abs/2402.54321',
    keywords: ['computer-using agents', 'web automation', 'vision-language models', 'GUI agents'],
    citationCount: 128,
  },
  {
    id: uuidv4(),
    title: 'Fara-7B: A Lightweight CUA for Consumer Hardware',
    abstract: 'We introduce Fara-7B, a 7 billion parameter model optimized for computer-using agent tasks that runs efficiently on consumer GPUs and Copilot+ PCs.',
    authors: ['Microsoft Research'],
    year: 2025,
    venue: 'ICML',
    url: 'https://arxiv.org/abs/2503.98765',
    keywords: ['Fara-7B', 'computer-using agents', 'edge deployment', 'efficient models'],
    citationCount: 67,
  },
  {
    id: uuidv4(),
    title: 'Knowledge Graphs for Trading Card Game Market Analysis',
    abstract: 'We propose a knowledge graph-based approach for analyzing trading card game markets, incorporating price trends, market dynamics, and collector behavior patterns.',
    authors: ['Thompson, J.', 'Garcia, M.'],
    year: 2024,
    venue: 'IEEE BigData',
    url: 'https://arxiv.org/abs/2411.11111',
    keywords: ['knowledge graphs', 'TCG', 'market analysis', 'price prediction'],
    citationCount: 23,
  },
  {
    id: uuidv4(),
    title: 'Deep Ideation Networks for Scientific Hypothesis Generation',
    abstract: 'This paper presents Deep Ideation Networks, a framework for generating novel scientific hypotheses using transformer models and knowledge graph reasoning.',
    authors: ['Lee, K.', 'Brown, A.', 'Taylor, S.'],
    year: 2024,
    venue: 'AAAI',
    url: 'https://arxiv.org/abs/2401.22222',
    keywords: ['deep ideation', 'hypothesis generation', 'knowledge graphs', 'transformers'],
    citationCount: 89,
  },
];

/**
 * Sample Concepts
 */
const SAMPLE_CONCEPTS = [
  { id: uuidv4(), name: 'computer-using agent', definition: 'An AI system capable of autonomously operating computer interfaces to accomplish tasks', category: 'technology', frequency: 156 },
  { id: uuidv4(), name: 'knowledge graph', definition: 'A structured representation of entities and their relationships in a graph database', category: 'methodology', frequency: 245 },
  { id: uuidv4(), name: 'multi-agent system', definition: 'A system composed of multiple interacting intelligent agents', category: 'technology', frequency: 189 },
  { id: uuidv4(), name: 'deep ideation', definition: 'Using deep learning to generate creative ideas and hypotheses', category: 'methodology', frequency: 67 },
  { id: uuidv4(), name: 'TCG market', definition: 'The marketplace for trading card games including Pokemon, Magic, and Yu-Gi-Oh', category: 'domain', frequency: 34 },
  { id: uuidv4(), name: 'price prediction', definition: 'Using machine learning to forecast future prices of assets', category: 'application', frequency: 312 },
  { id: uuidv4(), name: 'vision-language model', definition: 'Neural networks that process both visual and textual information', category: 'technology', frequency: 423 },
  { id: uuidv4(), name: 'grading services', definition: 'Professional card authentication and grading (PSA, BGS, CGC)', category: 'domain', frequency: 45 },
];

async function runQuery(driver: Driver, query: string, params: Record<string, unknown> = {}): Promise<void> {
  const session = driver.session({ database: config.database });
  try {
    await session.run(query, params);
  } finally {
    await session.close();
  }
}

async function seedCards(driver: Driver): Promise<string[]> {
  console.log('\nSeeding TCG cards...');
  const cardIds: string[] = [];

  for (const card of SAMPLE_CARDS) {
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
      RETURN c.id as id
    `;

    try {
      await runQuery(driver, query, card);
      cardIds.push(card.id);
      console.log(`  ✓ Card: ${card.name} (${card.set})`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`  ✗ Error seeding card ${card.name}: ${errorMessage}`);
    }
  }

  // Create SOLD_ON relationships to markets
  console.log('\nCreating card-market relationships...');
  for (const cardId of cardIds) {
    const marketQuery = `
      MATCH (c:Card {id: $cardId}), (m:Market)
      WHERE m.name IN ['TCGPlayer', 'eBay']
      CREATE (c)-[:SOLD_ON {
        firstListedDate: datetime() - duration({days: 365}),
        lastSeenDate: datetime(),
        transactionCount: toInteger(rand() * 100) + 1
      }]->(m)
    `;
    await runQuery(driver, marketQuery, { cardId });
  }
  console.log('  ✓ Card-Market relationships created');

  return cardIds;
}

async function seedTransactions(driver: Driver, cardIds: string[]): Promise<void> {
  console.log('\nSeeding price transactions...');

  for (const tx of SAMPLE_TRANSACTIONS) {
    const cardId = cardIds[tx.cardIndex];
    if (!cardId) continue;

    const transactionId = uuidv4();
    const transactionDate = new Date();
    transactionDate.setDate(transactionDate.getDate() - tx.daysAgo);

    // Get market ID for the source
    const marketMap: Record<string, string> = {
      'TCGPlayer': 'market-tcgplayer',
      'eBay': 'market-ebay',
      'CardMarket': 'market-cardmarket',
      'PWCC': 'market-pwccauctions',
      'Heritage': 'market-pwccauctions',
    };

    const marketId = marketMap[tx.source] || 'market-tcgplayer';

    const query = `
      MATCH (c:Card {id: $cardId}), (m:Market {id: $marketId})
      CREATE (t:Transaction {
        id: $transactionId,
        price: $price,
        currency: 'USD',
        condition: $condition,
        grading: $grading,
        quantity: 1,
        date: datetime($date),
        source: $source,
        createdAt: datetime()
      })
      CREATE (c)-[:PRICED_AT {source: $source, verified: true}]->(t)
      CREATE (t)-[:OCCURRED_ON {listingId: $listingId}]->(m)
    `;

    try {
      await runQuery(driver, query, {
        cardId,
        marketId,
        transactionId,
        price: tx.price,
        condition: tx.condition,
        grading: tx.grading,
        source: tx.source,
        date: transactionDate.toISOString(),
        listingId: `${tx.source}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      });
      console.log(`  ✓ Transaction: $${tx.price.toLocaleString()} (${tx.grading})`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`  ✗ Error seeding transaction: ${errorMessage}`);
    }
  }
}

async function seedResearch(driver: Driver): Promise<string[]> {
  console.log('\nSeeding research papers...');
  const researchIds: string[] = [];

  for (const paper of SAMPLE_RESEARCH) {
    const query = `
      CREATE (r:Research {
        id: $id,
        title: $title,
        abstract: $abstract,
        authors: $authors,
        year: $year,
        venue: $venue,
        url: $url,
        keywords: $keywords,
        citationCount: $citationCount,
        createdAt: datetime(),
        updatedAt: datetime()
      })
      RETURN r.id as id
    `;

    try {
      await runQuery(driver, query, paper);
      researchIds.push(paper.id);
      console.log(`  ✓ Paper: ${paper.title.substring(0, 50)}...`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`  ✗ Error seeding paper: ${errorMessage}`);
    }
  }

  // Create some citation relationships
  console.log('\nCreating citation relationships...');
  if (researchIds.length >= 3) {
    // Paper 0 cites papers 1 and 2
    await runQuery(driver, `
      MATCH (r1:Research {id: $citing}), (r2:Research {id: $cited})
      CREATE (r1)-[:CITES {context: 'Building on prior work in CUA systems', section: 'Related Work', sentiment: 'positive'}]->(r2)
    `, { citing: researchIds[0], cited: researchIds[1] });

    await runQuery(driver, `
      MATCH (r1:Research {id: $citing}), (r2:Research {id: $cited})
      CREATE (r1)-[:CITES {context: 'Extends the Fara-7B architecture', section: 'Methods', sentiment: 'neutral'}]->(r2)
    `, { citing: researchIds[0], cited: researchIds[2] });

    // Paper 4 cites paper 3
    await runQuery(driver, `
      MATCH (r1:Research {id: $citing}), (r2:Research {id: $cited})
      CREATE (r1)-[:CITES {context: 'Similar approach to knowledge graph construction', section: 'Introduction', sentiment: 'positive'}]->(r2)
    `, { citing: researchIds[4], cited: researchIds[3] });

    console.log('  ✓ Citation relationships created');
  }

  // Link research to Fara-7B agent
  console.log('\nLinking research to AI agents...');
  await runQuery(driver, `
    MATCH (r:Research), (a:Agent {name: 'Fara-7B'})
    WHERE r.title CONTAINS 'Fara'
    CREATE (r)-[:CONTRIBUTED_BY {role: 'subject', timestamp: datetime(), action: 'described'}]->(a)
  `);
  console.log('  ✓ Research-Agent relationships created');

  return researchIds;
}

async function seedConcepts(driver: Driver, researchIds: string[]): Promise<void> {
  console.log('\nSeeding concepts...');

  for (const concept of SAMPLE_CONCEPTS) {
    const query = `
      CREATE (c:Concept {
        id: $id,
        name: $name,
        definition: $definition,
        category: $category,
        frequency: $frequency,
        createdAt: datetime(),
        updatedAt: datetime()
      })
      RETURN c.id as id
    `;

    try {
      await runQuery(driver, query, concept);
      console.log(`  ✓ Concept: ${concept.name}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`  ✗ Error seeding concept: ${errorMessage}`);
    }
  }

  // Create MENTIONS relationships between research and concepts
  console.log('\nCreating research-concept relationships...');
  const mentionQueries = [
    { concept: 'computer-using agent', keywords: ['computer-using', 'CUA', 'GUI agents'] },
    { concept: 'knowledge graph', keywords: ['knowledge graph', 'graph'] },
    { concept: 'multi-agent system', keywords: ['multi-agent', 'agents'] },
    { concept: 'deep ideation', keywords: ['ideation', 'hypothesis'] },
    { concept: 'vision-language model', keywords: ['vision-language', 'visual'] },
  ];

  for (const { concept, keywords } of mentionQueries) {
    const keywordPattern = keywords.join('|');
    await runQuery(driver, `
      MATCH (r:Research), (c:Concept {name: $conceptName})
      WHERE any(kw IN r.keywords WHERE kw =~ $pattern) OR r.abstract =~ $pattern
      CREATE (r)-[:MENTIONS {frequency: toInteger(rand() * 10) + 1, importance: rand()}]->(c)
    `, { conceptName: concept, pattern: `(?i).*(?:${keywordPattern}).*` });
  }
  console.log('  ✓ Research-Concept relationships created');

  // Create CO_OCCURS_WITH relationships between concepts
  console.log('\nCreating concept co-occurrence relationships...');
  await runQuery(driver, `
    MATCH (c1:Concept {name: 'computer-using agent'}), (c2:Concept {name: 'vision-language model'})
    CREATE (c1)-[:CO_OCCURS_WITH {frequency: 45, strength: 0.85}]->(c2)
  `);
  await runQuery(driver, `
    MATCH (c1:Concept {name: 'knowledge graph'}), (c2:Concept {name: 'multi-agent system'})
    CREATE (c1)-[:CO_OCCURS_WITH {frequency: 23, strength: 0.62}]->(c2)
  `);
  await runQuery(driver, `
    MATCH (c1:Concept {name: 'deep ideation'}), (c2:Concept {name: 'multi-agent system'})
    CREATE (c1)-[:CO_OCCURS_WITH {frequency: 18, strength: 0.54}]->(c2)
  `);
  console.log('  ✓ Concept co-occurrence relationships created');
}

async function printSummary(driver: Driver): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('Seed Data Summary');
  console.log('='.repeat(60));

  const session = driver.session({ database: config.database });
  try {
    const countQuery = `
      MATCH (n)
      WITH labels(n) AS labels
      UNWIND labels AS label
      RETURN label, count(*) AS count
      ORDER BY count DESC
    `;

    const result = await session.run(countQuery);
    console.log('\nNodes by label:');
    for (const record of result.records) {
      const label = record.get('label');
      const count = record.get('count').toNumber();
      console.log(`  ${label}: ${count}`);
    }

    const relQuery = `
      MATCH ()-[r]->()
      RETURN type(r) AS type, count(*) AS count
      ORDER BY count DESC
    `;

    const relResult = await session.run(relQuery);
    console.log('\nRelationships by type:');
    for (const record of relResult.records) {
      const type = record.get('type');
      const count = record.get('count').toNumber();
      console.log(`  ${type}: ${count}`);
    }

  } finally {
    await session.close();
  }
}

async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('Apex Intelligence Center - Neo4j Seed Data');
  console.log('='.repeat(60));
  console.log(`\nConnecting to Neo4j at ${config.uri}...`);

  const driver = neo4j.driver(
    config.uri,
    neo4j.auth.basic(config.username, config.password)
  );

  try {
    await driver.verifyConnectivity();
    console.log('Connected successfully!');

    // Seed data
    const cardIds = await seedCards(driver);
    await seedTransactions(driver, cardIds);
    const researchIds = await seedResearch(driver);
    await seedConcepts(driver, researchIds);

    // Print summary
    await printSummary(driver);

    console.log('\n' + '='.repeat(60));
    console.log('Seed data complete!');
    console.log('='.repeat(60));
    console.log('\nYou can now run queries using:');
    console.log('  pnpm neo4j:query');

  } catch (error) {
    console.error('\nSeeding failed:', error);
    process.exit(1);
  } finally {
    await driver.close();
  }
}

main();

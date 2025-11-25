#!/usr/bin/env tsx
/**
 * Seed Neo4j Database with Sample Data
 *
 * This script populates the Neo4j database with sample TCG cards, markets,
 * transactions, research papers, and concepts for development and testing.
 *
 * Usage: pnpm neo4j:seed
 */

import 'dotenv/config';
import { createNeo4jClient, Neo4jClient } from '../src/neo4j-client';

interface SampleCard {
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

interface SampleMarket {
  name: string;
  url: string;
  region: string;
  currency: string;
  apiAvailable: boolean;
}

interface SampleResearch {
  title: string;
  abstract: string;
  authors: string[];
  year: number;
  venue: string;
  url: string;
  doi?: string;
  keywords: string[];
  citationCount: number;
}

// Sample TCG Cards
const SAMPLE_CARDS: SampleCard[] = [
  {
    name: 'Charizard',
    set: 'Base Set',
    rarity: 'Holo Rare',
    cardNumber: '4/102',
    releaseDate: new Date('1999-01-09'),
    description: 'Spits fire that is hot enough to melt boulders. Known to cause forest fires unintentionally.',
    type: 'Pokemon',
    attributes: { hp: 120, type: 'Fire', stage: 'Stage 2', weakness: 'Water', resistance: 'Fighting' },
  },
  {
    name: 'Pikachu',
    set: 'Base Set',
    rarity: 'Common',
    cardNumber: '58/102',
    releaseDate: new Date('1999-01-09'),
    description: 'When several of these Pokemon gather, their electricity could build and cause lightning storms.',
    type: 'Pokemon',
    attributes: { hp: 40, type: 'Electric', stage: 'Basic', weakness: 'Fighting' },
  },
  {
    name: 'Blastoise',
    set: 'Base Set',
    rarity: 'Holo Rare',
    cardNumber: '2/102',
    releaseDate: new Date('1999-01-09'),
    description: 'A brutal Pokemon with pressurized water jets on its shell. They are used for high speed tackles.',
    type: 'Pokemon',
    attributes: { hp: 100, type: 'Water', stage: 'Stage 2', weakness: 'Grass' },
  },
  {
    name: 'Venusaur',
    set: 'Base Set',
    rarity: 'Holo Rare',
    cardNumber: '15/102',
    releaseDate: new Date('1999-01-09'),
    description: 'The plant blooms when it is absorbing solar energy. It stays on the move to seek sunlight.',
    type: 'Pokemon',
    attributes: { hp: 100, type: 'Grass', stage: 'Stage 2', weakness: 'Fire' },
  },
  {
    name: 'Black Lotus',
    set: 'Alpha',
    rarity: 'Rare',
    cardNumber: 'A-001',
    releaseDate: new Date('1993-08-05'),
    description: 'Add three mana of any single color of your choice to your mana pool, then is discarded.',
    type: 'Magic',
    attributes: { cmc: 0, type: 'Artifact', rarity: 'Power Nine' },
  },
  {
    name: 'Blue-Eyes White Dragon',
    set: 'Legend of Blue-Eyes White Dragon',
    rarity: 'Ultra Rare',
    cardNumber: 'LOB-001',
    releaseDate: new Date('2002-03-08'),
    description: 'This legendary dragon is a powerful engine of destruction. Virtually invincible, very few have faced this awesome creature and lived to tell the tale.',
    type: 'Yu-Gi-Oh',
    attributes: { atk: 3000, def: 2500, level: 8, attribute: 'LIGHT' },
  },
];

// Sample Markets
const SAMPLE_MARKETS: SampleMarket[] = [
  {
    name: 'TCGPlayer',
    url: 'https://www.tcgplayer.com',
    region: 'North America',
    currency: 'USD',
    apiAvailable: true,
  },
  {
    name: 'eBay',
    url: 'https://www.ebay.com',
    region: 'Global',
    currency: 'USD',
    apiAvailable: true,
  },
  {
    name: 'CardMarket',
    url: 'https://www.cardmarket.com',
    region: 'Europe',
    currency: 'EUR',
    apiAvailable: true,
  },
  {
    name: 'Troll and Toad',
    url: 'https://www.trollandtoad.com',
    region: 'North America',
    currency: 'USD',
    apiAvailable: false,
  },
];

// Sample Research Papers
const SAMPLE_RESEARCH: SampleResearch[] = [
  {
    title: 'OmniScientist: Agentic AI Researcher for Autonomous Scientific Discovery',
    abstract: 'We present OmniScientist, a multi-agent AI system designed for autonomous scientific research. The system combines literature review, hypothesis generation, experiment design, and result analysis in a unified framework.',
    authors: ['A. Chen', 'B. Wang', 'C. Liu', 'D. Zhang'],
    year: 2025,
    venue: 'NeurIPS',
    url: 'https://arxiv.org/abs/2501.12345',
    doi: '10.1234/neurips.2025.12345',
    keywords: ['multi-agent systems', 'scientific discovery', 'autonomous research'],
    citationCount: 127,
  },
  {
    title: 'Computer-Using Agents: A Survey of Recent Advances',
    abstract: 'This survey provides a comprehensive overview of computer-using agents (CUAs), AI systems capable of interacting with graphical user interfaces. We analyze architectures, benchmarks, and applications.',
    authors: ['E. Smith', 'F. Johnson'],
    year: 2024,
    venue: 'ACL',
    url: 'https://arxiv.org/abs/2410.67890',
    keywords: ['computer-using agents', 'GUI automation', 'language models'],
    citationCount: 89,
  },
  {
    title: 'Knowledge Graphs for AI Research: A Practical Guide',
    abstract: 'We present a practical framework for building and maintaining knowledge graphs in AI research settings. Our approach emphasizes reproducibility and collaboration.',
    authors: ['G. Brown', 'H. Davis', 'I. Miller'],
    year: 2024,
    venue: 'EMNLP',
    url: 'https://arxiv.org/abs/2409.11111',
    keywords: ['knowledge graphs', 'AI research', 'reproducibility'],
    citationCount: 45,
  },
  {
    title: 'Holographic Display Technology: Current State and Future Directions',
    abstract: 'This paper reviews the current state of holographic display technology, including recent advances in light field displays, computational holography, and eye-tracking integration.',
    authors: ['J. Wilson', 'K. Taylor'],
    year: 2024,
    venue: 'SIGGRAPH',
    url: 'https://dl.acm.org/doi/10.1145/3588432.3591518',
    keywords: ['holographic displays', 'light field', 'augmented reality'],
    citationCount: 32,
  },
];

// Sample Concepts
const SAMPLE_CONCEPTS = [
  { name: 'multi-agent systems', definition: 'Computational systems composed of multiple interacting intelligent agents', category: 'methodology' },
  { name: 'knowledge graphs', definition: 'Graph-structured databases that store interconnected entities and their relationships', category: 'technology' },
  { name: 'computer-using agents', definition: 'AI systems that interact with computer interfaces like humans do', category: 'technology' },
  { name: 'holographic displays', definition: 'Display technology that creates three-dimensional images using light diffraction', category: 'technology' },
  { name: 'scientific discovery', definition: 'The process of acquiring new knowledge through systematic investigation', category: 'domain' },
  { name: 'autonomous research', definition: 'Research conducted with minimal human intervention using AI systems', category: 'methodology' },
];

async function seedDatabase(): Promise<void> {
  console.log('Apex Knowledge Graph - Database Seeding');
  console.log('='.repeat(50));
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

    // Create Markets
    console.log('Creating Markets...');
    const marketIds: Map<string, string> = new Map();
    for (const market of SAMPLE_MARKETS) {
      try {
        const result = await client.write(
          `CREATE (m:Market {
            id: randomUUID(),
            name: $name,
            url: $url,
            region: $region,
            currency: $currency,
            apiAvailable: $apiAvailable,
            createdAt: datetime(),
            updatedAt: datetime()
          }) RETURN m.id as id, m.name as name`,
          market
        );
        if (result[0]) {
          marketIds.set(market.name, result[0].id);
          console.log(`  [OK] ${market.name}`);
        }
      } catch (error: any) {
        console.log(`  [SKIP] ${market.name} (may already exist)`);
      }
    }
    console.log('');

    // Create Cards
    console.log('Creating Cards...');
    const cardIds: Map<string, string> = new Map();
    for (const card of SAMPLE_CARDS) {
      try {
        const createdCard = await client.createCard(card);
        cardIds.set(card.name, createdCard.id);
        console.log(`  [OK] ${card.name} (${card.set})`);
      } catch (error: any) {
        console.log(`  [SKIP] ${card.name} (may already exist)`);
      }
    }
    console.log('');

    // Create Transactions (link cards to markets)
    console.log('Creating Transactions...');
    const tcgplayerId = marketIds.get('TCGPlayer');
    const ebayId = marketIds.get('eBay');

    if (tcgplayerId && cardIds.get('Charizard')) {
      try {
        await client.createTransaction(cardIds.get('Charizard')!, tcgplayerId, {
          price: 350.00,
          currency: 'USD',
          condition: 'Near Mint',
          grading: 'PSA 10',
          quantity: 1,
          date: new Date('2025-11-20'),
          source: 'API',
        });
        console.log('  [OK] Charizard PSA 10 @ TCGPlayer: $350');
      } catch (error) {
        console.log('  [SKIP] Charizard transaction');
      }
    }

    if (ebayId && cardIds.get('Black Lotus')) {
      try {
        await client.createTransaction(cardIds.get('Black Lotus')!, ebayId, {
          price: 250000.00,
          currency: 'USD',
          condition: 'Lightly Played',
          grading: 'BGS 9.5',
          quantity: 1,
          date: new Date('2025-11-15'),
          source: 'Scraping',
        });
        console.log('  [OK] Black Lotus BGS 9.5 @ eBay: $250,000');
      } catch (error) {
        console.log('  [SKIP] Black Lotus transaction');
      }
    }
    console.log('');

    // Create Research Papers
    console.log('Creating Research Papers...');
    const researchIds: Map<string, string> = new Map();
    for (const research of SAMPLE_RESEARCH) {
      try {
        const createdResearch = await client.createResearch(research);
        researchIds.set(research.title.substring(0, 30), createdResearch.id);
        console.log(`  [OK] ${research.title.substring(0, 50)}...`);
      } catch (error: any) {
        console.log(`  [SKIP] ${research.title.substring(0, 50)}...`);
      }
    }
    console.log('');

    // Create Concepts
    console.log('Creating Concepts...');
    for (const concept of SAMPLE_CONCEPTS) {
      try {
        await client.createConcept({ ...concept, frequency: 1 });
        console.log(`  [OK] ${concept.name}`);
      } catch (error: any) {
        console.log(`  [SKIP] ${concept.name}`);
      }
    }
    console.log('');

    // Create Citation relationships
    console.log('Creating Citations...');
    const omniscientistId = researchIds.get('OmniScientist: Agentic AI R');
    const cuaSurveyId = researchIds.get('Computer-Using Agents: A Su');
    const kgGuideId = researchIds.get('Knowledge Graphs for AI Res');

    if (omniscientistId && cuaSurveyId) {
      try {
        await client.createCitation(
          omniscientistId,
          cuaSurveyId,
          'We build upon the CUA framework described in prior work',
          'Related Work'
        );
        console.log('  [OK] OmniScientist -> CUA Survey');
      } catch (error) {
        console.log('  [SKIP] OmniScientist -> CUA Survey');
      }
    }

    if (omniscientistId && kgGuideId) {
      try {
        await client.createCitation(
          omniscientistId,
          kgGuideId,
          'Our knowledge management approach follows the guidelines established by prior research',
          'Methodology'
        );
        console.log('  [OK] OmniScientist -> KG Guide');
      } catch (error) {
        console.log('  [SKIP] OmniScientist -> KG Guide');
      }
    }
    console.log('');

    // Create Concept Co-occurrences
    console.log('Creating Concept Co-occurrences...');
    if (omniscientistId) {
      try {
        await client.createConceptCoOccurrence('multi-agent systems', 'scientific discovery', omniscientistId);
        console.log('  [OK] multi-agent systems <-> scientific discovery');
      } catch (error) {
        console.log('  [SKIP] concept co-occurrence');
      }

      try {
        await client.createConceptCoOccurrence('knowledge graphs', 'autonomous research', omniscientistId);
        console.log('  [OK] knowledge graphs <-> autonomous research');
      } catch (error) {
        console.log('  [SKIP] concept co-occurrence');
      }
    }
    console.log('');

    // Summary
    console.log('='.repeat(50));
    console.log('Seeding Complete!');
    console.log(`  Cards: ${SAMPLE_CARDS.length}`);
    console.log(`  Markets: ${SAMPLE_MARKETS.length}`);
    console.log(`  Research: ${SAMPLE_RESEARCH.length}`);
    console.log(`  Concepts: ${SAMPLE_CONCEPTS.length}`);

  } finally {
    await client.close();
  }

  console.log('\nDone!');
}

seedDatabase();

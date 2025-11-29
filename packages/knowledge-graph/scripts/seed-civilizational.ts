#!/usr/bin/env tsx
/**
 * Civilizational Analytics Seed Data Script
 *
 * This script populates the Neo4j database with example entities, events,
 * and relationships demonstrating the "Double Helix" framework:
 *
 * STRAND A (Polished): The visible structure - entities, relationships, events
 * STRAND B (Process): The mechanisms - how power operates, parallel to TCG markets
 *
 * The core thesis: TCG market manipulation patterns are a MICROCOSM of
 * civilizational power dynamics. Same engine, different datasets.
 *
 * | TCG Mechanism        | Civilizational Equivalent           |
 * |---------------------|-------------------------------------|
 * | Artificial scarcity | Rentism, IP feudalism               |
 * | Insider knowledge   | Kompromat, advance legislation tips |
 * | Grading gatekeeping | Institutional legitimacy control    |
 * | Wash trading        | Circular donations, foundation grants|
 * | Whale moves         | State capture, rule rewriting       |
 * | Counterfeits        | Manufactured consent, fake news     |
 *
 * Usage: pnpm tsx scripts/seed-civilizational.ts
 *
 * @module seed-civilizational
 */

import 'dotenv/config';
import {
  CivilizationalClient,
  SEVEN_MOUNTAINS,
  type EntityNode,
  type EventNode,
  type InfluenceEdgeProperties,
  type FundingEdgeProperties,
  type InfluenceMechanism,
} from '../src/civilizational-client';
import { v4 as uuidv4 } from 'uuid';

const config = {
  uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
  username: process.env.NEO4J_USERNAME || 'neo4j',
  password: process.env.NEO4J_PASSWORD || 'password',
  database: process.env.NEO4J_DATABASE || 'neo4j',
};

/**
 * Sample Entities - Demonstrating Cross-Domain Power
 *
 * These are ARCHETYPAL examples showing how entities operate across
 * multiple "mountains" of influence. Real data would come from:
 * - SEC filings
 * - FARA registrations
 * - OpenSecrets donation data
 * - Corporate board interlocks
 * - Foundation 990 filings
 */
const SAMPLE_ENTITIES: Omit<EntityNode, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // --- TECH SECTOR (Business + Media + Government) ---
  {
    name: 'Palantir Technologies',
    type: 'corporation',
    aliases: ['Palantir', 'PLTR'],
    description:
      'Data analytics company with deep government contracts. Founded by Peter Thiel. Exemplifies tech-government fusion.',
    foundedYear: 2003,
    headquarters: 'Denver, CO',
    netWorth: 50000000000,
    currency: 'USD',
    domains: [SEVEN_MOUNTAINS.BUSINESS, SEVEN_MOUNTAINS.GOVERNMENT],
    publicProfile: true,
    faraRegistered: false,
    tags: ['defense', 'surveillance', 'big-data', 'government-contractor'],
    sourceUrls: ['https://www.palantir.com', 'https://www.sec.gov/cgi-bin/browse-edgar?company=palantir'],
    confidence: 0.95,
  },
  {
    name: 'Thiel Capital',
    type: 'investment_fund',
    aliases: ['Thiel Foundation', 'Founders Fund (related)'],
    description:
      'Investment vehicle and philanthropic arm of Peter Thiel. Funds technology ventures and political causes.',
    foundedYear: 2005,
    headquarters: 'San Francisco, CA',
    netWorth: 10000000000,
    currency: 'USD',
    domains: [SEVEN_MOUNTAINS.BUSINESS, SEVEN_MOUNTAINS.EDUCATION, SEVEN_MOUNTAINS.GOVERNMENT],
    publicProfile: true,
    faraRegistered: false,
    tags: ['venture-capital', 'philanthropy', 'libertarian', 'tech'],
    sourceUrls: ['https://www.thielfellowship.org'],
    confidence: 0.9,
  },

  // --- THINK TANKS (Education + Government) ---
  {
    name: 'Council on Foreign Relations',
    type: 'think_tank',
    aliases: ['CFR'],
    description:
      'Premier foreign policy think tank. Membership includes former presidents, secretaries of state, media executives.',
    foundedYear: 1921,
    headquarters: 'New York, NY',
    domains: [SEVEN_MOUNTAINS.EDUCATION, SEVEN_MOUNTAINS.GOVERNMENT, SEVEN_MOUNTAINS.MEDIA],
    publicProfile: true,
    faraRegistered: false,
    tags: ['foreign-policy', 'establishment', 'bipartisan', 'elite'],
    sourceUrls: ['https://www.cfr.org'],
    confidence: 0.98,
  },
  {
    name: 'Brookings Institution',
    type: 'think_tank',
    aliases: ['Brookings'],
    description:
      'Centrist think tank focused on governance, economics, and foreign policy. Major influence on Democratic administrations.',
    foundedYear: 1916,
    headquarters: 'Washington, DC',
    domains: [SEVEN_MOUNTAINS.EDUCATION, SEVEN_MOUNTAINS.GOVERNMENT],
    publicProfile: true,
    faraRegistered: false,
    tags: ['policy', 'centrist', 'economics', 'governance'],
    sourceUrls: ['https://www.brookings.edu'],
    confidence: 0.98,
  },

  // --- MEDIA CONGLOMERATES ---
  {
    name: 'News Corp',
    type: 'corporation',
    aliases: ['Fox Corporation', 'Murdoch Media'],
    description:
      'Global media conglomerate. Demonstrates media-politics nexus. Controls Fox News, Wall Street Journal, etc.',
    foundedYear: 1980,
    headquarters: 'New York, NY',
    netWorth: 20000000000,
    currency: 'USD',
    domains: [SEVEN_MOUNTAINS.MEDIA, SEVEN_MOUNTAINS.BUSINESS],
    publicProfile: true,
    faraRegistered: false,
    tags: ['media', 'conservative', 'news', 'entertainment'],
    sourceUrls: ['https://newscorp.com'],
    confidence: 0.95,
  },

  // --- FINANCIAL SECTOR ---
  {
    name: 'BlackRock',
    type: 'investment_fund',
    aliases: ['BLK'],
    description:
      'Largest asset manager globally. $10T+ AUM. Major shareholder in most public companies. ESG influence.',
    foundedYear: 1988,
    headquarters: 'New York, NY',
    netWorth: 10000000000000,
    currency: 'USD',
    domains: [SEVEN_MOUNTAINS.BUSINESS, SEVEN_MOUNTAINS.GOVERNMENT],
    publicProfile: true,
    faraRegistered: false,
    tags: ['asset-management', 'ESG', 'institutional', 'systemic'],
    sourceUrls: ['https://www.blackrock.com'],
    confidence: 0.98,
  },

  // --- UNIVERSITIES AS GATEKEEPERS ---
  {
    name: 'Harvard University',
    type: 'university',
    aliases: ['Harvard', 'Harvard Corporation'],
    description:
      'Elite university functioning as credentialing gatekeeper. Endowment >$50B. Produces political/business leaders.',
    foundedYear: 1636,
    headquarters: 'Cambridge, MA',
    netWorth: 50000000000,
    currency: 'USD',
    domains: [SEVEN_MOUNTAINS.EDUCATION, SEVEN_MOUNTAINS.BUSINESS, SEVEN_MOUNTAINS.GOVERNMENT],
    publicProfile: true,
    faraRegistered: false,
    tags: ['ivy-league', 'elite', 'credentialing', 'endowment'],
    sourceUrls: ['https://www.harvard.edu'],
    confidence: 0.99,
  },

  // --- FOUNDATIONS (Philanthropy as influence) ---
  {
    name: 'Open Society Foundations',
    type: 'foundation',
    aliases: ['OSF', 'Soros Foundation'],
    description:
      'Major progressive philanthropy network. Funds civil society, democracy initiatives, criminal justice reform.',
    foundedYear: 1993,
    headquarters: 'New York, NY',
    netWorth: 25000000000,
    currency: 'USD',
    domains: [SEVEN_MOUNTAINS.GOVERNMENT, SEVEN_MOUNTAINS.EDUCATION, SEVEN_MOUNTAINS.MEDIA],
    publicProfile: true,
    faraRegistered: false,
    tags: ['philanthropy', 'progressive', 'civil-society', 'democracy'],
    sourceUrls: ['https://www.opensocietyfoundations.org'],
    confidence: 0.95,
  },

  // --- EXAMPLE PERSON ---
  {
    name: 'Peter Thiel',
    type: 'person',
    aliases: ['Thiel'],
    description:
      'Tech billionaire. PayPal co-founder. Palantir co-founder. Facebook early investor. Republican megadonor.',
    foundedYear: undefined, // Birth year not "founded"
    headquarters: 'Los Angeles, CA',
    netWorth: 8000000000,
    currency: 'USD',
    domains: [
      SEVEN_MOUNTAINS.BUSINESS,
      SEVEN_MOUNTAINS.GOVERNMENT,
      SEVEN_MOUNTAINS.MEDIA,
      SEVEN_MOUNTAINS.EDUCATION,
    ],
    publicProfile: true,
    faraRegistered: false,
    tags: ['tech', 'libertarian', 'contrarian', 'venture-capital', 'political-donor'],
    sourceUrls: ['https://en.wikipedia.org/wiki/Peter_Thiel'],
    confidence: 0.9,
  },
];

/**
 * Sample Events - Demonstrating power network interactions
 */
const SAMPLE_EVENTS: Omit<EventNode, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Palantir IPO',
    type: 'transaction',
    date: new Date('2020-09-30'),
    location: 'NYSE',
    description: 'Direct listing of Palantir Technologies. Market cap reached $21B on first day.',
    monetaryValue: 21000000000,
    currency: 'USD',
    isPublic: true,
    sourceDocuments: ['SEC S-1 Filing'],
    sourceUrls: ['https://www.sec.gov/Archives/edgar/data/1321655/000119312520230013/d904406ds1.htm'],
    confidence: 0.99,
  },
  {
    name: 'Thiel Fellowship Launch',
    type: 'partnership',
    date: new Date('2010-09-01'),
    location: 'San Francisco, CA',
    description:
      'Peter Thiel launches fellowship paying students $100K to drop out of college. Anti-credentialism in action.',
    monetaryValue: 100000,
    currency: 'USD',
    isPublic: true,
    sourceDocuments: [],
    sourceUrls: ['https://www.thielfellowship.org'],
    confidence: 0.95,
  },
  {
    name: 'Hulk Hogan v. Gawker',
    type: 'litigation',
    date: new Date('2016-03-18'),
    endDate: new Date('2016-06-10'),
    location: 'Florida',
    description:
      'Thiel-funded lawsuit that bankrupted Gawker Media. Demonstrates billionaire media control mechanism.',
    monetaryValue: 140000000,
    currency: 'USD',
    isPublic: true,
    sourceDocuments: ['Court filings'],
    sourceUrls: [],
    confidence: 0.98,
  },
];

/**
 * Influence Relationships - Demonstrating mechanisms
 * Maps to TCG manipulation patterns
 */
interface SampleInfluence {
  fromName: string;
  toName: string;
  properties: InfluenceEdgeProperties;
  tcgParallel: string; // What TCG mechanism this mirrors
}

const SAMPLE_INFLUENCES: SampleInfluence[] = [
  {
    fromName: 'Peter Thiel',
    toName: 'Palantir Technologies',
    properties: {
      mechanism: 'market_making',
      strength: 0.95,
      bidirectional: false,
      evidence: ['Co-founder', 'Board member', 'Major shareholder'],
      publiclyKnown: true,
    },
    tcgParallel: 'The "Whale" who moves markets with single decisions',
  },
  {
    fromName: 'Thiel Capital',
    toName: 'Harvard University',
    properties: {
      mechanism: 'gatekeeping',
      strength: 0.3,
      bidirectional: true,
      evidence: ['Thiel Fellowship explicitly challenges Harvard credentialism'],
      publiclyKnown: true,
    },
    tcgParallel: 'Challenging the PSA/BGS grading monopoly',
  },
  {
    fromName: 'BlackRock',
    toName: 'News Corp',
    properties: {
      mechanism: 'artificial_scarcity',
      strength: 0.6,
      bidirectional: false,
      evidence: ['Major institutional shareholder', 'ESG voting influence'],
      publiclyKnown: true,
    },
    tcgParallel: 'Controlling card supply to maintain price floors',
  },
  {
    fromName: 'Council on Foreign Relations',
    toName: 'Brookings Institution',
    properties: {
      mechanism: 'insider_knowledge',
      strength: 0.7,
      bidirectional: true,
      evidence: ['Overlapping membership', 'Shared conferences', 'Revolving door'],
      publiclyKnown: true,
    },
    tcgParallel: 'Insiders knowing ban list changes before announcement',
  },
  {
    fromName: 'Open Society Foundations',
    toName: 'Brookings Institution',
    properties: {
      mechanism: 'wash_trading',
      strength: 0.5,
      bidirectional: false,
      startDate: new Date('2010-01-01'),
      evidence: ['Foundation grants to think tank', '990 filings show donations'],
      publiclyKnown: true,
    },
    tcgParallel: 'Circular funding to establish legitimacy and price history',
  },
];

/**
 * Funding Relationships - Following the money
 */
interface SampleFunding {
  fromName: string;
  toName: string;
  properties: FundingEdgeProperties;
}

const SAMPLE_FUNDING: SampleFunding[] = [
  {
    fromName: 'Thiel Capital',
    toName: 'Palantir Technologies',
    properties: {
      amount: 30000000,
      currency: 'USD',
      date: new Date('2004-06-01'),
      recurring: false,
      purpose: 'Seed funding',
      disclosed: true,
      sourceDocument: 'SEC filings',
    },
  },
  {
    fromName: 'Open Society Foundations',
    toName: 'Brookings Institution',
    properties: {
      amount: 5000000,
      currency: 'USD',
      date: new Date('2015-01-01'),
      recurring: true,
      purpose: 'General support and specific programs',
      disclosed: true,
      sourceDocument: 'Form 990',
    },
  },
];

async function main(): Promise<void> {
  console.log('='.repeat(70));
  console.log('APEX INTELLIGENCE CENTER - Civilizational Analytics Seed');
  console.log('='.repeat(70));
  console.log('\n"Same engine, different dataset."\n');

  const client = new CivilizationalClient(config);

  try {
    await client.verifyConnectivity();
    console.log('Connected to Neo4j\n');

    // Initialize schema
    console.log('Initializing civilizational schema...');
    await client.initializeSchema();

    // Seed Seven Mountains domains
    console.log('\nSeeding Seven Mountains domains...');
    await client.seedDomains();

    // Create entities
    console.log('\nSeeding entities...');
    const entityMap = new Map<string, string>();
    for (const entity of SAMPLE_ENTITIES) {
      try {
        const created = await client.createEntity(entity);
        entityMap.set(entity.name, created.id);
        console.log(`  ✓ ${entity.type}: ${entity.name}`);
        console.log(`    Domains: ${entity.domains.join(', ')}`);
      } catch (error) {
        console.error(`  ✗ Failed to create ${entity.name}:`, error);
      }
    }

    // Create events
    console.log('\nSeeding events...');
    const eventMap = new Map<string, string>();
    for (const event of SAMPLE_EVENTS) {
      try {
        const created = await client.createEvent(event);
        eventMap.set(event.name, created.id);
        console.log(`  ✓ ${event.type}: ${event.name}`);
      } catch (error) {
        console.error(`  ✗ Failed to create ${event.name}:`, error);
      }
    }

    // Create influence relationships
    console.log('\nSeeding influence relationships (with TCG parallels)...');
    for (const influence of SAMPLE_INFLUENCES) {
      const fromId = entityMap.get(influence.fromName);
      const toId = entityMap.get(influence.toName);
      if (fromId && toId) {
        try {
          await client.createInfluenceRelationship(fromId, toId, influence.properties);
          console.log(`  ✓ ${influence.fromName} --[${influence.properties.mechanism}]--> ${influence.toName}`);
          console.log(`    TCG Parallel: "${influence.tcgParallel}"`);
        } catch (error) {
          console.error(`  ✗ Failed:`, error);
        }
      }
    }

    // Create funding relationships
    console.log('\nSeeding funding relationships...');
    for (const funding of SAMPLE_FUNDING) {
      const fromId = entityMap.get(funding.fromName);
      const toId = entityMap.get(funding.toName);
      if (fromId && toId) {
        try {
          await client.createFundingRelationship(fromId, toId, funding.properties);
          console.log(
            `  ✓ ${funding.fromName} --[FUNDS $${(funding.properties.amount / 1000000).toFixed(1)}M]--> ${funding.toName}`
          );
        } catch (error) {
          console.error(`  ✗ Failed:`, error);
        }
      }
    }

    // Link entities to events
    console.log('\nLinking entities to events...');
    const thielId = entityMap.get('Peter Thiel');
    const palantirId = entityMap.get('Palantir Technologies');
    const ipoEventId = eventMap.get('Palantir IPO');
    const fellowshipEventId = eventMap.get('Thiel Fellowship Launch');
    const gawkerEventId = eventMap.get('Hulk Hogan v. Gawker');

    if (thielId && ipoEventId) {
      await client.linkEntityToEvent(thielId, ipoEventId, 'beneficiary');
      console.log('  ✓ Peter Thiel → Palantir IPO (beneficiary)');
    }
    if (palantirId && ipoEventId) {
      await client.linkEntityToEvent(palantirId, ipoEventId, 'subject');
      console.log('  ✓ Palantir → Palantir IPO (subject)');
    }
    if (thielId && fellowshipEventId) {
      await client.linkEntityToEvent(thielId, fellowshipEventId, 'organizer');
      console.log('  ✓ Peter Thiel → Thiel Fellowship (organizer)');
    }
    if (thielId && gawkerEventId) {
      await client.linkEntityToEvent(thielId, gawkerEventId, 'organizer');
      console.log('  ✓ Peter Thiel → Gawker Lawsuit (funder/organizer)');
    }

    // Run sample queries to demonstrate capabilities
    console.log('\n' + '='.repeat(70));
    console.log('DEMONSTRATION QUERIES');
    console.log('='.repeat(70));

    // Find network neighbors
    if (thielId) {
      console.log('\n1. Network neighbors of Peter Thiel (2 hops):');
      const neighbors = await client.findNetworkNeighbors(thielId, 2);
      for (const n of neighbors.slice(0, 5)) {
        console.log(`   - ${n.entity.name} (distance: ${n.distance})`);
      }
    }

    // Find cross-domain entities
    console.log('\n2. Entities operating across 3+ domains (cross-mountain influence):');
    const crossDomain = await client.findCrossDomainEntities(3);
    for (const e of crossDomain) {
      console.log(`   - ${e.name}: ${(e as any).activeDomains?.join(', ')}`);
    }

    // Find by influence mechanism
    console.log('\n3. Relationships using "gatekeeping" mechanism (parallel to PSA/BGS):');
    const gatekeeping = await client.findByInfluenceMechanism('gatekeeping');
    for (const r of gatekeeping) {
      console.log(`   - ${r.from.name} ↔ ${r.to.name} (strength: ${r.strength})`);
    }

    // Calculate centrality
    console.log('\n4. Top entities by connection count (network centrality):');
    const central = await client.calculateCentrality();
    for (const e of central.slice(0, 5)) {
      console.log(`   - ${e.name} (${e.type}): ${e.connections} connections`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('SEED COMPLETE');
    console.log('='.repeat(70));
    console.log('\nThe Civilizational Analytics layer is now operational.');
    console.log('You can query the graph using Cypher or the CivilizationalClient API.');
    console.log('\nNext steps:');
    console.log('  1. Import FARA registration data for foreign agent tracking');
    console.log('  2. Connect to OpenSecrets API for political donation flows');
    console.log('  3. Link TCG supply chain to cobalt mining entities');
    console.log('  4. Build "Double Helix" report generator\n');
  } catch (error) {
    console.error('\nSeeding failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();

/**
 * Truth Tier Seed Script - Ground Truth Data Ingestion
 *
 * This script populates the Power Network tables with the foundational
 * "Abyss" dataset - verified entities and relationships from legal documents
 * and court records.
 *
 * The Luminous Jellyfish Principle (ID #1) is intentionally placed first
 * to encode hope into the system's genetic code.
 *
 * Usage:
 *   DATABASE_URL=... tsx packages/db/seeds/truth-tier/seed.ts
 *
 * @module truth-tier-seed
 * @version 1.0.0
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import { powerEntities, powerRelationships } from '../../src/schema/powerNetwork';
import type {
  NewPowerEntity,
  NewPowerRelationship,
  PowerEntityType,
  PowerDomainType,
  EvidenceTier,
  PowerRelationshipType,
} from '../../src/schema/powerNetwork';

// =============================================================================
// CSV PARSING
// =============================================================================

interface RawEntity {
  id: string;
  name: string;
  type: string;
  evidence_tier: string;
  primary_domain: string;
  summary: string;
  scandal_notes: string;
  source_urls: string;
  is_obfuscated?: string; // Ghost Protocol flag (optional in CSVs)
}

interface RawRelationship {
  source_id: string;
  target_id: string;
  relationship_type: string;
  domain: string;
  evidence_tier: string;
  start_date: string;
  end_date: string;
  description: string;
  significance: string;
  evidence_link: string;
}

function parseCSV<T>(filePath: string): T[] {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  const headers = parseCSVLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const obj: Record<string, string> = {};
    headers.forEach((header, i) => {
      obj[header] = values[i] || '';
    });
    return obj as T;
  });
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());

  return values;
}

// =============================================================================
// TYPE MAPPING
// =============================================================================

function mapEntityType(type: string): PowerEntityType {
  const mapping: Record<string, PowerEntityType> = {
    PERSON: 'PERSON',
    ORGANIZATION: 'ORGANIZATION',
    CONCEPT: 'CONCEPT',
    EVENT: 'EVENT',
    LOCATION: 'LOCATION',
    SOLUTION: 'SOLUTION', // The Luminous Injection - maps hope and resistance
  };
  return mapping[type.toUpperCase()] || 'PERSON';
}

function mapDomainType(domain: string): PowerDomainType {
  const mapping: Record<string, PowerDomainType> = {
    RELIGION: 'RELIGION',
    FAMILY: 'FAMILY',
    EDUCATION: 'EDUCATION',
    GOVERNMENT: 'GOVERNMENT',
    MEDIA: 'MEDIA',
    ARTS: 'ARTS',
    BUSINESS: 'BUSINESS',
    SPACE: 'SPACE', // The Frontier
  };
  return mapping[domain.toUpperCase()] || 'BUSINESS';
}

function mapEvidenceTier(tier: string): EvidenceTier {
  const mapping: Record<string, EvidenceTier> = {
    CONFIRMED: 'CONFIRMED',
    ADJUDICATED: 'CONFIRMED', // Legal adjudication = confirmed
    DOCUMENTED: 'DOCUMENTED',
    ALLEGED: 'ALLEGED',
    CIRCUMSTANTIAL: 'ALLEGED', // Circumstantial evidence = alleged
    SPECULATIVE: 'SPECULATIVE',
  };
  return mapping[tier.toUpperCase()] || 'DOCUMENTED';
}

function mapRelationshipType(type: string): PowerRelationshipType {
  const mapping: Record<string, PowerRelationshipType> = {
    FINANCIAL: 'FINANCIAL',
    EMPLOYMENT: 'EMPLOYMENT',
    OWNERSHIP: 'OWNERSHIP',
    POLITICAL: 'POLITICAL',
    LEGAL: 'LEGAL',
    SOCIAL: 'SOCIAL',
    FAMILIAL: 'FAMILIAL',
    IDEOLOGICAL: 'IDEOLOGICAL',
  };
  return mapping[type.toUpperCase()] || 'SOCIAL';
}

function mapSignificance(sig: string): 'low' | 'medium' | 'high' | 'critical' {
  const mapping: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
    low: 'low',
    medium: 'medium',
    high: 'high',
    critical: 'critical',
  };
  return mapping[sig.toLowerCase()] || 'medium';
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

function parseSourceUrls(urlsStr: string): string[] {
  try {
    // Handle JSON array format
    if (urlsStr.startsWith('[')) {
      return JSON.parse(urlsStr);
    }
    // Handle single URL
    if (urlsStr.startsWith('http')) {
      return [urlsStr];
    }
    return [];
  } catch {
    return [];
  }
}

// =============================================================================
// MAIN SEED FUNCTION
// =============================================================================

async function seedTruthTier(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL or POSTGRES_URL environment variable required');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  const seedDir = join(__dirname);

  console.log('='.repeat(60));
  console.log('TRUTH TIER SEED - Ground Truth Data Ingestion');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Load CSV data
    console.log('Loading CSV files...');
    const rawEntities = parseCSV<RawEntity>(join(seedDir, 'entities.csv'));
    const rawRelationships = parseCSV<RawRelationship>(join(seedDir, 'relationships.csv'));

    // Load Solution data (The Luminous Injection)
    const rawSolutionEntities = parseCSV<RawEntity>(join(seedDir, 'entities_solutions.csv'));
    const rawSolutionRelationships = parseCSV<RawRelationship>(join(seedDir, 'relationships_solutions.csv'));

    // Merge: Solutions complete the map
    const allEntities = [...rawEntities, ...rawSolutionEntities];
    const allRelationships = [...rawRelationships, ...rawSolutionRelationships];

    console.log(`  - Loaded ${rawEntities.length} base entities`);
    console.log(`  - Loaded ${rawSolutionEntities.length} solution entities (Luminous Injection)`);
    console.log(`  - Loaded ${rawRelationships.length} base relationships`);
    console.log(`  - Loaded ${rawSolutionRelationships.length} solution relationships`);
    console.log(`  - TOTAL: ${allEntities.length} entities, ${allRelationships.length} relationships`);
    console.log('');

    // Map CSV IDs to database UUIDs
    const idMap = new Map<string, string>();

    // Insert entities
    console.log('Inserting entities...');
    for (const raw of allEntities) {
      // Parse is_obfuscated flag (Ghost Protocol)
      const isObfuscated = raw.is_obfuscated?.toLowerCase() === 'true';

      const entity: NewPowerEntity = {
        name: raw.name,
        type: mapEntityType(raw.type),
        evidenceTier: mapEvidenceTier(raw.evidence_tier),
        primaryDomain: mapDomainType(raw.primary_domain),
        summary: raw.summary,
        scandalNotes: raw.scandal_notes,
        sourceUrls: parseSourceUrls(raw.source_urls),
        isObfuscated, // Ghost Protocol: hidden actors
      };

      const [inserted] = await db
        .insert(powerEntities)
        .values(entity)
        .returning({ id: powerEntities.id });

      idMap.set(raw.id, inserted.id);
      const ghostIndicator = isObfuscated ? ' [GHOST]' : '';
      console.log(`  [${raw.id}] ${raw.name}${ghostIndicator} -> ${inserted.id}`);
    }
    console.log('');

    // Insert relationships
    console.log('Inserting relationships...');
    for (const raw of allRelationships) {
      const sourceUuid = idMap.get(raw.source_id);
      const targetUuid = idMap.get(raw.target_id);

      if (!sourceUuid || !targetUuid) {
        console.warn(`  SKIP: Missing entity for relationship ${raw.source_id} -> ${raw.target_id}`);
        continue;
      }

      const relationship: NewPowerRelationship = {
        sourceId: sourceUuid,
        targetId: targetUuid,
        relationshipType: mapRelationshipType(raw.relationship_type),
        domain: mapDomainType(raw.domain),
        evidenceTier: mapEvidenceTier(raw.evidence_tier),
        startDate: parseDate(raw.start_date),
        endDate: parseDate(raw.end_date),
        description: raw.description,
        significance: mapSignificance(raw.significance),
        evidenceLink: raw.evidence_link || null,
      };

      const [inserted] = await db
        .insert(powerRelationships)
        .values(relationship)
        .returning({ id: powerRelationships.id });

      const sourceName = allEntities.find((e) => e.id === raw.source_id)?.name || raw.source_id;
      const targetName = allEntities.find((e) => e.id === raw.target_id)?.name || raw.target_id;
      console.log(`  ${sourceName} --[${raw.relationship_type}]--> ${targetName}`);
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('SEED COMPLETE');
    console.log('='.repeat(60));
    console.log('');
    console.log('The Luminous Jellyfish Principle has been encoded.');
    console.log('Light persists in the abyss.');
    console.log('');
  } catch (error) {
    console.error('Seed failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if executed directly
seedTruthTier().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

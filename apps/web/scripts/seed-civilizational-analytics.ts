#!/usr/bin/env tsx
/**
 * Civilizational Analytics Seed Script
 *
 * Seeds the PostgreSQL database with power network entities and relationships
 * using the Seven Mountains Framework and Truth Tier evidence system.
 *
 * This script transforms CSV data into structured, queryable truth in your
 * Neon database, enforcing the "Truth Tier" logic:
 *
 * | Tier       | Meaning                                     |
 * |------------|---------------------------------------------|
 * | CONFIRMED  | Court documents, official records           |
 * | DOCUMENTED | Credible journalism, multiple sources       |
 * | ALLEGED    | Single source, unverified but plausible     |
 * | SPECULATIVE| Pattern-based inference, needs more evidence|
 *
 * Usage:
 *   pnpm tsx apps/web/scripts/seed-civilizational-analytics.ts
 *
 * Prerequisites:
 *   - CSV files in packages/db/seeds/data/
 *   - POSTGRES_URL or DATABASE_URL environment variable
 *
 * @module seed-civilizational-analytics
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import {
  powerEntities,
  powerRelationships,
  type NewPowerEntity,
  type NewPowerRelationship,
  type EvidenceTier,
  type PowerEntityType,
  type PowerDomainType,
  type PowerRelationshipType,
} from '@apex/db/src/schema/powerNetwork';

// =============================================================================
// CONFIGURATION
// =============================================================================

const DATA_DIR = path.join(process.cwd(), '..', '..', 'packages', 'db', 'seeds', 'data');
const ENTITIES_CSV = path.join(DATA_DIR, 'entities.csv');
const RELATIONSHIPS_CSV = path.join(DATA_DIR, 'relationships.csv');

// =============================================================================
// DATABASE CONNECTION
// =============================================================================

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

const db = drizzle(pool);

// =============================================================================
// CSV PARSERS
// =============================================================================

interface EntityRow {
  id: string;
  name: string;
  type: string;
  evidence_tier: string;
  primary_domain: string;
  description: string;
  aliases: string;
  wikipedia_url: string;
  scandal_notes: string;
}

interface RelationshipRow {
  source_id: string;
  target_id: string;
  relationship_type: string;
  domain: string;
  evidence_tier: string;
  description: string;
  source_citation: string;
  start_date: string;
  end_date: string;
  significance: string;
  financial_amount: string;
}

function parseAliases(aliasStr: string): string[] {
  if (!aliasStr || aliasStr.trim() === '') return [];
  try {
    // Handle JSON array format
    return JSON.parse(aliasStr);
  } catch {
    // Handle comma-separated format
    return aliasStr.split(',').map((s) => s.trim());
  }
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

// =============================================================================
// SEED FUNCTIONS
// =============================================================================

async function seedEntities(): Promise<Map<string, string>> {
  console.log('\n  Loading entities from CSV...');

  if (!fs.existsSync(ENTITIES_CSV)) {
    throw new Error(`Entities CSV not found at: ${ENTITIES_CSV}`);
  }

  const csvContent = fs.readFileSync(ENTITIES_CSV, 'utf-8');
  const rows: EntityRow[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`  Found ${rows.length} entities`);

  // Map CSV ID -> Database UUID
  const idMap = new Map<string, string>();

  for (const row of rows) {
    const entity: NewPowerEntity = {
      name: row.name,
      type: row.type as PowerEntityType,
      evidenceTier: row.evidence_tier as EvidenceTier,
      primaryDomain: row.primary_domain as PowerDomainType,
      summary: row.description,
      scandalNotes: row.scandal_notes || undefined,
      aliases: parseAliases(row.aliases),
      wikipediaUrl: row.wikipedia_url || undefined,
      sourceUrls: row.wikipedia_url ? [row.wikipedia_url] : [],
    };

    try {
      const result = await db
        .insert(powerEntities)
        .values(entity)
        .returning({ id: powerEntities.id });

      idMap.set(row.id, result[0].id);

      const tierEmoji = {
        CONFIRMED: '\u2705',
        DOCUMENTED: '\u{1F4CB}',
        ALLEGED: '\u26A0\uFE0F',
        SPECULATIVE: '\u{1F52E}',
      }[row.evidence_tier] || '\u2753';

      console.log(`    ${tierEmoji} [${row.type}] ${row.name}`);
    } catch (error) {
      console.error(`    \u274C Failed to insert ${row.name}:`, error);
    }
  }

  return idMap;
}

async function seedRelationships(idMap: Map<string, string>): Promise<void> {
  console.log('\n  Loading relationships from CSV...');

  if (!fs.existsSync(RELATIONSHIPS_CSV)) {
    throw new Error(`Relationships CSV not found at: ${RELATIONSHIPS_CSV}`);
  }

  const csvContent = fs.readFileSync(RELATIONSHIPS_CSV, 'utf-8');
  const rows: RelationshipRow[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`  Found ${rows.length} relationships`);

  let successCount = 0;
  let skipCount = 0;

  for (const row of rows) {
    const sourceUuid = idMap.get(row.source_id);
    const targetUuid = idMap.get(row.target_id);

    if (!sourceUuid || !targetUuid) {
      console.warn(`    \u23ED Skipping: source ${row.source_id} or target ${row.target_id} not found`);
      skipCount++;
      continue;
    }

    const relationship: NewPowerRelationship = {
      sourceId: sourceUuid,
      targetId: targetUuid,
      relationshipType: row.relationship_type as PowerRelationshipType,
      domain: row.domain as PowerDomainType,
      evidenceTier: row.evidence_tier as EvidenceTier,
      description: row.description,
      evidenceLink: row.source_citation || undefined,
      startDate: parseDate(row.start_date),
      endDate: parseDate(row.end_date),
      significance: row.significance || 'medium',
      financialAmount: row.financial_amount || undefined,
      sourceUrls: row.source_citation ? [row.source_citation] : [],
    };

    try {
      await db.insert(powerRelationships).values(relationship);
      successCount++;

      const arrow = row.relationship_type === 'IDEOLOGICAL' ? '\u2194' : '\u2192';
      console.log(`    \u{1F517} [${row.relationship_type}] ID:${row.source_id} ${arrow} ID:${row.target_id}`);
    } catch (error) {
      console.error(`    \u274C Failed to insert relationship:`, error);
    }
  }

  console.log(`\n  Relationships: ${successCount} created, ${skipCount} skipped`);
}

// =============================================================================
// MAIN
// =============================================================================

async function main(): Promise<void> {
  console.log('='.repeat(70));
  console.log(' APEX INTELLIGENCE CENTER');
  console.log(' Civilizational Analytics Engine - Database Seed');
  console.log('='.repeat(70));
  console.log('\n\u{1F331} Starting Civilizational Analytics Database Seed...');
  console.log('\n"Making power visible. The Luminous Jellyfish Principle."');

  try {
    // Verify database connection
    console.log('\n\u{1F50C} Connecting to database...');
    await pool.query('SELECT 1');
    console.log('  Connected successfully');

    // Seed entities
    console.log('\n\u{1F464} SEEDING ENTITIES (Power Network Nodes)');
    const idMap = await seedEntities();
    console.log(`\n  Total entities seeded: ${idMap.size}`);

    // Seed relationships
    console.log('\n\u{1F310} SEEDING RELATIONSHIPS (Power Network Edges)');
    await seedRelationships(idMap);

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log(' SEED COMPLETE');
    console.log('='.repeat(70));
    console.log('\n\u2705 The Truth is now online.');
    console.log('\nThe Luminous Jellyfish Principle (ID #1) is your first entity.');
    console.log('Every query into the abyss surfaces with hope.\n');

    console.log('Next steps:');
    console.log('  1. Query entities: SELECT * FROM power_entities WHERE evidence_tier = \'CONFIRMED\'');
    console.log('  2. Find connections: Query power_relationships for network analysis');
    console.log('  3. Build visualization: Use SourceCard component for Truth Tier display');
    console.log('  4. Publish the Manifesto: Deploy "The Antichrist and the Algorithm"\n');

  } catch (error) {
    console.error('\n\u274C Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('\u{1F50C} Database connection closed');
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

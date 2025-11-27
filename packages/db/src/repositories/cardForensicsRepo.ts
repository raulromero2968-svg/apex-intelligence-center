import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { cardForensics, type CardForensics, type NewCardForensics } from '../schema/cardForensics';

/**
 * Repository functions for card_forensics table.
 * 
 * These functions provide type-safe access to VARC job results stored in the database.
 */

/**
 * Insert a new card forensics record.
 * 
 * @param db - Drizzle database instance
 * @param record - Card forensics data to insert
 * @returns The inserted record with generated id and timestamps
 */
export async function insertCardForensics(
  db: NodePgDatabase<Record<string, never>>,
  record: NewCardForensics
): Promise<CardForensics> {
  const [inserted] = await db
    .insert(cardForensics)
    .values(record)
    .returning();
  
  return inserted;
}

/**
 * Find a card forensics record by jobId.
 * 
 * @param db - Drizzle database instance
 * @param jobId - The jobId to search for (matches Intelligence Bus jobId)
 * @returns The matching record or null if not found
 */
export async function findCardForensicsByJobId(
  db: NodePgDatabase<Record<string, never>>,
  jobId: string
): Promise<CardForensics | null> {
  const result = await db
    .select()
    .from(cardForensics)
    .where(eq(cardForensics.jobId, jobId))
    .limit(1);
  
  return result[0] ?? null;
}

/**
 * Find card forensics records by cardId.
 * 
 * @param db - Drizzle database instance
 * @param cardId - The card identifier to search for
 * @param limit - Maximum number of records to return (default: 100)
 * @returns Array of matching records
 */
export async function findCardForensicsByCardId(
  db: NodePgDatabase<Record<string, never>>,
  cardId: string,
  limit: number = 100
): Promise<CardForensics[]> {
  return db
    .select()
    .from(cardForensics)
    .where(eq(cardForensics.cardId, cardId))
    .limit(limit);
}




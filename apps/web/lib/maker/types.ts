/**
 * MAKER Framework Types
 *
 * Type definitions for the Multi-Agent Knowledge Ensemble Refinement framework
 * adapted for TCG arbitrage scanning with Drizzle ORM integration.
 */

import { z } from 'zod';
import type { Card, Price } from '@/db/schema';

/**
 * Card schema for validation
 */
export const CardSchema = z.object({
  id: z.string(),
  name: z.string(),
  setName: z.string(),
  cardNumber: z.string(),
  game: z.string(),
  artist: z.string().nullable(),
  rarity: z.string().nullable(),
  tcgplayerId: z.number().nullable(),
  scryfallId: z.string().nullable(),
  justTcgId: z.string().nullable(),
  apexScore: z.number().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Price schema for validation
 */
export const PriceSchema = z.object({
  id: z.string(),
  cardId: z.string(),
  date: z.date(),
  source: z.string(),
  market: z.number(),
  low: z.number().nullable(),
  high: z.number().nullable(),
  psa10: z.number().nullable(),
  psa9: z.number().nullable(),
  cgcBlackLabel: z.number().nullable(),
  bgs95: z.number().nullable(),
  createdAt: z.date(),
});

/**
 * Card with prices from database query
 */
export interface CardWithPrices {
  cardId: string;
  card: Card;
  prices: Price[];
}

/**
 * Extracted and normalized prices by source
 */
export interface ExtractedPrices {
  cardId: string;
  prices: Record<string, number>; // source → market price
}

/**
 * Single arbitrage opportunity
 */
export interface ArbitrageOpportunity {
  cardId: string;
  buySource: string;
  buyPrice: number;
  sellSource: string;
  sellPrice: number;
  profit: number;
  profitMarginPct: number;
  profitable: true;
}

/**
 * Arbitrage result for a single card
 */
export interface ArbitrageResult {
  cardId: string;
  opportunities: ArbitrageOpportunity[];
}

/**
 * Red flag function type
 */
export type RedFlagFunction<T> = (result: T) => string | null;

/**
 * Voting options for MAKER consensus
 */
export interface VotingOptions<T> {
  taskId: string;
  cardId?: string;
  stepName: string;
  k?: number;
  maxVotes?: number;
  redFlags?: RedFlagFunction<T>[];
}


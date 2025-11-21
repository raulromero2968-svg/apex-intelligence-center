import type { CardForensics } from '@apex/db/src/schema';

/**
 * PSA Certification data structure
 */
export interface PSACertification {
  certificationNumber: string;
  grade: number;
  gradeScale: 'PSA' | 'BGS' | 'CGC';
  cardName: string;
  cardSet: string;
  cardNumber: string;
  certifiedAt: string;
  imageUrl?: string;
}

/**
 * Metadata preparation result
 */
export interface MetadataResult {
  metadataUri: string;
  metadata: Record<string, unknown>;
}

/**
 * Mint result from Polygon
 */
export interface MintResult {
  tokenId: string;
  txHash: string;
}


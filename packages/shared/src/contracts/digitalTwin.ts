import { z } from 'zod';

/**
 * Digital Twin Token represents a blockchain NFT linked to a physical card via VARC forensics.
 * Each token is minted on Polygon and cryptographically linked to a card_forensics record.
 */
export const DigitalTwinTokenSchema = z.object({
  id: z.string().uuid(),
  cardForensicsId: z.string().uuid(),
  userId: z.string().uuid().nullable(),
  cardId: z.string().nullable(),
  polygonTokenId: z.string(),
  polygonTxHash: z.string(),
  metadataUri: z.string().url(),
  status: z.enum(['pending', 'minted', 'failed']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type DigitalTwinToken = z.infer<typeof DigitalTwinTokenSchema>;

/**
 * Metadata structure for digital twin NFT
 */
export const DigitalTwinMetadataSchema = z.object({
  name: z.string(),
  description: z.string(),
  image: z.string().url().optional(),
  external_url: z.string().url().optional(),
  attributes: z.array(
    z.object({
      trait_type: z.string(),
      value: z.union([z.string(), z.number()]),
    })
  ),
  fingerprintHash: z.string().optional(),
  hashVersion: z.string().optional(),
  grade: z.number().optional(),
  cardId: z.string().optional(),
  createdAt: z.string().datetime(),
});

export type DigitalTwinMetadata = z.infer<typeof DigitalTwinMetadataSchema>;



import { z } from 'zod';

// ============================================================================
// FINGERPRINT HASH VERSION
// ============================================================================

export type FingerprintHashVersion = string;

export const FingerprintHashVersionSchema = z.string().min(1);

// ============================================================================
// CARD FINGERPRINT
// ============================================================================

export const CardFingerprintSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().nullable(),
  cardId: z.string().nullable(),
  jobId: z.string().nullable(),
  imageUrl: z.string().url(),
  grade: z.number().nullable(),
  hashVersion: FingerprintHashVersionSchema,
  fingerprintVector: z.array(z.number()).length(256),
  fingerprintHex: z.string().length(64).regex(/^[0-9a-f]{64}$/i),
  similarToExisting: z.boolean(),
  nearestNeighborId: z.string().uuid().nullable(),
  nearestNeighborDistance: z.number().nullable(),
  createdAt: z.string().datetime(),
});

export type CardFingerprint = z.infer<typeof CardFingerprintSchema>;

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export const FingerprintScanRequestSchema = z.object({
  cardId: z.string().nullable(),
  imageUrl: z.string().url(),
});

export type FingerprintScanRequest = z.infer<typeof FingerprintScanRequestSchema>;

export const FingerprintScanResponseSchema = z.object({
  fingerprint: CardFingerprintSchema,
  potentialDuplicates: z.array(CardFingerprintSchema),
});

export type FingerprintScanResponse = z.infer<typeof FingerprintScanResponseSchema>;



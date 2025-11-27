import { z } from 'zod';

// ============================================================================
// QUEUE NAMES
// ============================================================================

export const VARC_QUEUE_NAME = 'varc_queue';
export const LAMP_QUEUE_NAME = 'lamp_queue';
export const CONTRARIAN_QUEUE_NAME = 'contrarian_queue';

// ============================================================================
// JOB KINDS
// ============================================================================

export type JobKind = 'varc' | 'lamp' | 'contrarian';

// ============================================================================
// JOB PAYLOADS (Zod Schemas)
// ============================================================================

export const VarcJobPayloadSchema = z.object({
  cardId: z.string().nullable(),
  imageUrl: z.string().url(),
  extraMetadata: z.record(z.unknown()).optional(),
});

export type VarcJobPayload = z.infer<typeof VarcJobPayloadSchema>;

export const LampJobPayloadSchema = z.object({
  scenarioId: z.string(),
  portfolioId: z.string().nullable(),
  parameters: z.record(z.unknown()),
  horizonDays: z.number().int().positive().default(30),
});

export type LampJobPayload = z.infer<typeof LampJobPayloadSchema>;

export const ContrarianJobPayloadSchema = z.object({
  query: z.string().min(1),
  mode: z.enum(['mainstream', 'contrarian', 'both']).default('both'),
  constraints: z.record(z.unknown()).optional(),
  language: z.string().default('en'),
});

export type ContrarianJobPayload = z.infer<typeof ContrarianJobPayloadSchema>;

// ============================================================================
// JOB ENVELOPE
// ============================================================================

export const QueuedJobEnvelopeSchema = <TPayload extends z.ZodTypeAny>(payloadSchema: TPayload) =>
  z.object({
    jobId: z.string().uuid(),
    kind: z.enum(['varc', 'lamp', 'contrarian']),
    userId: z.string().uuid().nullable(),
    traceId: z.string().uuid(),
    requestedAt: z.string().datetime(),
    payload: payloadSchema,
  });

export type QueuedJobEnvelope<TPayload> = {
  jobId: string;
  kind: JobKind;
  userId: string | null;
  traceId: string;
  requestedAt: string;
  payload: TPayload;
};

// ============================================================================
// RESULT PAYLOADS
// ============================================================================

export const VarcResultPayloadSchema = z.object({
  jobId: z.string().uuid(),
  status: z.enum(['completed', 'error']),
  result: z.record(z.unknown()).optional(),
  error: z
    .object({
      message: z.string(),
      code: z.string().optional(),
    })
    .optional(),
  completedAt: z.string().datetime(),
});

export type VarcResultPayload = z.infer<typeof VarcResultPayloadSchema>;

export const LampSimulationUpdatePayloadSchema = z.object({
  simulationId: z.string(),
  status: z.enum(['running', 'completed', 'error']),
  progress: z.number().min(0).max(100).optional(),
  result: z.record(z.unknown()).optional(),
  error: z
    .object({
      message: z.string(),
      code: z.string().optional(),
    })
    .optional(),
  updatedAt: z.string().datetime(),
});

export type LampSimulationUpdatePayload = z.infer<typeof LampSimulationUpdatePayloadSchema>;

export const ContrarianResultPayloadSchema = z.object({
  jobId: z.string().uuid(),
  status: z.enum(['completed', 'error']),
  result: z
    .object({
      query: z.string(),
      mainstream: z.array(z.record(z.unknown())).optional(),
      contrarian: z.array(z.record(z.unknown())).optional(),
      synthesis: z.string().optional(),
    })
    .optional(),
  error: z
    .object({
      message: z.string(),
      code: z.string().optional(),
    })
    .optional(),
  completedAt: z.string().datetime(),
});

export type ContrarianResultPayload = z.infer<typeof ContrarianResultPayloadSchema>;

// ============================================================================
// REDIS PUB/SUB CHANNEL PATTERNS
// ============================================================================

export const varcCompletedChannel = (jobId: string): string => `events.varc.completed.${jobId}`;

export const lampUpdateChannel = (simulationId: string): string => `events.lamp.update.${simulationId}`;

export const contrarianCompletedChannel = (jobId: string): string => `events.contrarian.completed.${jobId}`;



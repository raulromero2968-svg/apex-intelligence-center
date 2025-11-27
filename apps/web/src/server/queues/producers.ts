import { randomUUID } from 'crypto';
import {
  VarcJobPayload,
  LampJobPayload,
  ContrarianJobPayload,
  QueuedJobEnvelope,
  VARC_QUEUE_NAME,
  LAMP_QUEUE_NAME,
  CONTRARIAN_QUEUE_NAME,
} from '@apex/shared';
import { varcQueue, lampQueue, contrarianQueue } from './bullmqClient';

export async function enqueueVarcJob(
  payload: VarcJobPayload,
  userId: string | null,
  traceId: string,
): Promise<string> {
  const jobId = randomUUID();
  const envelope: QueuedJobEnvelope<VarcJobPayload> = {
    jobId,
    kind: 'varc',
    userId,
    traceId,
    requestedAt: new Date().toISOString(),
    payload,
  };

  await varcQueue.add(jobId, envelope, {
    jobId,
  });

  return jobId;
}

export async function enqueueLampJob(
  payload: LampJobPayload,
  userId: string | null,
  traceId: string,
): Promise<string> {
  const jobId = randomUUID();
  const envelope: QueuedJobEnvelope<LampJobPayload> = {
    jobId,
    kind: 'lamp',
    userId,
    traceId,
    requestedAt: new Date().toISOString(),
    payload,
  };

  await lampQueue.add(jobId, envelope, {
    jobId,
  });

  return jobId;
}

export async function enqueueContrarianJob(
  payload: ContrarianJobPayload,
  userId: string | null,
  traceId: string,
): Promise<string> {
  const jobId = randomUUID();
  const envelope: QueuedJobEnvelope<ContrarianJobPayload> = {
    jobId,
    kind: 'contrarian',
    userId,
    traceId,
    requestedAt: new Date().toISOString(),
    payload,
  };

  await contrarianQueue.add(jobId, envelope, {
    jobId,
  });

  return jobId;
}



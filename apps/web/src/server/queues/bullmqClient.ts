import { Queue, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import {
  VARC_QUEUE_NAME,
  LAMP_QUEUE_NAME,
  CONTRARIAN_QUEUE_NAME,
} from '@apex/shared/src/contracts/queues';

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL environment variable is required');
}

const connection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export const varcQueue = new Queue(VARC_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 86400,
      count: 1000,
    },
    removeOnFail: {
      age: 604800,
    },
  },
});

export const lampQueue = new Queue(LAMP_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 86400,
      count: 1000,
    },
    removeOnFail: {
      age: 604800,
    },
  },
});

export const contrarianQueue = new Queue(CONTRARIAN_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 86400,
      count: 1000,
    },
    removeOnFail: {
      age: 604800,
    },
  },
});

export const varcQueueEvents = new QueueEvents(VARC_QUEUE_NAME, {
  connection,
});

export const lampQueueEvents = new QueueEvents(LAMP_QUEUE_NAME, {
  connection,
});

export const contrarianQueueEvents = new QueueEvents(CONTRARIAN_QUEUE_NAME, {
  connection,
});


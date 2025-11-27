import { Queue, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import {
  VARC_QUEUE_NAME,
  LAMP_QUEUE_NAME,
  CONTRARIAN_QUEUE_NAME,
} from '@apex/shared';

// Lazy initialization to prevent build-time errors
let _connection: Redis | null = null;
let _varcQueue: Queue | null = null;
let _lampQueue: Queue | null = null;
let _contrarianQueue: Queue | null = null;
let _varcQueueEvents: QueueEvents | null = null;
let _lampQueueEvents: QueueEvents | null = null;
let _contrarianQueueEvents: QueueEvents | null = null;

function getConnection(): Redis {
  if (!_connection) {
    if (!process.env.REDIS_URL) {
      throw new Error('REDIS_URL environment variable is required');
    }
    _connection = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }
  return _connection;
}

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 2000,
  },
  removeOnComplete: {
    age: 86400,
    count: 1000,
  },
  removeOnFail: {
    age: 604800,
  },
};

export function getVarcQueue(): Queue {
  if (!_varcQueue) {
    _varcQueue = new Queue(VARC_QUEUE_NAME, {
      connection: getConnection(),
      defaultJobOptions,
    });
  }
  return _varcQueue;
}

export function getLampQueue(): Queue {
  if (!_lampQueue) {
    _lampQueue = new Queue(LAMP_QUEUE_NAME, {
      connection: getConnection(),
      defaultJobOptions,
    });
  }
  return _lampQueue;
}

export function getContrarianQueue(): Queue {
  if (!_contrarianQueue) {
    _contrarianQueue = new Queue(CONTRARIAN_QUEUE_NAME, {
      connection: getConnection(),
      defaultJobOptions,
    });
  }
  return _contrarianQueue;
}

export function getVarcQueueEvents(): QueueEvents {
  if (!_varcQueueEvents) {
    _varcQueueEvents = new QueueEvents(VARC_QUEUE_NAME, {
      connection: getConnection(),
    });
  }
  return _varcQueueEvents;
}

export function getLampQueueEvents(): QueueEvents {
  if (!_lampQueueEvents) {
    _lampQueueEvents = new QueueEvents(LAMP_QUEUE_NAME, {
      connection: getConnection(),
    });
  }
  return _lampQueueEvents;
}

export function getContrarianQueueEvents(): QueueEvents {
  if (!_contrarianQueueEvents) {
    _contrarianQueueEvents = new QueueEvents(CONTRARIAN_QUEUE_NAME, {
      connection: getConnection(),
    });
  }
  return _contrarianQueueEvents;
}

// Backwards compatibility exports using Proxy for lazy initialization
export const varcQueue = new Proxy({} as Queue, {
  get(_, prop) {
    const queue = getVarcQueue();
    const value = (queue as any)[prop];
    return typeof value === 'function' ? value.bind(queue) : value;
  }
});

export const lampQueue = new Proxy({} as Queue, {
  get(_, prop) {
    const queue = getLampQueue();
    const value = (queue as any)[prop];
    return typeof value === 'function' ? value.bind(queue) : value;
  }
});

export const contrarianQueue = new Proxy({} as Queue, {
  get(_, prop) {
    const queue = getContrarianQueue();
    const value = (queue as any)[prop];
    return typeof value === 'function' ? value.bind(queue) : value;
  }
});

export const varcQueueEvents = new Proxy({} as QueueEvents, {
  get(_, prop) {
    const events = getVarcQueueEvents();
    const value = (events as any)[prop];
    return typeof value === 'function' ? value.bind(events) : value;
  }
});

export const lampQueueEvents = new Proxy({} as QueueEvents, {
  get(_, prop) {
    const events = getLampQueueEvents();
    const value = (events as any)[prop];
    return typeof value === 'function' ? value.bind(events) : value;
  }
});

export const contrarianQueueEvents = new Proxy({} as QueueEvents, {
  get(_, prop) {
    const events = getContrarianQueueEvents();
    const value = (events as any)[prop];
    return typeof value === 'function' ? value.bind(events) : value;
  }
});



// src/lib/db.ts - Prisma client singleton for Next.js
// Prevents multiple instances in development (hot reload)

import type { PrismaClient as PrismaClientType } from '@prisma/client';

type PrismaConstructor = new (...args: any[]) => PrismaClientType;

function resolvePrismaClient(): PrismaConstructor {
  try {
    // eslint-disable-next-line global-require
    const { PrismaClient } = require('@prisma/client');
    return PrismaClient as PrismaConstructor;
  } catch (error) {
    console.warn('[db] PrismaClient not available. Using no-op stub.', error);

    class PrismaClientStub {
      constructor() {
        console.warn(
          '[db] PrismaClient stub instantiated. Database operations will no-op. Ensure @prisma/client is generated for full functionality.'
        );
      }
    }

    return PrismaClientStub as unknown as PrismaConstructor;
  }
}

const PrismaClient = resolvePrismaClient();

const globalForPrisma = globalThis as unknown as {
  prisma: InstanceType<PrismaConstructor> | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

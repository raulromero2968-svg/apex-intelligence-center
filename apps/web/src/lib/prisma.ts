/**
 * Prisma Client Singleton
 *
 * Provides PrismaClient for schema generation and migrations.
 * For database queries, prefer using the Drizzle ORM instance from @/db.
 *
 * The singleton pattern prevents multiple PrismaClient instances
 * in development due to hot module reloading.
 */

type PrismaClientType = Record<string, unknown>;
type PrismaConstructor = new (...args: unknown[]) => PrismaClientType;

function resolvePrismaClient(): PrismaConstructor {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require('@prisma/client');
    return PrismaClient as PrismaConstructor;
  } catch {
    // PrismaClient not available - return stub for build time
    // This happens when @prisma/client hasn't been generated yet
    console.warn('[prisma] PrismaClient not available. Using no-op stub.');

    class PrismaClientStub {
      constructor() {
        console.warn(
          '[prisma] PrismaClient stub instantiated. Run `pnpm exec prisma generate` to enable Prisma features.'
        );
      }
    }

    return PrismaClientStub as unknown as PrismaConstructor;
  }
}

const PrismaClient = resolvePrismaClient();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientType | undefined;
};

export const prisma: PrismaClientType =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

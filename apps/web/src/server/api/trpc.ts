import { createCallerFactory } from '@trpc/server';
import { appRouter } from './root';
import { createContext, type Context } from './init';
import type { NextRequest } from 'next/server';

export const createCaller = createCallerFactory(appRouter);

export async function createServerCaller(req: NextRequest) {
  const ctx = await createContext(req);
  return createCaller(ctx);
}



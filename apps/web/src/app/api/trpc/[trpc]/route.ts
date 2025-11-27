import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/api/root';
import { createContext } from '@/server/api/init';
import { NextRequest } from 'next/server';
import { createLogger } from '@apex/shared';

const logger = createLogger('web', 'trpc-handler');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext(req),
    onError: ({ path, error, type, ctx }) => {
      // Error formatter in init.ts handles logging, but we log here for additional context
      logger.error('tRPC request error', {
        path: path ?? '<no-path>',
        type,
        code: error.code,
        message: error.message,
        traceId: ctx?.traceId,
        userId: ctx?.userId,
      });
    },
  });

export { handler as GET, handler as POST };


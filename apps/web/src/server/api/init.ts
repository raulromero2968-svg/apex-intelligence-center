import { initTRPC, TRPCError } from '@trpc/server';
import { NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { randomUUID } from 'crypto';
import { createLogger } from '@apex/shared';

const logger = createLogger('web', 'trpc');

export interface Context {
  req: NextRequest;
  userId: string | null;
  traceId: string;
}

export async function createContext(req: NextRequest): Promise<Context> {
  const user = await getUserFromRequest(req);
  const traceId = req.headers.get('x-trace-id') || randomUUID();

  return {
    req,
    userId: user?.id ?? null,
    traceId,
  };
}

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error, ctx }) {
    // Log errors with traceId for debugging
    logger.error('tRPC error', {
      code: error.code,
      message: error.message,
      path: shape.path,
      traceId: ctx.traceId,
      userId: ctx.userId,
      stack: error.stack,
    });

    // Return sanitized error to client (no internals)
    return {
      ...shape,
      message:
        process.env.NODE_ENV === 'production'
          ? 'An error occurred. Please try again later.'
          : shape.message,
      data: {
        ...shape.data,
        code: error.code,
        httpStatus: error.cause instanceof TRPCError ? error.cause.code : 500,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
  }

  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId as string,
    },
  });
});



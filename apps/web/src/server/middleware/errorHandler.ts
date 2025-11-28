/**
 * Error Handling Middleware
 * 
 * Central error formatter that:
 * - Logs errors with traceId if available
 * - Returns sanitized error messages to client (no internals)
 * - Handles different error types appropriately
 */

import { NextResponse } from 'next/server';
import { createLogger } from '@apex/shared';

const logger = createLogger('web', 'error-handler');

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  traceId?: string;
}

/**
 * Create a sanitized error response for API routes
 */
export function createErrorResponse(
  error: unknown,
  traceId?: string
): NextResponse {
  const errorId = traceId || crypto.randomUUID();

  // Log the full error with traceId
  logger.error('API error occurred', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    statusCode: error instanceof Error && 'statusCode' in error ? (error as ApiError).statusCode : 500,
    code: error instanceof Error && 'code' in error ? (error as ApiError).code : undefined,
    traceId: errorId,
  });

  // Determine status code
  let statusCode = 500;
  if (error instanceof Error && 'statusCode' in error) {
    statusCode = (error as ApiError).statusCode || 500;
  }

  // Sanitize error message for client
  let message = 'An internal error occurred';
  
  if (error instanceof Error) {
    // Only expose specific error types to client
    if (error.name === 'ValidationError' || error.message.includes('validation')) {
      message = 'Validation error: ' + error.message;
      statusCode = 400;
    } else if (error.name === 'UnauthorizedError' || error.message.includes('unauthorized')) {
      message = 'Unauthorized';
      statusCode = 401;
    } else if (error.name === 'ForbiddenError' || error.message.includes('forbidden')) {
      message = 'Forbidden';
      statusCode = 403;
    } else if (error.name === 'NotFoundError' || error.message.includes('not found')) {
      message = 'Resource not found';
      statusCode = 404;
    } else if (statusCode < 500) {
      // Client errors (4xx) - safe to expose message
      message = error.message;
    }
    // Server errors (5xx) - use generic message
  }

  return NextResponse.json(
    {
      error: message,
      traceId: errorId,
    },
    { status: statusCode }
  );
}

/**
 * Wrap an API route handler with error handling
 */
export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      // Extract traceId from request if available
      let traceId: string | undefined;
      if (args[0] && typeof args[0] === 'object' && 'headers' in args[0]) {
        const request = args[0] as { headers: Headers };
        traceId = request.headers.get('x-trace-id') || undefined;
      }

      return createErrorResponse(error, traceId);
    }
  };
}



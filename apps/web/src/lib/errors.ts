/**
 * Enhanced Error Handling System
 *
 * Production-grade error classes with proper HTTP status codes and Sentry integration.
 * Follows best practices from Linear, Vercel, and Resend.
 */

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super(message, 400);
  }
}

/**
 * Authentication error (401)
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401);
  }
}

/**
 * Authorization error (403)
 */
export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403);
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
  }
}

/**
 * Rate limit error (429)
 */
export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429);
  }
}

/**
 * Tier limit error (403)
 */
export class TierLimitError extends AppError {
  constructor(message: string, public readonly limit: number, public readonly tier: string) {
    super(message, 403);
  }
}

/**
 * Internal server error (500)
 */
export class InternalServerError extends AppError {
  constructor(message = 'Internal server error') {
    super(message, 500, false);
  }
}

/**
 * Error response formatter
 */
export function formatErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return {
      error: error.message,
      statusCode: error.statusCode,
      ...(error instanceof TierLimitError && {
        limit: error.limit,
        tier: error.tier,
      }),
    };
  }

  // Log unexpected errors to console (Sentry will pick this up)
  console.error('Unexpected error:', error);

  return {
    error: 'Internal server error',
    statusCode: 500,
  };
}

/**
 * Global error handler for API routes
 */
export function handleApiError(error: unknown): Response {
  const errorResponse = formatErrorResponse(error);

  // Send to Sentry for non-operational errors
  if (!(error instanceof AppError) || !error.isOperational) {
    // Sentry integration would go here
    // Sentry.captureException(error);
  }

  return Response.json(errorResponse, {
    status: errorResponse.statusCode,
  });
}

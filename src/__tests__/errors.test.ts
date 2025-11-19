/**
 * Error Handling Unit Tests
 *
 * Tests for custom error classes and error handling utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  TierLimitError,
  InternalServerError,
  formatErrorResponse,
} from '@/lib/errors';

describe('Error Classes', () => {
  it('should create AppError with correct properties', () => {
    const error = new AppError('Test error', 418);
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(418);
    expect(error.isOperational).toBe(true);
    expect(error.name).toBe('AppError');
  });

  it('should create ValidationError with 400 status', () => {
    const error = new ValidationError('Invalid input');
    expect(error.message).toBe('Invalid input');
    expect(error.statusCode).toBe(400);
    expect(error.isOperational).toBe(true);
  });

  it('should create AuthenticationError with 401 status', () => {
    const error = new AuthenticationError();
    expect(error.message).toBe('Authentication required');
    expect(error.statusCode).toBe(401);
  });

  it('should create AuthorizationError with 403 status', () => {
    const error = new AuthorizationError('No access');
    expect(error.message).toBe('No access');
    expect(error.statusCode).toBe(403);
  });

  it('should create NotFoundError with 404 status', () => {
    const error = new NotFoundError('Resource missing');
    expect(error.message).toBe('Resource missing');
    expect(error.statusCode).toBe(404);
  });

  it('should create RateLimitError with 429 status', () => {
    const error = new RateLimitError();
    expect(error.message).toBe('Rate limit exceeded');
    expect(error.statusCode).toBe(429);
  });

  it('should create TierLimitError with limit and tier info', () => {
    const error = new TierLimitError('Limit reached', 10, 'free');
    expect(error.message).toBe('Limit reached');
    expect(error.statusCode).toBe(403);
    expect(error.limit).toBe(10);
    expect(error.tier).toBe('free');
  });

  it('should create InternalServerError with 500 status', () => {
    const error = new InternalServerError();
    expect(error.message).toBe('Internal server error');
    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(false);
  });
});

describe('formatErrorResponse', () => {
  it('should format AppError correctly', () => {
    const error = new ValidationError('Bad data');
    const response = formatErrorResponse(error);

    expect(response).toEqual({
      error: 'Bad data',
      statusCode: 400,
    });
  });

  it('should format TierLimitError with extra fields', () => {
    const error = new TierLimitError('Limit reached', 10, 'free');
    const response = formatErrorResponse(error);

    expect(response).toEqual({
      error: 'Limit reached',
      statusCode: 403,
      limit: 10,
      tier: 'free',
    });
  });

  it('should format unknown errors as 500', () => {
    const error = new Error('Something broke');
    const response = formatErrorResponse(error);

    expect(response).toEqual({
      error: 'Internal server error',
      statusCode: 500,
    });
  });

  it('should handle non-Error objects', () => {
    const response = formatErrorResponse('string error');

    expect(response).toEqual({
      error: 'Internal server error',
      statusCode: 500,
    });
  });
});

describe('Error Stack Traces', () => {
  it('should capture stack trace for AppError', () => {
    const error = new AppError('Test', 500);
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('AppError');
  });

  it('should have correct error name', () => {
    const validation = new ValidationError();
    const auth = new AuthenticationError();
    const notFound = new NotFoundError();

    expect(validation.name).toBe('ValidationError');
    expect(auth.name).toBe('AuthenticationError');
    expect(notFound.name).toBe('NotFoundError');
  });
});

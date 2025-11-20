import * as Sentry from '@sentry/nextjs';

/**
 * Manual Sentry instrumentation utilities
 * Use these wrappers to trace specific operations (API routes, server actions, background jobs)
 */

/**
 * Wrap a server-side function with Sentry transaction tracking
 *
 * @example
 * ```ts
 * export async function GET() {
 *   return withServerTrace('api.watchlist.get', async () => {
 *     // your logic
 *   });
 * }
 * ```
 */
export async function withServerTrace<T>(
  name: string,
  fn: () => Promise<T>,
  options?: Partial<Parameters<typeof Sentry.startSpan>[0]>
): Promise<T> {
  return Sentry.startSpan(
    {
      name,
      op: 'function',
      ...(options || {}),
    },
    fn
  );
}

/**
 * Create a child span for a specific operation within a transaction
 * Useful for tracking individual database queries, API calls, etc.
 *
 * @example
 * ```ts
 * await withSpan('db.query.users', async () => {
 *   return await db.query.users.findMany();
 * });
 * ```
 */
export async function withSpan<T>(
  name: string,
  fn: () => Promise<T>,
  options?: Partial<Parameters<typeof Sentry.startSpan>[0]>
): Promise<T> {
  return Sentry.startSpan(
    {
      name,
      op: 'db.query',
      ...(options || {}),
    },
    fn
  );
}

/**
 * Manually capture an exception with additional context
 *
 * @example
 * ```ts
 * try {
 *   await processPayment();
 * } catch (error) {
 *   captureException(error, { userId, amount });
 *   throw error;
 * }
 * ```
 */
export function captureException(
  error: Error,
  context?: Record<string, unknown>
): void {
  Sentry.withScope((scope: any) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
    }
    Sentry.captureException(error);
  });
}

/**
 * Set user context for error tracking
 * Call this after authentication to attach user info to all future errors
 *
 * @example
 * ```ts
 * setUser({ id: session.userId, email: session.email });
 * ```
 */
export function setUser(user: { id: string; email?: string; username?: string }): void {
  Sentry.setUser(user);
}

/**
 * Clear user context (e.g., on logout)
 */
export function clearUser(): void {
  Sentry.setUser(null);
}

/**
 * Add breadcrumbs for debugging
 * Breadcrumbs are logged events that lead up to an error
 *
 * @example
 * ```ts
 * addBreadcrumb('user.action', { action: 'clicked_subscribe' });
 * ```
 */
export function addBreadcrumb(
  message: string,
  data?: Record<string, unknown>
): void {
  Sentry.addBreadcrumb({
    message,
    data,
    level: 'info',
  });
}

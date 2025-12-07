/**
 * API Versioning for tRPC
 *
 * Implements header-based versioning with backward compatibility
 * and deprecation warnings for gradual migration.
 *
 * @see API Infrastructure Blueprint v1.0
 */

import { NextRequest } from 'next/server';
import * as Sentry from '@sentry/nextjs';

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Supported API versions
 */
export const API_VERSIONS = ['v1', 'v2'] as const;
export type ApiVersion = (typeof API_VERSIONS)[number];

/**
 * Current API version (latest stable)
 */
export const CURRENT_API_VERSION: ApiVersion = 'v1';

/**
 * Default API version if none specified
 */
export const DEFAULT_API_VERSION: ApiVersion = 'v1';

/**
 * Deprecated versions with sunset dates
 */
export const DEPRECATED_VERSIONS: Record<ApiVersion, { sunsetDate: Date; message: string } | null> = {
  v1: null, // Currently stable
  v2: null, // Future version
};

/**
 * Version header name
 */
export const VERSION_HEADER = 'x-api-version';

/**
 * Deprecation warning header
 */
export const DEPRECATION_HEADER = 'x-api-deprecation';

// =============================================================================
// VERSION RESOLUTION
// =============================================================================

/**
 * Version resolution result
 */
export interface VersionResolution {
  version: ApiVersion;
  isDeprecated: boolean;
  sunsetDate?: Date;
  deprecationMessage?: string;
  source: 'header' | 'query' | 'default';
}

/**
 * Extract API version from request
 *
 * Priority:
 * 1. X-API-Version header
 * 2. ?version query parameter
 * 3. Default version
 */
export function resolveApiVersion(req: NextRequest): VersionResolution {
  // Try header first
  const headerVersion = req.headers.get(VERSION_HEADER);
  if (headerVersion && isValidVersion(headerVersion)) {
    return buildResolution(headerVersion as ApiVersion, 'header');
  }

  // Try query parameter
  const queryVersion = req.nextUrl.searchParams.get('version');
  if (queryVersion && isValidVersion(queryVersion)) {
    return buildResolution(queryVersion as ApiVersion, 'query');
  }

  // Default version
  return buildResolution(DEFAULT_API_VERSION, 'default');
}

/**
 * Check if version string is valid
 */
function isValidVersion(version: string): boolean {
  return API_VERSIONS.includes(version as ApiVersion);
}

/**
 * Build version resolution with deprecation info
 */
function buildResolution(
  version: ApiVersion,
  source: 'header' | 'query' | 'default'
): VersionResolution {
  const deprecation = DEPRECATED_VERSIONS[version];

  return {
    version,
    isDeprecated: deprecation !== null,
    sunsetDate: deprecation?.sunsetDate,
    deprecationMessage: deprecation?.message,
    source,
  };
}

// =============================================================================
// VERSION ROUTING
// =============================================================================

/**
 * Version-aware route handler wrapper
 *
 * @example
 * ```typescript
 * export const POST = withApiVersion({
 *   v1: handleV1Request,
 *   v2: handleV2Request,
 * });
 * ```
 */
export function withApiVersion<T>(
  handlers: Partial<Record<ApiVersion, (req: NextRequest) => Promise<T>>>
): (req: NextRequest) => Promise<T | Response> {
  return async (req: NextRequest) => {
    const resolution = resolveApiVersion(req);

    // Log deprecated version usage
    if (resolution.isDeprecated) {
      Sentry.addBreadcrumb({
        category: 'api.version',
        message: `Deprecated API version used: ${resolution.version}`,
        level: 'warning',
        data: {
          version: resolution.version,
          source: resolution.source,
          sunsetDate: resolution.sunsetDate?.toISOString(),
        },
      });
    }

    // Find handler for version
    const handler = handlers[resolution.version];

    if (!handler) {
      // Try to fallback to lower version
      const fallbackVersion = findFallbackVersion(resolution.version, handlers);

      if (fallbackVersion && handlers[fallbackVersion]) {
        const result = await handlers[fallbackVersion]!(req);
        return result;
      }

      // No handler available
      return new Response(
        JSON.stringify({
          error: 'Unsupported API version',
          message: `API version ${resolution.version} is not supported for this endpoint`,
          supportedVersions: Object.keys(handlers),
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            [VERSION_HEADER]: resolution.version,
          },
        }
      );
    }

    // Execute handler and add version headers to response
    const result = await handler(req);

    // If result is a Response, add headers
    if (result instanceof Response) {
      const headers = new Headers(result.headers);
      headers.set(VERSION_HEADER, resolution.version);

      if (resolution.isDeprecated && resolution.sunsetDate) {
        headers.set(
          DEPRECATION_HEADER,
          `This API version will be sunset on ${resolution.sunsetDate.toISOString()}`
        );
      }

      return new Response(result.body, {
        status: result.status,
        statusText: result.statusText,
        headers,
      });
    }

    return result;
  };
}

/**
 * Find fallback version (try lower versions)
 */
function findFallbackVersion(
  requestedVersion: ApiVersion,
  handlers: Partial<Record<ApiVersion, unknown>>
): ApiVersion | null {
  const versionIndex = API_VERSIONS.indexOf(requestedVersion);

  // Try each lower version
  for (let i = versionIndex - 1; i >= 0; i--) {
    const version = API_VERSIONS[i];
    if (handlers[version]) {
      return version;
    }
  }

  return null;
}

// =============================================================================
// TRPC VERSION CONTEXT
// =============================================================================

/**
 * API version context for tRPC procedures
 */
export interface ApiVersionContext {
  version: ApiVersion;
  isDeprecated: boolean;
  sunsetDate?: Date;
}

/**
 * Create version context from request headers
 */
export function createVersionContext(headers: Headers): ApiVersionContext {
  const headerVersion = headers.get(VERSION_HEADER);
  let version: ApiVersion = DEFAULT_API_VERSION;

  if (headerVersion && isValidVersion(headerVersion)) {
    version = headerVersion as ApiVersion;
  }

  const deprecation = DEPRECATED_VERSIONS[version];

  return {
    version,
    isDeprecated: deprecation !== null,
    sunsetDate: deprecation?.sunsetDate,
  };
}

// =============================================================================
// VERSION COMPATIBILITY
// =============================================================================

/**
 * Version compatibility result
 */
export interface VersionCompatibility {
  compatible: boolean;
  requiredVersion?: ApiVersion;
  message?: string;
}

/**
 * Check if a feature is available in the requested version
 *
 * @param requestedVersion - The API version from the request
 * @param minimumVersion - Minimum version required for the feature
 * @param featureName - Name of the feature (for error messages)
 */
export function checkVersionCompatibility(
  requestedVersion: ApiVersion,
  minimumVersion: ApiVersion,
  featureName: string
): VersionCompatibility {
  const requestedIndex = API_VERSIONS.indexOf(requestedVersion);
  const minimumIndex = API_VERSIONS.indexOf(minimumVersion);

  if (requestedIndex < minimumIndex) {
    return {
      compatible: false,
      requiredVersion: minimumVersion,
      message: `Feature "${featureName}" requires API version ${minimumVersion} or later. You are using ${requestedVersion}.`,
    };
  }

  return { compatible: true };
}

// =============================================================================
// RESPONSE TRANSFORMERS
// =============================================================================

/**
 * Version-specific response transformer
 *
 * Use this to transform responses between API versions while
 * maintaining backward compatibility.
 */
export type ResponseTransformer<TInput, TOutput> = (
  data: TInput,
  version: ApiVersion
) => TOutput;

/**
 * Create a versioned response transformer
 *
 * @example
 * ```typescript
 * const transformUser = createVersionedTransformer({
 *   v1: (user) => ({ id: user.id, name: user.name }),
 *   v2: (user) => ({ id: user.id, fullName: user.name, createdAt: user.createdAt }),
 * });
 * ```
 */
export function createVersionedTransformer<TInput, TOutput>(
  transformers: Partial<Record<ApiVersion, (data: TInput) => TOutput>>
): ResponseTransformer<TInput, TOutput> {
  return (data: TInput, version: ApiVersion): TOutput => {
    const transformer = transformers[version];

    if (transformer) {
      return transformer(data);
    }

    // Find nearest lower version transformer
    const versionIndex = API_VERSIONS.indexOf(version);
    for (let i = versionIndex - 1; i >= 0; i--) {
      const fallbackVersion = API_VERSIONS[i];
      if (transformers[fallbackVersion]) {
        return transformers[fallbackVersion]!(data);
      }
    }

    // No transformer found, return as-is
    return data as unknown as TOutput;
  };
}

// =============================================================================
// DEPRECATION UTILITIES
// =============================================================================

/**
 * Mark a version as deprecated
 *
 * @param version - Version to deprecate
 * @param sunsetDate - Date when version will be removed
 * @param message - Deprecation message
 */
export function deprecateVersion(
  version: ApiVersion,
  sunsetDate: Date,
  message: string
): void {
  (DEPRECATED_VERSIONS as Record<ApiVersion, { sunsetDate: Date; message: string } | null>)[version] = {
    sunsetDate,
    message,
  };
}

/**
 * Get deprecation headers for response
 */
export function getDeprecationHeaders(version: ApiVersion): Record<string, string> {
  const deprecation = DEPRECATED_VERSIONS[version];

  if (!deprecation) {
    return {};
  }

  return {
    [DEPRECATION_HEADER]: deprecation.message,
    'Sunset': deprecation.sunsetDate.toUTCString(),
  };
}

/**
 * Log deprecated version usage
 */
export function logDeprecatedUsage(
  version: ApiVersion,
  endpoint: string,
  userId?: string
): void {
  const deprecation = DEPRECATED_VERSIONS[version];

  if (!deprecation) return;

  Sentry.captureMessage('Deprecated API version usage', {
    level: 'info',
    tags: {
      apiVersion: version,
      endpoint,
    },
    extra: {
      userId,
      sunsetDate: deprecation.sunsetDate.toISOString(),
      daysUntilSunset: Math.ceil(
        (deprecation.sunsetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ),
    },
  });
}

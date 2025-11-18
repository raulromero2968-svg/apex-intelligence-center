/**
 * MAKER Framework Utilities
 *
 * Core utility functions for deterministic hashing and result comparison.
 */

import crypto from 'crypto';

/**
 * Generate a deterministic JSON string representation
 *
 * Sorts object keys recursively to ensure consistent hashing across
 * equivalent objects regardless of key order.
 *
 * @param obj - Object to stringify deterministically
 * @returns Deterministic JSON string
 */
export function deterministicStringify(obj: unknown): string {
  if (obj === null || obj === undefined) {
    return 'null';
  }

  if (typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return '[' + obj.map(deterministicStringify).join(',') + ']';
  }

  const keys = Object.keys(obj as object).sort();
  const parts = keys.map((key) => {
    const value = (obj as Record<string, unknown>)[key];
    return `"${key}":${deterministicStringify(value)}`;
  });

  return '{' + parts.join(',') + '}';
}

/**
 * Hash a result using SHA-256
 *
 * Used by the MAKER voting mechanism to identify equivalent results.
 *
 * @param result - Result to hash
 * @returns SHA-256 hex digest
 */
export function hashResult(result: unknown): string {
  const stringified = deterministicStringify(result);
  return crypto.createHash('sha256').update(stringified).digest('hex');
}

/**
 * Generate a unique ID for database records
 *
 * Uses crypto.randomUUID() for compatibility.
 */
export function generateId(prefix?: string): string {
  const id = crypto.randomUUID();
  return prefix ? `${prefix}_${id}` : id;
}

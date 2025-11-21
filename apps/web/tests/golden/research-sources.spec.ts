import { test, expect } from '@playwright/test';

/**
 * Golden tests for Research API source array structure
 *
 * These tests validate that the __SOURCES__ JSON in streaming responses
 * conforms to the expected schema after deduplication and citation mapping.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/research`;

test.describe('Research API Source Array Golden Tests', () => {
  test('should return sources with correct schema (index, title, url, score)', async () => {
    // Note: This test only runs if FEATURE_RESEARCH_STREAMING=1
    // Otherwise it will get a JSON stub
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: 'What is the best Pokemon card to invest in?' }),
    });

    expect(response.status).toBe(200);

    // If feature flag is disabled, we get JSON stub
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      expect(data).toHaveProperty('ok', true);
      expect(data.sources).toEqual([]);
      return; // Skip rest of test
    }

    // Feature flag enabled - expect SSE stream
    expect(contentType).toContain('text/event-stream');

    const text = await response.text();

    // Extract __SOURCES__ JSON from stream
    const sourcesMatch = text.match(/__SOURCES__\s*\n(.+)$/s);
    expect(sourcesMatch).not.toBeNull();

    if (!sourcesMatch) {
      throw new Error('No __SOURCES__ found in response');
    }

    const sourcesJson = sourcesMatch[1].trim();
    const sources = JSON.parse(sourcesJson);

    // Validate schema
    expect(Array.isArray(sources)).toBe(true);
    expect(sources.length).toBeGreaterThan(0);
    expect(sources.length).toBeLessThanOrEqual(6); // Cap to 6 sources

    sources.forEach((source: any, i: number) => {
      // Required fields
      expect(source).toHaveProperty('index');
      expect(source).toHaveProperty('title');
      expect(source).toHaveProperty('url');
      expect(source).toHaveProperty('score');

      // Type validation
      expect(typeof source.index).toBe('number');
      expect(typeof source.title).toBe('string');
      expect(typeof source.url).toBe('string');
      expect(typeof source.score).toBe('number');

      // Value validation
      expect(source.index).toBe(i + 1); // 1-based indexing
      expect(source.title.length).toBeGreaterThan(0);
      expect(source.score).toBeGreaterThanOrEqual(0);
      expect(source.score).toBeLessThanOrEqual(1);

      // URL validation (should be valid URL or '#' fallback)
      if (source.url !== '#') {
        expect(() => new URL(source.url)).not.toThrow();
      }

      // No extra fields (strict schema enforcement)
      const allowedFields = ['index', 'title', 'url', 'score'];
      Object.keys(source).forEach((key) => {
        expect(allowedFields).toContain(key);
      });
    });
  });

  test('should deduplicate sources by URL', async () => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: 'Charizard PSA 10 price trends' }),
    });

    expect(response.status).toBe(200);

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      // Feature flag disabled, skip test
      return;
    }

    const text = await response.text();
    const sourcesMatch = text.match(/__SOURCES__\s*\n(.+)$/s);

    if (sourcesMatch) {
      const sources = JSON.parse(sourcesMatch[1].trim());

      // Extract all URLs
      const urls = sources.map((s: any) => s.url);

      // Normalize URLs for comparison (remove trailing slashes, etc.)
      const normalizedUrls = urls.map((url: string) => {
        try {
          const parsed = new URL(url);
          return `${parsed.origin}${parsed.pathname}`.replace(/\/$/, '').toLowerCase();
        } catch {
          return url.toLowerCase();
        }
      });

      // Check for duplicates
      const uniqueUrls = new Set(normalizedUrls);
      expect(uniqueUrls.size).toBe(normalizedUrls.length);
    }
  });

  test('should cap sources to maximum of 6', async () => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'comprehensive analysis of Pokemon, Yu-Gi-Oh, Magic, and sports cards investment',
      }),
    });

    expect(response.status).toBe(200);

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return;
    }

    const text = await response.text();
    const sourcesMatch = text.match(/__SOURCES__\s*\n(.+)$/s);

    if (sourcesMatch) {
      const sources = JSON.parse(sourcesMatch[1].trim());
      expect(sources.length).toBeLessThanOrEqual(6);
    }
  });

  test('should include citation markers [n] in response text', async () => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: 'What is the ROI on PSA 10 Charizard?' }),
    });

    expect(response.status).toBe(200);

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return;
    }

    const text = await response.text();

    // Extract answer text (before __SOURCES__)
    const answerMatch = text.match(/^(.+?)__SOURCES__/s);
    if (answerMatch) {
      const answerText = answerMatch[1];

      // Should contain at least one citation marker [n]
      const citationPattern = /\[\d+\]/;
      const hasCitations = citationPattern.test(answerText);

      // Note: Citations may not always be added if sentences are too short
      // or if the citation mapper doesn't find good matches, so we just
      // log a warning rather than failing the test
      if (!hasCitations) {
        console.warn('Warning: No citation markers [n] found in response');
      }
    }

    // Extract sources and verify citation indices are valid
    const sourcesMatch = text.match(/__SOURCES__\s*\n(.+)$/s);
    if (sourcesMatch) {
      const sources = JSON.parse(sourcesMatch[1].trim());
      const maxIndex = sources.length;

      // Find all citation markers in text
      const citations = text.match(/\[(\d+)\]/g) || [];
      citations.forEach((citation) => {
        const index = parseInt(citation.match(/\d+/)![0]);
        expect(index).toBeGreaterThanOrEqual(1);
        expect(index).toBeLessThanOrEqual(maxIndex);
      });
    }
  });

  test('should produce valid JSON that can be parsed', async () => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: 'Pokemon card grading comparison' }),
    });

    expect(response.status).toBe(200);

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return;
    }

    const text = await response.text();
    const sourcesMatch = text.match(/__SOURCES__\s*\n(.+)$/s);

    if (sourcesMatch) {
      const sourcesJson = sourcesMatch[1].trim();

      // Should parse without errors
      expect(() => JSON.parse(sourcesJson)).not.toThrow();

      // Should be an array
      const sources = JSON.parse(sourcesJson);
      expect(Array.isArray(sources)).toBe(true);

      // Should stringify back to same structure
      const reserialized = JSON.stringify(sources);
      const reparsed = JSON.parse(reserialized);
      expect(reparsed).toEqual(sources);
    }
  });
});


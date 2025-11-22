import { test, expect } from '@playwright/test';
import { deduplicateSources, formatSourcesForOutput, type RerankedResult } from '@/rag';

test.describe('Source Deduplication', () => {
  test('should remove exact URL duplicates', () => {
    const sources: RerankedResult[] = [
      {
        id: '1',
        content: 'Content 1',
        metadata: { source_url: 'https://example.com/page1', title: 'Title 1' },
        score: 0.9,
        source_type: 'ebay',
        created_at: new Date(),
        rerankScore: 0.9,
        originalScore: 0.8,
      },
      {
        id: '2',
        content: 'Content 2',
        metadata: { source_url: 'https://example.com/page1/', title: 'Title 1 Duplicate' },
        score: 0.85,
        source_type: 'ebay',
        created_at: new Date(),
        rerankScore: 0.85,
        originalScore: 0.75,
      },
      {
        id: '3',
        content: 'Content 3',
        metadata: { source_url: 'https://example.com/page2', title: 'Title 2' },
        score: 0.8,
        source_type: 'justtcg',
        created_at: new Date(),
        rerankScore: 0.8,
        originalScore: 0.7,
      },
    ];

    const deduped = deduplicateSources(sources, 6);

    // Should keep only 2 sources (1 and 3, as 2 is duplicate of 1)
    expect(deduped.length).toBe(2);
    expect(deduped[0].id).toBe('1');
    expect(deduped[1].id).toBe('3');
  });

  test('should remove near-duplicates by title+domain', () => {
    const sources: RerankedResult[] = [
      {
        id: '1',
        content: 'Content 1',
        metadata: {
          source_url: 'https://example.com/article1',
          title: 'The Best Pokemon Cards to Invest In',
        },
        score: 0.9,
        source_type: 'blog',
        created_at: new Date(),
        rerankScore: 0.9,
        originalScore: 0.8,
      },
      {
        id: '2',
        content: 'Content 2',
        metadata: {
          source_url: 'https://example.com/article2',
          title: 'Best Pokemon Cards to Invest In',
        },
        score: 0.85,
        source_type: 'blog',
        created_at: new Date(),
        rerankScore: 0.85,
        originalScore: 0.75,
      },
      {
        id: '3',
        content: 'Content 3',
        metadata: {
          source_url: 'https://different.com/page1',
          title: 'Best Pokemon Cards to Invest In',
        },
        score: 0.8,
        source_type: 'blog',
        created_at: new Date(),
        rerankScore: 0.8,
        originalScore: 0.7,
      },
    ];

    const deduped = deduplicateSources(sources, 6, 0.8);

    // Should keep source 1 and 3 (different domains), but remove 2 (same domain + similar title)
    expect(deduped.length).toBe(2);
    expect(deduped[0].id).toBe('1');
    expect(deduped[1].id).toBe('3');
  });

  test('should cap sources to maxSources', () => {
    const sources: RerankedResult[] = Array.from({ length: 10 }, (_, i) => ({
      id: `${i + 1}`,
      content: `Content ${i + 1}`,
      metadata: {
        source_url: `https://example${i}.com/page`,
        title: `Unique Title ${i + 1}`,
      },
      score: 0.9 - i * 0.05,
      source_type: 'blog',
      created_at: new Date(),
      rerankScore: 0.9 - i * 0.05,
      originalScore: 0.8 - i * 0.05,
    }));

    const deduped = deduplicateSources(sources, 6);

    // Should cap at 6 sources
    expect(deduped.length).toBe(6);
    // Should preserve order (highest scores first)
    expect(deduped[0].id).toBe('1');
    expect(deduped[5].id).toBe('6');
  });

  test('should handle sources without URLs gracefully', () => {
    const sources: RerankedResult[] = [
      {
        id: '1',
        content: 'Content 1',
        metadata: { title: 'Title 1' },
        score: 0.9,
        source_type: 'blog',
        created_at: new Date(),
        rerankScore: 0.9,
        originalScore: 0.8,
      },
      {
        id: '2',
        content: 'Content 2',
        metadata: { title: 'Title 2' },
        score: 0.85,
        source_type: 'blog',
        created_at: new Date(),
        rerankScore: 0.85,
        originalScore: 0.75,
      },
    ];

    const deduped = deduplicateSources(sources, 6);

    // Should handle missing URLs without crashing
    expect(deduped.length).toBe(2);
  });

  test('should preserve sources with different titles on same domain', () => {
    const sources: RerankedResult[] = [
      {
        id: '1',
        content: 'Content 1',
        metadata: {
          source_url: 'https://example.com/article1',
          title: 'Pokemon Card Investment Guide',
        },
        score: 0.9,
        source_type: 'blog',
        created_at: new Date(),
        rerankScore: 0.9,
        originalScore: 0.8,
      },
      {
        id: '2',
        content: 'Content 2',
        metadata: {
          source_url: 'https://example.com/article2',
          title: 'CGC Black Label Premium Analysis',
        },
        score: 0.85,
        source_type: 'blog',
        created_at: new Date(),
        rerankScore: 0.85,
        originalScore: 0.75,
      },
    ];

    const deduped = deduplicateSources(sources, 6, 0.8);

    // Should keep both (different titles)
    expect(deduped.length).toBe(2);
  });
});

test.describe('Source Output Formatting', () => {
  test('should format sources with correct schema', () => {
    const sources: RerankedResult[] = [
      {
        id: '1',
        content: 'Content 1',
        metadata: {
          source_url: 'https://example.com/page1',
          title: 'Test Title',
        },
        score: 0.9,
        source_type: 'ebay',
        created_at: new Date(),
        rerankScore: 0.95,
        originalScore: 0.8,
      },
      {
        id: '2',
        content: 'Content 2',
        metadata: {
          source_url: 'https://example.com/page2',
          card_name: 'Charizard',
        },
        score: 0.8,
        source_type: 'justtcg',
        created_at: new Date(),
        rerankScore: 0.75,
        originalScore: 0.7,
      },
    ];

    const formatted = formatSourcesForOutput(sources);

    // Verify schema
    expect(formatted.length).toBe(2);
    expect(formatted[0]).toEqual({
      index: 1,
      title: 'Test Title',
      url: 'https://example.com/page1',
      score: 0.95,
    });
    expect(formatted[1]).toEqual({
      index: 2,
      title: 'Charizard', // Falls back to card_name
      url: 'https://example.com/page2',
      score: 0.75,
    });
  });

  test('should normalize scores to 0..1 range', () => {
    const sources: RerankedResult[] = [
      {
        id: '1',
        content: 'Content 1',
        metadata: { source_url: 'https://example.com/page1', title: 'Title 1' },
        score: 0.9,
        source_type: 'ebay',
        created_at: new Date(),
        rerankScore: 1.5, // Out of range (too high)
        originalScore: 0.8,
      },
      {
        id: '2',
        content: 'Content 2',
        metadata: { source_url: 'https://example.com/page2', title: 'Title 2' },
        score: 0.8,
        source_type: 'justtcg',
        created_at: new Date(),
        rerankScore: -0.1, // Out of range (too low)
        originalScore: 0.7,
      },
    ];

    const formatted = formatSourcesForOutput(sources);

    // Scores should be clamped to 0..1
    expect(formatted[0].score).toBe(1);
    expect(formatted[1].score).toBe(0);
  });

  test('should use fallback values for missing metadata', () => {
    const sources: RerankedResult[] = [
      {
        id: '1',
        content: 'Content 1',
        metadata: {}, // No title or URL
        score: 0.9,
        source_type: 'ebay',
        created_at: new Date(),
        rerankScore: 0.9,
        originalScore: 0.8,
      },
    ];

    const formatted = formatSourcesForOutput(sources);

    expect(formatted[0]).toEqual({
      index: 1,
      title: 'Market Data', // Fallback
      url: '#', // Fallback
      score: 0.9,
    });
  });

  test('should return valid JSON structure for __SOURCES__', () => {
    const sources: RerankedResult[] = [
      {
        id: '1',
        content: 'Content 1',
        metadata: {
          source_url: 'https://example.com/page1',
          title: 'Test Title',
        },
        score: 0.9,
        source_type: 'ebay',
        created_at: new Date(),
        rerankScore: 0.95,
        originalScore: 0.8,
      },
    ];

    const formatted = formatSourcesForOutput(sources);
    const jsonString = JSON.stringify(formatted);
    const parsed = JSON.parse(jsonString);

    // Should be valid JSON with correct structure
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0]).toHaveProperty('index');
    expect(parsed[0]).toHaveProperty('title');
    expect(parsed[0]).toHaveProperty('url');
    expect(parsed[0]).toHaveProperty('score');
    expect(typeof parsed[0].index).toBe('number');
    expect(typeof parsed[0].title).toBe('string');
    expect(typeof parsed[0].url).toBe('string');
    expect(typeof parsed[0].score).toBe('number');
  });
});

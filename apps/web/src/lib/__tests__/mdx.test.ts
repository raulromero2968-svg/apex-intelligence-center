/**
 * MDX Utility Unit Tests
 *
 * Tests for the MDX parsing and blog post functions:
 * - getPostBySlug: Correctly parses individual posts
 * - getAllPosts: Returns sorted posts (newest first)
 * - calculateReadTime: Accurate reading time calculation
 *
 * @see lib/mdx.ts
 * @see Core Values: Trust-First Blog Engine
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'path';

// ============================================================================
// Mocks
// ============================================================================

// Mock file system
const mockFiles: Record<string, string> = {};

vi.mock('fs/promises', () => ({
  readFile: vi.fn(async (filePath: string) => {
    const normalizedPath = filePath.toString();
    if (mockFiles[normalizedPath]) {
      return mockFiles[normalizedPath];
    }
    const error = new Error(`ENOENT: no such file or directory, open '${normalizedPath}'`);
    (error as NodeJS.ErrnoException).code = 'ENOENT';
    throw error;
  }),
  readdir: vi.fn(async (dirPath: string) => {
    const normalizedPath = dirPath.toString();
    // Return files that exist in the mock for this directory
    const filesInDir: string[] = [];
    for (const key of Object.keys(mockFiles)) {
      if (key.startsWith(normalizedPath)) {
        const relativePath = key.slice(normalizedPath.length + 1);
        const fileName = relativePath.split('/')[0];
        if (fileName && !filesInDir.includes(fileName)) {
          filesInDir.push(fileName);
        }
      }
    }
    return filesInDir;
  }),
}));

// Mock next-mdx-remote/rsc
vi.mock('next-mdx-remote/rsc', () => ({
  compileMDX: vi.fn(async ({ source }: { source: string }) => ({
    content: `<mock-mdx>${source.slice(0, 100)}</mock-mdx>`,
    frontmatter: {},
  })),
}));

// ============================================================================
// Test Helpers
// ============================================================================

const createMockMdxFile = (frontmatter: Record<string, any>, content: string) => {
  const fm = Object.entries(frontmatter)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}:\n${value.map((v) => `  - "${v}"`).join('\n')}`;
      }
      if (typeof value === 'string') {
        return `${key}: "${value}"`;
      }
      return `${key}: ${JSON.stringify(value)}`;
    })
    .join('\n');
  return `---\n${fm}\n---\n\n${content}`;
};

const getBlogDirectory = () => {
  return path.join(process.cwd(), '..', '..', 'content', 'blog');
};

// ============================================================================
// Setup
// ============================================================================

beforeEach(() => {
  vi.clearAllMocks();
  // Clear mock files
  Object.keys(mockFiles).forEach((key) => delete mockFiles[key]);
});

afterEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// Tests
// ============================================================================

describe('MDX Utility Functions', () => {
  describe('calculateReadTime', () => {
    it('should calculate reading time based on word count', async () => {
      const { calculateReadTime } = await import('../mdx');

      // 200 words = 1 minute (at 200 wpm)
      const content200 = Array(200).fill('word').join(' ');
      expect(calculateReadTime(content200)).toBe(1);

      // 400 words = 2 minutes
      const content400 = Array(400).fill('word').join(' ');
      expect(calculateReadTime(content400)).toBe(2);

      // 150 words = ceil(0.75) = 1 minute
      const content150 = Array(150).fill('word').join(' ');
      expect(calculateReadTime(content150)).toBe(1);
    });

    it('should handle empty content', async () => {
      const { calculateReadTime } = await import('../mdx');

      expect(calculateReadTime('')).toBe(1); // Min 1 minute
      expect(calculateReadTime('   ')).toBe(1);
    });

    it('should round up to nearest minute', async () => {
      const { calculateReadTime } = await import('../mdx');

      // 201 words = ceil(1.005) = 2 minutes
      const content201 = Array(201).fill('word').join(' ');
      expect(calculateReadTime(content201)).toBe(2);

      // 399 words = ceil(1.995) = 2 minutes
      const content399 = Array(399).fill('word').join(' ');
      expect(calculateReadTime(content399)).toBe(2);
    });
  });

  describe('getAllBlogPostSlugs', () => {
    it('should return empty array when blog directory is empty', async () => {
      const blogDir = getBlogDirectory();

      // Mock empty directory
      const { readdir } = await import('fs/promises');
      vi.mocked(readdir).mockResolvedValueOnce([]);

      const { getAllBlogPostSlugs } = await import('../mdx');
      const slugs = await getAllBlogPostSlugs();

      expect(slugs).toEqual([]);
    });

    it('should only return .mdx file slugs', async () => {
      const blogDir = getBlogDirectory();

      // Mock directory with mixed files
      const { readdir } = await import('fs/promises');
      vi.mocked(readdir).mockResolvedValueOnce([
        'post-one.mdx',
        'post-two.mdx',
        'readme.md',
        'config.json',
        'post-three.mdx',
      ] as any);

      const { getAllBlogPostSlugs } = await import('../mdx');
      const slugs = await getAllBlogPostSlugs();

      expect(slugs).toEqual(['post-one', 'post-two', 'post-three']);
      expect(slugs).not.toContain('readme');
      expect(slugs).not.toContain('config');
    });

    it('should handle directory not found gracefully', async () => {
      const { readdir } = await import('fs/promises');
      const error = new Error('ENOENT');
      (error as NodeJS.ErrnoException).code = 'ENOENT';
      vi.mocked(readdir).mockRejectedValueOnce(error);

      const { getAllBlogPostSlugs } = await import('../mdx');
      const slugs = await getAllBlogPostSlugs();

      expect(slugs).toEqual([]);
    });
  });

  describe('getAllBlogPosts', () => {
    it('should return posts sorted by date (newest first)', async () => {
      const blogDir = getBlogDirectory();

      // Setup mock files
      mockFiles[path.join(blogDir, 'old-post.mdx')] = createMockMdxFile(
        {
          title: 'Old Post',
          description: 'An old post',
          date: '2024-01-01',
          author: 'Apex Team',
        },
        'Old content here'
      );

      mockFiles[path.join(blogDir, 'new-post.mdx')] = createMockMdxFile(
        {
          title: 'New Post',
          description: 'A new post',
          date: '2025-01-15',
          author: 'Apex Team',
        },
        'New content here'
      );

      mockFiles[path.join(blogDir, 'middle-post.mdx')] = createMockMdxFile(
        {
          title: 'Middle Post',
          description: 'A middle post',
          date: '2024-06-15',
          author: 'Apex Team',
        },
        'Middle content here'
      );

      const { readdir } = await import('fs/promises');
      vi.mocked(readdir).mockResolvedValueOnce([
        'old-post.mdx',
        'new-post.mdx',
        'middle-post.mdx',
      ] as any);

      const { getAllBlogPosts } = await import('../mdx');
      const posts = await getAllBlogPosts();

      expect(posts).toHaveLength(3);
      // Should be sorted newest first
      expect(posts[0].slug).toBe('new-post');
      expect(posts[1].slug).toBe('middle-post');
      expect(posts[2].slug).toBe('old-post');
    });

    it('should parse frontmatter correctly', async () => {
      const blogDir = getBlogDirectory();

      mockFiles[path.join(blogDir, 'test-post.mdx')] = createMockMdxFile(
        {
          title: 'Test Post Title',
          description: 'Test description for SEO',
          date: '2025-01-15',
          author: 'Test Author',
          tags: ['market-analysis', 'pokemon', 'investing'],
          hero: '/images/test-hero.png',
        },
        '## Test Content\n\nThis is the test content.'
      );

      const { readdir } = await import('fs/promises');
      vi.mocked(readdir).mockResolvedValueOnce(['test-post.mdx'] as any);

      const { getAllBlogPosts } = await import('../mdx');
      const posts = await getAllBlogPosts();

      expect(posts).toHaveLength(1);
      expect(posts[0].frontmatter).toMatchObject({
        title: 'Test Post Title',
        description: 'Test description for SEO',
        date: '2025-01-15',
        author: 'Test Author',
      });
      expect(posts[0].frontmatter.tags).toContain('pokemon');
    });

    it('should not compile MDX content for listing (performance)', async () => {
      const blogDir = getBlogDirectory();

      mockFiles[path.join(blogDir, 'perf-test.mdx')] = createMockMdxFile(
        {
          title: 'Performance Test',
          description: 'Testing performance',
          date: '2025-01-01',
          author: 'Apex',
        },
        'Content that should not be compiled for listings'
      );

      const { readdir } = await import('fs/promises');
      vi.mocked(readdir).mockResolvedValueOnce(['perf-test.mdx'] as any);

      const { getAllBlogPosts } = await import('../mdx');
      const posts = await getAllBlogPosts();

      expect(posts).toHaveLength(1);
      // Content should be null for listing pages (performance optimization)
      expect(posts[0].content).toBeNull();
    });
  });

  describe('getBlogPostBySlug', () => {
    it('should return null for non-existent post', async () => {
      const { getBlogPostBySlug } = await import('../mdx');
      const post = await getBlogPostBySlug('non-existent-slug');

      expect(post).toBeNull();
    });

    it('should compile MDX content for individual post', async () => {
      const blogDir = getBlogDirectory();

      mockFiles[path.join(blogDir, 'full-post.mdx')] = createMockMdxFile(
        {
          title: 'Full Post',
          description: 'A complete post',
          date: '2025-01-15',
          author: 'Apex Intelligence',
          tags: ['test'],
        },
        '## Introduction\n\nThis is the full content of the post with all the details.'
      );

      const { getBlogPostBySlug } = await import('../mdx');
      const post = await getBlogPostBySlug('full-post');

      expect(post).not.toBeNull();
      expect(post?.slug).toBe('full-post');
      expect(post?.frontmatter.title).toBe('Full Post');
      // Content should be compiled (not null)
      expect(post?.content).toBeDefined();
    });

    it('should parse citationList from frontmatter', async () => {
      const blogDir = getBlogDirectory();

      const citationListYaml = `citationList:
  - id: 1
    name: "eBay Sales Data"
    url: "https://ebay.com/research"
    verified: true
  - id: 2
    name: "PSA Population Report"
    url: "https://psacard.com/pop"`;

      mockFiles[path.join(blogDir, 'cited-post.mdx')] = `---
title: "Post With Citations"
description: "A post with citation sources"
date: "2025-01-15"
author: "Research Team"
${citationListYaml}
---

## Research Findings

According to sales data <Citation id="1" />, prices are up.
`;

      const { getBlogPostBySlug } = await import('../mdx');
      const post = await getBlogPostBySlug('cited-post');

      expect(post).not.toBeNull();
      expect(post?.frontmatter.citationList).toBeDefined();
      expect(post?.frontmatter.citationList).toHaveLength(2);
      expect(post?.frontmatter.citationList[0].name).toBe('eBay Sales Data');
    });
  });

  describe('getArticleBySlug (unified lookup)', () => {
    it('should search articles first, then blog posts', async () => {
      const blogDir = getBlogDirectory();

      // Add a blog post that can be found as fallback
      mockFiles[path.join(blogDir, 'fallback-post.mdx')] = createMockMdxFile(
        {
          title: 'Fallback Blog Post',
          description: 'Found via blog search',
          date: '2025-01-15',
          author: 'Apex',
        },
        'Blog content'
      );

      const { getArticleBySlug } = await import('../mdx');
      const article = await getArticleBySlug('fallback-post');

      // Should find it as a blog post fallback
      expect(article).not.toBeNull();
      expect(article?.frontmatter.title).toBe('Fallback Blog Post');
    });
  });
});

describe('Frontmatter Schema', () => {
  it('should support enhanced frontmatter fields', async () => {
    const blogDir = getBlogDirectory();

    mockFiles[path.join(blogDir, 'enhanced-post.mdx')] = `---
title: "Enhanced Blog Post"
description: "Standard description"
seoDescription: "SEO-optimized description for search engines"
date: "2025-01-15"
author: "Content Team"
authorRole: "Senior Analyst"
authorAvatar: "/avatars/analyst.png"
hero: "/images/hero.png"
tags:
  - "market-analysis"
  - "pokemon"
  - "q1-2025"
citationList:
  - id: 1
    name: "Data Source 1"
    url: "https://example.com/source1"
    publisher: "Market Research Inc"
    accessed: "2025-01-10"
    verified: true
---

## Article Content

This is the main content.
`;

    const { getBlogPostBySlug } = await import('../mdx');
    const post = await getBlogPostBySlug('enhanced-post');

    expect(post).not.toBeNull();
    expect(post?.frontmatter).toMatchObject({
      title: 'Enhanced Blog Post',
      description: 'Standard description',
      seoDescription: 'SEO-optimized description for search engines',
      date: '2025-01-15',
      author: 'Content Team',
      authorRole: 'Senior Analyst',
      authorAvatar: '/avatars/analyst.png',
      hero: '/images/hero.png',
    });
    expect(post?.frontmatter.tags).toContain('market-analysis');
    expect(post?.frontmatter.citationList).toHaveLength(1);
    expect(post?.frontmatter.citationList[0].verified).toBe(true);
  });
});

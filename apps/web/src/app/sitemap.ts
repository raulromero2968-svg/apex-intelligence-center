import { MetadataRoute } from 'next';
import { getAllArticles } from '@/lib/mdx';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://apexintelligence.io';
  const currentDate = new Date();

  // Static routes - merged from both branches
  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/about',
    '/blog',
    '/guides',
    '/insights',
    '/intel',
    '/intelligence',
    '/market',
    '/press',
    '/research',
    '/services',
    '/subscribe',
    '/tools',
    '/tutorial',
    // New routes for AI discoverability and legal
    '/ai/meta',
    '/llms.txt',
    '/security.txt',
    '/humans.txt',
    '/legal/licensing',
    '/legal/terms',
    '/legal/privacy',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: (route === '' ? 'daily' : 'weekly') as 'daily' | 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }));

  // Dynamic routes from MDX articles
  const allArticles = await getAllArticles();

  // Helper function to safely parse dates
  const safeDate = (date?: string | Date): Date => {
    try {
      if (!date) return currentDate;
      const d = new Date(date);
      return isNaN(d.getTime()) ? currentDate : d;
    } catch {
      return currentDate;
    }
  };

  // Filter out drafts and unlisted posts from sitemap
  const articles = allArticles
    .filter(p => !p.frontmatter.draft && !p.frontmatter.unlisted)
    .map(p => {
      const lastModified = safeDate(p.frontmatter.publishedAt || p.frontmatter.date);

      return {
        url: `${baseUrl}/blog/${p.slug}`,
        lastModified,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      };
    });

  return [...staticRoutes, ...articles];
}


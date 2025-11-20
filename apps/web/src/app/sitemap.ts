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

  // Filter out drafts and unlisted posts from sitemap
  const articles = allArticles
    .filter(p => !p.frontmatter.draft && !p.frontmatter.unlisted)
    .map(p => {
      let lastModified = currentDate;
      try {
        if (p.frontmatter.publishedAt) {
          const parsedDate = new Date(p.frontmatter.publishedAt);
          // Validate the date is valid
          if (!isNaN(parsedDate.getTime())) {
            lastModified = parsedDate;
          }
        }
      } catch (error) {
        // If date parsing fails, use currentDate
        console.warn(`Invalid date for article ${p.slug}:`, p.frontmatter.publishedAt);
      }

      return {
        url: `${baseUrl}/blog/${p.slug}`,
        lastModified,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      };
    });

  return [...staticRoutes, ...articles];
}

import { MetadataRoute } from 'next';
import { getAllArticleSlugs } from '@/lib/mdx';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://apexintelligence.io';
  const currentDate = new Date();

  // Static routes - merged from both branches
  const staticRoutes = [
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
    changeFrequency: route === '' ? ('daily' as const) : ('weekly' as const),
    priority: route === '' ? 1.0 : 0.8,
  }));

  // Dynamic blog post routes from MDX content
  const blogSlugs = await getAllArticleSlugs();
  const blogRoutes = blogSlugs.map((slug) => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...blogRoutes];
}

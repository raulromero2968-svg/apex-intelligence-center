import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://apexintelligence.io';
  const currentDate = new Date( );

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

  // TODO: Add dynamic routes from content/articles when MDX content is available
  // This would require reading the content directory or querying the database
  // for blog posts, research articles, intel posts, and insights

  return staticRoutes;
}

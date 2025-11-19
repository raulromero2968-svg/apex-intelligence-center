import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://apex-intelligence.com';
  const currentDate = new Date();

  // Static routes
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
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  // TODO: Add dynamic routes from content/articles when MDX content is available
  // This would require reading the content directory or querying the database
  // for blog posts, research articles, intel posts, and insights

  return [...staticRoutes];
}

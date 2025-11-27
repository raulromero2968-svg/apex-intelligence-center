import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://apex-intelligence.io'

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/intel`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/portfolio`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ]

  // Blog articles
  const articles = [
    'q4-2024-market-analysis',
    'pokemon-151-value-trajectory',
    'graded-vs-raw-2024',
    'lorcana-investment-thesis-2025',
    'japanese-vs-english-tcg-markets',
    'pokemon-151-vs-evolving-skies',
    'vintage-wotc-market-report-q3-2025',
    'one-piece-tcg-2025-outlook',
    'tcg-market-timing-guide',
    'premium-deep-dive-psa-10-blueprint',
  ]

  const articlePages = articles.map((slug) => ({
    url: `${baseUrl}/intel/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticPages, ...articlePages]
}

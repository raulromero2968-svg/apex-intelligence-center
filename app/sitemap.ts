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
  ]

  // Blog articles
  const articles = [
    'q4-2024-market-analysis',
    'pokemon-151-value-trajectory',
    'graded-vs-raw-2024',
    'lorcana-investment-thesis-2025',
    'japanese-vs-english-tcg-markets',
    'pokemon-151-vs-evolving-skies',
  ]

  const articlePages = articles.map((slug) => ({
    url: `${baseUrl}/intel/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Vintage WOTC report
  const vintageReport = {
    url: `${baseUrl}/intel/vintage-wotc-market-report-q3-2025`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }

  return [...staticPages, ...articlePages, vintageReport]
}

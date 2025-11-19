import { Article } from '@/lib/mdx';

interface ArticleSchemaProps {
  article: Article;
  baseUrl?: string;
}

export function ArticleSchema({ article, baseUrl = 'https://apexintelligence.io' }: ArticleSchemaProps) {
  const author = article.frontmatter.author || 'Apex Intelligence Team';

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.frontmatter.title,
    description: article.frontmatter.description || article.frontmatter.tags?.join(', ') || '',
    image: article.frontmatter.heroImage
      ? `${baseUrl}${article.frontmatter.heroImage}`
      : `${baseUrl}/api/og?slug=${article.slug}`,
    datePublished: article.frontmatter.publishedAt,
    dateModified: article.frontmatter.publishedAt,
    author: [
      {
        '@type': 'Person',
        name: author,
        url: `${baseUrl}/about`,
      },
    ],
    publisher: {
      '@type': 'Organization',
      name: 'Apex Intelligence',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo-white.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/blog/${article.slug}`,
    },
    wordCount: article.readingTime?.words,
    timeRequired: article.readingTime?.minutes ? `PT${article.readingTime.minutes}M` : undefined,
    keywords: article.frontmatter.tags?.join(', '),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
    />
  );
}

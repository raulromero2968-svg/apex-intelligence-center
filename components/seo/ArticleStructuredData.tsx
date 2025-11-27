import React from 'react';

interface ArticleStructuredDataProps {
  title: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  author: string;
  image?: string;
  url: string;
}

export function ArticleStructuredData({
  title,
  description,
  datePublished,
  dateModified,
  author,
  image = '/og-image.png',
  url,
}: ArticleStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description,
    image: `https://apex-intelligence.io${image}`,
    datePublished: datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Organization',
      name: author,
      url: 'https://apex-intelligence.io/about',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Apex Intelligence',
      logo: {
        '@type': 'ImageObject',
        url: 'https://apex-intelligence.io/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

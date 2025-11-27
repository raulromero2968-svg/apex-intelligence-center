import { SAME_AS_LINKS } from '@/lib/constants';

/**
 * JSON-LD Structured Data for Organization
 * Includes sameAs links for entity resolution and social profile verification
 */
export function StructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Apex Intelligence',
    url: 'https://apex-intelligence.com',
    logo: 'https://apex-intelligence.com/apex-intelligence-wolf-logo-transparent.png',
    description: 'Institutional-grade TCG market intelligence. Built for speed, accuracy, and edge.',
    sameAs: SAME_AS_LINKS,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}


/**
 * SEO Performance Domain Pack
 *
 * RAG knowledge base for Core Web Vitals and SEO optimization.
 * Implements knowledge-07-seo-performance domain integration.
 *
 * Features:
 * - Core knowledge documents for vitals and SEO
 * - Semantic search across optimization patterns
 * - Prompt templates for LLM-powered assistance
 *
 * @see knowledge-07-seo-performance for architecture details
 */

import { db } from '@/lib/db';
import { eq, ilike, or, and } from 'drizzle-orm';
import {
  seoKnowledge,
  type SeoKnowledge,
  type NewSeoKnowledge,
} from '@/db/schema/seo-performance';

// ============================================================================
// TYPES
// ============================================================================

export type DocumentType =
  | 'concept'
  | 'api_reference'
  | 'code_example'
  | 'best_practice'
  | 'troubleshooting';

export type Category = 'vitals' | 'schema' | 'sitemap' | 'images' | 'fonts' | 'meta' | 'og';

export interface KnowledgeQuery {
  query: string;
  category?: Category;
  documentType?: DocumentType;
  limit?: number;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: string[];
}

// ============================================================================
// CORE KNOWLEDGE DOCUMENTS
// ============================================================================

export const CORE_KNOWLEDGE: Array<Omit<NewSeoKnowledge, 'id' | 'createdAt' | 'updatedAt'>> = [
  {
    title: 'Core Web Vitals Overview',
    content: `Core Web Vitals are Google's metrics for measuring user experience.

## The Three Core Web Vitals

### LCP (Largest Contentful Paint)
- Measures loading performance
- Target: < 2.5 seconds
- Tracks when the largest content element becomes visible

### INP (Interaction to Next Paint)
- Measures interactivity/responsiveness
- Target: < 200 milliseconds
- Replaced FID in March 2024

### CLS (Cumulative Layout Shift)
- Measures visual stability
- Target: < 0.1
- Tracks unexpected layout shifts

## Why They Matter

1. **SEO Ranking Factor**: Google uses vitals in search rankings
2. **User Experience**: Direct correlation with engagement
3. **Conversion Rates**: Faster sites convert better

## Measurement

Use web-vitals library:
\`\`\`typescript
import { onCLS, onINP, onLCP } from 'web-vitals';

onCLS(console.log);
onINP(console.log);
onLCP(console.log);
\`\`\``,
    documentType: 'concept',
    category: 'vitals',
    tags: ['LCP', 'INP', 'CLS', 'performance', 'SEO'],
    relatedTopics: ['images', 'fonts', 'meta'],
    codeExamples: [
      {
        language: 'typescript',
        code: `// Report vitals to analytics
import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/vitals', body);
  }
}

onCLS(sendToAnalytics);
onINP(sendToAnalytics);
onLCP(sendToAnalytics);
onFCP(sendToAnalytics);
onTTFB(sendToAnalytics);`,
        description: 'Report Core Web Vitals to analytics endpoint',
      },
    ],
    nextjsVersion: '14+',
    isVerified: true,
  },
  {
    title: 'Optimizing LCP in Next.js',
    content: `Largest Contentful Paint optimization strategies for Next.js applications.

## Common LCP Elements
- Hero images
- Large text blocks
- Video poster images
- SVG elements

## Optimization Strategies

### 1. Image Optimization
\`\`\`tsx
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority  // Preload LCP image
  placeholder="blur"
  blurDataURL={blurHash}
/>
\`\`\`

### 2. Font Optimization
\`\`\`tsx
// next.config.js
module.exports = {
  optimizeFonts: true,
};

// Use next/font
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'], display: 'swap' });
\`\`\`

### 3. Server-Side Rendering
- Use SSR or SSG for critical content
- Avoid client-side rendering for LCP elements

### 4. Resource Hints
\`\`\`html
<link rel="preload" href="/hero.jpg" as="image" fetchpriority="high" />
<link rel="preconnect" href="https://cdn.example.com" />
\`\`\``,
    documentType: 'best_practice',
    category: 'vitals',
    tags: ['LCP', 'images', 'fonts', 'performance', 'Next.js'],
    relatedTopics: ['images', 'fonts'],
    nextjsVersion: '14+',
    isVerified: true,
  },
  {
    title: 'JSON-LD Structured Data',
    content: `Structured data helps search engines understand your content for rich results.

## What is JSON-LD?
JSON-LD (JavaScript Object Notation for Linked Data) is Google's preferred format for structured data.

## Common Schema Types

### Product
\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "TCG Card",
  "image": "https://example.com/card.jpg",
  "offers": {
    "@type": "Offer",
    "price": "29.99",
    "priceCurrency": "USD"
  }
}
\`\`\`

### Article
\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Article Title",
  "author": { "@type": "Person", "name": "Author" },
  "datePublished": "2024-01-15"
}
\`\`\`

### FAQ
\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "Question?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Answer"
    }
  }]
}
\`\`\`

## In Next.js
\`\`\`tsx
import Script from 'next/script';

export function ProductSchema({ product }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    ...product
  };

  return (
    <Script
      id="product-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
\`\`\``,
    documentType: 'api_reference',
    category: 'schema',
    tags: ['JSON-LD', 'structured-data', 'rich-results', 'schema.org'],
    relatedTopics: ['meta', 'sitemap'],
    nextjsVersion: '14+',
    isVerified: true,
  },
  {
    title: 'Dynamic Sitemaps in Next.js',
    content: `Generate dynamic XML sitemaps for better search engine indexing.

## App Router Sitemap

\`\`\`typescript
// app/sitemap.ts
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch dynamic routes from database
  const products = await getProducts();

  const productUrls = products.map((product) => ({
    url: \`https://example.com/products/\${product.slug}\`,
    lastModified: product.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    {
      url: 'https://example.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...productUrls,
  ];
}
\`\`\`

## Large Sitemaps (Sitemap Index)

\`\`\`typescript
// app/sitemap.ts
export async function generateSitemaps() {
  const totalProducts = await getProductCount();
  const sitemapCount = Math.ceil(totalProducts / 50000);

  return Array.from({ length: sitemapCount }, (_, i) => ({ id: i }));
}

export default async function sitemap({ id }: { id: number }) {
  const products = await getProducts({ offset: id * 50000, limit: 50000 });
  return products.map((p) => ({
    url: \`https://example.com/products/\${p.slug}\`,
    lastModified: p.updatedAt,
  }));
}
\`\`\`

## robots.txt

\`\`\`typescript
// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/'],
    },
    sitemap: 'https://example.com/sitemap.xml',
  };
}
\`\`\``,
    documentType: 'code_example',
    category: 'sitemap',
    tags: ['sitemap', 'SEO', 'indexing', 'robots.txt'],
    relatedTopics: ['schema', 'meta'],
    nextjsVersion: '14+',
    isVerified: true,
  },
  {
    title: 'Next.js Image Optimization',
    content: `Optimize images for performance and Core Web Vitals.

## next/image Component

\`\`\`tsx
import Image from 'next/image';

// Basic usage
<Image
  src="/photo.jpg"
  alt="Description"
  width={800}
  height={600}
/>

// Fill container
<div style={{ position: 'relative', width: '100%', height: '400px' }}>
  <Image
    src="/photo.jpg"
    alt="Description"
    fill
    style={{ objectFit: 'cover' }}
  />
</div>

// Priority for LCP images
<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority
/>
\`\`\`

## Configuration

\`\`\`javascript
// next.config.js
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.example.com' },
    ],
  },
};
\`\`\`

## Best Practices

1. **Always set dimensions** - Prevents CLS
2. **Use priority for LCP** - Preloads critical images
3. **Use placeholder** - Better perceived performance
4. **Lazy load below-fold** - Default behavior
5. **Use modern formats** - AVIF/WebP automatic`,
    documentType: 'best_practice',
    category: 'images',
    tags: ['images', 'optimization', 'LCP', 'CLS', 'next/image'],
    relatedTopics: ['vitals', 'fonts'],
    nextjsVersion: '14+',
    isVerified: true,
  },
  {
    title: 'Font Optimization in Next.js',
    content: `Optimize fonts for performance with next/font.

## next/font/google

\`\`\`tsx
import { Inter, Roboto_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
});

export default function RootLayout({ children }) {
  return (
    <html className={\`\${inter.variable} \${robotoMono.variable}\`}>
      <body>{children}</body>
    </html>
  );
}
\`\`\`

## Local Fonts

\`\`\`tsx
import localFont from 'next/font/local';

const myFont = localFont({
  src: [
    { path: './fonts/Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/Bold.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
});
\`\`\`

## Benefits

1. **Zero layout shift** - Fonts are loaded with fallback sizing
2. **Self-hosted** - Google Fonts are downloaded at build time
3. **Preloaded** - Critical fonts are preloaded automatically
4. **Subsetted** - Only required characters are included`,
    documentType: 'code_example',
    category: 'fonts',
    tags: ['fonts', 'CLS', 'next/font', 'performance'],
    relatedTopics: ['vitals', 'images'],
    nextjsVersion: '14+',
    isVerified: true,
  },
  {
    title: 'Meta Tags and Open Graph',
    content: `Configure meta tags and Open Graph for SEO and social sharing.

## Metadata API

\`\`\`tsx
// app/layout.tsx or app/page.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Apex TCG',
    template: '%s | Apex TCG',
  },
  description: 'TCG market intelligence platform',
  keywords: ['TCG', 'cards', 'trading'],

  // Open Graph
  openGraph: {
    title: 'Apex TCG',
    description: 'TCG market intelligence',
    url: 'https://apex-tcg.com',
    siteName: 'Apex TCG',
    images: [
      {
        url: 'https://apex-tcg.com/og.jpg',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  // Twitter
  twitter: {
    card: 'summary_large_image',
    title: 'Apex TCG',
    description: 'TCG market intelligence',
    images: ['https://apex-tcg.com/og.jpg'],
  },

  // Robots
  robots: {
    index: true,
    follow: true,
  },
};
\`\`\`

## Dynamic Metadata

\`\`\`tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const product = await getProduct(params.id);

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      images: [product.image],
    },
  };
}
\`\`\``,
    documentType: 'api_reference',
    category: 'meta',
    tags: ['meta', 'Open Graph', 'Twitter', 'SEO', 'metadata'],
    relatedTopics: ['og', 'schema'],
    nextjsVersion: '14+',
    isVerified: true,
  },
  {
    title: 'Dynamic OG Images',
    content: `Generate dynamic Open Graph images with Next.js.

## Using @vercel/og

\`\`\`tsx
// app/api/og/route.tsx
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') ?? 'Default Title';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1a2e',
          backgroundImage: 'linear-gradient(to bottom right, #16213e, #1a1a2e)',
        }}
      >
        <div
          style={{
            fontSize: 60,
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'center',
            padding: '0 60px',
          }}
        >
          {title}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
\`\`\`

## Usage in Metadata

\`\`\`tsx
export async function generateMetadata({ params }) {
  const product = await getProduct(params.id);

  return {
    openGraph: {
      images: [
        {
          url: \`/api/og?title=\${encodeURIComponent(product.name)}\`,
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}
\`\`\``,
    documentType: 'code_example',
    category: 'og',
    tags: ['Open Graph', 'images', 'social', 'dynamic'],
    relatedTopics: ['meta', 'images'],
    nextjsVersion: '14+',
    isVerified: true,
  },
];

// ============================================================================
// PROMPT TEMPLATES
// ============================================================================

export const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  diagnose_vitals: {
    id: 'diagnose_vitals',
    name: 'Diagnose Vitals',
    description: 'Diagnose Core Web Vitals issues',
    template: `Analyze these Core Web Vitals metrics and provide optimization recommendations:

LCP: {lcp}ms (target: <2500ms)
INP: {inp}ms (target: <200ms)
CLS: {cls} (target: <0.1)
FCP: {fcp}ms (target: <1800ms)
TTFB: {ttfb}ms (target: <800ms)

Page URL: {url}
Device: {device}

Provide:
1. Assessment of each metric
2. Root cause analysis for poor metrics
3. Specific Next.js code examples to fix issues
4. Priority of fixes based on impact`,
    variables: ['lcp', 'inp', 'cls', 'fcp', 'ttfb', 'url', 'device'],
  },
  generate_schema: {
    id: 'generate_schema',
    name: 'Generate Schema',
    description: 'Generate JSON-LD structured data',
    template: `Generate JSON-LD structured data for this content:

Content Type: {contentType}
Title: {title}
Description: {description}
Additional Data: {additionalData}

Requirements:
1. Use schema.org vocabulary
2. Include all required fields for rich results
3. Add recommended optional fields
4. Provide the Next.js component code`,
    variables: ['contentType', 'title', 'description', 'additionalData'],
  },
  optimize_images: {
    id: 'optimize_images',
    name: 'Optimize Images',
    description: 'Get image optimization recommendations',
    template: `Optimize images for this Next.js page:

Page Type: {pageType}
Number of Images: {imageCount}
Current LCP: {lcp}ms
Current CLS: {cls}

Images:
{imageList}

Provide:
1. next/image configuration for each image
2. Priority settings for LCP
3. Placeholder strategies
4. next.config.js optimizations`,
    variables: ['pageType', 'imageCount', 'lcp', 'cls', 'imageList'],
  },
};

// ============================================================================
// KNOWLEDGE MANAGEMENT
// ============================================================================

/**
 * Initialize knowledge base with core documents
 */
export async function initializeSeoKnowledge(): Promise<{ documentsLoaded: number }> {
  let count = 0;

  for (const doc of CORE_KNOWLEDGE) {
    const existing = await db
      .select()
      .from(seoKnowledge)
      .where(eq(seoKnowledge.title, doc.title))
      .execute();

    if (existing.length === 0) {
      await db.insert(seoKnowledge).values(doc);
      count++;
    }
  }

  return { documentsLoaded: count };
}

/**
 * Search knowledge base
 */
export async function searchKnowledge(query: KnowledgeQuery): Promise<SeoKnowledge[]> {
  const { query: searchQuery, category, documentType, limit = 10 } = query;

  const conditions = [];

  if (searchQuery) {
    conditions.push(
      or(
        ilike(seoKnowledge.title, `%${searchQuery}%`),
        ilike(seoKnowledge.content, `%${searchQuery}%`)
      )
    );
  }

  if (category) {
    conditions.push(eq(seoKnowledge.category, category));
  }

  if (documentType) {
    conditions.push(eq(seoKnowledge.documentType, documentType));
  }

  return db
    .select()
    .from(seoKnowledge)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(limit)
    .execute();
}

/**
 * Get knowledge by category
 */
export async function getKnowledgeByCategory(category: Category): Promise<SeoKnowledge[]> {
  return db.select().from(seoKnowledge).where(eq(seoKnowledge.category, category)).execute();
}

/**
 * Get a prompt template
 */
export function getPromptTemplate(templateId: string): PromptTemplate | null {
  return PROMPT_TEMPLATES[templateId] ?? null;
}

/**
 * Fill a prompt template with variables
 */
export function fillPromptTemplate(
  templateId: string,
  variables: Record<string, string>
): string | null {
  const template = PROMPT_TEMPLATES[templateId];
  if (!template) return null;

  let filled = template.template;
  for (const [key, value] of Object.entries(variables)) {
    filled = filled.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }

  return filled;
}

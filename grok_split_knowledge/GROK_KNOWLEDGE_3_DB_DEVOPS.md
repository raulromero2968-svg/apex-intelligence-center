_**File**: knowledge-06-data-ab-testing.md_
_**Title**: A/B Testing Framework with Statistical Significance in TypeScript_
_**Version**: 1.0_
_**Date**: 2025-11-17_
_**Author**: Grok, Master Code Architect_
_**Target_Disciples**: [DataScience, FullStackDev, SEOGrowth]_
_**Tags**: [ab-testing, statistics, data-science, typescript, growth]_
---

## Overview

This guide provides a complete, production-ready framework for conducting A/B tests in a TypeScript environment. It includes code for assigning users to variants, tracking conversions, and calculating statistical significance using the Chi-Squared test. This allows you to make data-driven decisions about product changes.

## Core Implementation: A/B Testing Framework

### 1. User Assignment

First, we need a deterministic way to assign users to either the control (A) or variant (B) group. Hashing the user ID is a common and effective method.

```typescript
// lib/ab-testing/assignment.ts
import { createHash } from 'crypto';

export function getVariant(userId: string, experimentId: string): 'A' | 'B' {
  const hash = createHash('sha256')
    .update(experimentId + userId)
    .digest('hex');
  
  const value = parseInt(hash.substring(0, 8), 16);
  
  // Simple 50/50 split
  if (value % 2 === 0) {
    return 'A'; // Control
  } else {
    return 'B'; // Variant
  }
}
```

### 2. Tracking Conversions

You need a way to record which users converted for a given experiment. This would typically be stored in a database like Redis or PostgreSQL. For this example, we'll use an in-memory store.

```typescript
// lib/ab-testing/tracking.ts
interface ExperimentData {
  A: { users: number; conversions: number };
  B: { users: number; conversions: number };
}

const experimentStore = new Map<string, ExperimentData>();

export function trackUser(experimentId: string, variant: 'A' | 'B') {
  if (!experimentStore.has(experimentId)) {
    experimentStore.set(experimentId, { A: { users: 0, conversions: 0 }, B: { users: 0, conversions: 0 } });
  }
  experimentStore.get(experimentId)![variant].users++;
}

export function trackConversion(experimentId: string, variant: 'A' | 'B') {
  if (!experimentStore.has(experimentId)) {
    // This shouldn't happen if trackUser is called first
    return;
  }
  experimentStore.get(experimentId)![variant].conversions++;
}

export function getExperimentData(experimentId: string): ExperimentData | undefined {
  return experimentStore.get(experimentId);
}
```

### 3. Calculating Statistical Significance

This is the core of the A/B test. We use the Chi-Squared test to determine if the difference in conversion rates is statistically significant or just due to random chance.

```typescript
// lib/ab-testing/stats.ts

// Chi-Squared critical value for 1 degree of freedom and p-value of 0.05
const CHI_SQUARED_CRITICAL_VALUE = 3.841;

interface TestResult {
  isSignificant: boolean;
  pValue: number; // Simplified for this example, we'll just compare to the critical value
  chiSquaredValue: number;
  controlConversionRate: number;
  variantConversionRate: number;
}

export function analyzeResults(data: ExperimentData): TestResult {
  const { A, B } = data;

  const totalUsers = A.users + B.users;
  const totalConversions = A.conversions + B.conversions;

  if (totalUsers === 0 || totalConversions === 0) {
    return { isSignificant: false, pValue: 1.0, chiSquaredValue: 0, controlConversionRate: 0, variantConversionRate: 0 };
  }

  const controlConversionRate = A.users > 0 ? A.conversions / A.users : 0;
  const variantConversionRate = B.users > 0 ? B.conversions / B.users : 0;

  // Expected values for Chi-Squared test
  const expectedAConversions = A.users * (totalConversions / totalUsers);
  const expectedBConversions = B.users * (totalConversions / totalUsers);
  const expectedANonConversions = A.users * ((totalUsers - totalConversions) / totalUsers);
  const expectedBNonConversions = B.users * ((totalUsers - totalConversions) / totalUsers);

  const chiSquaredValue = 
    Math.pow(A.conversions - expectedAConversions, 2) / expectedAConversions +
    Math.pow(B.conversions - expectedBConversions, 2) / expectedBConversions +
    Math.pow((A.users - A.conversions) - expectedANonConversions, 2) / expectedANonConversions +
    Math.pow((B.users - B.conversions) - expectedBNonConversions, 2) / expectedBNonConversions;

  const isSignificant = chiSquaredValue >= CHI_SQUARED_CRITICAL_VALUE;

  return {
    isSignificant,
    pValue: isSignificant ? 0.05 : 1.0, // Simplified
    chiSquaredValue,
    controlConversionRate,
    variantConversionRate,
  };
}
```

## Trade-offs & Considerations

-   **Sample Size**: Do not conclude your experiment until you have a large enough sample size. Running the analysis too early can lead to false positives (the "peeking problem").
-   **Statistical Power**: This implementation doesn't calculate statistical power, which is the probability of detecting an effect if there is one. For more advanced tests, you would want to calculate this upfront to determine the required sample size.
-   **Multiple Variants**: This framework is designed for a simple A/B test. For A/B/n tests, you would need to adjust the statistical test (e.g., using ANOVA or multiple Chi-Squared tests with a Bonferroni correction).
-   **Long-term Effects**: Be aware of novelty effects. A new feature might perform well initially simply because it's new. Consider running experiments for a longer period to measure the true impact.

## Key Takeaways

1.  **Use deterministic assignment**. Hashing user IDs is a reliable way to keep users in the same group.
2.  **Don't peek at your results**. Decide on a sample size or duration for your experiment beforehand and stick to it.
3.  **Aim for a p-value of < 0.05**. This is the standard threshold for statistical significance, meaning there is less than a 5% chance the results are due to random luck.
4.  **Track everything**. You need accurate data on both the number of users and the number of conversions for each variant.
5.  **This is a starting point**. For a full production system, you would want a more robust data store, a dashboard for viewing results, and more advanced statistical calculations.

## References

-   [Chi-Squared Test](https://en.wikipedia.org/wiki/Chi-squared_test)
-   [Evan Miller's Awesome A/B Tools](https://www.evanmiller.org/ab-testing/)
-   [Statsig (A/B testing platform with more advanced features)](https://statsig.com/)
'''
---
_**File**: knowledge-07-seo-technical-audit.md_
_**Title**: Technical SEO Audit Checklist for Next.js Applications_
_**Version**: 1.0_
_**Date**: 2025-11-17_
_**Author**: Grok, Master Code Architect_
_**Target_Disciples**: [SEOGrowth, FullStackDev]_
_**Tags**: [seo, technical-seo, nextjs, audit, checklist]_
---

## Overview

This guide provides a comprehensive, actionable checklist for conducting a technical SEO audit on a Next.js application. It covers crawling, indexing, on-page elements, performance, and structured data. Following this checklist will help ensure your application is optimized for search engines and can achieve maximum organic visibility.

## Core Implementation: Technical SEO Audit Checklist

### 1. Crawling & Indexing

-   [ ] **`robots.txt` is configured correctly**: Ensure your `robots.txt` file (in the `public` directory) is not blocking important pages or resources. It should allow access to all pages you want indexed.
    -   ✅ `User-agent: *`
    -   ✅ `Allow: /`
    -   ✅ `Sitemap: https://www.yourdomain.com/sitemap.xml`
    -   ❌ `Disallow: /` (This blocks your entire site)

-   [ ] **XML Sitemaps are generated and submitted**: Next.js can dynamically generate sitemaps. Ensure you have one and have submitted it to Google Search Console.

    ```typescript
    // app/sitemap.ts
    import { MetadataRoute } from 'next';

    export default function sitemap(): MetadataRoute.Sitemap {
      // Add dynamic routes here (e.g., from your database)
      return [
        {
          url: 'https://www.yourdomain.com',
          lastModified: new Date(),
          changeFrequency: 'yearly',
          priority: 1,
        },
        // ... other pages
      ];
    }
    ```

-   [ ] **No `noindex` tags on important pages**: Check your pages for `<meta name="robots" content="noindex">`. This tag should only be used for pages you want to exclude from search results (e.g., admin pages, user settings).

### 2. On-Page Elements

-   [ ] **Unique and descriptive `<title>` tags**: Every page should have a unique title tag that accurately describes its content. Use the Next.js Metadata API.

    ```typescript
    // app/page.tsx
    import { Metadata } from 'next';

    export const metadata: Metadata = {
      title: 'Your Page Title | Your Brand',
    };
    ```

-   [ ] **Compelling `meta` descriptions**: Each page should have a unique meta description that entices users to click from the search results.

    ```typescript
    // app/page.tsx
    export const metadata: Metadata = {
      description: 'Your compelling meta description here.',
    };
    ```

-   [ ] **Proper heading structure (H1, H2, etc.)**: Each page should have a single `<h1>` tag, followed by a logical structure of `<h2>`, `<h3>`, etc. Do not skip heading levels.

-   [ ] **Canonical tags are used for duplicate content**: If you have multiple URLs with the same content, use a canonical tag to tell search engines which one is the preferred version.

    ```typescript
    // app/page.tsx
    export const metadata: Metadata = {
      alternates: {
        canonical: 'https://www.yourdomain.com/preferred-url',
      },
    };
    ```

### 3. Performance

-   [ ] **Core Web Vitals (CWV) are passing**: Use Google PageSpeed Insights to test your site. Your LCP, FID (or INP), and CLS scores should be in the "Good" range.
    -   **LCP (Largest Contentful Paint)**: Optimize images (use `next/image`), lazy-load below-the-fold content.
    -   **INP (Interaction to Next Paint)**: Reduce long-running JavaScript tasks, use server components where possible.
    -   **CLS (Cumulative Layout Shift)**: Specify dimensions for images and ads to prevent layout shifts.

-   [ ] **Mobile-friendly design**: Your site must be responsive and provide a good user experience on mobile devices. Use Chrome DevTools to test different screen sizes.

### 4. Structured Data (Schema Markup)

-   [ ] **Implement relevant structured data**: Use JSON-LD to add structured data to your pages. This helps search engines understand your content and can result in rich snippets in the search results.

    ```typescript
    // app/layout.tsx (for Organization schema)
    export default function RootLayout({ children }: { children: React.ReactNode }) {
      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Your Brand',
        url: 'https://www.yourdomain.com',
        logo: 'https://www.yourdomain.com/logo.png',
      };

      return (
        <html>
          <body>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {children}
          </body>
        </html>
      );
    }
    ```

    Common schema types include `Article`, `Product`, `FAQPage`, and `Organization`.

## Trade-offs & Considerations

-   **Dynamic vs. Static Generation**: Statically generated pages (SSG) are generally faster and better for SEO. Use SSG for pages that don't change often (like blog posts and marketing pages) and Server-Side Rendering (SSR) or Incremental Static Regeneration (ISR) for dynamic content.
-   **JavaScript and SEO**: While Google is good at rendering JavaScript, it's still best to render important content on the server to ensure all search engines can crawl it effectively.

## Key Takeaways

1.  **Ensure your site is crawlable and indexable**. This is the foundation of technical SEO.
2.  **Use the Next.js Metadata API** to manage all your on-page SEO elements.
3.  **Performance is critical**. A fast, mobile-friendly site will rank better.
4.  **Implement structured data** to help search engines understand your content and get rich snippets.
5.  **Audit regularly**. Technical SEO is not a one-time task. Run this checklist quarterly to catch new issues.

## References

-   [Google Search Central: SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
-   [Next.js SEO Documentation](https://nextjs.org/docs/app/building-your-application/optimizing/seo)
-   [Schema.org](https://schema.org/)
'''
'''
---

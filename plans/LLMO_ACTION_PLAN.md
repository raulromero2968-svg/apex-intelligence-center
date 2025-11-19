# LLMO Action Plan
## Large Language Model Optimization for Apex Intelligence

**Repository**: https://github.com/raulromero2968-svg/apex-intelligence-center
**Created**: 2025-11-19
**Purpose**: Optimize Apex Intelligence for discovery and citation by AI assistants (ChatGPT, Claude, Perplexity, Gemini)

---

## Executive Summary

This action plan transforms Apex Intelligence into an AI-native platform optimized for Large Language Model (LLM) discovery and citation. LLMO (Large Language Model Optimization) ensures our TCG market intelligence, backtesting data, and research articles are structured for AI consumption, driving organic traffic from AI-powered search and chat interfaces.

**Target Outcomes:**
- AI assistants cite Apex Intelligence as authoritative TCG data source
- Structured data enables direct API consumption by LLMs
- Content appears in AI-generated research summaries
- Measurable attribution from AI search engines (Perplexity, ChatGPT Search)

---

## Task Overview

| # | Task | Owner | ETA | Label | Dependencies |
|---|------|-------|-----|-------|--------------|
| 1 | Implement JSON-LD Structured Data | Claude Code | 2 days | foundational | None |
| 2 | Create AI-Optimized Sitemap | Claude Code | 1 day | foundational | None |
| 3 | Add OpenGraph + Schema.org Metadata | Claude Code | 2 days | foundational | Task #1 |
| 4 | Implement robots.txt for AI Crawlers | Claude Code | 0.5 days | foundational | None |
| 5 | Optimize Article Frontmatter for LLMs | Cursor | 1 day | content | None |
| 6 | Create Fact-Dense Content Summaries | Cursor | 3 days | content | Task #5 |
| 7 | Add Citation-Friendly Source Attribution | Claude Code | 1 day | content | None |
| 8 | Implement Breadcrumb Navigation Schema | Claude Code | 1 day | foundational | Task #1 |
| 9 | Create AI-Readable API Documentation | Cursor | 2 days | foundational | None |
| 10 | Add LLM-Specific Meta Tags | Claude Code | 1 day | foundational | Task #3 |
| 11 | Optimize RAG System for AI Crawlers | Claude Code | 2 days | foundational | None |
| 12 | Create Backtesting Data JSON-LD | Claude Code | 2 days | content | Task #1 |
| 13 | Implement AI Bot Analytics Tracking | Claude Code | 2 days | analytics | None |
| 14 | Add TDM Reservation Protocol | Claude Code | 1 day | authority | Task #4 |
| 15 | Create Knowledge Graph Entities | Cursor | 3 days | authority | Task #1 |
| 16 | Optimize Page Load for AI Crawlers | Claude Code | 2 days | foundational | None |
| 17 | Implement Content Freshness Indicators | Claude Code | 1 day | content | None |
| 18 | Create AI-Optimized FAQs | Cursor | 2 days | content | None |
| 19 | Add Statistical Data Tables (Schema) | Claude Code | 2 days | content | Task #1 |
| 20 | Implement Citation Request Handler | Claude Code | 2 days | authority | Task #9 |

---

## Detailed Task Breakdown

### TASK #1: Implement JSON-LD Structured Data

**Owner**: Claude Code
**ETA**: 2 days
**Label**: foundational
**Dependencies**: None

**Description**:
Add JSON-LD structured data to all pages using Schema.org vocabulary. This enables AI systems to understand content semantically and extract factual data for citations.

**Files/Paths**:
- `src/app/layout.tsx` (global schema)
- `src/components/JsonLd.tsx` (new component)
- `src/app/blog/[slug]/page.tsx` (article schema)
- `src/app/research/[slug]/page.tsx` (research schema)
- `src/lib/jsonld.ts` (schema generator utilities)

**Acceptance Criteria**:
- [ ] All article pages include `Article` schema with author, datePublished, dateModified
- [ ] Research pages include `ScholarlyArticle` schema with citations
- [ ] Homepage includes `Organization` schema with logo, social links
- [ ] Backtesting data includes `Dataset` schema
- [ ] Validated via Google Rich Results Test
- [ ] No schema errors in Search Console

**Implementation Details**:
```typescript
// Example JSON-LD for article
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Pokemon vs One Piece TCG Market Analysis",
  "author": {
    "@type": "Organization",
    "name": "Apex Intelligence"
  },
  "datePublished": "2025-01-16T10:00:00Z",
  "dateModified": "2025-01-20T14:30:00Z",
  "image": "https://apexintel.com/images/articles/pokemon-vs-one-piece.jpg",
  "citation": [
    {
      "@type": "WebPage",
      "url": "https://tradingcardsets.com/...",
      "name": "Trading Card Sets Investment Guide"
    }
  ],
  "about": {
    "@type": "Thing",
    "name": "Trading Card Game Investment"
  }
}
```

**Ready-to-Use Prompt**:
```
Repository: https://github.com/raulromero2968-svg/apex-intelligence-center

Task: Implement JSON-LD structured data for LLMO optimization

Requirements:
1. Create src/components/JsonLd.tsx component that renders JSON-LD scripts
2. Add Article schema to all blog posts (src/app/blog/[slug]/page.tsx)
3. Add ScholarlyArticle schema to research articles (src/app/research/[slug]/page.tsx)
4. Add Organization schema to homepage (src/app/page.tsx)
5. Create utility functions in src/lib/jsonld.ts for generating schemas
6. Include all required Schema.org properties: headline, author, datePublished, dateModified, image, citation
7. Validate output with Google Rich Results Test

Reference implementation: Check existing frontmatter in src/content/articles for metadata sources
```

---

### TASK #2: Create AI-Optimized Sitemap

**Owner**: Claude Code
**ETA**: 1 day
**Label**: foundational
**Dependencies**: None

**Description**:
Generate dynamic XML sitemap optimized for AI crawler discovery. Include changefreq, priority, and lastmod for intelligent crawling.

**Files/Paths**:
- `src/app/sitemap.ts` (Next.js 15 sitemap route)
- `public/sitemap-articles.xml` (static fallback)
- `public/sitemap-research.xml` (static fallback)

**Acceptance Criteria**:
- [ ] Dynamic sitemap at `/sitemap.xml` includes all pages
- [ ] Articles sorted by freshness (most recent first)
- [ ] `changefreq` set to "daily" for research, "weekly" for guides
- [ ] `priority` reflects content importance (0.8-1.0 for research)
- [ ] Last-modified dates accurate from git history or frontmatter
- [ ] Sitemap submitted to Google Search Console

**Implementation Details**:
```typescript
// src/app/sitemap.ts
import { MetadataRoute } from 'next';
import { getAllArticles } from '@/lib/content';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await getAllArticles();

  return [
    {
      url: 'https://apexintel.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    ...articles.map(article => ({
      url: `https://apexintel.com/blog/${article.slug}`,
      lastModified: article.publishedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    })),
  ];
}
```

**Ready-to-Use Prompt**:
```
Repository: https://github.com/raulromero2968-svg/apex-intelligence-center

Task: Create AI-optimized XML sitemap for LLMO

Requirements:
1. Implement dynamic sitemap at src/app/sitemap.ts using Next.js 15 MetadataRoute
2. Include all blog articles from src/content/articles/
3. Include all research pages from src/content/articles/research/
4. Set changeFrequency: "daily" for research, "weekly" for guides
5. Set priority: 1.0 for homepage, 0.9 for research, 0.8 for guides, 0.7 for tools
6. Extract lastModified from frontmatter.publishedAt field
7. Test sitemap renders at http://localhost:3000/sitemap.xml

Reference: See existing content structure in src/content/articles/
```

---

### TASK #3: Add OpenGraph + Schema.org Metadata

**Owner**: Claude Code
**ETA**: 2 days
**Label**: foundational
**Dependencies**: Task #1

**Description**:
Enhance all pages with comprehensive OpenGraph and Twitter Card metadata. This ensures rich previews when AI systems share or reference content.

**Files/Paths**:
- `src/app/layout.tsx` (global metadata)
- `src/app/blog/[slug]/page.tsx` (article metadata)
- `src/lib/metadata.ts` (metadata generator utilities)
- `src/content/articles/**/*.mdx` (frontmatter updates)

**Acceptance Criteria**:
- [ ] All pages have unique og:title, og:description, og:image
- [ ] Twitter Card metadata includes summary_large_image
- [ ] Article pages include article:published_time, article:author
- [ ] Images optimized (1200x630px) for social sharing
- [ ] Metadata validated via OpenGraph debugger
- [ ] No duplicate or missing tags

**Ready-to-Use Prompt**:
```
Repository: https://github.com/raulromero2968-svg/apex-intelligence-center

Task: Add comprehensive OpenGraph and Twitter Card metadata

Requirements:
1. Create src/lib/metadata.ts with generateMetadata() utility
2. Update src/app/blog/[slug]/page.tsx to export metadata object
3. Include og:title, og:description, og:image, og:type for all pages
4. Add Twitter Card tags: twitter:card, twitter:title, twitter:description, twitter:image
5. Add article-specific tags: article:published_time, article:author, article:section
6. Extract data from existing frontmatter (see src/content/articles/guides/tax-strategy-collectors.mdx)
7. Validate with Facebook OpenGraph Debugger and Twitter Card Validator

Expected output: All article pages render proper OG tags in <head>
```

---

### TASK #4: Implement robots.txt for AI Crawlers

**Owner**: Claude Code
**ETA**: 0.5 days
**Label**: foundational
**Dependencies**: None

**Description**:
Create robots.txt that explicitly allows AI crawler bots (GPTBot, Claude-Web, PerplexityBot) while controlling access to API routes and private data.

**Files/Paths**:
- `public/robots.txt` (static file)
- `src/app/robots.ts` (dynamic route - Next.js 15)

**Acceptance Criteria**:
- [ ] Allows all AI bots: GPTBot, Claude-Web, PerplexityBot, Googlebot
- [ ] Disallows crawling of /api/ routes
- [ ] Allows crawling of /blog/, /research/, /tools/
- [ ] Includes sitemap reference: Sitemap: https://apexintel.com/sitemap.xml
- [ ] Tested with robots.txt validator

**Implementation Details**:
```typescript
// src/app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/_next/'],
      },
      {
        userAgent: ['GPTBot', 'Claude-Web', 'PerplexityBot', 'Googlebot'],
        allow: ['/blog/', '/research/', '/tools/', '/'],
      },
    ],
    sitemap: 'https://apexintel.com/sitemap.xml',
  };
}
```

**Ready-to-Use Prompt**:
```
Repository: https://github.com/raulromero2968-svg/apex-intelligence-center

Task: Create robots.txt optimized for AI crawler bots

Requirements:
1. Create src/app/robots.ts using Next.js 15 MetadataRoute.Robots
2. Allow all major AI bots: GPTBot, Claude-Web, PerplexityBot, Googlebot, Bingbot
3. Explicitly allow: /, /blog/, /research/, /tools/
4. Disallow: /api/, /admin/, /_next/, /api/auth/
5. Add sitemap reference: https://apexintel.com/sitemap.xml
6. Test locally at http://localhost:3000/robots.txt

Expected output: robots.txt renders with proper user-agent rules
```

---

### TASK #5: Optimize Article Frontmatter for LLMs

**Owner**: Cursor
**ETA**: 1 day
**Label**: content
**Dependencies**: None

**Description**:
Enhance MDX frontmatter with LLM-friendly metadata: summaries, key facts, data points, and semantic tags that AI systems can extract.

**Files/Paths**:
- `src/content/articles/**/*.mdx` (all 30+ articles)
- `types/mdx.d.ts` (TypeScript definitions)
- `src/lib/mdx.ts` (frontmatter parser)

**Acceptance Criteria**:
- [ ] All articles include `summary` field (150-200 chars, fact-dense)
- [ ] Add `keyFacts` array (3-5 bullet points with data)
- [ ] Include `dataPoints` for numerical claims
- [ ] Add `semanticTags` for topic categorization
- [ ] Update TypeScript types to reflect new fields
- [ ] Validate all frontmatter parses without errors

**Implementation Example**:
```yaml
---
title: "Pokemon vs One Piece TCG Market Analysis"
summary: "Pokemon vintage cards achieved 84% CAGR (1999-2025) with $1.18M returns, while One Piece TCG delivered 142% CAGR (2022-2025) with 3,180% returns, representing the highest Sharpe ratio (7.2) in TCG history."
keyFacts:
  - "Pokemon Vintage CAGR: 84% (1999-2025)"
  - "One Piece Sharpe Ratio: 7.2 (highest ever)"
  - "Pokemon Total Return: +1,180,000%"
dataPoints:
  pokemon_vintage_cagr: 84
  pokemon_vintage_return: 1180000
  one_piece_cagr: 142
  one_piece_sharpe: 7.2
semanticTags: ["TCG Investment", "Market Analysis", "Pokemon", "One Piece", "Backtesting"]
---
```

**Ready-to-Use Prompt**:
```
Repository: https://github.com/raulromero2968-svg/apex-intelligence-center

Task: Enhance article frontmatter for LLM optimization

Requirements:
1. Update all MDX files in src/content/articles/ to include:
   - summary: 150-200 char fact-dense summary
   - keyFacts: Array of 3-5 data-backed bullet points
   - dataPoints: Object with numerical data (e.g., cagr, return, sharpe)
   - semanticTags: Array of topic keywords
2. Update types/mdx.d.ts to include new frontmatter fields
3. Ensure all existing content remains functional
4. Validate MDX parsing with pnpm build

Example format: See src/content/articles/guides/tax-strategy-collectors.mdx for reference structure

Expected output: All 30+ articles have enhanced frontmatter without breaking existing functionality
```

---

### TASK #6: Create Fact-Dense Content Summaries

**Owner**: Cursor
**ETA**: 3 days
**Label**: content
**Dependencies**: Task #5

**Description**:
Add executive summaries to all research articles optimized for AI extraction. Summaries should be factual, cite sources, and include key data points that LLMs can reference.

**Files/Paths**:
- `src/content/articles/research/*.mdx` (research articles)
- `src/content/articles/market-analysis/*.mdx` (market analysis)
- `src/components/ExecutiveSummary.tsx` (new component)

**Acceptance Criteria**:
- [ ] All research articles include <ExecutiveSummary> component
- [ ] Summaries are 200-300 words, fact-dense
- [ ] Every claim includes inline source citation
- [ ] Key metrics highlighted (e.g., "84% CAGR", "7.2 Sharpe")
- [ ] Summaries extractable by LLMs via semantic HTML
- [ ] No marketing fluff - pure data

**Implementation Example**:
```mdx
<ExecutiveSummary>
  Pokemon vintage cards (1999-2025) achieved 84% CAGR with total returns of +1,180,000%
  and a Sharpe ratio of 5.6, according to institutional-grade backtesting across 26 years
  of market data. Maximum drawdown was limited to -14% with risk management protocols.

  One Piece TCG (2022-2025) delivered the highest Sharpe ratio in TCG history (7.2) with
  142% CAGR and +3,180% returns, despite only 3 years of market data. This represents
  superior risk-adjusted performance compared to all other TCGs analyzed.

  Key drivers: sealed product scarcity, competitive meta shifts, and Japanese market
  arbitrage opportunities contributing 12-15% annual alpha.
</ExecutiveSummary>
```

**Ready-to-Use Prompt**:
```
Repository: https://github.com/raulromero2968-svg/apex-intelligence-center

Task: Add fact-dense executive summaries to research articles

Requirements:
1. Create src/components/ExecutiveSummary.tsx component with semantic HTML
2. Add <ExecutiveSummary> to all files in src/content/articles/research/
3. Each summary must be 200-300 words, fact-dense
4. Include 3-5 key metrics with numerical data
5. Cite sources inline using existing frontmatter.allSources
6. Use semantic HTML (<article>, <data>) for LLM extraction
7. Validate all articles build successfully with pnpm build

Reference data: Use existing frontmatter and article content for facts

Expected output: 8+ research articles have AI-optimized executive summaries
```

---

### TASK #7: Add Citation-Friendly Source Attribution

**Owner**: Claude Code
**ETA**: 1 day
**Label**: content
**Dependencies**: None

**Description**:
Implement machine-readable source attribution that AI systems can extract and cite. Use Schema.org Citation markup and structured data.

**Files/Paths**:
- `src/components/SourceCards.tsx` (enhance existing)
- `src/components/CitationList.tsx` (new component)
- `src/lib/citations.ts` (citation formatter utilities)

**Acceptance Criteria**:
- [ ] All sources include Schema.org Citation markup
- [ ] Citations include: name, url, publisher, accessed date
- [ ] Implement "Cite this article" button with BibTeX/APA formats
- [ ] Add machine-readable attribution in <footer>
- [ ] Citations validate via Schema.org validator
- [ ] Support copy-to-clipboard for citations

**Implementation Details**:
```typescript
// Citation schema example
{
  "@type": "Citation",
  "url": "https://tradingcardsets.com/blogs/news/...",
  "name": "The Ultimate Guide to Investing in Pokemon Cards",
  "publisher": {
    "@type": "Organization",
    "name": "Trading Card Sets"
  },
  "dateAccessed": "2025-01-16"
}
```

**Ready-to-Use Prompt**:
```
Repository: https://github.com/raulromero2968-svg/apex-intelligence-center

Task: Add machine-readable source attribution for AI citation

Requirements:
1. Enhance src/components/SourceCards.tsx to include Schema.org Citation markup
2. Create src/components/CitationList.tsx with structured citations
3. Add "Cite this article" button that generates APA/MLA/BibTeX formats
4. Extract citation data from frontmatter.allSources field
5. Implement copy-to-clipboard functionality for citations
6. Add Schema.org markup to all citations in <footer>
7. Test citation extraction with Schema.org validator

Reference: See existing frontmatter.allSources in src/content/articles/guides/tax-strategy-collectors.mdx

Expected output: All articles have machine-readable citations that AI can extract
```

---

### TASK #8: Implement Breadcrumb Navigation Schema

**Owner**: Claude Code
**ETA**: 1 day
**Label**: foundational
**Dependencies**: Task #1

**Description**:
Add breadcrumb navigation with Schema.org BreadcrumbList markup. This helps AI systems understand site hierarchy and page context.

**Files/Paths**:
- `src/components/Breadcrumb.tsx` (new component)
- `src/lib/breadcrumb.ts` (breadcrumb generator)
- `src/app/blog/[slug]/page.tsx` (integrate breadcrumbs)
- `src/app/research/[slug]/page.tsx` (integrate breadcrumbs)

**Acceptance Criteria**:
- [ ] All article pages display breadcrumbs
- [ ] Breadcrumbs include Schema.org BreadcrumbList JSON-LD
- [ ] Hierarchy: Home > Category > Article
- [ ] Breadcrumbs are keyboard accessible (ARIA)
- [ ] Schema validates via Google Rich Results Test
- [ ] Breadcrumbs responsive on mobile

**Ready-to-Use Prompt**:
```
Repository: https://github.com/raulromero2968-svg/apex-intelligence-center

Task: Implement breadcrumb navigation with Schema.org markup

Requirements:
1. Create src/components/Breadcrumb.tsx component
2. Add Schema.org BreadcrumbList JSON-LD to all article pages
3. Display breadcrumbs: Home > [Category] > [Article Title]
4. Extract category from file path (guides, research, market-analysis, tools)
5. Add breadcrumbs to src/app/blog/[slug]/page.tsx
6. Add breadcrumbs to src/app/research/[slug]/page.tsx
7. Ensure ARIA accessibility (role="navigation", aria-label="Breadcrumb")
8. Validate with Google Rich Results Test

Expected output: All article pages display breadcrumbs with valid Schema.org markup
```

---

### TASK #9: Create AI-Readable API Documentation

**Owner**: Cursor
**ETA**: 2 days
**Label**: foundational
**Dependencies**: None

**Description**:
Generate comprehensive API documentation in OpenAPI 3.0 format. This enables AI systems to understand and interact with Apex Intelligence APIs programmatically.

**Files/Paths**:
- `public/openapi.json` (OpenAPI 3.0 spec)
- `docs/api/README.md` (human-readable docs)
- `src/app/api/*/route.ts` (document existing routes)

**Acceptance Criteria**:
- [ ] OpenAPI 3.0 spec covers all public API routes
- [ ] Includes: /api/research, /api/portfolio/optimize, /api/search
- [ ] All endpoints documented with parameters, responses, examples
- [ ] Spec validates via Swagger Editor
- [ ] AI-readable descriptions for each endpoint
- [ ] Hosted at /openapi.json for AI discovery

**Ready-to-Use Prompt**:
```
Repository: https://github.com/raulromero2968-svg/apex-intelligence-center

Task: Create OpenAPI 3.0 specification for all public APIs

Requirements:
1. Analyze existing API routes in src/app/api/
2. Create public/openapi.json with OpenAPI 3.0 specification
3. Document endpoints: /api/research, /api/portfolio/optimize, /api/search
4. Include request/response schemas, parameters, examples
5. Add AI-friendly descriptions for each endpoint
6. Validate spec with Swagger Editor (https://editor.swagger.io/)
7. Create docs/api/README.md with human-readable documentation

Expected output: OpenAPI spec at /openapi.json that AI systems can parse
```

---

### TASK #10: Add LLM-Specific Meta Tags

**Owner**: Claude Code
**ETA**: 1 day
**Label**: foundational
**Dependencies**: Task #3

**Description**:
Implement meta tags specifically designed for LLM consumption: content summaries, key facts, data freshness indicators.

**Files/Paths**:
- `src/app/layout.tsx` (global meta tags)
- `src/lib/meta.ts` (meta tag generator)
- `src/app/blog/[slug]/page.tsx` (article meta tags)

**Acceptance Criteria**:
- [ ] Add `<meta name="summary" content="...">` to all pages
- [ ] Add `<meta name="key-facts" content="...">` with JSON array
- [ ] Add `<meta name="last-updated" content="ISO-8601">` timestamp
- [ ] Add `<meta name="data-source" content="...">` for attribution
- [ ] Tags extractable by AI crawlers
- [ ] No duplicate meta tags

**Ready-to-Use Prompt**:
```
Repository: https://github.com/raulromero2968-svg/apex-intelligence-center

Task: Add LLM-specific meta tags for enhanced AI extraction

Requirements:
1. Update src/lib/meta.ts to generate LLM-specific meta tags
2. Add <meta name="summary"> extracted from frontmatter.summary
3. Add <meta name="key-facts"> with JSON array from frontmatter.keyFacts
4. Add <meta name="last-updated"> with ISO-8601 timestamp
5. Add <meta name="data-source"> listing primary sources
6. Integrate into src/app/blog/[slug]/page.tsx metadata export
7. Validate tags render in <head> without duplicates

Expected output: All article pages have LLM-optimized meta tags
```

---

### TASK #11: Optimize RAG System for AI Crawlers

**Owner**: Claude Code
**ETA**: 2 days
**Label**: foundational
**Dependencies**: None

**Description**:
Enhance RAG (Retrieval Augmented Generation) system to serve structured, citation-rich responses optimized for AI crawler consumption.

**Files/Paths**:
- `src/rag/chain.ts` (enhance response formatting)
- `src/rag/fusion.ts` (optimize query generation)
- `src/rag/dedupe.ts` (improve source attribution)
- `src/app/api/research/route.ts` (add structured output)

**Acceptance Criteria**:
- [ ] RAG responses include structured source citations
- [ ] Responses formatted with semantic HTML
- [ ] Add JSON output mode for API consumers
- [ ] Responses include confidence scores for facts
- [ ] IPFS provenance links included
- [ ] Response times <2s for AI crawlers

**Ready-to-Use Prompt**:
```
Repository: https://github.com/raulromero2968-svg/apex-intelligence-center

Task: Optimize RAG system for AI crawler consumption

Requirements:
1. Update src/rag/chain.ts to include structured source citations in responses
2. Add JSON output mode to src/app/api/research/route.ts (query param: ?format=json)
3. Include IPFS provenance links from src/lib/provenance/ipfs.ts
4. Add confidence scores for factual claims in responses
5. Format responses with semantic HTML (<article>, <cite>, <data>)
6. Maintain existing response quality (Claude 3.5 Sonnet)
7. Test API endpoint returns structured JSON with citations

Expected output: /api/research endpoint returns AI-friendly structured responses
```

---

### TASK #12: Create Backtesting Data JSON-LD

**Owner**: Claude Code
**ETA**: 2 days
**Label**: content
**Dependencies**: Task #1

**Description**:
Export backtesting results as structured data (JSON-LD) using Schema.org Dataset markup. This enables AI systems to cite specific performance metrics.

**Files/Paths**:
- `src/backtest/*.ts` (extract data from backtests)
- `public/data/backtests.json` (structured export)
- `src/app/data/backtests/page.tsx` (new page with schema)
- `scripts/export-backtests.ts` (export script)

**Acceptance Criteria**:
- [ ] All 7 backtesting strategies exported as JSON-LD
- [ ] Schema includes: name, description, dateModified, temporalCoverage
- [ ] Performance metrics structured: CAGR, Sharpe, MaxDD, Return
- [ ] Data hosted at /data/backtests with Schema.org Dataset markup
- [ ] Validates via Google Dataset Search
- [ ] Includes license information (proprietary)

**Implementation Example**:
```json
{
  "@context": "https://schema.org",
  "@type": "Dataset",
  "name": "Pokemon Vintage Backtesting Results (1999-2025)",
  "description": "Institutional-grade backtesting of Pokemon Base Set investment strategy across 26 years of market data",
  "url": "https://apexintel.com/data/backtests/pokemon-vintage",
  "temporalCoverage": "1999-01-01/2025-11-19",
  "dateModified": "2025-11-19",
  "creator": {
    "@type": "Organization",
    "name": "Apex Intelligence"
  },
  "distribution": {
    "@type": "DataDownload",
    "encodingFormat": "application/json",
    "contentUrl": "https://apexintel.com/data/backtests.json"
  },
  "variableMeasured": [
    {
      "@type": "PropertyValue",
      "name": "CAGR",
      "value": 84,
      "unitText": "percent"
    },
    {
      "@type": "PropertyValue",
      "name": "Sharpe Ratio",
      "value": 5.6
    },
    {
      "@type": "PropertyValue",
      "name": "Total Return",
      "value": 1180000,
      "unitText": "percent"
    }
  ]
}
```

**Ready-to-Use Prompt**:
```
Repository: https://github.com/raulromero2968-svg/apex-intelligence-center

Task: Export backtesting data as structured JSON-LD

Requirements:
1. Create scripts/export-backtests.ts to extract data from src/backtest/*.ts
2. Generate public/data/backtests.json with all 7 strategies
3. Use Schema.org Dataset markup for each backtest
4. Include metrics: CAGR, Sharpe, MaxDD, Return, Period
5. Create src/app/data/backtests/page.tsx to display data with schema
6. Add temporal coverage (start/end dates)
7. Validate with Google Dataset Search validator

Reference data sources:
- src/backtest/pokemon.v9.ultra-tight-commented.ts
- src/backtest/onepiece.v8.ts
- README.md (performance table)

Expected output: /data/backtests page with valid Schema.org Dataset markup
```

---

### TASK #13: Implement AI Bot Analytics Tracking

**Owner**: Claude Code
**ETA**: 2 days
**Label**: analytics
**Dependencies**: None

**Description**:
Add analytics tracking specifically for AI bot traffic (GPTBot, Claude-Web, PerplexityBot). Measure which content AI systems access most.

**Files/Paths**:
- `src/middleware.ts` (bot detection)
- `src/lib/analytics/ai-bots.ts` (tracking utilities)
- `src/app/api/analytics/bots/route.ts` (analytics endpoint)
- Database schema for bot analytics

**Acceptance Criteria**:
- [ ] Detect AI bot user-agents (GPTBot, Claude-Web, Perplexity)
- [ ] Track bot visits: page, timestamp, user-agent, referrer
- [ ] Store in database (PostgreSQL via Drizzle)
- [ ] Create dashboard at /admin/ai-analytics
- [ ] Measure: most-crawled pages, crawl frequency, bot types
- [ ] No impact on page load performance

**Ready-to-Use Prompt**:
```
Repository: https://github.com/raulromero2968-svg/apex-intelligence-center

Task: Implement AI bot analytics tracking

Requirements:
1. Update src/middleware.ts to detect AI bot user-agents
2. Create src/lib/analytics/ai-bots.ts with tracking functions
3. Add database schema for bot_visits table (src/db/schema.ts)
4. Track: page_url, bot_type, timestamp, referrer, ip_hash
5. Create src/app/api/analytics/bots/route.ts for data retrieval
6. Build admin dashboard at src/app/admin/ai-analytics/page.tsx
7. Show metrics: top pages, bot distribution, crawl frequency

Bot user-agents to detect:
- GPTBot
- Claude-Web
- PerplexityBot
- Googlebot (for comparison)
- Bingbot

Expected output: Dashboard showing AI bot traffic patterns
```

---

### TASK #14: Add TDM Reservation Protocol

**Owner**: Claude Code
**ETA**: 1 day
**Label**: authority
**Dependencies**: Task #4

**Description**:
Implement TDM (Text and Data Mining) reservation protocol to control AI training on content while allowing crawling for search/citation.

**Files/Paths**:
- `public/robots.txt` (TDM directives)
- `src/app/layout.tsx` (meta TDM tags)
- `public/tdm.json` (TDM policy file)

**Acceptance Criteria**:
- [ ] Add `ai-content-declaration` meta tag
- [ ] Create /tdm.json with usage policy
- [ ] Specify: allow crawling, disallow training
- [ ] Add TDM directives to robots.txt
- [ ] Implement "noai" meta tag where appropriate
- [ ] Document policy in /terms-of-service

**Implementation Details**:
```html
<!-- Allow AI crawling for search/citation, disallow training -->
<meta name="ai-content-declaration" content="index,follow,noai-training">
```

**Ready-to-Use Prompt**:
```
Repository: https://github.com/raulromero2968-svg/apex-intelligence-center

Task: Implement TDM (Text and Data Mining) reservation protocol

Requirements:
1. Add <meta name="ai-content-declaration" content="index,follow,noai-training">
2. Create public/tdm.json with TDM usage policy
3. Update robots.txt with TDM directives
4. Policy: Allow crawling for search/citation, disallow training
5. Add to src/app/layout.tsx as global meta tag
6. Create /terms-of-service page documenting TDM policy
7. Reference EU TDM Directive 2019/790

Expected output: TDM policy declared across site
```

---

### TASK #15: Create Knowledge Graph Entities

**Owner**: Cursor
**ETA**: 3 days
**Label**: authority
**Dependencies**: Task #1

**Description**:
Define knowledge graph entities for TCG domain concepts. This helps AI systems understand relationships between cards, sets, games, and market dynamics.

**Files/Paths**:
- `public/data/knowledge-graph.jsonld` (knowledge graph)
- `src/lib/knowledge-graph.ts` (graph builder)
- `docs/KNOWLEDGE_GRAPH.md` (documentation)

**Acceptance Criteria**:
- [ ] Define entities: TCG, Card, Set, Strategy, Backtest
- [ ] Establish relationships: hasSet, belongsToGame, citedBy
- [ ] Use Schema.org + custom TCG ontology
- [ ] Include 100+ entity definitions
- [ ] Validate graph with JSON-LD Playground
- [ ] Link entities to article content

**Implementation Example**:
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Thing",
      "@id": "https://apexintel.com/entity/pokemon-tcg",
      "name": "Pokemon Trading Card Game",
      "description": "Trading card game based on Pokemon franchise",
      "sameAs": "https://www.wikidata.org/wiki/Q864980"
    },
    {
      "@type": "Product",
      "@id": "https://apexintel.com/entity/pokemon-base-set",
      "name": "Pokemon Base Set",
      "releaseDate": "1999-01-09",
      "isPartOf": {
        "@id": "https://apexintel.com/entity/pokemon-tcg"
      }
    }
  ]
}
```

**Ready-to-Use Prompt**:
```
Repository: https://github.com/raulromero2968-svg/apex-intelligence-center

Task: Create TCG knowledge graph with entities and relationships

Requirements:
1. Create public/data/knowledge-graph.jsonld with Schema.org @graph
2. Define entities: TCG (Pokemon, MTG, YuGiOh, One Piece, Lorcana, Digimon, FAB)
3. Define: Card, Set, Strategy, Backtest, Market Analysis entities
4. Establish relationships: hasSet, belongsToGame, analyzedIn, citedBy
5. Include 100+ entities extracted from existing content
6. Link entities to articles via @id references
7. Validate with JSON-LD Playground (https://json-ld.org/playground/)

Reference sources:
- README.md (TCG list)
- src/content/articles/ (entity extraction)
- Wikidata for sameAs links

Expected output: /data/knowledge-graph.jsonld with valid linked data
```

---

### TASK #16: Optimize Page Load for AI Crawlers

**Owner**: Claude Code
**ETA**: 2 days
**Label**: foundational
**Dependencies**: None

**Description**:
Improve server-side rendering and initial page load for AI crawlers. Ensure content is immediately available without JavaScript execution.

**Files/Paths**:
- `src/app/blog/[slug]/page.tsx` (SSR optimization)
- `src/lib/cache.ts` (crawler-specific caching)
- `next.config.mjs` (optimization settings)

**Acceptance Criteria**:
- [ ] All article pages fully SSR (no client-side rendering required)
- [ ] HTML includes complete article content in initial response
- [ ] Cache HTML for AI bot user-agents (24h TTL)
- [ ] Time to First Byte (TTFB) <200ms for crawlers
- [ ] No render-blocking JavaScript for bots
- [ ] Validate with curl/wget requests

**Ready-to-Use Prompt**:
```
Repository: https://github.com/raulromero2968-svg/apex-intelligence-center

Task: Optimize server-side rendering for AI crawler performance

Requirements:
1. Ensure all pages in src/app/ are server-rendered (no 'use client')
2. Update src/lib/cache.ts to cache HTML for AI bot user-agents
3. Implement bot detection in middleware (src/middleware.ts)
4. Set cache TTL: 24h for bots, 1h for humans
5. Optimize next.config.mjs for SSR performance
6. Test TTFB with: curl -w "@curl-format.txt" https://apexintel.com/blog/[slug]
7. Validate complete HTML content in initial response (no hydration needed)

Expected output: AI bots receive fully-rendered HTML in <200ms
```

---

### TASK #17: Implement Content Freshness Indicators

**Owner**: Claude Code
**ETA**: 1 day
**Label**: content
**Dependencies**: None

**Description**:
Add visible and machine-readable content freshness indicators. AI systems prioritize recent, updated content.

**Files/Paths**:
- `src/components/FreshnessIndicator.tsx` (new component)
- `src/lib/freshness.ts` (freshness calculator)
- `src/app/blog/[slug]/page.tsx` (integrate component)

**Acceptance Criteria**:
- [ ] Display "Last updated: X days ago" on all articles
- [ ] Add `<meta property="article:modified_time">` tag
- [ ] Include dateModified in JSON-LD schema
- [ ] Show "Recently Updated" badge for articles updated <30 days
- [ ] Calculate freshness from git history or frontmatter
- [ ] Machine-readable via Schema.org

**Ready-to-Use Prompt**:
```
Repository: https://github.com/raulromero2968-svg/apex-intelligence-center

Task: Add content freshness indicators for AI prioritization

Requirements:
1. Create src/components/FreshnessIndicator.tsx component
2. Display "Last updated: [relative time]" on all article pages
3. Add <meta property="article:modified_time" content="ISO-8601">
4. Include dateModified in JSON-LD Article schema
5. Show "Recently Updated" badge for articles modified <30 days ago
6. Extract modification date from frontmatter.publishedAt or git log
7. Integrate into src/app/blog/[slug]/page.tsx

Expected output: All articles display freshness with machine-readable dates
```

---

### TASK #18: Create AI-Optimized FAQs

**Owner**: Cursor
**ETA**: 2 days
**Label**: content
**Dependencies**: None

**Description**:
Create FAQ pages using Schema.org FAQPage markup. AI systems frequently extract FAQ content for direct answers.

**Files/Paths**:
- `src/app/faq/page.tsx` (new FAQ page)
- `src/components/FAQ.tsx` (FAQ component with schema)
- `src/content/faq/*.md` (FAQ content)

**Acceptance Criteria**:
- [ ] Create 20+ FAQs covering TCG investment topics
- [ ] Each FAQ uses Schema.org Question/Answer markup
- [ ] Questions target common LLM queries
- [ ] Answers are fact-dense with data points
- [ ] FAQ page validates via Rich Results Test
- [ ] FAQs embedded in relevant articles

**Implementation Example**:
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is the average CAGR for Pokemon card investments?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Pokemon vintage cards (1999-2025) achieved 84% CAGR with a Sharpe ratio of 5.6, according to institutional-grade backtesting. Modern Pokemon sets (2022-2025) delivered 247% CAGR with lower volatility."
      }
    }
  ]
}
```

**Ready-to-Use Prompt**:
```
Repository: https://github.com/raulromero2968-svg/apex-intelligence-center

Task: Create AI-optimized FAQ page with Schema.org markup

Requirements:
1. Create src/app/faq/page.tsx with FAQPage schema
2. Create src/components/FAQ.tsx component with Question/Answer markup
3. Write 20+ FAQs covering:
   - TCG investment returns (CAGR, Sharpe ratios)
   - Grading ROI and strategies
   - Market analysis and trends
   - Tax implications for collectors
   - Portfolio optimization
4. Each answer must include specific data points from backtests
5. Use Schema.org FAQPage, Question, Answer types
6. Validate with Google Rich Results Test
7. Embed FAQs in relevant articles

Reference data: README.md backtesting table, src/content/articles/

Expected output: /faq page with valid FAQPage schema and 20+ questions
```

---

### TASK #19: Add Statistical Data Tables (Schema)

**Owner**: Claude Code
**ETA**: 2 days
**Label**: content
**Dependencies**: Task #1

**Description**:
Convert backtesting tables and market data into Schema.org Table markup. AI systems extract tabular data for factual responses.

**Files/Paths**:
- `src/components/DataTable.tsx` (enhanced table component)
- `src/lib/table-schema.ts` (schema generator)
- `README.md` (add schema to existing tables)
- Article pages with data tables

**Acceptance Criteria**:
- [ ] All data tables include Schema.org Table markup
- [ ] Tables include: csvText or JSON data representation
- [ ] Column headers marked with <th scope="col">
- [ ] Numerical data uses <data value="..."> tags
- [ ] Tables accessible (ARIA, keyboard navigation)
- [ ] Schema validates via validator

**Ready-to-Use Prompt**:
```
Repository: https://github.com/raulromero2968-svg/apex-intelligence-center

Task: Add Schema.org Table markup to all data tables

Requirements:
1. Create src/components/DataTable.tsx with Schema.org Table markup
2. Add schema to backtesting table in README.md
3. Include csvText representation of data
4. Use <data value="84"> for numerical values
5. Add proper table headers with scope="col"
6. Ensure ARIA accessibility (role="table", aria-label)
7. Integrate component into article pages with tables

Expected output: All data tables have valid Schema.org markup
```

---

### TASK #20: Implement Citation Request Handler

**Owner**: Claude Code
**ETA**: 2 days
**Label**: authority
**Dependencies**: Task #9

**Description**:
Create API endpoint that serves structured citations for AI systems. Enable programmatic access to article metadata and sources.

**Files/Paths**:
- `src/app/api/citations/[slug]/route.ts` (new endpoint)
- `src/lib/citations.ts` (citation formatter)
- `public/openapi.json` (add endpoint to spec)

**Acceptance Criteria**:
- [ ] API endpoint: GET /api/citations/[article-slug]
- [ ] Returns JSON with: title, authors, date, sources, bibtex
- [ ] Supports multiple formats: json, bibtex, apa, mla
- [ ] Includes IPFS provenance links
- [ ] Rate-limited for fair use
- [ ] Documented in OpenAPI spec

**Ready-to-Use Prompt**:
```
Repository: https://github.com/raulromero2968-svg/apex-intelligence-center

Task: Create API endpoint for programmatic citations

Requirements:
1. Create src/app/api/citations/[slug]/route.ts
2. Accept query param: ?format=json|bibtex|apa|mla
3. Return citation data extracted from article frontmatter
4. Include: title, authors, publishedAt, url, sources, ipfs_hash
5. Generate BibTeX format using citation-js library
6. Add rate limiting (10 requests/minute per IP)
7. Document endpoint in public/openapi.json

Example response (JSON format):
{
  "title": "Pokemon vs One Piece Market Analysis",
  "authors": ["Apex Intelligence"],
  "date": "2025-01-16",
  "url": "https://apexintel.com/blog/pokemon-vs-one-piece",
  "sources": [...],
  "bibtex": "@article{...}",
  "ipfs": "ipfs://..."
}

Expected output: /api/citations/[slug] returns formatted citations
```

---

## Implementation Timeline

### Phase 1: Foundational (Week 1-2)
**Focus**: Core infrastructure for AI discoverability

| Task | Owner | Days | Status |
|------|-------|------|--------|
| #1: JSON-LD Structured Data | Claude Code | 2 | 🔴 Not Started |
| #2: AI-Optimized Sitemap | Claude Code | 1 | 🔴 Not Started |
| #3: OpenGraph + Schema.org | Claude Code | 2 | 🔴 Not Started |
| #4: robots.txt for AI Bots | Claude Code | 0.5 | 🔴 Not Started |
| #8: Breadcrumb Schema | Claude Code | 1 | 🔴 Not Started |
| #10: LLM Meta Tags | Claude Code | 1 | 🔴 Not Started |

**Week 1-2 Total**: 7.5 days

---

### Phase 2: Content Optimization (Week 3-4)
**Focus**: Make content AI-extractable and citation-friendly

| Task | Owner | Days | Status |
|------|-------|------|--------|
| #5: Optimize Frontmatter | Cursor | 1 | 🔴 Not Started |
| #6: Fact-Dense Summaries | Cursor | 3 | 🔴 Not Started |
| #7: Source Attribution | Claude Code | 1 | 🔴 Not Started |
| #12: Backtesting JSON-LD | Claude Code | 2 | 🔴 Not Started |
| #17: Freshness Indicators | Claude Code | 1 | 🔴 Not Started |
| #18: AI-Optimized FAQs | Cursor | 2 | 🔴 Not Started |
| #19: Data Table Schema | Claude Code | 2 | 🔴 Not Started |

**Week 3-4 Total**: 12 days

---

### Phase 3: Advanced Features (Week 5-6)
**Focus**: Analytics, authority, and programmatic access

| Task | Owner | Days | Status |
|------|-------|------|--------|
| #9: API Documentation | Cursor | 2 | 🔴 Not Started |
| #11: RAG Optimization | Claude Code | 2 | 🔴 Not Started |
| #13: AI Bot Analytics | Claude Code | 2 | 🔴 Not Started |
| #14: TDM Reservation | Claude Code | 1 | 🔴 Not Started |
| #15: Knowledge Graph | Cursor | 3 | 🔴 Not Started |
| #16: Page Load Optimization | Claude Code | 2 | 🔴 Not Started |
| #20: Citation API | Claude Code | 2 | 🔴 Not Started |

**Week 5-6 Total**: 14 days

---

## Success Metrics

### Discoverability Metrics
- **AI Bot Traffic**: 20% increase in GPTBot/Claude-Web/Perplexity crawls
- **Indexed Pages**: 100% of articles indexed by AI search engines
- **Schema Validation**: 0 errors in Google Rich Results Test
- **Sitemap Coverage**: 100% of public pages in sitemap

### Citation Metrics
- **AI Citations**: Apex Intelligence cited in AI responses 50+ times/month
- **Perplexity Mentions**: Appear in 10+ Perplexity search results
- **ChatGPT References**: Cited in ChatGPT Search results
- **Source Attribution**: 95% of citations include proper attribution

### Content Quality Metrics
- **Fact Density**: 5+ data points per article summary
- **Source Count**: Average 20+ sources per research article
- **Freshness**: 80% of content updated within 90 days
- **Schema Coverage**: 100% of articles with valid JSON-LD

### Technical Metrics
- **TTFB for Bots**: <200ms average
- **Structured Data**: 0 validation errors
- **API Uptime**: 99.9% for /api/citations endpoint
- **Cache Hit Rate**: >80% for AI bot requests

---

## Monitoring & Maintenance

### Weekly Tasks
- [ ] Check AI bot crawl logs (GPTBot, Claude-Web, Perplexity)
- [ ] Validate Schema.org markup (Google Rich Results Test)
- [ ] Review AI bot analytics dashboard
- [ ] Update freshness indicators for new content

### Monthly Tasks
- [ ] Audit citation quality and accuracy
- [ ] Update knowledge graph with new entities
- [ ] Review LLMO performance metrics
- [ ] Test citation API with sample queries
- [ ] Update OpenAPI spec with new endpoints

### Quarterly Tasks
- [ ] Comprehensive LLMO audit
- [ ] Update content summaries with latest data
- [ ] Refresh backtesting JSON-LD with new results
- [ ] Review and update TDM policy
- [ ] Analyze AI search engine referral traffic

---

## Risk Mitigation

### Technical Risks

**Risk**: Schema.org validation errors block AI indexing
**Mitigation**: Automated validation in CI/CD pipeline, weekly manual checks

**Risk**: AI bots overload server resources
**Mitigation**: Rate limiting, aggressive caching for bot traffic, CDN

**Risk**: Content extraction produces inaccurate AI citations
**Mitigation**: Fact-dense summaries, explicit source attribution, citation monitoring

### Content Risks

**Risk**: AI systems train on proprietary data without attribution
**Mitigation**: TDM reservation protocol, monitoring for unauthorized use, legal recourse

**Risk**: Outdated content cited by AI systems
**Mitigation**: Freshness indicators, regular content audits, automated staleness detection

**Risk**: Competitor content outranks Apex Intelligence in AI results
**Mitigation**: Superior data quality, comprehensive source attribution, knowledge graph depth

---

## Tools & Resources

### Validation Tools
- **Google Rich Results Test**: https://search.google.com/test/rich-results
- **Schema.org Validator**: https://validator.schema.org/
- **JSON-LD Playground**: https://json-ld.org/playground/
- **OpenGraph Debugger**: https://www.opengraph.xyz/
- **Robots.txt Tester**: https://en.ryte.com/free-tools/robots-txt/

### AI Bot Detection
- **GPTBot**: `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.0; +https://openai.com/gptbot`
- **Claude-Web**: `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; Claude-Web/1.0; +https://www.anthropic.com`
- **PerplexityBot**: `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; PerplexityBot/1.0; +https://www.perplexity.ai/bot`

### Analytics Platforms
- **Plausible Analytics**: AI bot traffic segmentation
- **CloudFlare Analytics**: Bot detection and filtering
- **Custom Dashboard**: src/app/admin/ai-analytics (Task #13)

---

## Appendix: LLMO Best Practices

### Content Guidelines for AI Consumption

1. **Fact Density**: Every paragraph should contain ≥1 data point
2. **Source Attribution**: Cite sources inline, not just in footer
3. **Semantic HTML**: Use `<article>`, `<section>`, `<data>`, `<cite>`
4. **Unique Value**: Don't regurgitate existing content - provide original analysis
5. **Structured Summaries**: Include TL;DR with key metrics upfront

### Schema.org Recommendations

1. **Article Schema**: All blog posts
2. **ScholarlyArticle**: Research-grade content with citations
3. **Dataset**: Backtesting results, market data
4. **FAQPage**: Question/answer content
5. **BreadcrumbList**: Site hierarchy
6. **Organization**: Company information
7. **WebPage**: General pages

### AI Bot Optimization

1. **Server-Side Rendering**: No JavaScript execution required
2. **Fast TTFB**: <200ms for initial HTML
3. **Complete Content**: Don't lazy-load primary content
4. **Aggressive Caching**: 24h cache for bot traffic
5. **Structured Output**: Prefer JSON-LD over Microdata

---

## Document Metadata

**Version**: 1.0
**Created**: 2025-11-19
**Last Updated**: 2025-11-19
**Author**: Claude Code (Anthropic)
**Repository**: https://github.com/raulromero2968-svg/apex-intelligence-center
**Branch**: claude/create-action-plan-01Y72BtePUNdGr3jxbYpojVj

---

**Total Estimated Effort**: 33.5 days (6.5 weeks)
**Recommended Team**: 1x Claude Code + 1x Cursor (parallel execution)
**Target Completion**: End of Q1 2026


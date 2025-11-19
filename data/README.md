# Data Directory

This directory contains stable, canonical data files that serve as the single source of truth for various aspects of the Apex Intelligence platform.

## `/data/facts.json`

**Central Facts Registry** - The canonical source for all stable organizational claims and metadata.

### Purpose

The `facts.json` file prevents drift and inconsistency by centralizing all stable facts about:
- Organization details (founded year, HQ, mission, founders)
- Product information (name, description, features)
- Pricing summary
- Official links and social media
- Technology stack
- Performance metrics
- Legal information

### Usage

#### 1. In API Routes

Load facts via the `/api/ai/meta` endpoint:

```typescript
// GET /api/ai/meta
const response = await fetch('/api/ai/meta');
const facts = await response.json();
```

#### 2. In Components and Pages

Import directly from the JSON file:

```typescript
import facts from '@/../../data/facts.json';

export default function MyComponent() {
  return (
    <div>
      <h1>{facts.organization.name}</h1>
      <p>{facts.organization.description}</p>
    </div>
  );
}
```

Or use the utility function:

```typescript
import { getFacts } from '@/lib/jsonld';

const facts = getFacts();
```

#### 3. In Metadata Generation

The facts registry is automatically used in:
- **Next.js Metadata** (`src/app/layout.tsx`)
- **JSON-LD Schema.org** structured data (`src/lib/jsonld.ts`)
- **OpenGraph tags** (via layout metadata)

#### 4. In AI Responses

AI assistants can fetch facts from `/api/ai/meta` to ensure consistent, accurate information:

```typescript
// In an AI prompt
const facts = await fetch('/api/ai/meta').then(r => r.json());
const response = await ai.chat({
  systemPrompt: `You are an assistant for ${facts.organization.name}.
                Founded in ${facts.organization.foundedYear}.
                Our mission: ${facts.organization.mission}`,
});
```

### Schema

The facts.json file follows this structure:

```typescript
{
  version: string;           // Schema version
  lastUpdated: string;       // ISO date of last update
  organization: {
    name: string;
    legalName: string;
    description: string;
    foundedYear: number;
    headquarters: { addressCountry: string };
    mission: string;
    tagline: string;
  };
  founders: Array<{
    name: string;
    role: string;
  }>;
  product: {
    name: string;
    shortName: string;
    fullName: string;
    description: string;
    category: string;
    targetMarket: string;
    features: string[];
  };
  pricing: {
    model: string;
    tiers: Array<{
      name: string;
      description: string;
      price?: string;
      type?: string;
    }>;
    summary: string;
  };
  links: {
    website: string;
    github: string;
    documentation: string;
    blog: string;
    research: string;
    insights: string;
    intel: string;
  };
  technology: {
    stack: string[];
    deployment: string;
    monitoring: string;
  };
  performance: {
    bundleSize: string;
    lighthouse: Record<string, number>;
    coreWebVitals: Record<string, string>;
  };
  contact: {
    supportEmail: string;
    businessEmail: string;
  };
  social: {
    twitter: string;
    linkedin: string;
  };
  legal: {
    termsOfService: string;
    privacyPolicy: string;
    disclaimer: string;
    license: string;
  };
}
```

### Benefits

✅ **Single Source of Truth** - All organizational facts in one place
✅ **Prevents Drift** - Metadata, JSON-LD, and AI responses stay in sync
✅ **Type Safety** - TypeScript types exported from API route
✅ **Easy Updates** - Change once, propagate everywhere
✅ **SEO Optimized** - Consistent structured data for search engines
✅ **AI-Friendly** - Provides canonical information for AI assistants

### Maintenance

When updating facts:

1. Edit `/data/facts.json` with new information
2. Update the `lastUpdated` field with current date
3. Increment `version` if schema changes
4. Test that all dependent systems still work:
   - `/api/ai/meta` endpoint
   - Metadata in page headers
   - JSON-LD structured data
   - Any components using facts

### Related Files

- **`/src/app/api/ai/meta/route.ts`** - API endpoint that serves facts
- **`/src/lib/jsonld.ts`** - Utilities for generating JSON-LD from facts
- **`/src/app/layout.tsx`** - Root layout using facts for metadata and JSON-LD

## Other Data Files

- **`sets-database.js`** - Trading card set information
- **`public/data/indices/`** - Price index data
- **`public/data/trailer/`** - Marketing trailer assets and data

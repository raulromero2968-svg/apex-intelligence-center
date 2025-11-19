# Deployment Guide - Vercel Production

## Overview

Production deployment guide for Next.js App Router on Vercel with AI integrations (Drizzle ORM, LangChain, OpenAI, Anthropic, etc.).

## 1. Runtime Configuration

### Critical: Set Runtime Per Route

Next.js App Router defaults to Edge runtime, but AI/database packages require Node.js.

**✅ Correct Pattern:**
```typescript
// app/api/intelligence-center/route.ts
export const runtime = 'nodejs'; // Forces Node.js 20.x

import { db } from '@/lib/db';
import { OpenAI } from 'openai';

export async function POST(req: NextRequest) {
  // Safe to use pg, drizzle-orm, heavy libs
}
```

**❌ Wrong Pattern:**
```typescript
// Missing runtime → Vercel tries Edge → crash
import { db } from '@/lib/db';
export async function POST(req: NextRequest) { ... }
```

### Runtime Decision Tree

| Use Case | Runtime | Reason |
|----------|---------|--------|
| Pure AI inference (OpenAI, Groq, Claude) | `edge` | Lowest cold-start (~50-150ms) |
| LangChain agents, RAG pipelines | `nodejs` | Needs fs/crypto for loaders |
| Drizzle/PostgreSQL (pg, neon) | `nodejs` | pg driver uses node APIs |
| Mixed routes | `split` | Best perf/cost per route |

## 2. vercel.json Configuration

Create/update `vercel.json` in project root:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "functions": {
    "app/api/backtest/**/*": {
      "maxDuration": 60,
      "memory": 3008,
      "runtime": "nodejs20.x"
    },
    "app/api/portfolio/**/*": {
      "maxDuration": 30,
      "memory": 1024,
      "runtime": "nodejs20.x"
    },
    "app/api/rag/**/*": {
      "maxDuration": 60,
      "memory": 3008,
      "runtime": "nodejs20.x"
    }
  },
  "regions": ["iad1"],
  "framework": "nextjs",
  "installCommand": "pnpm install --frozen-lockfile",
  "buildCommand": "pnpm build",
  "outputDirectory": ".next"
}
```

## 3. Environment Variables

### Quick Setup

Paste into **Vercel → Project Settings → Environment Variables**:

```bash
# Core (already used)
NODE_VERSION=20
PNPM_VERSION=10.19.0

# Feature flags
FEATURE_RESEARCH_STREAMING=0        # set to 1 when ready

# Optional for streaming mode
OPENAI_API_KEY=...
COHERE_API_KEY=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

### Required Variables

Set in Vercel Dashboard → Project → Settings → Environment Variables:

**Production + Preview + Development:**
- `NODE_VERSION=20` - Node.js version
- `PNPM_VERSION=10.19.0` - pnpm version
- `DATABASE_URL` - PostgreSQL connection string
- `ANTHROPIC_API_KEY` - Claude API key
- `OPENAI_API_KEY` - OpenAI API key
- `VOYAGE_API_KEY` - Voyage AI embeddings
- `COHERE_API_KEY` - Reranking
- `PINATA_API_KEY` - IPFS provenance (optional)
- `PINATA_API_SECRET` - IPFS provenance (optional)
- `NEXT_PUBLIC_SENTRY_DSN` - Monitoring (optional)

**Feature Flags:**
- `FEATURE_RESEARCH_STREAMING=0` - Enable streaming mode (set to `1` when ready)

**Optional for Streaming Mode:**
- `UPSTASH_REDIS_REST_URL` - Redis REST API URL
- `UPSTASH_REDIS_REST_TOKEN` - Redis REST API token

> 📚 **See [Environment Variables Reference](./ENVIRONMENT_VARIABLES.md) for complete list**

### Runtime Check Pattern

```typescript
const apiKey = process.env.OPENAI_API_KEY ?? process.env.NEXT_PUBLIC_OPENAI_API_KEY;
if (!apiKey) throw new Error('OPENAI_API_KEY missing');
```

## 4. Common Build Failures & Fixes

### Issue: "Module not found: pg"

**Cause:** Edge runtime trying to load Node.js-only package

**Fix:** Add `export const runtime = 'nodejs';` to route

### Issue: "critters" conflict

**Cause:** Old boilerplate packages conflict with Next.js 13+

**Fix:**
```bash
pnpm remove critters next-pwa next-optimized-images
```

### Issue: pnpm-specific errors

**Fix:** Add to `vercel.json`:
```json
{
  "installCommand": "pnpm install --frozen-lockfile",
  "buildCommand": "pnpm build"
}
```

### Issue: Large build times / OOM

**Solutions:**
1. Set `runtime = 'nodejs'` only on heavy routes
2. Add to `next.config.ts`:
```typescript
experimental: {
  outputFileTracingRoot: path.join(__dirname, '..'),
}
```
3. Use `pnpm deploy --prod` to strip devDependencies
4. Increase function memory in vercel.json

## 5. Sentry Configuration

### Edge-Compatible Setup

```typescript
// sentry.edge.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? 'development',
  tracesSampleRate: 1.0,
  transport: Sentry.makeNodeTransport, // Critical for edge
});
```

Or set `runtime = 'nodejs'` on routes that import Sentry.

## 6. Production Checklist

Before deploying:

- [ ] All heavy routes have `export const runtime = 'nodejs'`
- [ ] `vercel.json` contains function runtime overrides
- [ ] `pnpm-lock.yaml` committed & up-to-date
- [ ] Environment variables in Vercel dashboard (all environments)
- [ ] Sentry DSN uses `makeNodeTransport` or `runtime = 'nodejs'`
- [ ] No `critters` / `next-pwa` in package.json
- [ ] Test locally: `pnpm build && pnpm start`
- [ ] Clear Vercel cache: Project → Settings → Git → Clear Build Cache

## 7. Monitoring & Debugging

### Vercel Logs

```bash
# Install Vercel CLI
pnpm add -g vercel

# View logs
vercel logs [deployment-url]
```

### Performance Monitoring

- Edge runtime: ~50-150ms cold start
- Node.js runtime: ~200-500ms cold start
- Heavy operations: Set `maxDuration: 60` in vercel.json

### Common Runtime Errors

| Error | Cause | Fix |
|-------|-------|-----|
| "Unable to reach model provider" | Missing env var | Add to Vercel dashboard |
| "fetch failed" in edge route | Node.js SDK in edge | Switch to Vercel AI SDK or `runtime = 'nodejs'` |
| "Module not found: pg" | Edge runtime | Add `export const runtime = 'nodejs'` |

## 8. Cost Optimization

### Function Duration Limits

```json
{
  "functions": {
    "app/api/quick/**/*": { "maxDuration": 10 },
    "app/api/standard/**/*": { "maxDuration": 30 },
    "app/api/heavy/**/*": { "maxDuration": 60 }
  }
}
```

### Memory Allocation

- Light operations: 1024 MB
- Standard operations: 1536 MB
- Heavy backtests: 3008 MB

### Regional Deployment

```json
{
  "regions": ["iad1"]  // Single region for cost optimization
}
```

For global: `["iad1", "sfo1", "cdg1"]`

## 9. Database Connection

### Neon Serverless (Recommended)

```typescript
// lib/db.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);
```

### Connection Pooling

For `pg` driver:
```typescript
import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1, // Vercel serverless = 1 connection per function
});
```

## 10. Troubleshooting Quick Reference

### Build Succeeds Locally, Fails on Vercel

1. Check runtime configuration
2. Verify environment variables
3. Check for local-only dependencies
4. Review webpack config

### Deployment Succeeds, Runtime Errors

1. Check function logs in Vercel dashboard
2. Verify API keys are set
3. Check database connectivity
4. Review Sentry errors

### Slow Cold Starts

1. Use Edge runtime where possible
2. Reduce bundle size
3. Enable output file tracing
4. Consider Pro plan for dedicated instances

## Key Takeaways

- Always explicitly set `runtime = 'nodejs'` on routes with pg, drizzle-orm, LangChain
- Prefer per-route runtime over webpack externals
- Use `pnpm deploy .next --prod` for perfect production snapshot
- Never mix critters with modern Next.js
- Environment variables must exist in Vercel dashboard
- Vercel AI SDK + edge runtime = lowest latency for pure inference
- Node.js runtime for complex agents and database operations

## References

- Vercel Runtime Docs: https://vercel.com/docs/functions/runtimes
- Next.js Edge vs Node: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
- Vercel AI SDK: https://sdk.vercel.ai/docs
- Sentry Next.js: https://docs.sentry.io/platforms/javascript/guides/nextjs/

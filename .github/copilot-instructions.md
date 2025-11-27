# Apex Intelligence Center - GitHub Copilot Instructions

## Project Overview

This is a production-ready TCG (Trading Card Game) market intelligence platform built with Next.js 15, featuring institutional-grade backtesting, risk management, and AI-powered research capabilities. The codebase is a Turborepo monorepo with strict production guardrails and performance requirements.

## Architecture & File Structure

### Monorepo Organization
- `apps/web/` - Next.js 15 application (App Router)
- `apps/mobile/` - Expo React Native mobile app
- `packages/` - Shared packages (auth, config, db, ui)
- Use Turbo commands: `pnpm dev:web`, `pnpm build:web`, `pnpm dev:mobile`

### Key Directories in `apps/web/src/`
- `app/` - Next.js App Router pages and API routes
- `lib/` - Shared utilities (MUST use barrel exports)
- `backtest/` - Trading strategy engines (`*.v5.ts`, `*.v8.ts`)
- `risk/` - Risk management rules (`rules.v3.ts`)
- `rag/` - RAG pipeline and AI research tools
- `db/` - Drizzle ORM schema and repositories

## Critical Patterns & Conventions

### API Route Runtime Configuration
**ALWAYS** set `export const runtime = 'nodejs';` for routes using:
- Drizzle ORM/PostgreSQL operations
- LangChain or AI SDK calls (Claude, OpenAI, Cohere)
- Heavy computations (backtesting, optimization)
- Redis/BullMQ operations

```typescript
// Required at top of heavy API routes
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // Safe for DB/AI operations
}
```

### Barrel Export Enforcement (`src/lib/`)
**NO direct imports** from `src/lib/` subdirectories. Always use barrel exports:

```typescript
// ✅ Correct - barrel import
import { ragFusionPipeline } from '@/lib/rag';

// ❌ Wrong - direct import
import { ragFusionPipeline } from '@/lib/rag/rag-fusion';
```

Every `src/lib/` module MUST have `index.ts` exporting public APIs.

### Error Handling & Monitoring
**Never use `console.log`** - use Sentry for all logging:

```typescript
import * as Sentry from '@sentry/nextjs';

try {
  const result = await operation();
  return NextResponse.json({ success: true, data: result });
} catch (error) {
  Sentry.captureException(error);
  return NextResponse.json(
    { success: false, error: 'Operation failed' },
    { status: 500 }
  );
}
```

### Database Patterns
- Use Drizzle ORM with type-safe queries
- Database connection in `src/db/index.ts` with repository pattern
- Schema in `packages/db/src/schema.ts` (shared across apps)
- Run schema sync: `pnpm schema:check` before commits

## Performance Requirements

### Backtesting Engines
- **Sub-50ms execution** for full 26-year history backtests
- File naming: `{strategy}.v{version}.ts` (e.g., `pokemon.v9.ts`)
- Return format: `{totalReturn, cagr, sharpeRatio, maxDrawdown, numTrades, winRate}`

### Risk Management
- Import from `@/risk/rules.v3` - the `pass()` function validates all trades
- **Sub-1ms validation** required for production trading
- Portfolio limits: 8% single card, 35% Pokemon, 40% MTG, 15% Yu-Gi-Oh!

### Bundle Budgets
- JavaScript: <300KB per chunk
- CSS: <120KB total
- Routes: <500KB per page
- Check with: `pnpm budget:js`, `pnpm budget:css`, `pnpm budget:route`

## AI/RAG Integration

### LangChain Usage
**Only use official packages** - no experimental imports:
- `@langchain/core`, `@langchain/anthropic`, `@langchain/openai`
- `@langchain/cohere`, `@langchain/community`, `@langchain/textsplitters`

### RAG Pipeline
- Entry point: `ragFusionPipeline()` from `@/lib/rag`
- Uses Voyage AI embeddings (1024d), Claude 3.5 Sonnet, Cohere reranking
- IPFS provenance tracking required for all responses

## Development Workflow

### Pre-commit Checks
CI pipeline enforces these in order:
1. `pnpm lint` - ESLint validation
2. `pnpm typecheck` - TypeScript strict mode
3. `pnpm schema:check` - Database schema sync
4. `pnpm test` - Unit/integration tests
5. `pnpm build` - Production build

### Git Commit Format
```
feat(scope): Brief description

Detailed explanation:
- What changed
- Why it changed
- Performance impact

Results: +X% improvement / Fixes #123
```

## Critical Notes

- **Production Guardrails Active**: LangChain safety, schema sync, barrel enforcement
- **Performance Targets**: API <100ms p95, backtests <50ms, risk validation <1ms
- **Type Safety**: Strict TypeScript, no `any` types, Zod validation for APIs
- **Attribution**: All RAG responses must include citations and IPFS logging
- **Rate Limiting**: Tiered token bucket (Redis-based) on all API endpoints
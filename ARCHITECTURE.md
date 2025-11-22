> **Production Equilibrium Achieved – November 19 2025**  
> Apex Intelligence now runs with six active guardrails plus enforced migrations: LangChain safety, experimental chain exile, barrel-only lib imports, schema/code sync, CI guardrail suite, Sentry release tracking, and mandatory migrations for every schema change.

# Architecture Overview

This document describes the production architecture of the Apex Intelligence Center platform.

## Production Guardrails

The following guardrails are enforced to maintain production stability and prevent regressions:

### 1. LangChain Scoped Imports
- **No experimental APIs**: All LangChain imports must use the official, supported packages:
  - `@langchain/core`
  - `@langchain/community`
  - `@langchain/openai`
  - `@langchain/anthropic`
  - `@langchain/cohere`
  - `@langchain/textsplitters`
  - `langchain` (main package)
- **No experimental imports**: Direct imports from experimental LangChain packages or internal paths are prohibited.
- **Path corrections**: All LangChain imports have been corrected to use the proper package paths.

### 2. Experimental RAG Chain Isolation
- **Not callable in production**: Experimental RAG chains have been removed or isolated from production code paths.
- **Production-only chains**: Only stable, production-tested RAG chains are used in the main application.
- **Testing requirements**: Any new RAG chains must pass full test coverage before being integrated into production.

### 3. Barrel-Only `src/lib` Imports
- **Strict barrel enforcement**: All imports from `src/lib` must use barrel exports via `@/lib/<module>`.
- **Index.ts requirement**: Every module in `src/lib` must have an `index.ts` barrel file that exports all public APIs.
- **No deep imports**: Direct imports into `src/lib/*/subdirectories` are prohibited. Use the module's barrel export instead.
- **Example**: Use `import { function } from '@/lib/module'` instead of `import { function } from '@/lib/module/subdirectory/file'`.

### 4. Schema/Code Sync Guardrail
- **Schema verification**: Every column referenced in code must exist in `apps/web/src/db/schema.ts` with a corresponding migration.
- **Verification script**: `scripts/verify-schema-sync.ts` validates schema/code synchronization.
- **CI enforcement**: Schema drift is detected = CI fails.

### 5. CI Guardrail Suite
The following CI steps must pass in order before any code is merged:
- **`pnpm lint`**: ESLint validation for code quality and style consistency.
- **`pnpm verify-barrels`**: Validates that all `src/lib` modules have proper barrel exports and no deep imports exist.
- **`pnpm verify-schema-sync`**: Validates schema/code synchronization via `scripts/verify-schema-sync.ts`.
- **`pnpm verify-drizzle-syntax`**: Validates Drizzle ORM syntax and migrations.
- **`pnpm test`**: Unit and integration test suite execution.
- **`pnpm build`**: Production build validation.

### 6. Sentry Release Tracking
- **Release creation**: All production deployments must create a Sentry release via `scripts/create-sentry-release.ts` after each deploy.
- **Error monitoring**: Production errors are automatically captured and reported to Sentry.
- **Performance monitoring**: Application performance metrics are tracked and monitored.
- **Source maps**: Production source maps are uploaded to Sentry for accurate error reporting.

### 7. Migration Requirement
- **Mandatory migrations**: Every column referenced in code must have a schema entry in `apps/web/src/db/schema.ts` and a corresponding migration in `apps/web/prisma/migrations`.
- **No code-first schema changes**: Schema changes must always be made through migrations, never directly in code without a migration.
- **CI enforcement**: The CI pipeline validates that all referenced columns exist in the schema and have migrations.

## System Architecture

### Technology Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Vector Database**: LanceDB (production RAG pipeline)
- **Authentication**: Custom JWT-based auth
- **Payments**: Stripe
- **Monitoring**: Sentry
- **Deployment**: Vercel

### Key Components
- **RAG System**: Hybrid search with LanceDB vector database and Grok-3 tool calling
- **Portfolio Tracking**: Real-time collection value tracking
- **Market Intelligence**: TCG market analysis and insights
- **Tools Ecosystem**: Grading ROI calculator, sealed product analyzer, and more

### Directory Structure
```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
├── lib/              # Shared libraries (barrel exports only)
├── rag/              # RAG system implementation
├── portfolio/        # Portfolio tracking
├── arbitrage/        # Market arbitrage tools
└── jobs/             # Background jobs
```

## Deployment Architecture

### Vercel Configuration
- **Production environment**: Automatic deployments from `main` branch
- **Preview deployments**: Automatic preview deployments for pull requests
- **Environment variables**: Managed through Vercel dashboard
- **Edge runtime**: Optimized for edge deployment where applicable

### Monitoring & Observability
- **Sentry**: Error tracking and performance monitoring
- **Vercel Analytics**: Deployment and performance metrics
- **Custom logging**: Structured logging for debugging and audit trails

## Security

### Authentication & Authorization
- JWT-based authentication with secure token storage
- Role-based access control (RBAC) for premium features
- API rate limiting via Upstash Redis

### Data Protection
- Environment variable validation on startup
- Secure database connections
- Input validation and sanitization

## Performance

### Optimization Strategies
- **Code splitting**: Automatic route-based code splitting
- **Image optimization**: Next.js Image component with WebP/AVIF support
- **Bundle size monitoring**: Automated bundle budget enforcement
- **Caching**: Strategic use of Next.js caching and Redis for frequently accessed data

### Budget Enforcement
- **Bundle budgets**: Per-route and global bundle size limits
- **CSS budgets**: Maximum CSS file size enforcement
- **Media budgets**: Image and video file size limits
- **Delta monitoring**: Chunk size delta tracking to prevent regressions


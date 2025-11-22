# PRODUCTION LOCKDOWN MANIFESTO

**This repository has achieved production equilibrium.**

As of **November 19 2025**, Apex Intelligence is in a hardened, production-only state:

- **No unguarded LangChain usage**
- **No experimental RAG chains on the production path**
- **No deep `src/lib` imports (barrels only)**
- **No schema/code drift (every column in code exists in `apps/web/src/db/schema.ts` + has a migration)**
- **No unverified builds (lint, barrels, schema-sync, Drizzle syntax, tests, build all must pass)**
- **No untracked deploys (Sentry releases for every production deploy)**

## Immutable Rule

> **No new code may be merged without passing the full guardrail suite.**

This includes, at minimum:

1. `pnpm lint`
2. `pnpm verify-barrels`
3. `tsx scripts/verify-schema-sync.ts`
4. Drizzle syntax verification (e.g. `drizzle-kit check`)
5. `pnpm test` / `pnpm test:e2e` (where applicable)
6. `pnpm build`

Any attempt to bypass or weaken these guardrails is considered a production regression and must be rejected during review.

## Production URL

- **Canonical Production:** https://apexintelligence.io

## Date of Lockdown

- **Production Equilibrium Achieved:** November 19 2025
- **Main HEAD at Lockdown:** `af4f277`


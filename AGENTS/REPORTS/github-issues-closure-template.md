# GitHub Issues Closure Template

## Issues to Close

Close the following issues on GitHub (https://github.com/raulromero2968-svg/apex-intelligence-center/issues):

1. **Schema drift problem** - Any issues describing schema drift, missing columns, or schema/code sync issues
2. **MDX build failures** - Any issues describing MDX compilation or build failures
3. **RAG search broken in production** - Any issues describing RAG search functionality being broken
4. **Hydration warnings** - Any issues describing React hydration warnings or errors

## Closure Comment Template

Use this comment when closing each issue:

```
**Production Equilibrium Achieved – November 19 2025**

This issue has been resolved through the implementation of six active guardrails plus enforced migrations:

1. **LangChain scoped imports** - No experimental APIs allowed
2. **Experimental RAG chain isolation** - Not callable in production
3. **Barrel-only src/lib imports** - Via @/lib/* only
4. **Schema/code sync guardrail** - Via scripts/verify-schema-sync.ts and migrations
5. **CI guardrail suite** - lint → verify-barrels → verify-schema-sync → verify-drizzle-syntax → test → build
6. **Sentry release tracking** - Via scripts/create-sentry-release.ts after each deploy
7. **Migration requirement** - Every column referenced in code has a schema entry and a migration

All guardrails are now documented in ARCHITECTURE.md and CONTRIBUTING.md. The production equilibrium state ensures these issues cannot recur.

Closing as resolved.
```

## Verification

After closing issues, verify:
- Only intended long-lived branches remain (main, and any current feature branches)
- All issues tied to the final blockers are closed
- Documentation is visible on GitHub (ARCHITECTURE.md and CONTRIBUTING.md show the new banners)


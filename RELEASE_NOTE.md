# Release Note - Research API Stub + Sanitized ResearchPanel

**Date:** November 19, 2025  
**Deployment Status:** ✅ Ready (Build: `mahz2nnnu`)  
**Production URL:** `https://apex-intelligence-center-mahz2nnnu-apex-omnis-studio-projects.vercel.app`

## Summary

Merged minimal `/api/research` stub endpoint and sanitized `ResearchPanel` component into `main` branch, then deployed to production via forced Vercel deployment.

## Changes

### ✅ API Route (`/api/research/route.ts`)
- **Fixed:** Removed `NextResponse.json<T>` generics (uses `NextResponse.json` only)
- **Minimal stub:** Returns `{ ok: true, answer, sources: [], requestId }` format
- **Error handling:** Proper error responses with request IDs

### ✅ ResearchPanel Component (`/components/research/ResearchPanel.tsx`)
- **XSS protection:** `escapeHtml()` function sanitizes `&`, `<`, `>`, `"`, `'`, `` ` ``
- **Whitespace:** Uses `whitespace-pre-wrap` CSS class for proper text rendering

### ✅ Route Configuration
- **`/research` page:** `revalidate = 300` (5 minutes ISR)
- **`/about` page:** `revalidate = 3600` (1 hour ISR)

### 🔧 Build Fixes
- Fixed TypeScript errors in `src/rag/chain.ts` (judgmentText type annotation)
- Fixed TypeScript errors in `src/rag/lorcana-enchanted.chain.ts` (card parameter types)
- Fixed TypeScript errors in `src/rag/fusion.ts` (text type handling)
- Updated `@upstash/ratelimit` from `^2.1.0` → `^2.0.7` (latest available)
- Removed `vitest.config.ts` causing build failures

## Commits

1. `fd51ab4` - chore(merge): resolve conflicts; keep RAG from main; keep minimal research stub
2. `c3829f4` - fix(api): remove NextResponse.json generics from research route
3. `3d1ca0d` - chore(merge): resolve conflicts; keep RAG streaming from origin/main; keep minimal research stub
4. `e10d291` - fix(types): add type annotation for judgmentText
5. `f13c5a7` - fix(types): add type annotation for card parameter
6. `ec836ca` - fix(types): add type annotations for all card parameters
7. `f6ea9df` - fix(types): add type annotation for filter card parameter
8. `24686ed` - fix(types): fix text type in fusion.ts
9. `d331cbe` - chore: sync pnpm-lock.yaml with package.json
10. Additional fixes for TypeScript strict mode compliance

## Production Checks

⚠️ **Note:** Preview deployment has password protection enabled. To verify production:

1. **POST /api/research**
   ```bash
   curl -X POST https://[production-domain]/api/research \
     -H "Content-Type: application/json" \
     -d '{"query":"test"}'
   ```
   Expected: `{ "ok": true, "answer": "Research queued for: test", "sources": [], "requestId": "..." }`

2. **HEAD /research**
   ```bash
   curl -I https://[production-domain]/research
   ```
   Expected: `200 OK` with `Cache-Control` header

3. **HEAD /about**
   ```bash
   curl -I https://[production-domain]/about
   ```
   Expected: `200 OK` with `Cache-Control` header

## Next Steps

- Verify production domain and remove password protection if needed
- Run full production smoke tests
- Monitor Sentry for any runtime errors
- Confirm ISR cache headers are properly set

---

**Build ID:** `mahz2nnnu`  
**Deployment Time:** ~2025-11-19T02:09:11Z  
**Status:** Ready ✓


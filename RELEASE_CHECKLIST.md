# Release Checklist (90-second pass)

**Date:** _Fill in release date_  
**Release:** _Fill in version/tag_

---

## Pre-Release: PR Merges

### ✅ PR 1 → CI Green
- [ ] Merge PR 1 to `main`
- [ ] Verify CI passes: [GitHub Actions](https://github.com/raulromero2968-svg/apex-intelligence-center/actions)
- [ ] Check all required checks pass:
  - [ ] Typecheck
  - [ ] Build
  - [ ] Repo sanity
  - [ ] Bundle/route/CSS/media budgets
  - [ ] Bundle delta
  - [ ] Library watchlist

### ✅ PR 2 → Watch Perf Artifact
- [ ] Merge PR 2 to `main`
- [ ] Download perf artifact from CI run: `artifacts/perf-budget.txt`
- [ ] Review performance budget report:
  ```bash
  # Check artifact in GitHub Actions or locally:
  cat artifacts/perf-budget.txt
  ```
- [ ] Verify no critical breaches (route/chunk/first-load budgets)
- [ ] Note any warnings for follow-up

### ✅ PR 3 → Fix MDX Violations
- [ ] Merge PR 3 to `main`
- [ ] Check CI for MDX validation errors
- [ ] If violations found, run locally:
  ```bash
  pnpm validate:mdx
  ```
- [ ] Fix any MDX frontmatter issues:
  - Required fields: `title`, `slug`, `publishedAt`, `category`
  - Valid categories: `blog`, `research`, `intel`
  - ISO 8601 date format for `publishedAt`
- [ ] Re-run validation until clean:
  ```bash
  pnpm validate:mdx
  ```

---

## Preview Deployment: Feature Flag

### ✅ Enable Research Streaming on Preview
- [ ] Navigate to Vercel Dashboard → Project → Settings → Environment Variables
- [ ] Add/update on **Preview** environment:
  ```
  FEATURE_RESEARCH_STREAMING=1
  ```
- [ ] Trigger preview deployment (or wait for auto-deploy)
- [ ] Get preview URL from Vercel dashboard

### ✅ Manual QA with Research Panel
- [ ] Open preview URL: `https://[preview-url].vercel.app/research`
- [ ] Test research panel:
  - [ ] Submit a test query (e.g., "What are the best MTG Reserved List cards?")
  - [ ] Verify streaming response appears
  - [ ] Check for errors in browser console (F12)
  - [ ] Verify sources display correctly
  - [ ] Test error handling (empty query, network error)
- [ ] Test on mobile viewport
- [ ] Verify no console errors or warnings

---

## Production Deployment

### ✅ Deploy to Production
- [ ] Ensure all PRs merged and CI green
- [ ] Force deploy to production:
  ```bash
  vercel --prod --force
  ```
- [ ] Wait for deployment to complete (~2-3 minutes)
- [ ] Note production URL from Vercel output

---

## Post-Deployment: Sanity Checks

### ✅ Sanity Curl Trio

**1. API Endpoint (`/api/research`)**
```bash
curl -X POST https://[production-domain]/api/research \
  -H "Content-Type: application/json" \
  -d '{"query":"test query"}'
```
Expected: `{"ok":true,"answer":"Research queued for: test query","sources":[],"requestId":"..."}`

**2. Research Page (`/research`)**
```bash
curl -I https://[production-domain]/research
```
Expected: `200 OK` with `Cache-Control` header

**3. About Page (`/about`)**
```bash
curl -I https://[production-domain]/about
```
Expected: `200 OK` with `Cache-Control` header

---

## Quick Reference

### CI Artifacts Location
- GitHub Actions → Latest run → Artifacts → `vercel-local-mirror`
- Or check `artifacts/perf-budget.txt` locally after build

### MDX Validation
```bash
pnpm validate:mdx
```

### Performance Budget Check
```bash
pnpm perf:budget
# Or check artifacts/perf-budget.txt
```

### Vercel Deployment
```bash
# Preview (auto on PR)
vercel

# Production (force)
vercel --prod --force
```

### Environment Variables
- **Preview**: Vercel Dashboard → Settings → Environment Variables → Preview
- **Production**: Vercel Dashboard → Settings → Environment Variables → Production

---

## Rollback Plan

If issues detected:
1. Revert last commit: `git revert HEAD`
2. Force deploy: `vercel --prod --force`
3. Or rollback via Vercel Dashboard → Deployments → Select previous deployment → Promote to Production

---

**Status:** ⬜ Not Started | 🟡 In Progress | ✅ Complete


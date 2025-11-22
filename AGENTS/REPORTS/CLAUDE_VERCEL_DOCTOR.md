# CLAUDE-VERCEL-DOCTOR Report

**Date**: 2025-11-18
**Mission**: Fix Vercel build failures without touching src/**
**Status**: CRITICAL ISSUES DETECTED

---

## Executive Summary

Multiple configuration mismatches detected between local environment, CI, and required Vercel settings. These mismatches are likely causing build failures:

1. **Missing Node.js version constraint** in package.json
2. **Missing pnpm version constraint** in package.json
3. **pnpm version mismatch** in CI (v9) vs required (v10.x)
4. **Install command** missing `--frozen-lockfile` flag
5. **Node version mismatch** in local environment (v22) vs required (v20)

---

## Current Vercel Configuration Analysis

### vercel.json Settings
```json
{
  "installCommand": "pnpm install",           ❌ Missing --frozen-lockfile
  "buildCommand": "pnpm build",               ✅ Correct
  "outputDirectory": ".next",                 ✅ Correct (Next.js default)
  "framework": "nextjs",                      ✅ Correct
  "regions": ["iad1"],                        ✅ Configured
  "functions": {
    "app/api/**/*.ts": {
      "memory": 4096,                         ✅ Vercel Pro limits
      "maxDuration": 300                      ✅ 5 min timeout
    }
  }
}
```

### package.json Settings
```json
{
  "engines": <MISSING>,                       ❌ No Node version constraint
  "packageManager": <MISSING>                 ❌ No pnpm version constraint
}
```

### Required Vercel Environment Variables

The following environment variables **MUST** be configured in Vercel project settings:

#### Build System Variables
- `NODE_VERSION` = `20` (currently not set or incorrect)
- `PNPM_VERSION` = `10.19.0` (currently not set or incorrect)
- `ENABLE_EXPERIMENTAL_COREPACK` = `1` (recommended for pnpm 10.x)

#### Application Runtime Variables (CRITICAL)
- `DATABASE_URL` - PostgreSQL connection string
- `ANTHROPIC_API_KEY` - Anthropic Claude API key
- `OPENAI_API_KEY` - OpenAI API key
- `COHERE_API_KEY` - Cohere API key
- `VOYAGE_API_KEY` - Voyage AI embeddings key
- `UPSTASH_REDIS_REST_URL` - Upstash Redis URL
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis token
- `REDIS_URL` - Redis connection string (if using separate Redis)

#### Optional Notification Services
- `DISCORD_WEBHOOK_URL` - Discord notifications
- `TELEGRAM_BOT_TOKEN` - Telegram bot token
- `TELEGRAM_CHAT_ID` - Telegram chat ID
- `SENDGRID_API_KEY` - SendGrid email service

#### Optional Feature Flags
- `VAPID_PUBLIC_KEY` - Web push notifications public key
- `VAPID_PRIVATE_KEY` - Web push notifications private key
- `LOG_DB_QUERIES` - Enable database query logging
- `NODE_ENV` - Should be `production` (Vercel sets this automatically)

**NOTE**: All sensitive keys (DATABASE_URL, API keys, tokens) must be set in Vercel project settings. Missing critical variables will cause build or runtime failures.

---

## Version Mismatch Analysis

### Local Environment
- **Node**: v22.21.1 ❌ (Should be 20.x)
- **pnpm**: 10.22.0 ✅

### CI Environment (.github/workflows/pr-ci.yml)
- **Node**: 20 ✅
- **pnpm**: 9 ❌ (Should be 10.x)

### Required for Vercel
- **Node**: 20.x ✅ (specified in CI)
- **pnpm**: 10.19.0 ❌ (not enforced)

**CRITICAL**: CI workflow uses pnpm v9, but local dev and Vercel need v10.x. This creates inconsistent lockfile formats and dependency resolution.

---

## Build Cache Recommendation

### Should Vercel build cache be cleared?

**YES - REQUIRED**

**Reasons**:
1. **pnpm version change**: Switching from pnpm 9 to 10 invalidates cached node_modules
2. **Node version enforcement**: Ensuring Node 20.x may affect native module builds
3. **Lockfile format**: pnpm 10 uses a different lockfile format than pnpm 9
4. **Failed builds**: Previous build failures may have cached error states

**How to clear**:
- In Vercel dashboard → Project Settings → General → scroll to "Build & Development Settings"
- Find the "Clear Build Cache" button and click it
- Or redeploy with "Clear Build Cache" checkbox enabled

---

## Required Changes

### 1. package.json
Add version constraints:
```json
{
  "engines": {
    "node": "20.x"
  },
  "packageManager": "pnpm@10.19.0"
}
```

### 2. vercel.json
Update install command:
```json
{
  "installCommand": "pnpm install --frozen-lockfile"
}
```

### 3. .github/workflows/pr-ci.yml
Update pnpm version:
```yaml
- uses: pnpm/action-setup@v4
  with:
    version: 10
```

### 4. Vercel Project Settings (UI changes required)
Navigate to: Project Settings → General → Build & Development Settings

**Environment Variables** (tab):
- Add: `NODE_VERSION` = `20`
- Add: `PNPM_VERSION` = `10.19.0`
- Add: `ENABLE_EXPERIMENTAL_COREPACK` = `1`
- Verify all required app environment variables are set (see list above)

**Build Settings**:
- Build Command: `pnpm build` (already correct)
- Install Command: Should be auto-detected from vercel.json

---

## Experimental Flags & Special Considerations

### ENABLE_EXPERIMENTAL_COREPACK
- **Purpose**: Enables Corepack, which respects the `packageManager` field in package.json
- **Benefit**: Ensures Vercel uses exactly pnpm@10.19.0 as specified
- **Recommended**: YES for pnpm 10.x deployments

### Next.js Configuration
- Using Next.js v14 (app router)
- Output directory: `.next` (standard)
- No custom experimental flags detected in next.config.js
- Tailwind CSS v4 in use (latest)

---

## Risk Assessment

### HIGH RISK
- ❌ Missing Node version constraint (could use wrong Node version)
- ❌ Missing pnpm version constraint (could use wrong pnpm version)
- ❌ CI/local/Vercel pnpm version misalignment (lockfile conflicts)

### MEDIUM RISK
- ⚠️ Missing --frozen-lockfile flag (could modify lockfile during build)
- ⚠️ Local Node v22 vs required v20 (dev/prod parity issue)

### LOW RISK
- ℹ️ Build cache potentially stale (cleanup recommended)

---

## Deployment Confidence Score

**Current**: 3/10 🔴
**After fixes**: 9/10 🟢

The configuration issues identified are all fixable through the changes outlined above. Once applied, Vercel builds should succeed consistently.

---

## Next Steps

1. Apply code changes (package.json, vercel.json, CI workflow)
2. Commit and push to branch `ops/claude-vercel-doctor`
3. Update Vercel project environment variables (UI)
4. Clear Vercel build cache (UI)
5. Trigger manual redeploy
6. Monitor build logs for success

---

**Report generated by**: CLAUDE-VERCEL-DOCTOR
**End of report**

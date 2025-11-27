# OPERATION SEVERANCE: Build Isolation Architecture

## Executive Summary

**Mission:** Achieve GREEN Vercel deployment by strictly isolating Web build from Mobile codebase.

**Root Cause:** The monorepo root is misconfigured as a Next.js application instead of a Turborepo orchestrator, causing Vercel to compile all workspace packages including React Native mobile code.

## Current State (BROKEN)

```
Root package.json → next build (scans entire workspace)
  ├── apps/web (Next.js) ✓
  ├── apps/mobile (React Native) ✗ SHOULD NOT BE SCANNED
  └── packages/* (shared libraries) ✓
```

**Build Flow:**
1. Vercel runs `pnpm build`
2. Root package.json executes `next build`
3. Next.js TypeScript checker scans ALL workspace files
4. Encounters `apps/mobile/lib/push-context.tsx` with React Native types
5. **BUILD FAILS** ❌

## Target State (FIXED)

```
Root package.json → turbo run build --filter=@apex/web...
  ├── apps/web (Next.js) ✓ BUILDS
  ├── apps/mobile (React Native) ⊘ IGNORED
  └── packages/* (only web dependencies) ✓ BUILDS IF NEEDED
```

**Build Flow:**
1. Vercel runs `pnpm build:web`
2. Root package.json executes `turbo run build --filter=@apex/web...`
3. Turborepo builds ONLY `@apex/web` and its dependencies
4. Mobile code is never touched
5. **BUILD SUCCEEDS** ✅

## Implementation Strategy

### 1. Root Package.json Transformation

**BEFORE:**
```json
{
  "scripts": {
    "build": "next build"  // ❌ Wrong: treats root as Next.js app
  }
}
```

**AFTER:**
```json
{
  "scripts": {
    "build": "turbo run build",  // Generic fallback
    "build:web": "turbo run build --filter=@apex/web...",  // ✅ Web-only
    "build:mobile": "turbo run build --filter=@apex/mobile...",  // Mobile-only
    "dev": "turbo run dev --filter=@apex/web...",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck"
  }
}
```

### 2. Turborepo Task Isolation

**turbo.json Enhancement:**
```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "build:web": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    }
  }
}
```

### 3. Vercel Configuration

**vercel.json Update:**
```json
{
  "buildCommand": "pnpm build:web",  // ✅ Explicit web-only build
  "ignoreCommand": "bash scripts/vercel-ignore.sh"  // Ignore mobile changes
}
```

**scripts/vercel-ignore.sh:**
```bash
#!/bin/bash
# Ignore builds if only mobile code changed
git diff HEAD^ HEAD --quiet -- apps/mobile/ && echo "Mobile-only changes, skipping build" && exit 0
exit 1
```

### 4. TypeScript Isolation

**apps/web/tsconfig.json:**
```json
{
  "exclude": [
    "node_modules",
    "../mobile/**",  // ✅ Explicit mobile exclusion
    "scripts",
    "**/*.test.example.ts"
  ]
}
```

### 5. ESLint Configuration Fix

**apps/web/.eslintrc.json:**
- Remove or fix the `eslint-plugin-rulesdir` configuration
- Ensure ESLint only scans web-specific files

## Verification Checklist

- [ ] Root package.json has no Next.js commands
- [ ] `pnpm build:web` runs successfully locally
- [ ] TypeScript does not scan `apps/mobile`
- [ ] Vercel build command updated to `pnpm build:web`
- [ ] Mobile stubs removed (biometric-enrollment.ts, push-hybrid.ts)
- [ ] Vercel ignore script prevents unnecessary builds
- [ ] Green build on Vercel ✅

## Rollback Plan

If this fails:
1. Revert all changes: `git reset --hard HEAD~1`
2. Alternative: Create separate Vercel projects for web and mobile
3. Nuclear option: Move `apps/mobile` to separate repository

## Success Metrics

- ✅ Vercel build completes without mobile TypeScript errors
- ✅ Build time reduced (no mobile compilation)
- ✅ Future mobile changes don't trigger web rebuilds
- ✅ Clean separation of concerns

---

**Status:** READY FOR IMPLEMENTATION
**Approval:** Systems Architect
**Next Phase:** Execute configuration changes

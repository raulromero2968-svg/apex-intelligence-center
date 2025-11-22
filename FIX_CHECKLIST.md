# Vercel Build Fix Checklist

Quick reference for the 3 most common Vercel deployment failures and their one-line fixes.

## 🔥 Top 3 Vercel Build Killers

### 1. **pnpm-lock.yaml out of date**

**Symptom**: `ERR_PNPM_LOCKFILE_MISSING_DEPENDENCY` or `lockfile is out of sync`

**Fix**:
```bash
pnpm install && git add pnpm-lock.yaml && git commit -m "chore: update lockfile" && git push
```

**Why it happens**: Package.json was updated but lockfile wasn't regenerated

---

### 2. **Node.js version mismatch**

**Symptom**: `Error: The engine "node" is incompatible with this module`

**Fix**: Add to `package.json`:
```json
{
  "engines": {
    "node": "20.x"
  }
}
```

**Why it happens**: Vercel defaults to Node 18.x, but project requires 20.x

---

### 3. **Edge runtime Node.js import (fs/path)**

**Symptom**: `Module not found: Can't resolve 'fs'` in Edge runtime routes

**Fix**: Delete the offending file and use Contentlayer/edge-compatible alternative:
```bash
git rm src/lib/mdx.ts && git commit -m "fix: remove Node.js from Edge" && git push
```

**Why it happens**: Edge runtime doesn't support Node.js APIs like `fs`, `path`, `crypto`

**Alternative**: Use `@next/mdx` or Contentlayer for MDX processing at build time

---

## 📋 Quick Diagnostics

### Check build locally before pushing:
```bash
pnpm build
```

### Test Edge runtime compatibility:
```bash
# Grep for Node.js imports in app directory
grep -r "from 'fs'" app/
grep -r "from 'path'" app/
```

### Verify lockfile:
```bash
pnpm install --frozen-lockfile
```

---

## 🚀 Production Deploy Checklist

Before merging to main:

- [ ] `pnpm install --frozen-lockfile` passes
- [ ] `pnpm build` succeeds locally
- [ ] No `fs`, `path`, or `crypto` imports in `app/` directory
- [ ] `package.json` has `"engines": { "node": "20.x" }`
- [ ] All environment variables set in Vercel dashboard
- [ ] Sentry DSN configured (`NEXT_PUBLIC_SENTRY_DSN`)

---

## 🔗 Resources

- [Vercel Build Errors](https://vercel.com/docs/errors)
- [Edge Runtime Limitations](https://nextjs.org/docs/app/api-reference/edge)
- [pnpm Lockfile Troubleshooting](https://pnpm.io/npmrc#lockfile)

---

**Last updated**: November 19, 2025
**Session**: CLAUDE_SESSION_12

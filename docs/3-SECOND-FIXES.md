# 3-Second Fix Cheat Sheet

Ultra-concise solutions to common issues. Maximum 3 seconds to execute.

## Deployment Issues

### 1. Lockfile Drift Error
```bash
ERR_PNPM_OUTDATED_LOCKFILE
```
**Fix:**
```bash
pnpm i && git add pnpm-lock.yaml && git commit -m "chore: update lockfile" && git push -f
```
**Time:** 3s

---

### 2. Node.js in Edge Functions
```
Error: Can't use Node.js APIs in Edge Runtime
```
**Fix:**
```bash
# Remove the offending file or wrap in runtime check
git rm src/lib/mdx.ts && git push -f
```
**Time:** 2s

---

### 3. Build Cache Stuck
```
Build succeeds locally but fails in Vercel
```
**Fix:**
1. Vercel Dashboard → Deployments
2. Click "Redeploy" → Check "Clear Cache"
3. Deploy

**Time:** 3s

---

### 4. Sentry Noise (ResizeObserver errors)
```
Sentry flooded with ResizeObserver loop errors
```
**Fix:**
```ts
// sentry.config.ts
beforeSend(event) {
  if (event.exception?.values?.[0]?.value?.includes('ResizeObserver')) return null;
  return event;
}
```
Then deploy. **Time:** 3s

---

### 5. Turbo Cache Miss
```
Turborepo not using cache / cache hit rate = 0%
```
**Fix:**
```bash
rm -rf .turbo node_modules/.cache/turbo && git push
```
**Time:** 2s

---

## Database Issues

### 6. Migration Not Applied
```
Column "subscription_tier" does not exist
```
**Fix:**
```bash
pnpm db:migrate && git push
```
**Time:** 2s

---

### 7. Drizzle Type Errors
```
Type error: Property 'watchlistItems' does not exist
```
**Fix:**
```bash
pnpm drizzle-kit generate && pnpm db:migrate
```
**Time:** 3s

---

## Mobile Issues

### 8. Expo Build Fails
```
Build failed: Metro bundler error
```
**Fix:**
```bash
cd apps/mobile && rm -rf node_modules .expo && pnpm i && expo start -c
```
**Time:** 3s

---

### 9. SQLite Database Locked
```
Error: database is locked
```
**Fix:**
```ts
// Close all connections first
import { db } from './lib/db';
await db.$client.close();
```
**Time:** 2s

---

### 10. Biometric Auth Not Working (iOS Simulator)
```
Face ID not available in simulator
```
**Fix:**
1. Simulator → Features → Face ID → Enrolled
2. Restart app

**Time:** 3s

---

## API Issues

### 11. Stripe Webhook 403
```
Stripe webhook verification failed
```
**Fix:**
```bash
# Update webhook secret in Vercel
vercel env add STRIPE_WEBHOOK_SECRET
# Get from: https://dashboard.stripe.com/webhooks
```
**Time:** 3s

---

### 12. Rate Limit Not Working
```
Redis rate limiting always returns success
```
**Fix:**
```bash
# Check Redis connection
vercel env pull && grep UPSTASH .env.local
```
**Time:** 2s

---

### 13. CORS Error on API Route
```
Access-Control-Allow-Origin missing
```
**Fix:**
```ts
// Add to route.ts
export async function OPTIONS() {
  return new Response(null, {
    headers: { 'Access-Control-Allow-Origin': '*' }
  });
}
```
**Time:** 3s

---

## Performance Issues

### 14. Sentry 100% Trace Sample Rate in Prod
```
Sentry bill = $$$, performance degraded
```
**Fix:**
```ts
// sentry.config.ts
tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0
```
**Time:** 2s

---

### 15. Bundle Size Explosion
```
Initial JS size > 500KB
```
**Fix:**
```bash
npx @next/bundle-analyzer && remove unused deps
```
**Time:** 3s

---

## Quick Diagnostics

### Check Build Locally (Exactly Like Vercel)
```bash
NODE_ENV=production pnpm build
```

### Check Lockfile Validity
```bash
pnpm install --frozen-lockfile || echo "LOCKFILE OUT OF DATE"
```

### Check Turbo Cache Status
```bash
pnpm build --dry-run=json | jq '.tasks[] | select(.cache.status != "HIT")'
```

### Check Sentry Error Count
```bash
curl "https://sentry.io/api/0/projects/ORG/PROJECT/issues/" \
  -H "Authorization: Bearer $SENTRY_TOKEN" | jq '.[].count'
```

---

## Emergency Rollback (1 Second)

```bash
pnpm rollback
```

Or in Vercel dashboard:
1. Deployments → Select previous
2. "Promote to Production"

**Time:** 1s

---

## Notes

- All fixes assume you're in the repository root
- `git push -f` is safe on feature branches only
- Always test locally before force-pushing to main
- For Vercel issues, check deployment logs first
- For mobile issues, always test on real device before blaming code

---

**Last Updated:** November 19, 2025
**Session:** CLAUDE_SESSION_13

We fix issues faster than they occur. 🚀

**Context:** Next.js App Router v15+, TS, pnpm, Tailwind, optional Upstash Redis/Sentry, Vercel.

**Vercel Settings:** Node 20, build: `pnpm build`. Env: `CACHE_MINUTE_TTL_SECONDS=3600`, `NEXT_PUBLIC_ADMIN_ENABLE_WEEKLY=0`.

**Local Repro**

- `pnpm i --frozen-lockfile` → [pass/fail + snippet]
- `pnpm typecheck` → [pass/fail + snippet]
- `pnpm build` → [pass/fail + snippet]
- `npx vercel build --prod` → [optional, pass/fail]

**Logs**

```logs
[paste the failing Vercel output here]
```

**Repo diffs since last green build (if any):**

[short summary or `git show --name-only --oneline -n 1`]


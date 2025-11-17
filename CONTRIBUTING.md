# Contributing Guide — Deploy Sanity & Pre-Push Ritual

This repo ships with a **Vercel Deploy Sanity Kit**: parity loop, repo tripwires, JS/CSS/route/media budgets, delta + library guards, env audit, and a PR “Deploy Sanity Report.” The goal is boring deploys and fast, surgical fixes.

## TL;DR
1. Before pushing:
   ```bash
   pnpm golden
   ```
2. If anything chirps:
   ```bash
   pnpm snapshot   # paste output in the PR or chat
   # receive patch.diff
   pnpm patch:check   # optional dry run
   pnpm patch:apply   # applies diff + runs golden loop
   ```

## Branch Rules
- `main` is protected. Required checks include: build, typecheck, repo sanity, bundle/route/css/media budgets, bundle delta, library watchlist, and the CI summary job.
- Enforce admins; squash or linear history; dismiss stale approvals.
- Auto-merge (squash) is enabled: **green = ship**.

## Budgets & Config
- Per-route limits live in `budgets.json` (regex-based). Temporary allows expire via their `until` date.
- Global defaults via GitHub **Actions → Variables**: `MAX_*`, `DELTA_CHUNK_KB`, `LIB_BLOCKLIST`, etc.
- When redesigns intentionally change size, refresh the bundle baseline:
  ```bash
  mkdir -p budgets/baselines
  cp artifacts/bundle-budget.txt budgets/baselines/bundle-budget.txt
  ```
- Prune expired temporary allows:
  ```bash
  jq -r --arg now "$(date -u +%FT%TZ)" '.temporaryAllow[] | select(.until < $now) | "\(.route) expired on \(.until) — \(.note)"' budgets.json
  ```

## Fix-it Runbook
- **Client env misuse** → only read `NEXT_PUBLIC_*` on client; otherwise pass via server props/context.
- **Client importing server-only / calling cache APIs** → move logic to server component/route/server action.
- **Edge + Node built-ins** → use Web APIs or `export const runtime = 'nodejs'`.
- **Client using Node built-ins or `require()`** → move behind server boundary or use ESM + `next/dynamic`.
- **Chunk/Route budget** → dynamic-import heavy widgets, precise entrypoints (`lodash/debounce`, individual icons), lazy-load admin-only UI.
- **CSS/Media budget** → correct purge paths; trim globals; `next/image` with `sizes`; compress to WebP/AVIF.

## Triage Cheat-Sheet
Route over limit → list its assets:
```bash
jq -r '.pages["/ROUTE"][]' .next/build-manifest.json | sed 's#^#./.next/static/#' | head -n 5
```
Chunk delta spike → scan for the usual heavy libs:
```bash
rg -n "recharts|monaco|codemirror|prism|three|mapbox|xlsx|pdf" ./.next/static/chunks/<chunk>.js
```
Library watch hit → locate the source import:
```bash
rg -n "from 'LIB'|require('LIB')" app src
```
Leakage checks:
```bash
rg -n --multiline "(?s)^'use client'.*(next/(server|headers)|from ['\"](fs|path|crypto|zlib|http|https|url|stream|buffer|os|net|tls|child_process)['\"])"
rg -n "\\b(window|document|navigator|localStorage)\\b" app src --glob '!**/node_modules/**'
```

## Snapshot & Patch Flow
Print the first 80 lines of each report:
```bash
pnpm snapshot
```
Apply a provided unified diff:
```bash
pnpm patch:check    # optional
pnpm patch:apply    # applies + runs golden loop
```

## Runtime & Tooling
- Node 20; `pnpm`; Next.js App Router; Vercel. All guard scripts are dependency-free.


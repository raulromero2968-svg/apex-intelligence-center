## Summary
Short description of the change and why it exists.

## Pre-Push Ritual (confirm)
- [ ] Ran `pnpm golden` locally
- [ ] Attached offender snapshot (first ~80 lines from `pnpm snapshot`)
- [ ] No new dependencies added
- [ ] App Router rules intact (client/server boundaries respected)

## Offender Snapshot
Paste the output of:
```
pnpm snapshot
```

## Affected Routes / Areas
List the primary routes or modules touched (e.g., `/dashboard/reports`, `/marketing`).

## Fix Type (check all that apply)
- [ ] Dynamic import / `next/dynamic({ ssr: false })`
- [ ] Precise entrypoint (e.g., `lodash/debounce`, individual icons)
- [ ] Move server-only logic to server action/route, pass plain props
- [ ] CSS trim / purge path fix
- [ ] Media optimized (`next/image` sizes, WebP/AVIF)
- [ ] Other (describe):

## Budgets & Policy
- [ ] No route exceeds limit (see `artifacts/route-budget.txt`)
- [ ] No chunk delta breach (see `artifacts/bundle-delta.txt`)
- [ ] Library watchlist clean (`artifacts/library-watch.txt`)
- [ ] (If intentional size change) Updated:
  - [ ] `budgets/baselines/bundle-budget.txt` (after build)
  - [ ] `budgets.json` temporary allow **with** `until` and note

## Notes for Reviewers
Anything surprising, risky, or worth a second look.


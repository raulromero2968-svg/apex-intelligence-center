#!/usr/bin/env bash
set -euo pipefail
[ "${DEBUG:-0}" = "1" ] && set -x

LOG_DIR="${LOG_DIR:-./artifacts}"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/vercel-local-mirror.log"

{
  echo "# Local mirror of Vercel (Node 20) — $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
} | tee "$LOG"

run() {
  echo -e "\n$ $*" | tee -a "$LOG"
  "$@" 2>&1 | tee -a "$LOG"
}

run pnpm -v || true
run node -v || true

# install + typecheck
run pnpm i --frozen-lockfile
run pnpm typecheck

# tests (workspace preferred, then project)
set +e
pnpm -w test --reporter=dot 2>&1 | tee -a "$LOG"
TEST_RC=${PIPESTATUS[0]}
if [ "$TEST_RC" -ne 0 ]; then
  pnpm test --reporter=dot 2>&1 | tee -a "$LOG" || true
fi
set -e

# build
run pnpm build

# Optional: closest to CI
if command -v vercel >/dev/null 2>&1; then
  echo -e "\n# Vercel build (closest to CI)" | tee -a "$LOG"
  npx vercel build --prod 2>&1 | tee -a "$LOG" || true
fi

echo -e "\n✅ Done. Log: $LOG"
if command -v tar >/dev/null 2>&1; then
  TAR="$LOG_DIR/vercel-local-mirror-$(date -u +%Y%m%dT%H%M%SZ).tar.gz"
  tar -czf "$TAR" -C "$LOG_DIR" "$(basename "$LOG")" 2>/dev/null || true
  echo "📦 Compressed: $TAR"
fi


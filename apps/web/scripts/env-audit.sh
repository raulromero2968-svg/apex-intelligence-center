#!/usr/bin/env bash
set -euo pipefail

OUT_DIR=${OUT_DIR:-./artifacts}
mkdir -p "$OUT_DIR"
REPORT="$OUT_DIR/env-audit.txt"
: > "$REPORT"

if ! command -v rg >/dev/null 2>&1; then
  echo "⚠️  ripgrep (rg) not found. Skipping env audit." | tee -a "$REPORT"
  exit 0
fi

USAGE=$(rg -n --no-filename --glob '!**/node_modules/**' --glob '!**/.next/**' --glob '!artifacts/**' 'process\.env\.([A-Z0-9_]+)' -r '$1' | sort -u || true)

if [ -f .env.example ]; then
  DECLARED=$(grep -E '^[A-Z][A-Z0-9_]*=' .env.example | cut -d'=' -f1 | sort -u || true)
else
  DECLARED=""
fi

echo "# Env Audit" | tee -a "$REPORT"
echo "Scans for process.env usage and checks .env.example coverage." | tee -a "$REPORT"
echo "" | tee -a "$REPORT"

MISSING=""
if [ -n "$USAGE" ]; then
  while read -r var; do
    [ -z "$var" ] && continue
    if ! echo "$DECLARED" | grep -qx "$var"; then
      MISSING+="$var"$'\n'
    fi
  done <<< "$USAGE"
fi

if [ -n "$MISSING" ]; then
  echo "❌ Missing in .env.example:" | tee -a "$REPORT"
  echo "$MISSING" | sort -u | tee -a "$REPORT"
else
  echo "✅ All used env vars are present in .env.example (or no env usage found)." | tee -a "$REPORT"
fi

EXTRA=""
if [ -n "$DECLARED" ]; then
  while read -r var; do
    [ -z "$var" ] && continue
    if ! echo "$USAGE" | grep -qx "$var"; then
      EXTRA+="$var"$'\n'
    fi
  done <<< "$DECLARED"
fi

if [ -n "$EXTRA" ]; then
  echo "" | tee -a "$REPORT"
  echo "ℹ️  Declared but not used:" | tee -a "$REPORT"
  echo "$EXTRA" | sort -u | tee -a "$REPORT"
fi

exit 0


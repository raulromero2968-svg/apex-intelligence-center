#!/usr/bin/env bash
set -euo pipefail

LIB_BLOCKLIST=${LIB_BLOCKLIST:-"moment,chart.js/auto,echarts,fullcalendar,lodash "}
OUT_DIR=${OUT_DIR:-./artifacts}
REPORT="$OUT_DIR/library-watch.txt"

mkdir -p "$OUT_DIR"
: > "$REPORT"

to_regex() {
  echo "$1" | tr ',' '|' | sed 's/[]\/$*.^|[]/\\&/g'
}

RE="$(to_regex "$LIB_BLOCKLIST")"
FOUND=0

if command -v rg >/dev/null 2>&1; then
  SRC=$(rg -n "from ['\"]($RE)['\"]|require\\(['\"]($RE)['\"]\\)" app src || true)
  if [ -n "$SRC" ]; then
    echo "❌ Disallowed imports in source:" | tee -a "$REPORT"
    echo "$SRC" | tee -a "$REPORT"
    FOUND=1
  fi
fi

if [ -d .next/static/chunks ]; then
  BIN=$(grep -RInE "$RE" .next/static/chunks 2>/dev/null || true)
  if [ -n "$BIN" ]; then
    echo "" >> "$REPORT"
    echo "⚠️  Blocklisted strings found in built chunks:" | tee -a "$REPORT"
    echo "$BIN" | head -n 200 | tee -a "$REPORT"
    FOUND=1
  fi
fi

if [ $FOUND -eq 0 ]; then
  echo "✅ No disallowed libraries detected in source/chunks." | tee -a "$REPORT"
  exit 0
fi

exit 1


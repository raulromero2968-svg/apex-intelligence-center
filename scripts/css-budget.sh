#!/usr/bin/env bash
set -euo pipefail

MAX_CSS_KB=${MAX_CSS_KB:-120}
STRICT_CSS=${STRICT_CSS:-0}
OUT_DIR=${OUT_DIR:-./artifacts}

mkdir -p "$OUT_DIR"
REPORT="$OUT_DIR/css-budget.txt"
: > "$REPORT"

if [ ! -d .next ]; then
  echo "ℹ️  No .next directory. Run a build first." | tee -a "$REPORT"
  exit 0
fi

FOUND=0
BREACH=0
TMP=$(mktemp)

while IFS= read -r -d '' file; do
  if [ -f "$file" ]; then
    size_bytes=$(gzip -c -9 "$file" | wc -c | tr -d ' ')
    size_kb=$(( (size_bytes + 1023) / 1024 ))
    printf "%6d KB  %s\n" "$size_kb" "$file" >> "$TMP"
    FOUND=1
  fi
done < <(find .next/static/css -type f -name "*.css" -print0 2>/dev/null || true)

if [ $FOUND -eq 0 ]; then
  echo "ℹ️  No CSS files found under .next/static/css" | tee -a "$REPORT"
  exit 0
fi

sort -nr "$TMP" | tee -a "$REPORT"
echo "" >> "$REPORT"

while read -r line; do
  kb=$(echo "$line" | awk '{print $1}')
  if [ "$kb" -gt "$MAX_CSS_KB" ]; then
    echo "❌ CSS budget breach: ${line}" | tee -a "$REPORT"
    BREACH=1
  fi
done < "$TMP"

rm -f "$TMP"

if [ $BREACH -eq 0 ]; then
  echo "✅ All CSS files ≤ ${MAX_CSS_KB} KB (gz)" | tee -a "$REPORT"
  exit 0
fi

if [ "$STRICT_CSS" = "1" ]; then
  echo "❌ Strict mode: failing due to CSS budget breach(s)." | tee -a "$REPORT"
  exit 1
fi

echo "⚠️  Warnings only (STRICT_CSS=0). Consider purging or splitting CSS." | tee -a "$REPORT"
exit 0


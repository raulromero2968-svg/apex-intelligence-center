#!/usr/bin/env bash

set -euo pipefail

# Configurable thresholds
MAX_CHUNK_KB=${MAX_CHUNK_KB:-300}
STRICT=${STRICT:-0}
OUT_DIR=${OUT_DIR:-./artifacts}

mkdir -p "$OUT_DIR"
REPORT="$OUT_DIR/bundle-budget.txt"
: > "$REPORT"

if [ ! -d .next ]; then
  echo "ℹ️  No .next directory. Run a build first." | tee -a "$REPORT"
  exit 0
fi

FOUND=0
BREACHES=0
TMP=$(mktemp)

# Gather gzipped sizes for client chunks
while IFS= read -r -d '' file; do
  if [ -f "$file" ]; then
    size_bytes=$(gzip -c -9 "$file" | wc -c | tr -d ' ')
    size_kb=$(( (size_bytes + 1023) / 1024 ))
    printf "%6d KB  %s\n" "$size_kb" "$file" >> "$TMP"
    FOUND=1
  fi
done < <(find .next/static/chunks -type f -name "*.js" -print0 2>/dev/null || true)

if [ $FOUND -eq 0 ]; then
  echo "ℹ️  No client chunks found under .next/static/chunks" | tee -a "$REPORT"
  rm -f "$TMP"
  exit 0
fi

sort -nr "$TMP" | tee -a "$REPORT"
echo "" >> "$REPORT"

while read -r line; do
  kb=$(echo "$line" | awk '{print $1}')
  if [ "$kb" -gt "$MAX_CHUNK_KB" ]; then
    echo "❌ Budget breach: ${line}" | tee -a "$REPORT"
    BREACHES=1
  fi
done < "$TMP"

rm -f "$TMP"

if [ $BREACHES -eq 0 ]; then
  echo -e "\n✅ All client chunks ≤ ${MAX_CHUNK_KB} KB (gz)" | tee -a "$REPORT"
  exit 0
fi

if [ "$STRICT" = "1" ]; then
  echo -e "\n❌ Strict mode: failing due to bundle budget breach(s)." | tee -a "$REPORT"
  exit 1
fi

echo -e "\n⚠️  Warnings only (STRICT=0). Consider code-splitting or trimming deps." | tee -a "$REPORT"
exit 0


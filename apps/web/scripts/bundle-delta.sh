#!/usr/bin/env bash
set -euo pipefail

BASELINE=${BASELINE:-./budgets/baselines/bundle-budget.txt}
DELTA_CHUNK_KB=${DELTA_CHUNK_KB:-40}
STRICT_DELTA=${STRICT_DELTA:-0}
OUT_DIR=${OUT_DIR:-./artifacts}
REPORT="$OUT_DIR/bundle-delta.txt"

mkdir -p "$OUT_DIR"
: > "$REPORT"

if [ ! -f artifacts/bundle-budget.txt ]; then
  echo "ℹ️  No artifacts/bundle-budget.txt. Run scripts/bundle-budget.sh first." | tee -a "$REPORT"
  exit 0
fi

if [ ! -f "$BASELINE" ]; then
  echo "ℹ️  No baseline at $BASELINE. Creating one from current build." | tee -a "$REPORT"
  mkdir -p "$(dirname "$BASELINE")"
  cp artifacts/bundle-budget.txt "$BASELINE"
  exit 0
fi

declare -A CUR BASE

while read -r kb path; do
  [[ -z "$kb" || -z "$path" ]] && continue
  CUR["$path"]=$kb
done < <(awk '{print $1,$2}' artifacts/bundle-budget.txt | grep -E '^[0-9]+' || true)

while read -r kb path; do
  [[ -z "$kb" || -z "$path" ]] && continue
  BASE["$path"]=$kb
done < <(awk '{print $1,$2}' "$BASELINE" | grep -E '^[0-9]+' || true)

BREACH=0
echo "# Bundle Delta (gz, KB)" | tee -a "$REPORT"

for path in "${!CUR[@]}"; do
  cur=${CUR["$path"]}
  base=${BASE["$path"]:-0}
  delta=$((cur - base))
  if [ $delta -gt 0 ]; then
    printf "+%4d KB  %s (now %d KB, was %d KB)\n" "$delta" "$path" "$cur" "$base" | tee -a "$REPORT"
    if [ $delta -gt $DELTA_CHUNK_KB ]; then
      echo "❌ Delta breach: +${delta} KB > ${DELTA_CHUNK_KB} KB — $path" | tee -a "$REPORT"
      BREACH=1
    fi
  fi
done

if [ $BREACH -eq 0 ]; then
  echo "✅ No chunk grew more than ${DELTA_CHUNK_KB} KB (gz)" | tee -a "$REPORT"
  exit 0
fi

if [ "$STRICT_DELTA" = "1" ]; then
  echo "❌ Strict mode: failing on bundle delta breach(s)." | tee -a "$REPORT"
  exit 1
else
  echo "⚠️  Warnings only (STRICT_DELTA=0). Investigate offenders." | tee -a "$REPORT"
  exit 0
fi


#!/usr/bin/env bash
set -euo pipefail

MAX_MEDIA_KB=${MAX_MEDIA_KB:-300}
MAX_MEDIA_VIDEO_KB=${MAX_MEDIA_VIDEO_KB:-1500}
STRICT_MEDIA=${STRICT_MEDIA:-0}
OUT_DIR=${OUT_DIR:-./artifacts}

mkdir -p "$OUT_DIR"
REPORT="$OUT_DIR/media-budget.txt"
: > "$REPORT"

breach=0
found=0

scan_dir() {
  local dir="$1"
  [ -d "$dir" ] || return 0
  while IFS= read -r -d '' file; do
    local bytes
    bytes=$(wc -c < "$file" | tr -d ' ')
    local kb=$(( (bytes + 1023) / 1024 ))
    local ext="${file##*.}"
    local limit=$MAX_MEDIA_KB
    case "${ext,,}" in
      mp4|mov|webm) limit=$MAX_MEDIA_VIDEO_KB ;;
    esac
    printf "%6d KB  %s\n" "$kb" "$file" >> "$REPORT"
    found=1
    if [ "$kb" -gt "$limit" ]; then
      echo "❌ Media budget breach ($kb KB > ${limit} KB): $file" >> "$REPORT"
      breach=1
    fi
  done < <(find "$dir" -type f \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.gif' -o -iname '*.webp' -o -iname '*.avif' -o -iname '*.svg' -o -iname '*.mp4' -o -iname '*.mov' -o -iname '*.webm' \) -print0 2>/dev/null || true)
}

scan_dir "public"
scan_dir ".next/static/media"

if [ $found -eq 0 ]; then
  echo "ℹ️  No media files found in public/ or .next/static/media" | tee -a "$REPORT"
  exit 0
fi

if [ $breach -eq 0 ]; then
  echo "" >> "$REPORT"
  echo "✅ All media files within limits (images ≤ ${MAX_MEDIA_KB} KB, video ≤ ${MAX_MEDIA_VIDEO_KB} KB)." >> "$REPORT"
  exit 0
fi

if [ "$STRICT_MEDIA" = "1" ]; then
  echo "" >> "$REPORT"
  echo "❌ Strict mode: failing due to media budget breach(s)." >> "$REPORT"
  exit 1
fi

echo "" >> "$REPORT"
echo "⚠️  Warnings only (STRICT_MEDIA=0). Consider optimizing or lazy-loading media." >> "$REPORT"
exit 0


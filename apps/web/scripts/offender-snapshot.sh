#!/usr/bin/env bash
set -euo pipefail

for f in artifacts/{bundle-budget.txt,route-budget.txt,css-budget.txt,media-budget.txt,env-audit.txt,bundle-delta.txt,library-watch.txt}; do
  [ -f "$f" ] && { echo "### $f"; sed -n '1,80p' "$f"; echo; }
done


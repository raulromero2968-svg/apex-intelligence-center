#!/usr/bin/env bash

set -euo pipefail

REQS_MISSING=()
command -v rg >/dev/null 2>&1 || REQS_MISSING+=("ripgrep (rg)")
command -v jq >/dev/null 2>&1 || REQS_MISSING+=("jq")
if [ ${#REQS_MISSING[@]} -gt 0 ]; then
  echo "⚠️  Optional tools not found: ${REQS_MISSING[*]} — some checks may be less precise." >&2
fi

# Enforce case-sensitive index (Linux parity)
git config core.ignorecase false || true

# Resolve directory targets for app/components
APP_DIRS=""
for dir in app src/app; do
  [ -d "$dir" ] && APP_DIRS="$APP_DIRS $dir"
done
COMP_DIRS=""
for dir in components src/components; do
  [ -d "$dir" ] && COMP_DIRS="$COMP_DIRS $dir"
done
APP_AND_COMP="$APP_DIRS $COMP_DIRS"

# 1) Case collisions (macOS passes, Linux fails)
COLLISIONS=$(git ls-files | awk '{print tolower($0)}' | sort | uniq -d || true)
if [ -n "$COLLISIONS" ]; then
  echo "\n❌ Potential case collisions:"; echo "$COLLISIONS"
else
  echo "\n✅ No case collisions detected"
fi

# 2) tsconfig baseUrl/paths sanity
if [ -f tsconfig.json ]; then
  HAS_BASE=$(jq -r '.compilerOptions.baseUrl // empty' tsconfig.json || true)
  HAS_PATHS=$(jq -r '.compilerOptions.paths["@/*"][0] // empty' tsconfig.json || true)
  if [ -z "$HAS_BASE" ] || [ -z "$HAS_PATHS" ]; then
    echo "\n❌ tsconfig.json is missing baseUrl/paths for @/*"
    echo "   Suggested patch:"
    cat <<'JSON'
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./*"] }
  }
}
JSON
  else
    echo "\n✅ tsconfig.json has baseUrl + @/* path alias"
  fi
else
  echo "\nℹ️  No tsconfig.json found at repo root"
fi

# 3) Alias + deep path issues (wrong casing, bare deep imports)
RG1=$(rg -n "from\\s+['\"]\\.\\.?/|from\\s+['\"][^'\"]+Cache-Keys|from\\s+['\"][^'\"]+Redis['\"]" || true)
if [ -n "$RG1" ]; then
  echo "\n❌ Suspicious imports (fix casing/aliasing):"
  echo "$RG1"
else
  echo "\n✅ No suspicious import patterns found"
fi

# 4) Client components importing server-only libs
RG2=$(rg -n --multiline "(?s)^'use client'.*import\\s+.*@/lib/(cache|redis|server|sentry)" $APP_AND_COMP 2>/dev/null || true)
if [ -n "$RG2" ]; then
  echo "\n❌ Client components importing server-only modules:"
  echo "$RG2"
else
  echo "\n✅ No client→server import leaks detected"
fi

echo "\nDone."

# ---------------------------
# Phase-2: extra App Router tripwires
# ---------------------------
echo "\n▶ Extra App Router tripwires"

# A) Client components accessing non-public env (should use NEXT_PUBLIC_*)

if command -v rg >/dev/null 2>&1; then
  ENV_MISUSE=$(rg --pcre2 -n --multiline "(?s)^'use client'.*process\.env\.(?!NEXT_PUBLIC_)[A-Z0-9_]+" $APP_AND_COMP --glob '!*.patch' 2>/dev/null || true)
  if [ -n "$ENV_MISUSE" ]; then
    echo "\n❌ Client env misuse (use NEXT_PUBLIC_* in client):"
    echo "$ENV_MISUSE"
  else
    echo "\n✅ No client-side non-public env usage"
  fi
fi

# B) Client components importing server-only modules (next/headers or next/server)
if command -v rg >/dev/null 2>&1; then
  CLIENT_SERVER_IMPORTS=$(rg -n --multiline "(?s)^'use client'.*from\\s+['\"]next/(headers|server)['\"]" $APP_AND_COMP --glob '!*.patch' 2>/dev/null || true)
  if [ -n "$CLIENT_SERVER_IMPORTS" ]; then
    echo "\n❌ Client importing server-only Next modules:"
    echo "$CLIENT_SERVER_IMPORTS"
  else
    echo "\n✅ No server-only Next imports in client components"
  fi
fi

# C) Edge runtime files importing Node built-ins
if command -v rg >/dev/null 2>&1; then
  EDGE_NODE_BUILTINS=$(rg -n --multiline "(?s)export\\s+const\\s+runtime\\s*=\\s*['\"]edge['\"].*import\\s+.*from\\s+['\"](fs|path|crypto|zlib|http|https|url|stream|buffer|os|net|tls|child_process)['\"]" app src/app --glob '!*.patch' 2>/dev/null || true)
  if [ -n "$EDGE_NODE_BUILTINS" ]; then
    echo "\n❌ Edge runtime importing Node built-ins (unsupported on Edge):"
    echo "$EDGE_NODE_BUILTINS"
  else
    echo "\n✅ No Node built-ins imported in Edge runtime files"
  fi
fi

# D) Client components importing Node built-ins (unsupported in browser)
if command -v rg >/dev/null 2>&1; then
  CLIENT_NODE_BUILTINS=$(rg -n --multiline "(?s)^'use client'.*from\\s+['\"](fs|path|crypto|zlib|http|https|url|stream|buffer|os|net|tls|child_process)['\"]" $APP_AND_COMP --glob '!*.patch' 2>/dev/null || true)
  if [ -n "$CLIENT_NODE_BUILTINS" ]; then
    echo "\n❌ Client components importing Node built-ins:"
    echo "$CLIENT_NODE_BUILTINS"
  else
    echo "\n✅ No Node built-ins imported in client components"
  fi
fi

# E) Server components referencing browser globals (window, document, navigator, localStorage)
if command -v rg >/dev/null 2>&1; then
  SERVER_BROWSER_GLOBALS=""
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    if ! grep -q "^'use client'" "$file"; then
      matches=$(rg -n "\\b(window|document|navigator|localStorage)\\b" "$file" || true)
      if [ -n "$matches" ]; then
        SERVER_BROWSER_GLOBALS+=$'\n'"$matches"
      fi
    fi
  done < <(rg -l "\\b(window|document|navigator|localStorage)\\b" $APP_AND_COMP --glob '*.tsx' --glob '!*.patch' 2>/dev/null || true)

  if [ -n "$SERVER_BROWSER_GLOBALS" ]; then
    echo "\n⚠️  Browser globals found in files without 'use client' (ensure these are client components):"
    echo "$SERVER_BROWSER_GLOBALS"
  else
    echo "\n✅ No browser-only globals detected in server components scan"
  fi
fi

# F) Client components using server-only cache APIs
if command -v rg >/dev/null 2>&1; then
  CLIENT_SERVER_CACHE=$(rg -n --multiline "(?s)^'use client'.*(revalidatePath|revalidateTag|unstable_cache)" $APP_AND_COMP --glob '!*.patch' 2>/dev/null || true)
  if [ -n "$CLIENT_SERVER_CACHE" ]; then
    echo "\n❌ Client components calling server-only cache APIs:"
    echo "$CLIENT_SERVER_CACHE"
  else
    echo "\n✅ No server-only cache APIs used in client components"
  fi
fi

# G) Client components using require()
if command -v rg >/dev/null 2>&1; then
  CLIENT_REQUIRE=$(rg -n --multiline "(?s)^'use client'.*\\brequire\\(" $APP_AND_COMP --glob '!*.patch' 2>/dev/null || true)
  if [ -n "$CLIENT_REQUIRE" ]; then
    echo "\n⚠️  Client components using require() (prefer ESM imports + dynamic() boundaries):"
    echo "$CLIENT_REQUIRE"
  else
    echo "\n✅ No require() calls found in client components"
  fi
fi


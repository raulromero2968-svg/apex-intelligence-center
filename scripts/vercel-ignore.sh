#!/bin/bash
# Vercel Ignore Script - Skip builds if only mobile code changed
# This script returns exit code 0 to skip build, 1 to proceed with build

set -e

echo "🔍 Checking if build should be skipped..."

# If VERCEL_GIT_PREVIOUS_SHA is not set, this is the first deployment - always build
if [ -z "$VERCEL_GIT_PREVIOUS_SHA" ]; then
  echo "✅ First deployment detected - proceeding with build"
  exit 1
fi

# Get list of changed files between previous and current commit
CHANGED_FILES=$(git diff --name-only $VERCEL_GIT_PREVIOUS_SHA $VERCEL_GIT_COMMIT_SHA)

echo "📝 Changed files:"
echo "$CHANGED_FILES"

# Check if any changes are outside of apps/mobile
NON_MOBILE_CHANGES=$(echo "$CHANGED_FILES" | grep -v "^apps/mobile/" || true)

if [ -z "$NON_MOBILE_CHANGES" ]; then
  echo "⏭️  Only mobile code changed - skipping web build"
  exit 0
else
  echo "✅ Web-related changes detected - proceeding with build"
  echo "Changed files outside mobile:"
  echo "$NON_MOBILE_CHANGES"
  exit 1
fi

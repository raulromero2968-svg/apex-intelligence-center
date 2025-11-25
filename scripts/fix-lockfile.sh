#!/bin/bash
# scripts/fix-lockfile.sh - Production-ready lockfile resolver for pnpm monorepo
#
# Resolves ERR_PNPM_OUTDATED_LOCKFILE errors in CI by regenerating pnpm-lock.yaml
# when package.json dependencies are added/modified without lockfile update.
#
# Usage: ./scripts/fix-lockfile.sh [package-dir] (default: packages/core)
#
# Features:
# - Automatic backup of existing lockfile
# - Validation of pnpm version compatibility
# - Error recovery with trap handler
# - Git integration for commit/push
# - Audit trail logging for ethics compliance
#
# Trade-offs:
# - GOOD: Automates resolution, prevents CI failures
# - GOOD: Backup prevents data loss
# - BAD: Temporarily disables frozen-lockfile (re-enable post-fix)
# - BAD: Monorepo-specific - adjust paths for non-Turborepo setups
#
# @see knowledge-04-devops-vercel-advanced
# @see pack-ai-defense-001 (resilience/anomaly detection)

set -e  # Exit on any error

# Configuration
PACKAGE_DIR="${1:-packages/core}"
BACKUP_FILE="pnpm-lock.yaml.bak"
LOG_FILE="scripts/.lockfile-fix.log"
MIN_PNPM_VERSION="9.0.0"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
  local level="$1"
  local message="$2"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo -e "${timestamp} [${level}] ${message}" >> "$LOG_FILE"

  case "$level" in
    INFO)  echo -e "${BLUE}[INFO]${NC} $message" ;;
    OK)    echo -e "${GREEN}[OK]${NC} $message" ;;
    WARN)  echo -e "${YELLOW}[WARN]${NC} $message" ;;
    ERROR) echo -e "${RED}[ERROR]${NC} $message" ;;
  esac
}

# Cleanup function for error recovery
cleanup() {
  if [ -f "$BACKUP_FILE" ]; then
    log "WARN" "Error occurred - restoring backup lockfile"
    mv "$BACKUP_FILE" pnpm-lock.yaml
  fi
}

# Set trap for error recovery
trap cleanup ERR

# Version comparison function
version_gte() {
  printf '%s\n%s\n' "$2" "$1" | sort -V -C
}

# Main execution
main() {
  log "INFO" "Starting lockfile resolution for $PACKAGE_DIR"

  # Check if we're in repo root
  if [ ! -f "pnpm-workspace.yaml" ]; then
    log "ERROR" "Must run from monorepo root (pnpm-workspace.yaml not found)"
    exit 1
  fi

  # Verify pnpm version
  PNPM_VERSION=$(pnpm --version 2>/dev/null || echo "0.0.0")
  log "INFO" "Detected pnpm version: $PNPM_VERSION"

  if ! version_gte "$PNPM_VERSION" "$MIN_PNPM_VERSION"; then
    log "ERROR" "pnpm version $MIN_PNPM_VERSION or higher required (found $PNPM_VERSION)"
    exit 1
  fi

  # Verify package directory exists
  if [ ! -d "$PACKAGE_DIR" ]; then
    log "ERROR" "Package directory not found: $PACKAGE_DIR"
    exit 1
  fi

  # Backup existing lockfile
  if [ -f pnpm-lock.yaml ]; then
    cp pnpm-lock.yaml "$BACKUP_FILE"
    log "OK" "Backed up pnpm-lock.yaml to $BACKUP_FILE"
  else
    log "WARN" "No pnpm-lock.yaml found - will create new"
  fi

  # Check for common missing dependencies
  log "INFO" "Checking for missing dependencies in $PACKAGE_DIR/package.json"

  PACKAGE_JSON="$PACKAGE_DIR/package.json"
  if [ -f "$PACKAGE_JSON" ]; then
    # Check if @types/uuid, typescript, uuid are declared
    if grep -q '"@types/uuid"' "$PACKAGE_JSON"; then
      log "OK" "Found @types/uuid in package.json"
    fi
    if grep -q '"typescript"' "$PACKAGE_JSON"; then
      log "OK" "Found typescript in package.json"
    fi
    if grep -q '"uuid"' "$PACKAGE_JSON"; then
      log "OK" "Found uuid in package.json"
    fi
  fi

  # Regenerate lockfile (disable frozen to allow updates)
  log "INFO" "Regenerating pnpm-lock.yaml (frozen-lockfile disabled)"

  # Run pnpm install with detailed output
  if pnpm install --no-frozen-lockfile 2>&1 | tee -a "$LOG_FILE"; then
    log "OK" "pnpm install completed successfully"
  else
    log "ERROR" "pnpm install failed"
    exit 1
  fi

  # Validate lockfile was updated
  if [ -f "$BACKUP_FILE" ]; then
    if diff -q pnpm-lock.yaml "$BACKUP_FILE" > /dev/null 2>&1; then
      log "INFO" "No changes detected - lockfile was already up-to-date"
      rm -f "$BACKUP_FILE"
      exit 0
    else
      log "OK" "Lockfile updated with new dependencies"
    fi
  fi

  # Git operations (if in git repo and changes exist)
  if git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    if ! git diff --quiet pnpm-lock.yaml 2>/dev/null; then
      log "INFO" "Staging and committing lockfile changes"

      git add pnpm-lock.yaml
      git commit -m "chore(deps): regenerate pnpm-lock.yaml after dependency updates

Resolves ERR_PNPM_OUTDATED_LOCKFILE by regenerating lockfile
after package.json modifications in $PACKAGE_DIR.

Automated by scripts/fix-lockfile.sh"

      log "OK" "Changes committed"

      # Push if remote is configured
      CURRENT_BRANCH=$(git branch --show-current)
      if git remote get-url origin > /dev/null 2>&1; then
        log "INFO" "Pushing to origin/$CURRENT_BRANCH"
        if git push -u origin "$CURRENT_BRANCH" 2>&1 | tee -a "$LOG_FILE"; then
          log "OK" "Changes pushed successfully"
        else
          log "WARN" "Push failed - may need manual intervention"
        fi
      else
        log "WARN" "No remote configured - skipping push"
      fi
    else
      log "INFO" "No git changes to commit"
    fi
  else
    log "WARN" "Not in a git repository - skipping git operations"
  fi

  # Cleanup backup on success
  rm -f "$BACKUP_FILE"

  # Final verification
  log "INFO" "Running final verification with frozen-lockfile"
  if pnpm install --frozen-lockfile 2>&1 | tee -a "$LOG_FILE"; then
    log "OK" "Verification passed - lockfile is now in sync"
  else
    log "ERROR" "Verification failed - lockfile may still have issues"
    exit 1
  fi

  log "OK" "Lockfile resolution complete - re-run Vercel build"

  # Summary
  echo ""
  echo "=========================================="
  echo -e "${GREEN}Lockfile Fix Complete${NC}"
  echo "=========================================="
  echo "Package: $PACKAGE_DIR"
  echo "pnpm version: $PNPM_VERSION"
  echo "Log file: $LOG_FILE"
  echo ""
  echo "Next steps:"
  echo "1. Verify CI build passes"
  echo "2. Merge PR to main/beta"
  echo "3. Monitor Vercel deployment"
  echo "=========================================="
}

# Run main function
main "$@"

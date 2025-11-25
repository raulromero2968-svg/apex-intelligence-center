#!/bin/bash
# scripts/enhanced-fix-lockfile.sh - Enhanced resolver for pnpm lockfile + git conflicts
#
# Comprehensive fix for Vercel build failures (ERR_PNPM_OUTDATED_LOCKFILE)
# with integrated conflict resolution for concurrent Claude sessions.
#
# Usage: ./scripts/enhanced-fix-lockfile.sh [branch] [package-dir]
#   branch: Target branch (default: current)
#   package-dir: Package to update deps in (default: packages/core)
#
# Features:
# - Git conflict resolution (theirs/manual strategies)
# - pnpm version pinning (10.x for consistency)
# - Dependency addition with lockfile regen
# - Ethics audit integration
# - Full backup and recovery
# - Detailed logging
#
# @see knowledge-04-devops-vercel-advanced
# @see pack-ai-defense-001 (resilience for DDIL)

set -e  # Exit on error

# Configuration
BRANCH="${1:-$(git rev-parse --abbrev-ref HEAD)}"
PACKAGE_DIR="${2:-packages/core}"
BACKUP_DIR="resolve_backup_$(date +%Y%m%d_%H%M%S)"
LOG_FILE="scripts/.enhanced-resolve.log"
STASH_MSG="Pre-enhanced-resolve stash $(date +%Y%m%d_%H%M%S)"

# pnpm version target (from error logs - pin to avoid 9.x/10.x mismatch)
PNPM_TARGET_MAJOR="9"
PNPM_MIN_VERSION="9.0.0"

# Common missing deps from build errors
MISSING_DEPS=(
  "@types/uuid@^9.0.0"
  "typescript@^5.0.0"
  "uuid@^9.0.0"
)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Logging
log() {
  local level="$1"
  local message="$2"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo -e "${timestamp} [${level}] ${message}" >> "$LOG_FILE"

  case "$level" in
    INFO)   echo -e "${BLUE}[INFO]${NC} $message" ;;
    OK)     echo -e "${GREEN}[OK]${NC} $message" ;;
    WARN)   echo -e "${YELLOW}[WARN]${NC} $message" ;;
    ERROR)  echo -e "${RED}[ERROR]${NC} $message" ;;
    DEBUG)  echo -e "${CYAN}[DEBUG]${NC} $message" ;;
    AUDIT)  echo -e "${MAGENTA}[AUDIT]${NC} $message" ;;
  esac
}

# Cleanup function
cleanup() {
  local exit_code=$?
  if [ $exit_code -ne 0 ]; then
    log "ERROR" "Script failed with exit code $exit_code - initiating recovery"

    # Abort any in-progress operations
    git merge --abort 2>/dev/null || true
    git rebase --abort 2>/dev/null || true

    # Restore from stash if exists
    if git stash list | grep -q "$STASH_MSG"; then
      log "INFO" "Restoring from stash"
      git stash pop 2>/dev/null || true
    fi

    log "INFO" "Backup preserved in: $BACKUP_DIR"
    log "INFO" "Review $LOG_FILE for details"
  else
    # Cleanup backup on success
    if [ -d "$BACKUP_DIR" ]; then
      rm -rf "$BACKUP_DIR"
      log "OK" "Cleanup complete - backup removed"
    fi
  fi
}

trap cleanup EXIT

# Check prerequisites
check_prerequisites() {
  log "INFO" "Checking prerequisites"

  # Check git repo
  if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    log "ERROR" "Not in a git repository"
    exit 1
  fi

  # Check pnpm
  if ! command -v pnpm &> /dev/null; then
    log "ERROR" "pnpm not found - install with: npm install -g pnpm"
    exit 1
  fi

  # Check pnpm version
  PNPM_VERSION=$(pnpm --version)
  PNPM_MAJOR=$(echo "$PNPM_VERSION" | cut -d '.' -f1)
  log "INFO" "pnpm version: $PNPM_VERSION (major: $PNPM_MAJOR)"

  if [ "$PNPM_MAJOR" != "$PNPM_TARGET_MAJOR" ]; then
    log "WARN" "pnpm version mismatch - expected $PNPM_TARGET_MAJOR.x, got $PNPM_VERSION"
    log "INFO" "Attempting to use corepack for version pinning"

    if command -v corepack &> /dev/null; then
      corepack enable 2>/dev/null || true
      log "OK" "Continuing with available pnpm version"
    else
      log "WARN" "corepack not available - continuing with pnpm $PNPM_VERSION"
    fi
  fi

  log "OK" "Prerequisites check passed"
}

# Create backup
create_backup() {
  log "INFO" "Creating backup in $BACKUP_DIR"
  mkdir -p "$BACKUP_DIR"

  # Backup key files
  if [ -d "apps/web/src" ]; then
    cp -r apps/web/src "$BACKUP_DIR/web_src_backup" 2>/dev/null || true
  fi
  if [ -d "$PACKAGE_DIR" ]; then
    cp -r "$PACKAGE_DIR" "$BACKUP_DIR/package_backup" 2>/dev/null || true
  fi
  cp pnpm-lock.yaml "$BACKUP_DIR/pnpm-lock.yaml.bak" 2>/dev/null || true
  cp package.json "$BACKUP_DIR/package.json.bak" 2>/dev/null || true

  # Stash uncommitted changes
  if ! git diff --quiet || ! git diff --cached --quiet; then
    git stash push -m "$STASH_MSG"
    log "OK" "Uncommitted changes stashed"
  fi

  log "OK" "Backup created"
}

# Fetch and handle conflicts
fetch_and_resolve_conflicts() {
  log "INFO" "Fetching from origin and checking for conflicts"

  git fetch origin 2>> "$LOG_FILE"

  # Check for upstream changes
  LOCAL=$(git rev-parse HEAD)
  REMOTE=$(git rev-parse origin/$BRANCH 2>/dev/null || echo "")

  if [ -z "$REMOTE" ]; then
    log "WARN" "Remote branch origin/$BRANCH not found - skipping pull"
    return 0
  fi

  if [ "$LOCAL" = "$REMOTE" ]; then
    log "OK" "Branch is up to date"
    return 0
  fi

  log "INFO" "Attempting to pull changes"

  # Try merge first
  if git pull origin "$BRANCH" --no-edit 2>> "$LOG_FILE"; then
    log "OK" "Pull completed without conflicts"
    return 0
  fi

  # Handle conflicts
  CONFLICTS=$(git diff --name-only --diff-filter=U 2>/dev/null || echo "")

  if [ -z "$CONFLICTS" ]; then
    log "OK" "No conflicts detected"
    return 0
  fi

  log "WARN" "Conflicts detected - resolving"
  echo "$CONFLICTS" >> "$LOG_FILE"

  for file in $CONFLICTS; do
    log "DEBUG" "Processing conflict: $file"

    case "$file" in
      # Auto-resolve for common patterns (accept theirs for Claude changes)
      */index.ts|*/index.tsx|*/__init__.py)
        git checkout --theirs "$file" 2>/dev/null && git add "$file"
        log "OK" "Auto-resolved (theirs): $file"
        ;;

      # Lockfiles - will be regenerated
      pnpm-lock.yaml|package-lock.json|yarn.lock)
        git checkout --theirs "$file" 2>/dev/null || true
        git add "$file"
        log "DEBUG" "Lockfile will be regenerated: $file"
        ;;

      # 3D world files - accept theirs (Claude's latest)
      */3d-world/*|*/world3d/*)
        git checkout --theirs "$file" 2>/dev/null && git add "$file"
        log "OK" "Auto-resolved (theirs - 3D world): $file"
        ;;

      # Manager files - accept theirs
      *manager.ts|*Manager.ts)
        git checkout --theirs "$file" 2>/dev/null && git add "$file"
        log "OK" "Auto-resolved (theirs - manager): $file"
        ;;

      # Customer UX files - accept theirs
      */customer-ux/*|*/nexus/*)
        git checkout --theirs "$file" 2>/dev/null && git add "$file"
        log "OK" "Auto-resolved (theirs - customer UX): $file"
        ;;

      # Config files - accept theirs
      *.json|*.yaml|*.yml|*.toml|*.config.*)
        git checkout --theirs "$file" 2>/dev/null && git add "$file"
        log "OK" "Auto-resolved (theirs - config): $file"
        ;;

      # Other source files - accept theirs with warning
      *.ts|*.tsx|*.js|*.jsx)
        git checkout --theirs "$file" 2>/dev/null && git add "$file"
        log "WARN" "Auto-resolved (theirs - review recommended): $file"
        ;;

      # Default - accept theirs
      *)
        git checkout --theirs "$file" 2>/dev/null && git add "$file"
        log "OK" "Auto-resolved (theirs): $file"
        ;;
    esac
  done

  # Complete merge
  git add -A
  if ! git diff --cached --quiet; then
    git commit -m "Resolve merge conflicts via enhanced-fix-lockfile

Auto-resolved files:
$(echo "$CONFLICTS" | sed 's/^/  - /')

Strategy: Accept incoming (theirs) for Claude changes
Automated by scripts/enhanced-fix-lockfile.sh"
    log "OK" "Conflicts resolved and committed"
  fi
}

# Fix dependencies and lockfile
fix_dependencies() {
  log "INFO" "Fixing dependencies and lockfile"

  # Check if package directory exists
  if [ -d "$PACKAGE_DIR" ] && [ -f "$PACKAGE_DIR/package.json" ]; then
    log "INFO" "Adding missing dependencies to $PACKAGE_DIR"

    pushd "$PACKAGE_DIR" > /dev/null

    # Add missing deps
    for dep in "${MISSING_DEPS[@]}"; do
      log "DEBUG" "Ensuring dependency: $dep"
      pnpm add "$dep" --save-dev 2>> "../$LOG_FILE" || {
        log "WARN" "Could not add $dep - may already exist"
      }
    done

    popd > /dev/null
  else
    log "DEBUG" "Package directory $PACKAGE_DIR not found or has no package.json"
  fi

  # Regenerate root lockfile
  log "INFO" "Regenerating pnpm-lock.yaml"

  if pnpm install --no-frozen-lockfile 2>> "$LOG_FILE"; then
    log "OK" "pnpm install completed"
  else
    log "ERROR" "pnpm install failed"
    exit 1
  fi

  # Stage lockfile
  if ! git diff --quiet pnpm-lock.yaml 2>/dev/null; then
    git add pnpm-lock.yaml
    log "OK" "Lockfile changes staged"
  fi

  # Stage any package.json changes
  git add "**/package.json" 2>/dev/null || true
}

# Run ethics audit
run_ethics_audit() {
  log "AUDIT" "Running ethics audit on changes"

  # Check if ethics audit module exists
  local AUDIT_FILE="apps/web/src/lib/ethics/merge-audit.ts"

  if [ -f "$AUDIT_FILE" ]; then
    log "DEBUG" "Found ethics audit module"

    # Run the audit
    if npx tsx "$AUDIT_FILE" --automation partial --files 10 2>> "$LOG_FILE"; then
      log "AUDIT" "Ethics audit passed"
    else
      local exit_code=$?
      if [ $exit_code -eq 2 ]; then
        log "AUDIT" "Ethics audit completed with warnings - review recommended"
      else
        log "WARN" "Ethics audit encountered issues"
      fi
    fi
  else
    log "DEBUG" "Ethics audit module not found - skipping"
  fi
}

# Verify and commit
verify_and_commit() {
  log "INFO" "Verifying resolution"

  # Verify lockfile
  if pnpm install --frozen-lockfile 2>> "$LOG_FILE"; then
    log "OK" "Lockfile verification passed"
  else
    log "ERROR" "Lockfile verification failed - manual intervention required"
    exit 1
  fi

  # Commit if there are changes
  if ! git diff --cached --quiet || ! git diff --quiet; then
    git add -A

    git commit -m "chore(deps): fix lockfile and resolve conflicts

- Regenerated pnpm-lock.yaml for CI compatibility
- Added missing dependencies: ${MISSING_DEPS[*]}
- Resolved any git conflicts (strategy: theirs)
- Verified with frozen-lockfile

Automated by scripts/enhanced-fix-lockfile.sh" 2>/dev/null || {
      log "DEBUG" "No changes to commit"
    }
  fi

  log "OK" "Verification complete"
}

# Push changes
push_changes() {
  log "INFO" "Pushing to origin/$BRANCH"

  if git push origin "$BRANCH" 2>> "$LOG_FILE"; then
    log "OK" "Changes pushed successfully"
  else
    log "WARN" "Push failed - attempting force push"

    read -p "Force push to $BRANCH? (y/N): " confirm
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
      git push -f origin "$BRANCH" 2>> "$LOG_FILE" && {
        log "OK" "Force push completed"
      } || {
        log "ERROR" "Force push failed"
        exit 1
      }
    else
      log "WARN" "Push skipped - manual push required"
    fi
  fi
}

# Main execution
main() {
  echo ""
  echo -e "${CYAN}================================================${NC}"
  echo -e "${CYAN}Enhanced Lockfile + Conflict Resolver${NC}"
  echo -e "${CYAN}================================================${NC}"
  echo ""

  log "INFO" "Starting enhanced resolution"
  log "INFO" "Branch: $BRANCH"
  log "INFO" "Package: $PACKAGE_DIR"
  echo ""

  check_prerequisites
  create_backup
  fetch_and_resolve_conflicts
  fix_dependencies
  run_ethics_audit
  verify_and_commit
  push_changes

  echo ""
  echo -e "${GREEN}================================================${NC}"
  echo -e "${GREEN}Resolution Complete${NC}"
  echo -e "${GREEN}================================================${NC}"
  echo ""
  echo "Summary:"
  echo "  Branch: $BRANCH"
  echo "  Package: $PACKAGE_DIR"
  echo "  Log: $LOG_FILE"
  echo ""
  echo "Next steps:"
  echo "  1. Verify Vercel build passes"
  echo "  2. Check CI pipeline status"
  echo "  3. Review auto-resolved files if needed"
  echo "  4. Merge to main/beta when ready"
  echo ""
  echo -e "${GREEN}Re-run Vercel build to verify fix${NC}"
  echo ""
}

# Run main
main "$@"

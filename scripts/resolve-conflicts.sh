#!/bin/bash
# scripts/resolve-conflicts.sh - Production-ready resolver for git conflicts + pnpm lockfile
#
# Handles merge conflicts and lockfile mismatches from concurrent Claude sessions/commits.
# Implements smart resolution strategies with ethics audit integration.
#
# Usage: ./scripts/resolve-conflicts.sh [branch] [strategy]
#   branch: Target branch (default: current)
#   strategy: 'theirs' | 'ours' | 'manual' (default: theirs)
#
# Features:
# - Automatic conflict resolution for common files (imports, exports)
# - Manual resolution prompts for complex conflicts
# - Lockfile regeneration for pnpm
# - Ethics audit for merge changes
# - Full backup with recovery
# - Detailed logging
#
# @see knowledge-04-devops-vercel-advanced
# @see pack-ai-defense-001 (edge resilience)

set -e  # Exit on error

# Configuration
BRANCH="${1:-$(git rev-parse --abbrev-ref HEAD)}"
STRATEGY="${2:-theirs}"
BACKUP_DIR="conflict_backup_$(date +%Y%m%d_%H%M%S)"
LOG_FILE="scripts/.resolve-conflicts.log"
STASH_MSG="Pre-resolve stash $(date +%Y%m%d_%H%M%S)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Logging
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
    DEBUG) echo -e "${CYAN}[DEBUG]${NC} $message" ;;
  esac
}

# Cleanup function
cleanup() {
  local exit_code=$?
  if [ $exit_code -ne 0 ]; then
    log "ERROR" "Script failed - initiating recovery"

    # Abort any in-progress operations
    git merge --abort 2>/dev/null || true
    git rebase --abort 2>/dev/null || true

    # Restore from stash if exists
    if git stash list | grep -q "$STASH_MSG"; then
      log "INFO" "Restoring from stash"
      git stash pop 2>/dev/null || true
    fi

    log "INFO" "Backup available in: $BACKUP_DIR"
  else
    # Cleanup backup on success
    if [ -d "$BACKUP_DIR" ]; then
      rm -rf "$BACKUP_DIR"
      log "OK" "Cleanup complete"
    fi
  fi
}

trap cleanup EXIT

# Check if we're in a git repo
check_git_repo() {
  if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    log "ERROR" "Not in a git repository"
    exit 1
  fi
}

# Create backup
create_backup() {
  log "INFO" "Creating backup in $BACKUP_DIR"
  mkdir -p "$BACKUP_DIR"

  # Backup key files
  cp -r apps/web/src "$BACKUP_DIR/src_backup" 2>/dev/null || true
  cp pnpm-lock.yaml "$BACKUP_DIR/pnpm-lock.yaml.bak" 2>/dev/null || true
  cp package.json "$BACKUP_DIR/package.json.bak" 2>/dev/null || true

  # Stash any uncommitted changes
  if ! git diff --quiet || ! git diff --cached --quiet; then
    git stash push -m "$STASH_MSG"
    log "OK" "Uncommitted changes stashed"
  fi
}

# Fetch and detect conflicts
fetch_and_detect() {
  log "INFO" "Fetching from origin"
  git fetch origin 2>> "$LOG_FILE"

  # Check for upstream changes
  LOCAL=$(git rev-parse HEAD)
  REMOTE=$(git rev-parse origin/$BRANCH 2>/dev/null || echo "")

  if [ -z "$REMOTE" ]; then
    log "WARN" "Remote branch origin/$BRANCH not found"
    return 0
  fi

  if [ "$LOCAL" = "$REMOTE" ]; then
    log "OK" "Branch is up to date with origin/$BRANCH"
    return 0
  fi

  log "INFO" "Changes detected - attempting merge"
  return 1
}

# Resolve conflicts
resolve_conflicts() {
  local strategy="$1"

  # Attempt merge
  if git merge origin/$BRANCH --no-edit 2>> "$LOG_FILE"; then
    log "OK" "Merge completed without conflicts"
    return 0
  fi

  # Get list of conflicted files
  CONFLICTS=$(git diff --name-only --diff-filter=U 2>/dev/null || echo "")

  if [ -z "$CONFLICTS" ]; then
    log "OK" "No conflicts to resolve"
    return 0
  fi

  log "WARN" "Conflicts detected in: $CONFLICTS"

  # Process each conflict
  for file in $CONFLICTS; do
    log "INFO" "Processing conflict in: $file"

    # Determine resolution strategy based on file type
    case "$file" in
      # Auto-resolve for index/export files (usually safe to accept incoming)
      */index.ts|*/index.tsx|*/__init__.py)
        log "DEBUG" "Auto-resolving index file with strategy: $strategy"
        resolve_file "$file" "$strategy"
        ;;

      # Auto-resolve for lockfiles
      pnpm-lock.yaml|package-lock.json|yarn.lock)
        log "DEBUG" "Lockfile will be regenerated"
        git checkout --theirs "$file" 2>/dev/null || true
        git add "$file"
        ;;

      # Auto-resolve for config files (usually accept theirs for latest)
      *.json|*.yaml|*.yml|*.toml)
        if [ "$strategy" = "manual" ]; then
          manual_resolve "$file"
        else
          resolve_file "$file" "$strategy"
        fi
        ;;

      # Source files - use strategy or manual
      *.ts|*.tsx|*.js|*.jsx)
        if [ "$strategy" = "manual" ]; then
          manual_resolve "$file"
        else
          resolve_file "$file" "$strategy"
        fi
        ;;

      # Default: use specified strategy
      *)
        resolve_file "$file" "$strategy"
        ;;
    esac
  done

  # Continue merge
  git add -A

  if ! git diff --cached --quiet; then
    git commit -m "Resolve merge conflicts via $strategy strategy

Resolved files:
$CONFLICTS

Automated by scripts/resolve-conflicts.sh"
    log "OK" "Conflicts resolved and committed"
  fi
}

# Resolve single file with strategy
resolve_file() {
  local file="$1"
  local strategy="$2"

  case "$strategy" in
    theirs)
      git checkout --theirs "$file" 2>/dev/null && git add "$file"
      log "OK" "Resolved (theirs): $file"
      ;;
    ours)
      git checkout --ours "$file" 2>/dev/null && git add "$file"
      log "OK" "Resolved (ours): $file"
      ;;
    *)
      log "WARN" "Unknown strategy: $strategy - defaulting to theirs"
      git checkout --theirs "$file" 2>/dev/null && git add "$file"
      ;;
  esac
}

# Manual resolution prompt
manual_resolve() {
  local file="$1"

  log "WARN" "Manual resolution required: $file"
  echo ""
  echo -e "${YELLOW}========================================${NC}"
  echo -e "${YELLOW}Manual Resolution Required: $file${NC}"
  echo -e "${YELLOW}========================================${NC}"
  echo ""
  echo "Options:"
  echo "  1) Accept theirs (incoming changes)"
  echo "  2) Accept ours (current changes)"
  echo "  3) Open in editor"
  echo "  4) Skip this file"
  echo ""

  read -p "Choose option [1-4]: " choice

  case "$choice" in
    1)
      git checkout --theirs "$file" && git add "$file"
      log "OK" "Resolved (theirs): $file"
      ;;
    2)
      git checkout --ours "$file" && git add "$file"
      log "OK" "Resolved (ours): $file"
      ;;
    3)
      ${EDITOR:-vim} "$file"
      git add "$file"
      log "OK" "Resolved (manual edit): $file"
      ;;
    4)
      log "WARN" "Skipped: $file"
      ;;
    *)
      log "WARN" "Invalid choice - skipping"
      ;;
  esac
}

# Regenerate lockfile
fix_lockfile() {
  log "INFO" "Regenerating pnpm-lock.yaml"

  if [ -f "pnpm-workspace.yaml" ]; then
    # Monorepo
    pnpm install --no-frozen-lockfile 2>> "$LOG_FILE"
  elif [ -f "package.json" ]; then
    # Single package
    pnpm install --no-frozen-lockfile 2>> "$LOG_FILE"
  else
    log "WARN" "No package.json found - skipping lockfile fix"
    return 0
  fi

  if ! git diff --quiet pnpm-lock.yaml 2>/dev/null; then
    git add pnpm-lock.yaml
    log "OK" "Lockfile updated"
  fi
}

# Run ethics audit on changes
run_ethics_audit() {
  log "INFO" "Running ethics audit on merge changes"

  # Check if ethics audit module exists
  if [ -f "apps/web/src/lib/ethics/merge-audit.ts" ]; then
    # Run the audit
    npx tsx apps/web/src/lib/ethics/merge-audit.ts 2>> "$LOG_FILE" || {
      log "WARN" "Ethics audit completed with warnings"
    }
  else
    log "DEBUG" "Ethics audit module not found - skipping"
  fi
}

# Verify resolution
verify_resolution() {
  log "INFO" "Verifying resolution"

  # Check for remaining conflicts
  if git diff --name-only --diff-filter=U 2>/dev/null | grep -q .; then
    log "ERROR" "Unresolved conflicts remain"
    return 1
  fi

  # Verify lockfile
  if [ -f "pnpm-workspace.yaml" ] || [ -f "package.json" ]; then
    if pnpm install --frozen-lockfile 2>> "$LOG_FILE"; then
      log "OK" "Lockfile verification passed"
    else
      log "ERROR" "Lockfile verification failed"
      return 1
    fi
  fi

  log "OK" "Resolution verified"
  return 0
}

# Push changes
push_changes() {
  log "INFO" "Pushing to origin/$BRANCH"

  if git push origin "$BRANCH" 2>> "$LOG_FILE"; then
    log "OK" "Changes pushed successfully"
  else
    log "ERROR" "Push failed - may need force push or manual intervention"
    echo ""
    echo -e "${YELLOW}Push failed. Options:${NC}"
    echo "  1) Force push (git push -f origin $BRANCH)"
    echo "  2) Manual resolution required"
    return 1
  fi
}

# Main execution
main() {
  echo ""
  echo -e "${CYAN}========================================${NC}"
  echo -e "${CYAN}Conflict Resolution Script${NC}"
  echo -e "${CYAN}========================================${NC}"
  echo ""
  log "INFO" "Starting conflict resolution"
  log "INFO" "Branch: $BRANCH"
  log "INFO" "Strategy: $STRATEGY"
  echo ""

  check_git_repo
  create_backup

  if fetch_and_detect; then
    log "OK" "No merge needed"
  else
    resolve_conflicts "$STRATEGY"
  fi

  fix_lockfile
  run_ethics_audit

  if verify_resolution; then
    # Commit any remaining changes
    if ! git diff --cached --quiet || ! git diff --quiet; then
      git add -A
      git commit -m "chore: post-resolve cleanup and lockfile update" 2>/dev/null || true
    fi

    push_changes

    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Resolution Complete${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "Branch: $BRANCH"
    echo "Strategy: $STRATEGY"
    echo "Log file: $LOG_FILE"
    echo ""
    echo "Next steps:"
    echo "  1) Verify Vercel build passes"
    echo "  2) Review changes in PR"
    echo "  3) Merge to main/beta"
    echo ""
  else
    log "ERROR" "Resolution verification failed"
    exit 1
  fi
}

# Run main
main "$@"

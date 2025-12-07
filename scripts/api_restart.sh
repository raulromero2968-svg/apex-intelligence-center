#!/bin/bash
# API Restart Script for Quick Recovery
# Reference: docs/security/DISASTER_RECOVERY_PLAYBOOK.md
# Usage: ./scripts/api_restart.sh [--force]

set -e

# Configuration
APP_NAME="${APP_NAME:-apex-api}"
HEALTH_ENDPOINT="${HEALTH_ENDPOINT:-http://localhost:3000/api/health}"
HAPROXY_SOCKET="${HAPROXY_SOCKET:-/var/run/haproxy.sock}"
MAX_RETRIES=30
RETRY_DELAY=5
LOG_FILE="/var/log/apex/api_restart.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}"
    echo "${timestamp} [${level}] ${message}" >> "${LOG_FILE}" 2>/dev/null || true
}

info() { log "INFO" "${GREEN}$*${NC}"; }
warn() { log "WARN" "${YELLOW}$*${NC}"; }
error() { log "ERROR" "${RED}$*${NC}"; }

check_dependencies() {
    local deps=("pm2" "curl")
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            error "Required dependency not found: $dep"
            exit 1
        fi
    done
}

disable_in_loadbalancer() {
    local hostname=$(hostname)
    if [[ -S "$HAPROXY_SOCKET" ]]; then
        info "Disabling server in HAProxy load balancer..."
        echo "disable server backend/${hostname}" | socat "$HAPROXY_SOCKET" stdio 2>/dev/null || {
            warn "Failed to disable in HAProxy (socket may not exist)"
        }
    else
        warn "HAProxy socket not found, skipping load balancer disable"
    fi
}

enable_in_loadbalancer() {
    local hostname=$(hostname)
    if [[ -S "$HAPROXY_SOCKET" ]]; then
        info "Re-enabling server in HAProxy load balancer..."
        echo "enable server backend/${hostname}" | socat "$HAPROXY_SOCKET" stdio 2>/dev/null || {
            warn "Failed to enable in HAProxy"
        }
    fi
}

wait_for_health() {
    info "Waiting for application to become healthy..."
    local attempt=1
    while [[ $attempt -le $MAX_RETRIES ]]; do
        if curl -sf "$HEALTH_ENDPOINT" > /dev/null 2>&1; then
            info "Health check passed!"
            return 0
        fi
        warn "Health check attempt $attempt/$MAX_RETRIES failed, retrying in ${RETRY_DELAY}s..."
        sleep $RETRY_DELAY
        ((attempt++))
    done
    error "Health check failed after $MAX_RETRIES attempts"
    return 1
}

restart_pm2() {
    local force=$1

    info "Checking PM2 status..."
    if ! pm2 describe "$APP_NAME" > /dev/null 2>&1; then
        error "Application '$APP_NAME' not found in PM2"
        info "Attempting to start from ecosystem config..."
        if [[ -f "ecosystem.config.js" ]]; then
            pm2 start ecosystem.config.js
        else
            error "No ecosystem.config.js found"
            return 1
        fi
    fi

    if [[ "$force" == "--force" ]]; then
        warn "Force restart requested - killing PM2 daemon..."
        pm2 kill
        sleep 2
        if [[ -f "ecosystem.config.js" ]]; then
            pm2 start ecosystem.config.js
        else
            pm2 start "$APP_NAME"
        fi
    else
        info "Gracefully reloading $APP_NAME..."
        pm2 reload "$APP_NAME" --update-env
    fi
}

main() {
    local force=""
    if [[ "$1" == "--force" ]]; then
        force="--force"
        warn "Force mode enabled"
    fi

    info "Starting API restart procedure..."
    info "Application: $APP_NAME"
    info "Health endpoint: $HEALTH_ENDPOINT"

    check_dependencies

    # Step 1: Disable in load balancer
    disable_in_loadbalancer

    # Step 2: Restart PM2
    if ! restart_pm2 "$force"; then
        error "Failed to restart application"
        enable_in_loadbalancer
        exit 1
    fi

    # Step 3: Wait for health
    if ! wait_for_health; then
        error "Application failed to become healthy"
        error "Manual intervention required"
        # Still try to enable in load balancer for manual debugging
        enable_in_loadbalancer
        exit 1
    fi

    # Step 4: Re-enable in load balancer
    enable_in_loadbalancer

    info "API restart completed successfully!"

    # Log final status
    pm2 status "$APP_NAME"
}

# Run main function
main "$@"

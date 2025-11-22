# Migration Application Script for 20251119_add_notified_to_watchlist_items
# This script applies the migration to local/dev, staging, and production databases

param(
    [Parameter(Mandatory=$false)]
    [string]$Environment = "local"
)

$ErrorActionPreference = "Stop"
$LogFile = "../../AGENTS/REPORTS/migration-20251119-notified-all-envs.log"

function Write-Log {
    param([string]$Message)
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "[$Timestamp] $Message"
    Write-Host $LogMessage
    Add-Content -Path $LogFile -Value $LogMessage
}

function Verify-Column {
    param([string]$EnvName)
    Write-Log "Verifying 'notified' column in $EnvName database..."
    
    $result = npx prisma db execute --schema=prisma/schema.prisma --file=./prisma/check_notified_column.sql 2>&1
    Write-Log "Verification result for $EnvName :"
    Write-Log $result
    
    return $result
}

Write-Log "========================================="
Write-Log "Migration: 20251119_add_notified_to_watchlist_items"
Write-Log "Environment: $Environment"
Write-Log "========================================="

if ($Environment -eq "local" -or $Environment -eq "dev") {
    Write-Log "Applying migration to local/dev database..."
    npx prisma migrate dev --name 20251119_add_notified_to_watchlist_items 2>&1 | Tee-Object -FilePath $LogFile -Append
    Verify-Column "local/dev"
}
elseif ($Environment -eq "staging") {
    Write-Log "Applying migration to staging database..."
    if (-not $env:DATABASE_URL) {
        Write-Log "ERROR: DATABASE_URL environment variable not set for staging"
        Write-Log "Please set it using: `$env:DATABASE_URL='<staging_database_url>'"
        exit 1
    }
    npx prisma migrate deploy 2>&1 | Tee-Object -FilePath $LogFile -Append
    Verify-Column "staging"
}
elseif ($Environment -eq "production") {
    Write-Log "Applying migration to production database..."
    if (-not $env:DATABASE_URL) {
        Write-Log "ERROR: DATABASE_URL environment variable not set for production"
        Write-Log "Please set it using: `$env:DATABASE_URL='<production_database_url>'"
        exit 1
    }
    npx prisma migrate deploy 2>&1 | Tee-Object -FilePath $LogFile -Append
    Verify-Column "production"
}

Write-Log "========================================="
Write-Log "Migration process completed for $Environment"
Write-Log "========================================="


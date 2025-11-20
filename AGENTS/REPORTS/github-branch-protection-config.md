# GitHub Main Branch Protection Configuration Guide

## Repository
**Repo:** `raulromero2968-svg/apex-intelligence-center`  
**Branch:** `main`  
**URL:** https://github.com/raulromero2968-svg/apex-intelligence-center/settings/branches

## Required Configuration

### Branch Protection Rule Settings

#### 1. Branch Name Pattern
- **Pattern:** `main`

#### 2. Protect Matching Branches

##### Require a Pull Request Before Merging
- ✅ **Enable:** Require a pull request before merging
- ✅ **Require approvals:** Set to **2** (two disciples)
- ✅ **Dismiss stale pull request approvals when new commits are pushed**
- ✅ **Require review from Code Owners** (if CODEOWNERS file exists)

##### Require Status Checks to Pass Before Merging
- ✅ **Enable:** Require status checks to pass before merging
- ✅ **Require branches to be up to date before merging**

**Required Status Checks:**
Based on the CI workflows, the main status check is:
- `verify` (from `.github/workflows/pr-ci.yml`)

This job includes all the following checks:
- Lint
- Verify barrels
- Verify schema sync
- Verify Drizzle syntax
- Test
- Typecheck
- Build
- Perf budget
- Repo sanity
- And other quality checks

**Note:** If you want to require individual step checks, you would need to split the workflow into separate jobs. For now, requiring the `verify` job covers all checks.

##### Require Conversation Resolution Before Merging
- ✅ **Enable:** Require conversation resolution before merging

##### Restrict Who Can Push to Matching Branches
- ✅ **Enable:** Restrict who can push to matching branches
- **Allowed:** Only release/infra automation (if any)
- **Blocked:** All regular users (no direct pushes allowed)

##### Do Not Allow Bypassing the Above Settings
- ✅ **Enable:** Do not allow bypassing the above settings
- This prevents even admins from bypassing protection rules

## Verification Steps

### 1. Test Direct Push Rejection
```bash
# Attempt a direct push to main (should be rejected)
git checkout main
git commit --allow-empty -m "Test direct push"
git push origin main
# Expected: Push rejected with branch protection error
```

### 2. Test PR Requirements
1. Create a test branch
2. Make a small change
3. Open a PR targeting `main`
4. Verify:
   - Status checks must be green before merge is allowed
   - At least 2 approvals are required
   - Cannot merge with failing checks
   - Cannot merge with unresolved conversations

### 3. Screenshot Requirements
Capture a screenshot showing:
- Required status checks list (with `verify` checked)
- "2 required approvals" setting
- "Do not allow bypassing" enabled
- All protection rules active

**Save screenshot as:** `AGENTS/REPORTS/github-main-branch-protection-final.png`

## Current CI Workflow Jobs

From `.github/workflows/pr-ci.yml`:
- **Job:** `verify` - Main CI job with all quality checks
- **Job:** `streaming-check` - Optional streaming feature check

From `.github/workflows/ci-cd.yml`:
- **Job:** `build-test-deploy` - Build, test, and deploy job

From `.github/workflows/ci-turborepo.yml`:
- **Job:** `build-and-test` - Turborepo cached build and test

## Recommended Status Checks

For maximum protection, require:
1. `verify` (primary - includes all checks)
2. Optionally: `build-test-deploy` if you want separate deployment validation

## Implementation Date
**Date:** November 19, 2025  
**Status:** Apex Intelligence Main Branch Protection - IMMORTAL


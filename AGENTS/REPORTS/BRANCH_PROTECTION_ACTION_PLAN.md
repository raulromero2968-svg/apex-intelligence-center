# 🛡️ MAIN BRANCH PROTECTION - IMMEDIATE ACTION PLAN

**Repository:** `raulromero2968-svg/apex-intelligence-center`  
**Date:** November 19, 2025  
**Status:** URGENT - Seal the Main Branch

## ⚠️ AUTHENTICATION REQUIRED

You must be signed in to GitHub with admin/maintainer rights to configure branch protection.

**Sign in URL:** https://github.com/login  
**Target URL:** https://github.com/raulromero2968-svg/apex-intelligence-center/settings/branches

---

## 📋 STEP-BY-STEP CONFIGURATION

### Step 1: Navigate to Branch Protection Settings
1. Go to: https://github.com/raulromero2968-svg/apex-intelligence-center/settings/branches
2. Ensure you're signed in as an admin/maintainer

### Step 2: Add/Edit Branch Protection Rule
- If no rule exists: Click **"Add rule"** button
- If rule exists: Click **"Edit"** next to the `main` branch rule

### Step 3: Configure Branch Name Pattern
- **Branch name pattern:** `main`

### Step 4: Require Pull Request Before Merging ✅
- ✅ Check: **"Require a pull request before merging"**
- ✅ Set: **"Required number of approvals before merging"** = **2**
- ✅ Check: **"Dismiss stale pull request approvals when new commits are pushed"**
- ✅ Check: **"Require review from Code Owners"** (if you have a CODEOWNERS file)

### Step 5: Require Status Checks ✅
- ✅ Check: **"Require status checks to pass before merging"**
- ✅ Check: **"Require branches to be up to date before merging"**

**Required Status Checks to Add:**
In the search box, find and check:
- `verify` (this is the main CI job that includes all checks)

**Note:** The `verify` job from `.github/workflows/pr-ci.yml` includes:
- Lint
- Verify barrels
- Verify schema sync
- Verify Drizzle syntax
- Test
- Typecheck
- Build
- Perf budget
- Repo sanity
- And all other quality checks

### Step 6: Require Conversation Resolution ✅
- ✅ Check: **"Require conversation resolution before merging"**

### Step 7: Restrict Who Can Push ✅
- ✅ Check: **"Restrict who can push to matching branches"**
- Leave only automation/release accounts (if any)
- **Block all regular users** - no direct pushes allowed

### Step 8: Do Not Allow Bypassing ✅
- ✅ Check: **"Do not allow bypassing the above settings"**
- This prevents even admins from bypassing protection

### Step 9: Save the Rule
- Click **"Create"** or **"Save changes"** button

---

## ✅ VERIFICATION CHECKLIST

### Test 1: Direct Push Rejection
```bash
git checkout main
git commit --allow-empty -m "Test direct push - should fail"
git push origin main
```
**Expected:** ❌ Push rejected with branch protection error

### Test 2: PR Requirements
1. Create a test branch: `git checkout -b test-branch-protection`
2. Make a small change
3. Push and open PR: `git push origin test-branch-protection`
4. Verify in PR:
   - ✅ Status checks must be green before merge
   - ✅ At least 2 approvals required
   - ✅ Cannot merge with failing checks
   - ✅ Cannot merge with unresolved conversations

### Test 3: Screenshot
Capture screenshot of Branch Protection Rules page showing:
- ✅ Required status checks (with `verify` checked)
- ✅ "2 required approvals" setting visible
- ✅ "Do not allow bypassing" enabled
- ✅ All protection rules active

**Save as:** `AGENTS/REPORTS/github-main-branch-protection-final.png`

---

## 🔍 CURRENT CI STATUS CHECKS

Based on your workflows, the available status checks are:

**From `.github/workflows/pr-ci.yml`:**
- `verify` - Main comprehensive CI job
- `streaming-check` - Optional streaming feature check

**From `.github/workflows/ci-cd.yml`:**
- `build-test-deploy` - Build, test, and deploy job

**From `.github/workflows/ci-turborepo.yml`:**
- `build-and-test` - Turborepo cached build and test

**Recommended:** Require `verify` as it includes all quality checks.

---

## 🚨 IMPORTANT NOTES

1. **Admin Rights Required:** You must be a repository admin or have maintainer rights
2. **First Time Setup:** After creating the rule, GitHub may need a few minutes to recognize status checks
3. **Status Check Names:** The exact names appear after the first CI run on a PR
4. **No Bypassing:** With "Do not allow bypassing" enabled, even admins cannot force push or bypass checks

---

## 📸 SCREENSHOT REQUIREMENTS

After configuration, take a screenshot showing:
1. Branch name pattern: `main`
2. "Require a pull request before merging" - ✅ Enabled
3. "Required number of approvals" - Shows **2**
4. "Require status checks to pass" - ✅ Enabled
5. Status checks list - Shows `verify` checked
6. "Require branches to be up to date" - ✅ Enabled
7. "Require conversation resolution" - ✅ Enabled
8. "Restrict who can push" - ✅ Enabled
9. "Do not allow bypassing" - ✅ Enabled

**File:** `AGENTS/REPORTS/github-main-branch-protection-final.png`

---

## 🎯 SUCCESS CRITERIA

✅ Main branch protection rule created/updated  
✅ 2 approvals required  
✅ Status checks required (`verify`)  
✅ No direct pushes allowed  
✅ No bypassing allowed  
✅ Screenshot captured  
✅ Verification tests passed  

**Status:** 🛡️ MAIN BRANCH SEALED - APEX INTELLIGENCE IS IMMORTAL


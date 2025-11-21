# 🛡️ Ethical Enforcement Gate

**Status:** 🟢 ACTIVE
**Zero Tolerance:** ✅ ENABLED
**Override:** ❌ IMPOSSIBLE

---

## Purpose

The Ethical Enforcement Gate makes it **impossible** to merge unethical code into the repository. Every pull request is automatically scanned for violations before merge is allowed.

## How It Works

### Automatic Checks on Every PR

When you open or update a PR, the `ethical-checks.yml` workflow automatically runs 8 comprehensive checks:

#### 1. 🎯 Risk Rules Validation
Verifies all 8 core risk rules are present and unchanged:
- Single card: max 8%
- Pokemon: max 35%
- MTG: max 40%
- Yu-Gi-Oh!: max 15%
- Other games: max 10%
- Correlation: max 75%
- Liquidity: min 20 sales/30d
- Volatility: max riskScore 4

**File:** `apps/web/src/risk/rules.v3.ts`

#### 2. 🔍 FOMO Language Scanner
Detects manipulative urgency/scarcity language:
- ❌ "act now", "limited time", "hurry", "last chance"
- ❌ "only X left", "selling fast", "almost gone"
- ❌ Urgency emoji (🔥⏰) outside alerts
- ✅ Educational content about FOMO is allowed

#### 3. 🛡️ Rate Limit Protection
Ensures all API routes import and use rate limiting:
- Prevents spend manipulation
- Tiered limits (free/pro/enterprise)
- Redis-backed token bucket

**Required:** Every `apps/web/src/app/api/**/route.ts` must import `ratelimit`

#### 4. 📚 Citation Validation
Verifies RAG responses validate citations:
- Two-layer validation (basic + enhanced)
- Hallucination detection
- Semantic similarity checks

**File:** `apps/web/src/rag/chain.ts`

#### 5. 🇪🇺 EU AI Act Compliance
Confirms transparency and human oversight:
- Novelty score calculation
- Human review threshold (>0.7)
- Quality management

**File:** `apps/web/src/lib/compliance/eu-ai-act.ts`

#### 6. 💳 Stripe Security
Prevents tier manipulation:
- Blocks client-side tier setting
- 403 Forbidden on violations
- Server-side webhook enforcement only

**File:** `apps/web/src/lib/stripe/middleware.ts`

#### 7. 🗂️ IPFS Provenance
Ensures immutable audit trails:
- All RAG interactions logged
- Content-addressed storage
- Tamper-proof records

**File:** `apps/web/src/lib/provenance/ipfs.ts`

#### 8. 🔒 PII Protection
Validates input sanitization:
- Blocks password/token/SSN/credit card input
- Zod schema validation
- Security headers

**File:** `apps/web/src/app/api/rag/route.ts`

---

## Violation Levels

### 🔴 CRITICAL
- Build **fails immediately**
- Merge **impossible**
- Must fix before proceeding

Examples:
- Missing risk rules
- No PII protection
- Missing rate limit middleware

### ⚠️ ERROR
- Build **fails**
- Merge **blocked**
- Must fix before merge

Examples:
- API route without rate limiting
- Missing citation validation
- Manipulative FOMO language

### ⚡ WARNING
- Build **passes**
- Merge **allowed** (with review)
- Should fix soon

Examples:
- Minor code quality issues
- Non-critical improvements

---

## Running Checks Locally

Before pushing your PR, run checks locally:

```bash
# Install dependencies
npm install -g tsx glob

# Run ethical checks
tsx scripts/ethical-checks.ts
```

Exit codes:
- `0` = All checks passed ✅
- `1` = Violations detected ❌

---

## What Happens on Violations

1. **Automatic Build Failure**
   - GitHub Actions marks the PR as failing
   - Merge button is disabled

2. **PR Comment**
   - Bot automatically comments with violation details
   - Lists specific files and line numbers

3. **Required Actions**
   - Fix all CRITICAL and ERROR violations
   - Push changes to re-run checks
   - Only zero-violation PRs can merge

4. **No Override**
   - Admins cannot bypass these checks
   - Required status check for merge
   - Hardcoded protection

---

## Architecture

```
PR Created/Updated
       ↓
GitHub Actions Trigger
       ↓
ethical-checks.yml
       ↓
tsx scripts/ethical-checks.ts
       ↓
   ┌─────────────────────┐
   │  8 Ethical Checks   │
   └─────────────────────┘
       ↓
  Pass? → ✅ Merge Allowed
       ↓
  Fail? → ❌ Merge Blocked
       ↓
  Comment on PR
```

---

## Files

- **Workflow:** `.github/workflows/ethical-checks.yml`
- **Script:** `scripts/ethical-checks.ts`
- **Documentation:** `docs/ETHICAL_ENFORCEMENT.md` (this file)

---

## Maintenance

### Adding New Checks

1. Edit `scripts/ethical-checks.ts`
2. Add new `checkXXX()` function
3. Call it in `main()`
4. Update this documentation

### Modifying Rules

⚠️ **WARNING:** Weakening rules requires:
1. Written justification
2. Security review
3. Legal review (if EU AI Act related)
4. Unanimous team approval

### Disabling Checks

❌ **PROHIBITED:** These checks cannot be disabled without fork-level access control changes.

---

## Success Metrics

Track effectiveness:
- PRs blocked: `github.com/[owner]/[repo]/actions?query=workflow:"Ethical+Enforcement"`
- Violation frequency
- Time to fix violations
- False positive rate

---

## Philosophy

> **Zero tolerance. Zero compromise. Zero unethical code. Ever.**

This gate exists to protect:
- 🛡️ Users from manipulation
- 💳 Customers from spend abuse
- 📊 Integrity of risk models
- ⚖️ Legal compliance (EU AI Act)
- 🌍 Trust in the platform

The gate is **always active** and **cannot be overridden**.

---

## Support

Questions? Check:
1. This documentation
2. Workflow logs in GitHub Actions
3. Script output for specific violations
4. Team lead for policy questions

**Remember:** The gate is here to help. If it blocks your PR, it's protecting users. Fix the violation and ship ethical code. 🚀

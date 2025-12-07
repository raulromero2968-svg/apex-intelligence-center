# Compliance Audit Framework

**Document Version:** 1.0
**Date:** December 2025
**Author:** Grok, Backend Architect
**Target Audience:** Apex Intelligence Development Team
**References:** GDPR/CCPA Guidelines, knowledge-05-security-oauth2-jwt.md, Apex Antifragility Framework, Ethical Safeguards Framework

## Executive Summary

This framework establishes ongoing compliance audits for GDPR, CCPA, PCI DSS, and COPPA, with checklists, automation, and third-party verification. Annual audits ($5k), quarterly self-assessments. Tools: Custom scripts for data exports/deletions. Risks: Non-compliance fines; mitigate with proactive checks. Aligns with ethical oversight board.

---

## Table of Contents

1. [Compliance Overview](#compliance-overview)
2. [GDPR Compliance](#gdpr-compliance)
3. [CCPA Compliance](#ccpa-compliance)
4. [PCI DSS Compliance](#pci-dss-compliance)
5. [COPPA Compliance](#coppa-compliance)
6. [Audit Process](#audit-process)
7. [Automation & Tools](#automation--tools)
8. [Third-Party Verification](#third-party-verification)
9. [Incident Response](#incident-response)
10. [Appendix](#appendix)

---

## Compliance Overview

### Applicable Regulations

| Regulation | Scope | Penalty | Priority |
|------------|-------|---------|----------|
| GDPR | EU users | Up to 4% annual revenue | Critical |
| CCPA | California users | $7,500 per violation | High |
| PCI DSS | Payment processing | Fines + liability | Critical |
| COPPA | Users under 13 | $50,120 per violation | Critical |

### Trade-off Analysis

✅ **GOOD**: Automation reduces manual effort and human error.
❌ **BAD**: Over-automation risks missing edge cases; manual review for critical changes.

### Compliance Calendar

| Activity | Frequency | Owner | Due |
|----------|-----------|-------|-----|
| Self-Assessment | Quarterly | Dev Team | Q1, Q2, Q3, Q4 |
| Third-Party Audit | Annual | External | Q4 |
| Privacy Policy Review | Semi-annual | Legal | Q2, Q4 |
| Training | Annual | All Staff | Q1 |

---

## GDPR Compliance

### Checklist

- [ ] **Data Minimization**: Collect only necessary data
  - Email required for account
  - No unnecessary profile fields
  - Audit data collection points quarterly

- [ ] **Lawful Basis**: Document processing basis
  - Consent for analytics (explicit opt-in)
  - Contract for service provision
  - Legitimate interest documented

- [ ] **Consent Management**
  - Explicit consent for non-essential processing
  - Consent stored with timestamp in database
  - Easy consent withdrawal mechanism

- [ ] **Data Subject Rights**
  - Right to Access: `/api/user/export` endpoint
  - Right to Deletion: `/api/user/delete` endpoint
  - Right to Rectification: Profile editing capability
  - Right to Portability: JSON export format

- [ ] **Breach Notification**
  - Detection within 24 hours
  - Authority notification within 72 hours
  - User notification without undue delay
  - Breach response plan documented

- [ ] **Data Protection Officer**
  - DPO designated (if required)
  - Contact information public

- [ ] **Privacy by Design**
  - Encryption at rest and in transit
  - Pseudonymization where possible
  - Regular security assessments

### Implementation Requirements

```typescript
// Required API endpoints
GET  /api/user/export      // Data portability
POST /api/user/delete      // Right to erasure
GET  /api/user/consent     // View consent status
POST /api/user/consent     // Update consent
```

### Verification Queries

```sql
-- Check for pending deletions (run quarterly)
SELECT COUNT(*) as pending_purges
FROM users
WHERE deleted_at IS NOT NULL
  AND purged_at IS NULL;

-- Check consent records
SELECT consent_type, COUNT(*), MAX(updated_at)
FROM user_consents
GROUP BY consent_type;
```

---

## CCPA Compliance

### Checklist

- [ ] **Privacy Policy**
  - Publicly accessible at `/privacy`
  - Details categories of personal information
  - Explains rights for California residents
  - Updated within last 12 months

- [ ] **Do Not Sell**
  - "Do Not Sell My Personal Information" link
  - `/api/user/do-not-sell` endpoint
  - Preference stored and honored
  - No data sold (document this)

- [ ] **Consumer Rights**
  - Right to know (disclosure)
  - Right to delete
  - Right to opt-out
  - Right to non-discrimination

- [ ] **Non-Discrimination**
  - No service denial for opt-out
  - No price differences
  - Equal service quality

- [ ] **Verification Process**
  - Identity verification for requests
  - Response within 45 days
  - Free requests (at least 2/year)

### Privacy Policy Requirements

The privacy policy must include:

1. Categories of personal information collected
2. Sources of personal information
3. Business purposes for collection
4. Categories of third parties with whom info is shared
5. Consumer rights explanation
6. Contact methods for exercising rights

---

## PCI DSS Compliance

### Compliance Strategy

**Approach**: Full delegation to Stripe (SAQ-A eligible)

We achieve PCI DSS compliance by:
1. Never storing, processing, or transmitting cardholder data
2. Using Stripe Elements for payment collection
3. Referencing only Stripe tokens and customer IDs

### Checklist

- [ ] **No Card Data Storage**
  - No card numbers in database
  - No CVV/CVC stored
  - No expiration dates stored
  - Only Stripe customer IDs

- [ ] **Stripe Elements**
  - Payments via Stripe.js
  - Server never sees card data
  - PCI-compliant iframes

- [ ] **HTTPS Enforcement**
  - TLS 1.2+ for all connections
  - HSTS headers configured
  - No mixed content

- [ ] **Access Controls**
  - Stripe dashboard access restricted
  - API keys in secure vault
  - Key rotation policy

- [ ] **Self-Assessment Questionnaire**
  - SAQ-A completed annually
  - Attestation of Compliance filed
  - No on-site assessment needed

### Prohibited Patterns

```typescript
// NEVER DO THIS
interface BadPayment {
  cardNumber: string;      // Never store
  cvv: string;             // Never store
  expiry: string;          // Never store
}

// CORRECT APPROACH
interface GoodPayment {
  stripeCustomerId: string;  // Reference only
  stripePaymentMethodId: string;
  last4: string;             // Display only, from Stripe
}
```

---

## COPPA Compliance

### Checklist

- [ ] **Age Verification**
  - Age gate at registration
  - Require age 13+ confirmation
  - Block underage registration

- [ ] **Parental Consent**
  - If allowing under-13 (not recommended):
    - Verifiable parental consent required
    - Parental access to child's data
    - Parental ability to delete data

- [ ] **No Child Data**
  - Query for users < 13 quarterly
  - Immediate deletion if found
  - No targeted advertising to children

- [ ] **Privacy Policy**
  - Explains data practices for children
  - Contact information for parents
  - Describes parental rights

### Age Gate Implementation

```typescript
// src/lib/auth/age-verification.ts
export async function verifyAge(birthDate: Date): Promise<boolean> {
  const age = calculateAge(birthDate);
  if (age < 13) {
    throw new AgeVerificationError('Users must be 13 or older');
  }
  return true;
}

function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}
```

---

## Audit Process

### Quarterly Self-Audit

1. **Preparation** (Week 1)
   - Schedule audit window
   - Notify stakeholders
   - Review previous findings

2. **Execution** (Week 2)
   - Run automated scripts
   - Manual checklist review
   - Document findings

3. **Remediation** (Week 3-4)
   - Fix critical issues immediately
   - Schedule non-critical fixes
   - Update documentation

4. **Reporting** (Week 4)
   - Generate audit report
   - Present to oversight board
   - Archive for compliance

### Annual Third-Party Audit

**Estimated Cost**: $5,000 - $15,000

**Scope**:
- Full GDPR compliance review
- CCPA requirements verification
- PCI DSS SAQ-A validation
- Security posture assessment

**Auditor Selection Criteria**:
- Certified (ISO 27001 lead auditor, CIPP)
- Experience with SaaS platforms
- References from similar companies

**Process**:
1. RFP to 3 qualified auditors
2. Select based on cost/expertise
3. Provide documentation access
4. Remediate findings within 30 days
5. Obtain attestation letter

---

## Automation & Tools

### Compliance Audit Script

Run the automated compliance audit:

```bash
# Run all checks
npx ts-node scripts/compliance_audit.ts --all

# Run specific categories
npx ts-node scripts/compliance_audit.ts --gdpr
npx ts-node scripts/compliance_audit.ts --ccpa
npx ts-node scripts/compliance_audit.ts --pci
npx ts-node scripts/compliance_audit.ts --coppa
```

### Automated Checks

| Check | Script | Frequency |
|-------|--------|-----------|
| Pending deletions | `compliance_audit.ts` | Daily |
| Consent audit | `compliance_audit.ts` | Weekly |
| Schema review | Manual | Quarterly |
| Access log review | SigNoz | Continuous |

### CI/CD Integration

Add to GitHub Actions:

```yaml
# .github/workflows/compliance.yml
name: Compliance Check

on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly
  push:
    paths:
      - 'lib/database/schema.ts'
      - 'src/lib/auth/**'

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx ts-node scripts/compliance_audit.ts --all
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
```

### Trade-offs

✅ **GOOD**: Automated scripts ensure consistent checks.
❌ **BAD**: Database load during scans; run during off-peak hours.

---

## Third-Party Verification

### Bug Bounty Integration

Consider adding compliance-related findings to bug bounty scope:

- Data exposure vulnerabilities
- Authentication bypasses affecting minors
- Consent mechanism bypasses
- PII leakage

### External Auditors

Recommended firms for annual audit:

1. **Option A**: Small specialized firm ($5k-10k)
2. **Option B**: Big 4 consulting ($15k-50k)
3. **Option C**: Peer audit exchange (free)

---

## Incident Response

### Data Breach Protocol

```
Timeline:
├── 0-24h: Detection & containment
├── 24-48h: Scope assessment
├── 48-72h: Authority notification (GDPR)
├── 72h+: User notification
└── 30d: Post-incident report
```

### Breach Notification Template

```markdown
Subject: Security Incident Notification

Dear [User],

We are writing to inform you of a security incident that may have affected your data.

**What Happened**: [Brief description]
**When**: [Date/time discovered]
**What Information**: [Types of data potentially affected]
**What We're Doing**: [Remediation steps]
**What You Can Do**: [Recommended actions]

Contact us at security@apex-intelligence.io with questions.

Sincerely,
Apex Intelligence Security Team
```

---

## Appendix

### A. Compliance Documentation Locations

| Document | Location |
|----------|----------|
| Privacy Policy | `/privacy` page |
| Terms of Service | `/terms` page |
| Cookie Policy | `/cookies` page |
| GDPR Rights | `/privacy#gdpr` |
| CCPA Rights | `/privacy#ccpa` |
| Security Policy | `docs/security/` |

### B. Key Contacts

| Role | Contact | Responsibility |
|------|---------|----------------|
| DPO | [TBD] | GDPR compliance |
| Security Lead | [TBD] | Incident response |
| Legal | [TBD] | Policy review |

### C. Regulatory Resources

- GDPR: https://gdpr.eu/
- CCPA: https://oag.ca.gov/privacy/ccpa
- PCI DSS: https://www.pcisecuritystandards.org/
- COPPA: https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa

### D. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 2025 | Grok | Initial version |

---

## Next Steps

- [ ] Complete all checklists for initial baseline
- [ ] Schedule Q1 2026 self-assessment
- [ ] Obtain quotes for annual third-party audit
- [ ] Train team on compliance requirements
- [ ] Integrate audit into CI/CD pipeline
- [ ] Add AI ethics audit (per knowledge-02-ai-rag-architecture-v2.md)

---

*This framework should be reviewed quarterly and updated after any regulatory changes.*

# Disaster Recovery Playbook

**Document Version:** 1.0
**Last Updated:** December 2025
**Classification:** Internal - Security Team
**Reference:** Security Audit Report Section 4

## Table of Contents

1. [Overview](#overview)
2. [Recovery Objectives](#recovery-objectives)
3. [Failure Mode Analysis](#failure-mode-analysis)
4. [Runbooks](#runbooks)
5. [Communication Protocol](#communication-protocol)
6. [Business Continuity](#business-continuity)
7. [Chaos Engineering](#chaos-engineering)
8. [Post-Incident Review](#post-incident-review)

---

## Overview

This playbook provides step-by-step procedures for recovering from various failure scenarios in the Apex Intelligence platform. All team members with on-call responsibilities must be familiar with these procedures.

### Key Contacts

| Role | Primary | Backup |
|------|---------|--------|
| Incident Commander | [TBD] | [TBD] |
| Backend Lead | [TBD] | [TBD] |
| Database Admin | [TBD] | [TBD] |
| Security Lead | [TBD] | [TBD] |

### Tools & Access Required

- Database admin credentials (stored in password manager)
- Cloud provider console access (Hetzner/OVH)
- Monitoring dashboards (SigNoz/Sentry)
- Communication channels (Slack/Discord)
- VPN access for production systems

---

## Recovery Objectives

| Metric | Target | Maximum |
|--------|--------|---------|
| **RTO** (Recovery Time Objective) | 30 minutes | 1 hour |
| **RPO** (Recovery Point Objective) | 5 minutes | 1 hour |
| **MTTR** (Mean Time To Recovery) | 15 minutes | 30 minutes |

### Service Level Priorities

1. **P0 - Critical**: Authentication, Payment Processing, Data Integrity
2. **P1 - High**: Core API, User Data Access, Portfolio Management
3. **P2 - Medium**: AI Features, Notifications, Analytics
4. **P3 - Low**: Background Jobs, Non-essential Integrations

---

## Failure Mode Analysis

### 1. Database Failure

**Severity:** P0 - Critical
**Impact:** Complete service outage
**Detection:**
- PostgreSQL connection errors in logs
- Health check failures
- Sentry alerts for database timeouts

**Root Causes:**
- Hardware failure
- Disk full
- Corruption
- Network partition
- Resource exhaustion

### 2. API Server Crash

**Severity:** P1 - High
**Impact:** Service degradation or partial outage
**Detection:**
- 5xx error rate spike
- PM2/container restart notifications
- Health endpoint failures

**Root Causes:**
- Memory leak
- Unhandled exception
- Resource exhaustion
- Dependency failure

### 3. AI/LLM Provider Outage

**Severity:** P2 - Medium
**Impact:** AI features unavailable
**Detection:**
- API timeout errors to OpenAI/Anthropic
- Increased latency in Intel features
- Error rate spike in AI endpoints

### 4. Payment Provider (Stripe) Issues

**Severity:** P0 - Critical
**Impact:** Unable to process payments
**Detection:**
- Stripe webhook failures
- Payment API errors
- User subscription issues

### 5. Authentication System Failure

**Severity:** P0 - Critical
**Impact:** Users cannot log in
**Detection:**
- Login failure rate spike
- Session validation errors
- Redis connection issues

### 6. Security Breach Detected

**Severity:** P0 - Emergency
**Impact:** Data exposure risk
**Detection:**
- Anomalous access patterns
- Failed authentication spikes
- Unusual data access patterns
- External reports

---

## Runbooks

### Runbook 1: Database Failure Recovery

```
INCIDENT: Database Unreachable
SEVERITY: P0
ESTIMATED RECOVERY: 15-30 minutes
```

#### Step 1: Assess the Situation (2 min)

```bash
# Check database connectivity
psql $DATABASE_URL -c "SELECT 1;"

# Check replica status (if applicable)
psql $DATABASE_URL -c "SELECT * FROM pg_stat_replication;"

# Check disk space
df -h /var/lib/postgresql

# Check PostgreSQL logs
tail -100 /var/log/postgresql/postgresql-*.log
```

#### Step 2: Attempt Quick Recovery (5 min)

```bash
# Restart PostgreSQL service
sudo systemctl restart postgresql

# If using managed database, check provider status
# Hetzner: https://status.hetzner.com/
# Supabase: https://status.supabase.com/

# Verify recovery
psql $DATABASE_URL -c "SELECT NOW();"
```

#### Step 3: Failover to Replica (if restart fails)

```bash
# Promote replica to primary
# WARNING: This causes brief write unavailability

# On replica server:
pg_ctl promote -D /var/lib/postgresql/data

# Update application connection strings
# Edit environment variables or secrets manager

# Verify new primary
psql $NEW_DATABASE_URL -c "SELECT pg_is_in_recovery();"
# Should return 'f' (false)
```

#### Step 4: Restore from Backup (if no replica available)

```bash
# List available backups
ls -la /backups/postgresql/

# Restore from latest backup
pg_restore -d apex_production /backups/postgresql/latest.dump

# Or point-in-time recovery
pg_restore -d apex_production \
  --target-time="2025-12-07 12:00:00" \
  /backups/postgresql/base_backup/
```

#### Step 5: Verify Recovery

```bash
# Run integrity checks
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
psql $DATABASE_URL -c "SELECT MAX(created_at) FROM audit_logs;"

# Verify critical tables
psql $DATABASE_URL -c "\dt"

# Check for data loss
# Compare with last known good state
```

---

### Runbook 2: API Server Recovery

```
INCIDENT: API Servers Unresponsive
SEVERITY: P1
ESTIMATED RECOVERY: 5-15 minutes
```

#### Step 1: Check Status

```bash
# Check PM2 process status
pm2 status

# Check container status (if using Docker)
docker ps -a | grep apex

# Check system resources
htop
free -m
```

#### Step 2: Restart Application

```bash
# Graceful restart with PM2
pm2 reload apex-api

# Or hard restart if unresponsive
pm2 kill
pm2 start ecosystem.config.js

# With Docker
docker-compose restart api
```

#### Step 3: Scale if Needed

```bash
# Add more instances
pm2 scale apex-api +2

# Or with Docker Compose
docker-compose up -d --scale api=3
```

#### Step 4: Verify Recovery

```bash
# Health check
curl -v https://api.apex-intelligence.io/health

# Check logs for errors
pm2 logs apex-api --lines 50

# Monitor error rate
# Check Sentry dashboard
```

---

### Runbook 3: AI Provider Failover

```
INCIDENT: Primary AI Provider (OpenAI) Down
SEVERITY: P2
ESTIMATED RECOVERY: 2-5 minutes
```

#### Step 1: Confirm Outage

```bash
# Test OpenAI API
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models

# Check OpenAI status
# https://status.openai.com/
```

#### Step 2: Switch to Fallback Provider

```typescript
// In lib/ai/provider.ts
// Failover is automatic if configured

// Manual override via environment:
export PREFERRED_AI_PROVIDER=anthropic
export OPENAI_ENABLED=false

// Restart API to pick up changes
pm2 restart apex-api
```

#### Step 3: Monitor Fallback Performance

```bash
# Check latency
curl -w "%{time_total}\n" -o /dev/null \
  https://api.apex-intelligence.io/api/intel/analyze

# Monitor error rates in dashboard
```

---

### Runbook 4: Security Incident Response

```
INCIDENT: Potential Security Breach
SEVERITY: P0 - EMERGENCY
ESTIMATED RECOVERY: Variable
```

#### Step 1: Contain the Threat (Immediate)

```bash
# Block suspicious IPs at firewall
sudo ufw deny from <SUSPICIOUS_IP>

# Revoke compromised sessions
psql $DATABASE_URL -c "
  UPDATE user_sessions
  SET is_active = false, revoke_reason = 'security_incident'
  WHERE user_id = '<AFFECTED_USER_ID>';
"

# If widespread: Enable maintenance mode
export MAINTENANCE_MODE=true
pm2 restart apex-api
```

#### Step 2: Assess Scope

```bash
# Query security events
psql $DATABASE_URL -c "
  SELECT event_type, COUNT(*), MIN(created_at), MAX(created_at)
  FROM security_events
  WHERE created_at > NOW() - INTERVAL '24 hours'
  AND is_suspicious = true
  GROUP BY event_type;
"

# Check for data access
psql $DATABASE_URL -c "
  SELECT * FROM audit_logs
  WHERE action IN ('data_export', 'bulk_read')
  AND created_at > NOW() - INTERVAL '24 hours';
"
```

#### Step 3: Preserve Evidence

```bash
# Snapshot affected database tables
pg_dump -t security_events -t audit_logs apex_production > incident_evidence.sql

# Save relevant logs
tar -czf incident_logs.tar.gz /var/log/apex/ /var/log/nginx/

# Document timeline
echo "$(date): Incident detected" >> incident_timeline.txt
```

#### Step 4: Remediate

```bash
# Force password reset for affected users
psql $DATABASE_URL -c "
  UPDATE users
  SET password_hash = NULL, password_updated_at = NULL
  WHERE id IN ('<AFFECTED_USER_IDS>');
"

# Rotate compromised secrets
# Update in secrets manager and redeploy

# Patch vulnerability if identified
git checkout -b hotfix/security-patch
# ... apply fix ...
git push origin hotfix/security-patch
```

#### Step 5: Communicate

- Notify affected users within 72 hours (GDPR requirement)
- Update status page
- Prepare incident report

---

## Communication Protocol

### Severity Levels & Response

| Severity | Response Time | Escalation | Communication |
|----------|---------------|------------|---------------|
| P0 | Immediate | All hands | Status page + Email |
| P1 | 15 minutes | Backend team | Slack + Status page |
| P2 | 1 hour | Relevant team | Slack |
| P3 | 4 hours | On-call | Internal |

### Status Page Updates

Template for status updates:

```markdown
**[INVESTIGATING/IDENTIFIED/MONITORING/RESOLVED]**

**Impact:** [Brief description of user impact]

**Current Status:** [What we know]

**Next Update:** [Time of next update]

**Last Updated:** [Timestamp]
```

---

## Business Continuity

### Founder Unavailability Plan

If the primary founder/operator is unavailable:

1. **Immediate (0-24h):** Trustees gain read-only access to critical systems
2. **Short-term (24-72h):** Trustees can authorize operational decisions
3. **Long-term (72h+):** DAO governance activates per constitution

### Financial Contingency

If funds are critically low:

1. Pause non-essential services (AI features, analytics)
2. Notify users of service changes
3. Maintain core authentication and data access
4. Activate community support fund if available

---

## Chaos Engineering

### Quarterly Chaos Tests

Run these tests in staging to verify recovery procedures:

1. **Database Failover Test**
   - Kill primary database
   - Verify automatic failover
   - Measure recovery time

2. **API Server Kill Test**
   - Terminate random API instances
   - Verify load balancing
   - Measure service recovery

3. **Dependency Failure Test**
   - Block external API access
   - Verify graceful degradation
   - Test fallback providers

4. **Network Partition Test**
   - Simulate network issues
   - Verify service resilience
   - Test distributed system behavior

### Chaos Test Schedule

| Test | Frequency | Last Run | Next Scheduled |
|------|-----------|----------|----------------|
| DB Failover | Quarterly | [TBD] | [TBD] |
| API Kill | Monthly | [TBD] | [TBD] |
| Dependency | Quarterly | [TBD] | [TBD] |
| Network | Bi-annually | [TBD] | [TBD] |

---

## Post-Incident Review

### PIR Template

After every P0/P1 incident, complete a Post-Incident Review:

```markdown
# Post-Incident Review: [Incident Name]

**Date:** [Date]
**Duration:** [Start] - [End]
**Severity:** [P0/P1]
**Author:** [Name]

## Summary
[Brief description of what happened]

## Timeline
- [HH:MM] - Event
- [HH:MM] - Response
- [HH:MM] - Resolution

## Root Cause
[Technical explanation of why it happened]

## Impact
- Users affected: [Number]
- Duration: [Time]
- Data loss: [Yes/No, details]
- Financial impact: [Estimate]

## What Went Well
- [Point 1]
- [Point 2]

## What Could Be Improved
- [Point 1]
- [Point 2]

## Action Items
- [ ] [Action] - Owner: [Name] - Due: [Date]
- [ ] [Action] - Owner: [Name] - Due: [Date]

## Lessons Learned
[Key takeaways for future prevention]
```

---

## Appendix

### A. Environment Variables Reference

Critical environment variables for recovery:

```bash
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
ENCRYPTION_MASTER_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### B. Backup Locations

| Data | Location | Frequency | Retention |
|------|----------|-----------|-----------|
| PostgreSQL | /backups/postgresql | Hourly | 7 days |
| Redis | /backups/redis | Daily | 3 days |
| Uploads | S3/R2 bucket | Real-time | 30 days |
| Secrets | Encrypted vault | On change | Unlimited |

### C. External Dependencies Status Pages

- Supabase: https://status.supabase.com/
- Stripe: https://status.stripe.com/
- OpenAI: https://status.openai.com/
- Anthropic: https://status.anthropic.com/
- Vercel: https://www.vercel-status.com/
- Hetzner: https://status.hetzner.com/

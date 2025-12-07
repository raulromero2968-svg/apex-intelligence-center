# Disaster Recovery Playbook

**Document Version:** 1.1 (Expanded)
**Last Updated:** December 2025
**Classification:** Internal - Security Team
**Author:** Grok, Backend Architect
**Target Audience:** Apex Intelligence Development Team
**References:** AWS DR Best Practices, Chaos Monkey Guides, knowledge-04-devops-vercel-advanced.md, knowledge-09-database-architecture.md, Apex Antifragility Framework, Ethical Safeguards Framework

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Recovery Objectives](#recovery-objectives)
3. [Key Contacts](#key-contacts)
4. [Failure Mode Analysis](#failure-mode-analysis)
5. [Detailed Runbooks](#detailed-runbooks)
   - [Database Failure Recovery](#runbook-1-database-failure-recovery)
   - [API Server Recovery](#runbook-2-api-server-recovery)
   - [AI Provider Failover](#runbook-3-ai-provider-failover)
   - [Payment Processor Termination](#runbook-4-payment-processor-termination)
   - [Security Incident Response](#runbook-5-security-incident-response)
   - [Founder Incapacitation](#runbook-6-founder-incapacitation)
6. [Communication Protocol](#communication-protocol)
7. [Business Continuity](#business-continuity)
8. [Chaos Engineering](#chaos-engineering)
9. [Post-Incident Review](#post-incident-review)
10. [Appendix](#appendix)

---

## Executive Summary

This expanded playbook provides detailed, step-by-step runbooks for key failure modes, building on the initial version. Each runbook includes prerequisites, steps, verification, and rollback procedures for <1-hour RTO (Recovery Time Objective). Integration with tools like SigNoz for detection and Ansible for automation. Trade-offs analyzed with ✅ GOOD / ❌ BAD patterns. Testing: Conduct chaos engineering quarterly in staging.

**Expanded Scope:** Added runbooks for AI provider outage, payment termination, and founder incapacitation, with code snippets for automation.

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

## Key Contacts

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

## Failure Mode Analysis

### Impact Summary

| Failure Mode | Severity | Impact | Detection Time |
|--------------|----------|--------|----------------|
| Database Down | P0 | Complete service outage | < 1 min |
| API Crash | P1 | Service degradation | < 1 min |
| AI Provider Outage | P2 | Transformation failures | < 2 min |
| Payment Terminated | P0 | Revenue halt | < 5 min |
| Founder Unavailable | Strategic | Decision paralysis | 7 days |
| Security Breach | P0 | Data exposure risk | Variable |

### Trade-off Analysis

✅ **GOOD**: Proactive chaos tests build resilience.
❌ **BAD**: Over-testing in prod risks real outages; limit to staging.

### 1. Database Failure

**Severity:** P0 - Critical
**Impact:** Complete service outage
**Detection:**
- PostgreSQL connection errors in logs
- Health check failures
- SigNoz alerts for database timeouts
- Query failure rate >5%
- Replication lag >1min

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
- 5xx error rate spike (>500 errors)
- CPU utilization >90%
- PM2/container restart notifications
- Health endpoint failures

**Root Causes:**
- Memory leak
- Unhandled exception
- Resource exhaustion
- Dependency failure

### 3. AI/LLM Provider Outage

**Severity:** P2 - Medium
**Impact:** AI features unavailable, transformation failures
**Detection:**
- API timeout errors to OpenAI/Anthropic
- >10% transformation failure rate
- Increased latency in Intel features
- Error rate spike in AI endpoints

**Root Causes:**
- Provider service outage
- API quota exhaustion
- Network connectivity issues
- Rate limiting

### 4. Payment Provider (Stripe) Issues

**Severity:** P0 - Critical
**Impact:** Unable to process payments, revenue halt
**Detection:**
- Stripe webhook failures
- >50% transaction failures
- Payment API errors
- User subscription issues
- Email notification from provider

**Root Causes:**
- Provider outage
- Account termination
- Compliance issues
- Integration failures

### 5. Authentication System Failure

**Severity:** P0 - Critical
**Impact:** Users cannot log in
**Detection:**
- Login failure rate spike
- Session validation errors
- Redis connection issues

**Root Causes:**
- Session store failure
- JWT signing issues
- OAuth provider outage

### 6. Founder Incapacitation

**Severity:** Strategic
**Impact:** Decision paralysis, operational uncertainty
**Detection:**
- No check-in for 7 days (automated email)
- Dead man's switch activation

**Root Causes:**
- Health emergency
- Communication blackout
- Force majeure

---

## Detailed Runbooks

### Runbook 1: Database Failure Recovery

```
INCIDENT: Database Unreachable
SEVERITY: P0
ESTIMATED RECOVERY: 15-30 minutes
PREREQUISITES: Multi-region replicas, PITR backups, SigNoz alerts
ON-CALL: DBA or founder
```

#### Step 1: Detection & Assessment (2 min)

```bash
# Check database connectivity
psql $DATABASE_URL -c "SELECT 1;"

# Check if in recovery mode
psql $DATABASE_URL -c "SELECT pg_is_in_recovery();"

# Check replica status (if applicable)
psql $DATABASE_URL -c "SELECT * FROM pg_stat_replication;"

# Check disk space
df -h /var/lib/postgresql

# Check PostgreSQL logs
tail -100 /var/log/postgresql/postgresql-*.log
```

#### Step 2: Isolate & Quick Recovery (5 min)

```bash
# If primary is down, fence via Patroni (if configured)
patronictl failover --master <primary_name>

# Or restart PostgreSQL service
sudo systemctl restart postgresql

# If using managed database, check provider status
# Supabase: https://status.supabase.com/
# Hetzner: https://status.hetzner.com/

# Verify recovery
psql $DATABASE_URL -c "SELECT NOW();"
```

#### Step 3: Failover to Replica (if restart fails)

```bash
# Promote replica to primary
# WARNING: This causes brief write unavailability

# On replica server:
pg_ctl promote -D /var/lib/postgresql/data

# Update DNS (Route53) to new primary
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456 \
  --change-batch file://dns-update.json

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
# Run scripts/recovery.ts for automated PITR
npx ts-node scripts/recovery.ts --target-time="2025-12-07 12:00:00"
```

#### Step 5: Notify & Document

```bash
# Email users if downtime >5min
# Log to audit_logs for ethical transparency

# Update status page
echo "Database recovered at $(date)" >> /var/log/incident.log
```

#### Verification

```bash
# Run integrity checks
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
psql $DATABASE_URL -c "SELECT MAX(created_at) FROM audit_logs;"

# Verify critical tables
psql $DATABASE_URL -c "\dt"

# Monitor replication lag (should be <5s)
psql $DATABASE_URL -c "SELECT NOW() - pg_last_xact_replay_timestamp();"
```

#### Rollback

If failover was a false positive:
- Demote new primary
- Restore original primary
- Update DNS back

#### Automation

See `ansible/playbooks/db_failover.yml` for automated failover.

**Trade-offs:**
- ✅ GOOD: Automated failover minimizes human error
- ❌ BAD: DNS propagation delay (5-10min); use connection pooling failover

---

### Runbook 2: API Server Recovery

```
INCIDENT: API Servers Unresponsive
SEVERITY: P1
ESTIMATED RECOVERY: 5-15 minutes
PREREQUISITES: PM2 clustering, HAProxy load balancer, health checks
```

#### Step 1: Check Status (1 min)

```bash
# Check PM2 process status
pm2 status

# Check container status (if using Docker)
docker ps -a | grep apex

# Check system resources
htop
free -m

# Check health endpoint
curl -v http://localhost:3000/api/health
```

#### Step 2: Isolate Failed Node (2 min)

```bash
# Remove failed node from HAProxy
echo "disable server backend/$(hostname)" | socat /var/run/haproxy.sock stdio

# Or via HAProxy API
curl -X POST http://admin:password@localhost:8404/pools/backend/servers/$(hostname)/state \
  -d "state=disable"
```

#### Step 3: Restart Application (3 min)

```bash
# Graceful restart with PM2
pm2 reload apex-api

# Or hard restart if unresponsive
pm2 kill
pm2 start ecosystem.config.js

# With Docker
docker-compose restart api

# If restart fails, deploy new instance via GitHub Actions
# Trigger workflow manually or via API
```

#### Step 4: Scale if Needed

```bash
# Add more instances if load-induced
pm2 scale apex-api +2

# Or with Docker Compose
docker-compose up -d --scale api=3

# Kubernetes (Phase 3)
kubectl scale deployment apex-api --replicas=5
```

#### Step 5: Re-enable & Notify

```bash
# Wait for health
until curl -f http://localhost:3000/api/health; do sleep 5; done

# Re-add to load balancer
echo "enable server backend/$(hostname)" | socat /var/run/haproxy.sock stdio

# Slack alert to team; user message if outage >1min
```

#### Verification

```bash
# Health check
curl -v https://api.apex-intelligence.io/health

# Check response latency (should be <200ms)
curl -w "%{time_total}\n" -o /dev/null https://api.apex-intelligence.io/api/health

# Check logs for errors
pm2 logs apex-api --lines 50

# Monitor error rate in Sentry dashboard
```

#### Rollback

Re-add node to balancer if removed incorrectly.

#### Automation

See `scripts/api_restart.sh` for quick restart.

**Trade-offs:**
- ✅ GOOD: Zero-downtime with load balancer
- ❌ BAD: Cold starts slow (10s); pre-warm instances

---

### Runbook 3: AI Provider Failover

```
INCIDENT: Primary AI Provider (OpenAI) Down
SEVERITY: P2
ESTIMATED RECOVERY: <1 minute (automated), 2-5 minutes (manual)
PREREQUISITES: Multi-LLM abstraction configured
```

#### Step 1: Confirm Outage (30 sec)

```bash
# Test OpenAI API
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models

# Check OpenAI status
# https://status.openai.com/

# Check transformation failure rate in SigNoz
# Alert threshold: >10% failures
```

#### Step 2: Switch to Fallback Provider (1 min)

```typescript
// Automatic failover should trigger via lib/ai/monitor.ts
// Manual override via environment:

export PREFERRED_AI_PROVIDER=anthropic
export OPENAI_ENABLED=false

// Or update config dynamically (no restart needed)
// POST /api/admin/config
// { "primaryLLM": "anthropic" }
```

```bash
# Restart API to pick up env changes (if not using dynamic config)
pm2 restart apex-api
```

#### Step 3: Fallback to Local (if all cloud fail)

```bash
# Route to local Llama server
export PRIMARY_LLM=local
export LOCAL_LLM_URL=http://localhost:11434

# Verify Ollama is running
curl http://localhost:11434/api/tags
```

#### Step 4: User Impact Mitigation

```bash
# Queue requests for processing
# Notify users: "Delayed due to AI maintenance"

# Update status page
curl -X POST https://status.apex-intelligence.io/api/incidents \
  -d '{"status": "degraded", "message": "AI features experiencing delays"}'
```

#### Step 5: Monitor & Restore

```bash
# Monitor fallback performance
curl -w "%{time_total}\n" -o /dev/null \
  https://api.apex-intelligence.io/api/intel/analyze

# Check cost/quality metrics
# Monitor provider status; switch back when healthy
```

#### Verification

```bash
# Test transformation
curl -X POST https://api.apex-intelligence.io/api/intel/transform \
  -H "Content-Type: application/json" \
  -d '{"text": "test", "style": "brief"}'

# Verify response quality
# Check error rates in monitoring
```

#### Rollback

```bash
# Revert to primary provider
export PREFERRED_AI_PROVIDER=openai
export OPENAI_ENABLED=true
pm2 restart apex-api
```

#### Automation

See `lib/ai/monitor.ts` for automated failover.

**Trade-offs:**
- ✅ GOOD: Maintains service continuity
- ❌ BAD: Quality drop on local models; alert users

---

### Runbook 4: Payment Processor Termination

```
INCIDENT: Stripe Account Terminated/Major Outage
SEVERITY: P0
ESTIMATED RECOVERY: 30 minutes - 1 hour
PREREQUISITES: Multi-processor wrapper configured
```

#### Step 1: Detection & Assessment (5 min)

```bash
# Check for termination email from Stripe
# OR check transaction failure rate >50%

# Verify Stripe status
# https://status.stripe.com/

# Test Stripe API
curl https://api.stripe.com/v1/balance \
  -u "$STRIPE_SECRET_KEY:"
```

#### Step 2: Switch to Backup Processor (10 min)

```bash
# Update payment configuration
export PRIMARY_PAYMENT_PROCESSOR=paypal
export STRIPE_ENABLED=false

# Update application config
# POST /api/admin/config
# { "paymentProcessor": "paypal" }

# Restart API
pm2 restart apex-api
```

#### Step 3: Handle Pending Transactions

```bash
# Export pending transactions
psql $DATABASE_URL -c "
  SELECT * FROM transactions
  WHERE status = 'pending' AND processor = 'stripe'
  ORDER BY created_at DESC;
" > pending_transactions.csv

# Refund failed transactions via API
# Run refund script
npx ts-node scripts/refund-failed.ts
```

#### Step 4: User Communication

```bash
# Email users to update payment methods
# Template: "We've updated our payment system..."

# Enable crypto fallback if configured
export CRYPTO_PAYMENTS_ENABLED=true

# Post transparency report (ethical requirement)
# Update status page
```

#### Step 5: Subscription Migration

```bash
# Export active subscriptions
psql $DATABASE_URL -c "
  SELECT user_id, plan_id, expires_at FROM subscriptions
  WHERE status = 'active';
" > active_subscriptions.csv

# Create subscriptions in new processor
# (Manual process or via migration script)
```

#### Verification

```bash
# Test subscription creation in new processor
curl -X POST https://api.apex-intelligence.io/api/subscriptions/test \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Verify webhook configuration
# Check new processor dashboard
```

#### Rollback

Re-enable Stripe if termination was in error.

**Trade-offs:**
- ✅ GOOD: Revenue continuity maintained
- ❌ BAD: User friction on payment method updates

---

### Runbook 5: Security Incident Response

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

### Runbook 6: Founder Incapacitation

```
INCIDENT: Founder Unavailable for Extended Period
SEVERITY: Strategic
ESTIMATED RECOVERY: N/A (transition process)
PREREQUISITES: Dead man's switch configured, trustees with keys
```

#### Step 1: Detection (Automated)

```
Trigger: No check-in for 7 days
Action: Automated email sent to trustees
System: Dead man's switch from Ethical Safeguards Framework
```

#### Step 2: Activate Dead Man's Switch

```bash
# Trustees access vault (1Password shared)
# Verify identity via pre-arranged verification

# Access critical credentials:
# - Cloud provider access
# - Database credentials
# - DNS management
# - Payment processor admin
```

#### Step 3: Transfer Control

```bash
# Update DNS registrar access
# Transfer domain ownership if needed

# Update cloud provider account
# Add trustees as administrators

# Notify service providers
# Legal documentation ready
```

#### Step 4: Operations Continue

```
Phase 3+: DAO votes on interim leader
Community notification via official channels
Weekly transparency updates
```

#### Step 5: Graceful Transition

- Follow succession plan document
- Maintain service continuity
- Preserve user data and access

#### Verification

Trustees test access quarterly:
- Login to password manager
- Access cloud console (read-only test)
- Verify DNS management access

#### Rollback

N/A - irreversible scenario

**Trade-offs:**
- ✅ GOOD: Ensures business continuity
- ❌ BAD: Trust in trustees required; elect via RC vote

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

### Financial Contingency

If funds are critically low:

1. Pause non-essential services (AI features, analytics)
2. Notify users of service changes
3. Maintain core authentication and data access
4. Activate community support fund if available

### Service Degradation Levels

| Level | Services Active | Services Paused |
|-------|-----------------|-----------------|
| Full | All | None |
| Degraded | Core API, Auth | AI, Analytics |
| Minimal | Auth, Data Export | All others |
| Emergency | Data Export only | All |

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
| DB Failover | Quarterly | [TBD] | Q1 2026 |
| API Kill | Monthly | [TBD] | [TBD] |
| Dependency | Quarterly | [TBD] | Q1 2026 |
| Network | Bi-annually | [TBD] | [TBD] |

### Chaos Test Checklist

Before running chaos tests:
- [ ] Notify team 24h in advance
- [ ] Verify staging environment mirrors production
- [ ] Have rollback procedures ready
- [ ] Monitor dashboards during test
- [ ] Document results

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
PREFERRED_AI_PROVIDER=openai
PRIMARY_PAYMENT_PROCESSOR=stripe
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

### D. Automation Scripts

| Script | Location | Purpose |
|--------|----------|---------|
| Database Failover | `ansible/playbooks/db_failover.yml` | Automated DB failover |
| API Restart | `scripts/api_restart.sh` | Quick API recovery |
| AI Monitor | `lib/ai/monitor.ts` | AI provider failover |
| Compliance Audit | `scripts/compliance_audit.ts` | GDPR/CCPA checks |

### E. Recovery Time Estimates

| Scenario | Minimum | Typical | Maximum |
|----------|---------|---------|---------|
| DB restart | 2 min | 5 min | 15 min |
| DB failover | 5 min | 15 min | 30 min |
| DB restore | 15 min | 30 min | 60 min |
| API restart | 1 min | 3 min | 10 min |
| AI failover | <1 min | 1 min | 5 min |
| Payment switch | 10 min | 30 min | 60 min |

---

## Next Steps

- [ ] Test runbooks in staging (Q1 2026)
- [ ] Complete key contacts table
- [ ] Schedule first chaos engineering session
- [ ] Review automation scripts
- [ ] Train team on procedures

---

*This playbook should be reviewed and updated quarterly or after any significant incident.*

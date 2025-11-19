# Research Feature On-Call Runbook

**Last Updated:** 2025-11-19
**Feature:** RAG-based research streaming endpoint (`/api/research`)
**Owner:** Engineering
**On-Call Priority:** P2 (degraded experience is acceptable)

---

## Table of Contents

1. [Environment Matrix](#environment-matrix)
2. [Feature Flags](#feature-flags)
3. [Smoke Test Commands](#smoke-test-commands)
4. [Common Failures](#common-failures)
5. [Instant Rollback Procedures](#instant-rollback-procedures)
6. [Monitoring & Alerts](#monitoring--alerts)
7. [Emergency Contacts](#emergency-contacts)

---

## Environment Matrix

| Environment | URL | Feature Flag | Expected Behavior | API Keys Required |
|-------------|-----|--------------|-------------------|-------------------|
| **Local** | `http://localhost:3000/api/research` | `FEATURE_RESEARCH_STREAMING=0` (default) | Returns JSON stub | None |
| **Local (streaming)** | `http://localhost:3000/api/research` | `FEATURE_RESEARCH_STREAMING=1` | SSE streaming | All keys required |
| **Vercel Preview** | `https://[preview-url]/api/research` | Set in Vercel dashboard | Matches flag setting | Based on flag |
| **Production** | `https://[prod-domain]/api/research` | Set in Vercel dashboard | Matches flag setting | Based on flag |

### Required Environment Variables

**Minimum (stub mode):**
```bash
# No variables required for stub mode
FEATURE_RESEARCH_STREAMING=0  # or unset
```

**Full streaming mode:**
```bash
FEATURE_RESEARCH_STREAMING=1

# LLM & Embeddings
ANTHROPIC_API_KEY=sk-ant-...         # Claude 3.5 Sonnet
OPENAI_API_KEY=sk-...                # text-embedding-3-large
COHERE_API_KEY=...                   # rerank-multilingual-v3.0

# Rate Limiting (Redis)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Optional
VOYAGE_API_KEY=...                   # Alternative embeddings
```

---

## Feature Flags

### Primary Flag: `FEATURE_RESEARCH_STREAMING`

| Value | Behavior | Response Type | Dependencies |
|-------|----------|---------------|--------------|
| `0` or unset | **Stub mode** (safe default) | Immediate JSON | None |
| `1` | **Full streaming** | Server-Sent Events | All API keys + Redis |

### How to Check Current Flag Value

**Vercel Dashboard:**
1. Navigate to: Project Settings → Environment Variables
2. Search for `FEATURE_RESEARCH_STREAMING`
3. Check value for Production/Preview/Development

**Runtime Test:**
```bash
# Stub response (flag=0)
curl -X POST https://[domain]/api/research \
  -H "Content-Type: application/json" \
  -d '{"query":"test"}' | jq '.answer'

# Expected: "Research queued for: test"

# Streaming response (flag=1)
curl -N -X POST https://[domain]/api/research \
  -H "Content-Type: application/json" \
  -d '{"query":"test"}'

# Expected: text/event-stream with tokens streaming
```

---

## Smoke Test Commands

### Automated Smoke Test

```bash
# Run full smoke test suite
./scripts/smoke.sh

# Test specific environment
ENDPOINT=https://preview-xyz.vercel.app ./scripts/smoke.sh

# Test with streaming enabled
FEATURE_RESEARCH_STREAMING=1 ./scripts/smoke.sh
```

### Manual Smoke Tests

**1. Stub Mode (should always work):**
```bash
curl -X POST http://localhost:3000/api/research \
  -H "Content-Type: application/json" \
  -d '{"query":"Pokemon cards investment advice"}' \
  | jq '.'

# ✓ Expect HTTP 200
# ✓ Expect: {"ok":true,"answer":"Research queued for: ...","sources":[],"requestId":"..."}
```

**2. Streaming Mode (requires all keys):**
```bash
curl -N -X POST http://localhost:3000/api/research \
  -H "Content-Type: application/json" \
  -d '{"query":"Pokemon cards investment advice"}'

# ✓ Expect HTTP 200
# ✓ Expect Content-Type: text/event-stream
# ✓ Expect streaming tokens followed by __SOURCES__ line
```

**3. Invalid Request (should fail gracefully):**
```bash
curl -X POST http://localhost:3000/api/research \
  -H "Content-Type: application/json" \
  -d '{"query":""}'

# ✓ Expect HTTP 400
# ✓ Expect: {"ok":false,"error":"Invalid request: query is required","requestId":"..."}
```

**4. Rate Limiting Test:**
```bash
# Send 21+ requests rapidly from same IP
for i in {1..25}; do
  curl -X POST http://localhost:3000/api/research \
    -H "Content-Type: application/json" \
    -d "{\"query\":\"test $i\"}" &
done
wait

# ✓ Expect some HTTP 429 responses after 20 requests
# ✓ Expect: {"ok":false,"error":"Rate limited. Please wait...","requestId":"..."}
# ✓ Expect headers: X-RateLimit-Remaining: 0, Retry-After: 60
```

**5. Content-Type Validation (Preview with FEATURE_RESEARCH_STREAMING=1):**
```bash
RESPONSE_HEADERS=$(curl -I -X POST https://[preview-url]/api/research \
  -H "Content-Type: application/json" \
  -d '{"query":"test"}' 2>&1)

echo "$RESPONSE_HEADERS" | grep -i "content-type"

# ✓ When FEATURE_RESEARCH_STREAMING=1: MUST be "text/event-stream"
# ✗ If "application/json": Streaming is broken, rollback immediately
```

---

## Common Failures

### 1. HTTP 429: Rate Limited

**Symptom:**
```json
{
  "ok": false,
  "error": "Rate limited. Please wait before making more requests.",
  "requestId": "abc123"
}
```

**Cause:**
- More than 20 requests in 60 seconds from same IP
- Upstash Redis rate limiter active

**Resolution:**
- **User:** Wait 60 seconds, retry
- **Ops:** Check Upstash Redis health: https://console.upstash.com/
- **Temporary fix:** If Redis down, rate limiting is gracefully disabled
- **Long-term:** Consider increasing limit for production traffic

**Prevention:**
- Monitor rate limit hit rate in Sentry
- Add client-side rate limiting UI
- Implement user-based (not IP-based) limits with auth

---

### 2. SSE Disconnects / Streaming Cuts Off

**Symptom:**
- Client receives partial response
- No `__SOURCES__` line at end
- Network tab shows connection closed mid-stream

**Causes:**

**A) Vercel Function Timeout (10s for Hobby, 60s for Pro):**
```
Error: Function exceeded maximum execution time
```

**Resolution:**
- Verify Vercel plan supports longer timeouts
- Optimize RAG pipeline (reduce search results, faster reranking)
- Add timeout monitoring in Sentry

**B) Nginx/Proxy Buffering:**
```
X-Accel-Buffering: no  # Header should be present
```

**Resolution:**
- Verify response headers include `X-Accel-Buffering: no`
- Check Vercel edge config for buffering settings
- Test with `curl -N` (no buffering)

**C) Client-Side EventSource Timeout:**

**Resolution:**
- Implement EventSource retry logic in frontend
- Add keepalive pings every 5 seconds
- Handle `onerror` events gracefully

**D) Claude API Timeout:**

**Resolution:**
- Check Anthropic status page: https://status.anthropic.com/
- Verify `ANTHROPIC_API_KEY` is valid and not rate-limited
- Fallback to stub mode if API consistently failing

---

### 3. Missing API Keys

**Symptom:**
```json
{
  "ok": true,
  "answer": "Research queued for: test (streaming requires API keys)",
  "sources": [],
  "requestId": "xyz789"
}
```

**Cause:**
- `FEATURE_RESEARCH_STREAMING=1` but API keys not configured
- API key expired or invalid

**Resolution:**

**Step 1: Verify keys exist**
```bash
# In Vercel Dashboard
Project Settings → Environment Variables

Required:
✓ ANTHROPIC_API_KEY
✓ OPENAI_API_KEY
✓ COHERE_API_KEY
✓ UPSTASH_REDIS_REST_URL
✓ UPSTASH_REDIS_REST_TOKEN
```

**Step 2: Test keys locally**
```bash
# Test Anthropic
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-3-5-sonnet-20241022","max_tokens":10,"messages":[{"role":"user","content":"hi"}]}'

# Test OpenAI
curl https://api.openai.com/v1/embeddings \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"text-embedding-3-large","input":"test"}'

# Test Cohere
curl https://api.cohere.ai/v1/rerank \
  -H "Authorization: Bearer $COHERE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"rerank-multilingual-v3.0","query":"test","documents":["doc1"]}'
```

**Step 3: Redeploy after adding keys**
```bash
vercel --prod --force
```

---

### 4. Upstash Redis Connection Failures

**Symptom:**
```
Warning: Failed to initialize rate limiter: [Upstash error]
```

**Cause:**
- `UPSTASH_REDIS_REST_URL` or `UPSTASH_REDIS_REST_TOKEN` invalid
- Upstash service outage
- Network connectivity issues

**Resolution:**

**Step 1: Check Upstash status**
- Visit: https://console.upstash.com/
- Verify database is active and accessible

**Step 2: Test connection**
```bash
curl -X POST $UPSTASH_REDIS_REST_URL/ping \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"

# Expected: {"result":"PONG"}
```

**Step 3: Graceful degradation**
- Rate limiting automatically disabled if Redis unavailable
- Requests proceed without rate limiting (acceptable for short outages)

**Step 4: Monitor**
- Set up Upstash alerts for database downtime
- Track rate limiter failures in Sentry

---

### 5. Cohere Reranking Failures

**Symptom:**
```
Warning: Reranking failed, using original scores: [Cohere API error]
```

**Cause:**
- `COHERE_API_KEY` invalid or rate-limited
- Cohere API outage

**Impact:**
- **Low severity:** Search results still returned
- Results not optimally ranked
- User experience slightly degraded

**Resolution:**

**Step 1: Verify Cohere API**
```bash
curl https://api.cohere.ai/v1/check-api-key \
  -H "Authorization: Bearer $COHERE_API_KEY"
```

**Step 2: Check Cohere status**
- Visit: https://status.cohere.com/

**Step 3: Temporary workaround**
- Fallback scoring already implemented
- No immediate action required unless persistent

---

### 6. Invalid JSON Response (should be text/event-stream)

**Symptom:**
```bash
curl -I https://preview.vercel.app/api/research

Content-Type: application/json  # ✗ WRONG when FEATURE_RESEARCH_STREAMING=1
```

**Cause:**
- Streaming code path not executing
- Feature flag mismatch
- Code regression

**Resolution:**

**Immediate: Rollback to stub mode**
```bash
# See "Instant Rollback Procedures" below
```

**Investigation:**
1. Check feature flag value in Vercel
2. Review recent deployments for regressions
3. Check Sentry for errors in streaming code path
4. Test locally with `FEATURE_RESEARCH_STREAMING=1`

---

## Instant Rollback Procedures

### Scenario: Streaming is broken in production

**Goal:** Return to safe stub mode within **60 seconds**

---

### Method 1: Vercel Dashboard (Recommended)

**Steps:**

1. **Navigate to Vercel Dashboard:**
   - Go to: https://vercel.com/[team]/[project]
   - Click: **Settings** → **Environment Variables**

2. **Update Feature Flag:**
   - Search for: `FEATURE_RESEARCH_STREAMING`
   - Change value: `1` → `0`
   - Environment: **Production**
   - Click: **Save**

3. **Redeploy (Automatic):**
   - Vercel auto-redeploys on env var change
   - Monitor deployment progress in Dashboard
   - **ETA:** ~30-60 seconds

4. **Verify Rollback:**
```bash
curl -X POST https://[prod-domain]/api/research \
  -H "Content-Type: application/json" \
  -d '{"query":"test"}' | jq '.answer'

# ✓ Expected: "Research queued for: test"
# ✓ Response should be instant JSON, not streaming
```

---

### Method 2: Git Revert + Force Deploy

**Use when:** Env var change insufficient (code regression)

**Steps:**

1. **Identify last good commit:**
```bash
git log --oneline -10
```

2. **Revert to known-good state:**
```bash
git revert [bad-commit-hash] --no-edit
git push origin main
```

3. **Force production deploy:**
```bash
vercel --prod --force
```

4. **Verify:**
```bash
./scripts/smoke.sh
```

**ETA:** ~2-3 minutes

---

### Method 3: Emergency Stub Code Patch

**Use when:** Immediate code change needed

**Steps:**

1. **Edit API route:**
```bash
# src/app/api/research/route.ts

export async function POST(request: Request) {
  // EMERGENCY OVERRIDE: Force stub mode
  const EMERGENCY_STUB = true;  // ← Add this line

  if (EMERGENCY_STUB || process.env.FEATURE_RESEARCH_STREAMING !== '1') {
    return Response.json({
      ok: true,
      answer: `Research queued for: ${query}`,
      sources: [],
      requestId: crypto.randomUUID()
    });
  }

  // ... rest of code
}
```

2. **Commit and deploy:**
```bash
git add src/app/api/research/route.ts
git commit -m "EMERGENCY: Force research stub mode"
git push origin main
vercel --prod --force
```

**ETA:** ~1-2 minutes

---

### Post-Rollback Actions

1. **Notify team:**
   - Post in #incidents channel
   - Update status page if applicable

2. **Create incident ticket:**
   - Document symptoms, timeline, resolution
   - Link to relevant Sentry errors

3. **Schedule postmortem:**
   - Review root cause
   - Implement preventive measures
   - Update runbook with learnings

---

## Monitoring & Alerts

### Sentry Dashboards

**Key Metrics to Monitor:**

1. **Error Rate:**
   - Filter: `transaction:/api/research`
   - Alert threshold: >5% error rate over 5min

2. **RAG Pipeline Failures:**
   - Span: `rag.fusion.search`
   - Span: `rag.rerank`
   - Alert on consecutive failures

3. **Rate Limit Hit Rate:**
   - Error message: "Rate limited"
   - Track legitimate vs. abuse

4. **Streaming Disconnects:**
   - Incomplete responses (missing `__SOURCES__`)
   - Client-side EventSource errors

### Vercel Analytics

- **Function Duration:** Monitor for timeout trends
- **Error Rate:** Correlate with deployments
- **Edge Logs:** Real-time request inspection

### Upstash Metrics

- **Redis Availability:** Uptime monitoring
- **Rate Limit Stats:** Requests blocked per hour

---

## Emergency Contacts

| Role | Contact | Escalation |
|------|---------|-----------|
| On-Call Engineer | [Your team's on-call rotation] | Primary |
| Engineering Lead | [Lead contact] | After 15min |
| Platform Team | [Platform contact] | Vercel/infra issues |

### Escalation Triggers

- **P1:** Research endpoint completely unavailable (5xx errors)
- **P2:** Streaming degraded but stub mode working
- **P3:** Single provider (Cohere, etc.) degraded

---

## Quick Reference: Common Commands

```bash
# Test stub mode
curl -X POST http://localhost:3000/api/research \
  -H "Content-Type: application/json" \
  -d '{"query":"test"}' | jq '.'

# Test streaming mode
curl -N -X POST http://localhost:3000/api/research \
  -H "Content-Type: application/json" \
  -d '{"query":"Pokemon cards"}'

# Run smoke tests
./scripts/smoke.sh

# Check Vercel env vars
vercel env ls

# Force production deploy
vercel --prod --force

# View real-time logs
vercel logs [deployment-url] --follow

# Check rate limit status
curl -I https://[domain]/api/research | grep -i "x-ratelimit"
```

---

## Architecture Reference

**Key Files:**
- API Endpoint: `src/app/api/research/route.ts`
- RAG-Fusion: `src/rag/fusion.ts`
- Reranking: `src/rag/reranker.ts`
- Search: `src/rag/search.ts`

**Dependencies:**
- LangChain: RAG pipeline orchestration
- Anthropic: Claude 3.5 Sonnet (answer generation)
- OpenAI: text-embedding-3-large (embeddings)
- Cohere: rerank-multilingual-v3.0 (reranking)
- Upstash: Redis-based rate limiting

**Rate Limiting:**
- 20 requests per 60 seconds per IP
- Sliding window algorithm
- Graceful degradation if Redis unavailable

**Response Format:**
```
# Stub mode (JSON)
{"ok":true,"answer":"...","sources":[],"requestId":"..."}

# Streaming mode (SSE)
{streaming tokens}
__SOURCES__
[{"index":1,"title":"...","url":"..."}]
```

---

**End of Runbook**
For questions or updates, contact the platform team.

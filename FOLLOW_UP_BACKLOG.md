# Follow-Up Backlog — Next PR Set

**Tech Lead:** Planning next PR set without destabilizing main  
**Created:** 2025-01-XX  
**Status:** Ready for implementation

---

## Overview

This backlog contains 4 focused PRs designed to enhance the research API, improve content ingestion, add performance gates, and strengthen test coverage. All changes are designed to be non-breaking and feature-flagged where appropriate.

**Priority Order:**
1. Smoke tests (safety net)
2. Perf budget gate (guardrails)
3. MDX validator re-enable (data quality)
4. Research API streaming (feature enhancement)

---

## PR 1: Add Research API Smoke Tests

**Branch:** `feature/smoke-research-api`  
**Type:** Test Coverage  
**Risk:** Low (additive only)

### Description

Add smoke tests for `/api/research` endpoint to ensure basic functionality and schema compliance. This provides a safety net before making enhancements to the research API.

### Acceptance Criteria

- [ ] New test file: `tests/smoke/research-api.spec.ts`
- [ ] Test: POST `/api/research` returns 200 with valid query
- [ ] Test: POST `/api/research` validates request schema (requires `query` string)
- [ ] Test: POST `/api/research` validates response schema (requires `ok`, `answer`, `sources`, `requestId`)
- [ ] Test: POST `/api/research` returns 400 for missing/invalid query
- [ ] Test: POST `/api/research` returns 500 for server errors (mocked)
- [ ] Tests run in CI as part of `test:smoke` suite
- [ ] All tests pass on current implementation

### Technical Details

**File to Create:**
```
tests/smoke/research-api.spec.ts
```

**Test Structure:**
- Use Playwright test framework (consistent with existing `tests/smoke.spec.ts`)
- Test against local dev server or test environment
- Validate JSON schema using Zod or manual assertions
- Include both happy path and error cases

**Schema Validation:**
```typescript
// Request schema
interface ResearchRequest {
  query: string;
}

// Response schema (current)
interface ResearchResponse {
  ok: boolean;
  answer?: string;
  sources?: never[];
  requestId: string;
  error?: string;
}
```

**Integration:**
- Add to existing `test:smoke` script in `package.json`
- Ensure tests run in CI workflow (`.github/workflows/pr-ci.yml`)

### Dependencies

- None (can be implemented immediately)

### Risk Assessment

**Low Risk:**
- Additive only (no code changes to API)
- Tests validate current behavior
- Can be merged independently

### Implementation Notes

- Follow existing smoke test patterns from `tests/smoke.spec.ts`
- Use `expect(response.status()).toBe(200)` for status checks
- Use `expect(response.json()).toMatchObject({ ... })` for schema validation
- Consider using `zod` for runtime schema validation if not already in dependencies

---

## PR 2: Perf Budget Gate in CI

**Branch:** `feature/perf-budget-gate`  
**Type:** CI/CD Enhancement  
**Risk:** Low (additive, warnings only initially)

### Description

Add performance budget gate that runs `pnpm perf:budget` post-build in CI. This creates a guardrail to catch performance regressions before they reach main.

### Acceptance Criteria

- [ ] Create `perf:budget` script in `package.json` that aggregates all budget checks
- [ ] Script runs: `budget:js`, `budget:route`, `budget:css`, `budget:media`, `guard:delta`
- [ ] Add CI step in `.github/workflows/pr-ci.yml` that runs `pnpm perf:budget` after build
- [ ] On PRs: perf budget failures are warnings (non-blocking)
- [ ] On main: perf budget failures are errors (blocking)
- [ ] Artifacts from perf budget are uploaded to CI
- [ ] Perf budget summary appears in PR summary

### Technical Details

**Script to Add:**
```json
{
  "scripts": {
    "perf:budget": "pnpm build && pnpm -s budget:js && pnpm -s guard:delta && pnpm -s budget:route && pnpm -s budget:css && pnpm -s budget:media"
  }
}
```

**CI Integration:**
Add to `.github/workflows/pr-ci.yml` after the "Build" step:

```yaml
- name: Perf budget gate (warnings on PRs)
  run: |
    chmod +x scripts/bundle-budget.sh scripts/bundle-delta.sh scripts/route-budget.mjs scripts/css-budget.sh scripts/media-budget.sh || true
    MAX_CHUNK_KB=${{ vars.MAX_CHUNK_KB || 300 }} STRICT=0 scripts/bundle-budget.sh || true
    DELTA_CHUNK_KB=${{ vars.DELTA_CHUNK_KB || 40 }} STRICT_DELTA=0 scripts/bundle-delta.sh || true
    MAX_ROUTE_KB=${{ vars.MAX_ROUTE_KB || 500 }} STRICT_ROUTE=0 node scripts/route-budget.mjs || true
    MAX_CSS_KB=${{ vars.MAX_CSS_KB || 120 }} STRICT_CSS=0 scripts/css-budget.sh || true
    MAX_MEDIA_KB=${{ vars.MAX_MEDIA_KB || 300 }} MAX_MEDIA_VIDEO_KB=${{ vars.MAX_MEDIA_VIDEO_KB || 1500 }} STRICT_MEDIA=0 scripts/media-budget.sh || true

- name: Perf budget gate (strict on main)
  if: github.ref == 'refs/heads/main'
  run: |
    MAX_CHUNK_KB=${{ vars.MAX_CHUNK_KB || 300 }} STRICT=1 scripts/bundle-budget.sh
    DELTA_CHUNK_KB=${{ vars.DELTA_CHUNK_KB || 40 }} STRICT_DELTA=1 scripts/bundle-delta.sh
    MAX_ROUTE_KB=${{ vars.MAX_ROUTE_KB || 500 }} STRICT_ROUTE=1 node scripts/route-budget.mjs
    MAX_CSS_KB=${{ vars.MAX_CSS_KB || 120 }} STRICT_CSS=1 scripts/css-budget.sh
    MAX_MEDIA_KB=${{ vars.MAX_MEDIA_KB || 300 }} MAX_MEDIA_VIDEO_KB=${{ vars.MAX_MEDIA_VIDEO_KB || 1500 }} STRICT_MEDIA=1 scripts/media-budget.sh
```

**Note:** The existing CI already has these checks individually. This PR consolidates them into a single `perf:budget` script and ensures they run post-build consistently.

### Dependencies

- None (uses existing budget scripts)

### Risk Assessment

**Low Risk:**
- Consolidates existing checks (no new logic)
- Warnings on PRs (non-blocking)
- Strict only on main (protects production)

### Implementation Notes

- Consider if we want to keep individual budget steps or replace with consolidated `perf:budget`
- May want to add a summary step that aggregates all budget results
- Ensure artifacts are uploaded for debugging

---

## PR 3: Re-enable MDX Content Validator & Chunking

**Branch:** `feature/mdx-validator-chunking`  
**Type:** Data Quality Enhancement  
**Risk:** Medium (affects ingestion pipeline)

### Description

Re-enable MDX content validator and chunking in the ingestion pipeline using LangChain text splitters. This ensures MDX articles are properly validated and chunked for optimal RAG retrieval.

### Acceptance Criteria

- [ ] Create MDX content validator that checks:
  - Valid YAML frontmatter (title, category, publishedAt, tags, etc.)
  - Valid MDX syntax
  - Required components present (charts, citations, etc.)
- [ ] Integrate validator into ingestion pipeline (`src/rag/ingestion.ts` or new ingestion script)
- [ ] Use LangChain `RecursiveCharacterTextSplitter` for MDX chunking
- [ ] Chunking respects MDX structure (preserves frontmatter, handles components)
- [ ] Add MDX-specific ingestion function: `ingestMdxArticles()`
- [ ] Validator logs errors but doesn't block ingestion (warnings only)
- [ ] Add script: `pnpm rag:ingest:mdx` to ingest MDX articles from `src/content/articles/`
- [ ] Document MDX ingestion process

### Technical Details

**MDX Validator Requirements:**
- Validate frontmatter schema (use existing `VALIDATION_MANIFEST.json` as reference)
- Check for required fields: `title`, `category`, `publishedAt`, `tags`, `heroImage`
- Validate MDX syntax (can use `@mdx-js/mdx` compiler in dry-run mode)
- Check for required components: charts, citations, `AskFollowUp`

**Chunking Strategy:**
```typescript
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

const mdxSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1500, // Larger chunks for articles vs listings
  chunkOverlap: 300,
  separators: ['\n\n## ', '\n\n### ', '\n\n', '\n', '. ', ' ', ''], // Respect markdown headers
});
```

**Ingestion Function:**
```typescript
// New function in src/rag/ingestion.ts
export async function ingestMdxArticles(
  articles: Array<{
    slug: string;
    frontmatter: Record<string, any>;
    content: string; // MDX content
    filePath: string;
  }>
): Promise<IngestionResult>
```

**Validation Logic:**
- Parse frontmatter using `gray-matter` (already in dependencies)
- Validate against schema (can use Zod if available, or manual checks)
- Compile MDX to check syntax (optional, may be expensive)
- Log validation errors to Sentry but continue ingestion

**Script to Add:**
```json
{
  "scripts": {
    "rag:ingest:mdx": "tsx scripts/ingest-mdx-articles.ts"
  }
}
```

**New Script:** `scripts/ingest-mdx-articles.ts`
- Scans `src/content/articles/**/*.mdx`
- Validates each article
- Ingests valid articles into RAG system
- Reports validation errors

### Dependencies

- Existing: `@langchain/textsplitters`, `gray-matter`, `@mdx-js/mdx`
- May need: `zod` for schema validation (check if already in deps)

### Risk Assessment

**Medium Risk:**
- Affects ingestion pipeline (could impact RAG quality)
- Validation errors should be warnings, not blockers
- Test thoroughly with sample MDX files

### Implementation Notes

- Start with warnings-only validation (don't block ingestion)
- Consider feature flag: `ENABLE_MDX_VALIDATION=true`
- Preserve frontmatter in chunk metadata for better retrieval
- Chunk at section boundaries when possible (respect `##` headers)
- Test with existing MDX articles in `src/content/articles/`

---

## PR 4: Upgrade /api/research to Streaming SSE + Rerank

**Branch:** `feature/research-streaming-rerank`  
**Type:** Feature Enhancement  
**Risk:** Medium (API change, but feature-flagged)

### Description

Upgrade `/api/research` endpoint to support Server-Sent Events (SSE) streaming responses with reranking. This provides real-time feedback to users and improves answer quality through reranking.

### Acceptance Criteria

- [ ] `/api/research` supports both streaming (SSE) and non-streaming modes
- [ ] Streaming mode enabled via feature flag: `ENABLE_RESEARCH_STREAMING=true`
- [ ] Streaming mode uses SSE (`text/event-stream`)
- [ ] Non-streaming mode maintains current behavior (backward compatible)
- [ ] Integrate reranking using existing `rerankResults()` from `src/rag/reranker.ts`
- [ ] Reranking enabled via feature flag: `ENABLE_RESEARCH_RERANK=true`
- [ ] Stream response includes:
  - `data: {"type": "chunk", "content": "..."}`
  - `data: {"type": "sources", "sources": [...]}`
  - `data: {"type": "done", "requestId": "..."}`
- [ ] Error handling: stream error events on failure
- [ ] Update client code to handle streaming (if applicable)
- [ ] Add smoke tests for streaming mode
- [ ] Document API changes

### Technical Details

**Current Implementation:**
- `src/app/api/research/route.ts` - Simple stub that returns mock response
- Needs integration with RAG chain from `src/rag/chain.ts`

**Streaming Implementation:**
```typescript
// src/app/api/research/route.ts
export async function POST(req: NextRequest) {
  const { query, stream } = await req.json();
  const enableStreaming = process.env.ENABLE_RESEARCH_STREAMING === 'true' || stream === true;
  const enableRerank = process.env.ENABLE_RESEARCH_RERANK === 'true';

  if (enableStreaming) {
    return streamResearchResponse(query, enableRerank);
  } else {
    return standardResearchResponse(query, enableRerank);
  }
}

async function streamResearchResponse(query: string, rerank: boolean) {
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 1. Perform search
        const searchResults = await hybridSearch({ query, limit: rerank ? 30 : 10 });
        
        // 2. Rerank if enabled
        const results = rerank 
          ? await rerankResults(query, searchResults, 10)
          : searchResults.slice(0, 10);

        // 3. Stream sources first
        controller.enqueue(
          `data: ${JSON.stringify({ type: 'sources', sources: results })}\n\n`
        );

        // 4. Stream LLM response chunks
        const chain = createStreamingChain(); // Use LangChain streaming
        for await (const chunk of chain.stream({ query, context: formatContext(results) })) {
          controller.enqueue(
            `data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`
          );
        }

        // 5. Signal completion
        controller.enqueue(
          `data: ${JSON.stringify({ type: 'done', requestId: crypto.randomUUID().slice(0, 8) })}\n\n`
        );
        controller.close();
      } catch (error) {
        controller.enqueue(
          `data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

**Reranking Integration:**
- Use existing `rerankResults()` from `src/rag/reranker.ts`
- Retrieve 2-3x more results initially, then rerank to top 10
- Only rerank if `ENABLE_RESEARCH_RERANK=true`

**LangChain Streaming:**
- Use `llm.stream()` instead of `llm.invoke()` for streaming
- May need to update `src/rag/chain.ts` to support streaming mode

**Feature Flags:**
```env
# .env.local (development)
ENABLE_RESEARCH_STREAMING=true
ENABLE_RESEARCH_RERANK=true

# Production (Vercel)
# Set via Vercel dashboard or vercel.json
```

**Backward Compatibility:**
- Default behavior (no flags) = current stub behavior
- Feature flags enable new functionality
- Client can opt-in via `{ query, stream: true }` in request body

### Dependencies

- PR 1 (smoke tests) should be merged first
- Requires RAG chain integration (may need updates to `src/rag/chain.ts`)
- Requires Cohere API key for reranking (already configured)

### Risk Assessment

**Medium Risk:**
- API change (but backward compatible via feature flags)
- Streaming adds complexity
- Requires testing with real RAG chain (not just stub)

### Implementation Notes

- Start with feature flags disabled (safe default)
- Test streaming with small queries first
- Consider rate limiting for streaming endpoints
- Monitor for memory leaks in long-running streams
- Update API documentation
- Consider adding request timeout for streaming responses
- Test error handling (network failures, LLM errors, etc.)

**Testing Strategy:**
1. Test non-streaming mode (current behavior)
2. Test streaming mode with feature flag
3. Test reranking with feature flag
4. Test error cases (invalid query, API failures)
5. Load test streaming endpoint

---

## Implementation Order

1. **PR 1: Smoke Tests** (safety net)
   - Can be merged immediately
   - Provides baseline for API changes

2. **PR 2: Perf Budget Gate** (guardrails)
   - Can be merged independently
   - Protects against regressions

3. **PR 3: MDX Validator** (data quality)
   - Can be merged independently
   - Improves RAG data quality

4. **PR 4: Research Streaming** (feature)
   - Should merge after PR 1 (tests in place)
   - Feature-flagged for safe rollout

---

## Success Metrics

- **PR 1:** All smoke tests pass, coverage for research API
- **PR 2:** Perf budget catches regressions in CI
- **PR 3:** MDX articles validated and chunked correctly, ingestion logs show validation results
- **PR 4:** Streaming works in dev, feature flags control rollout, reranking improves answer quality

---

## Notes

- All PRs should include:
  - Clear commit messages
  - Updated documentation where applicable
  - No breaking changes (or clearly documented)
  - Feature flags for risky changes

- Consider creating a `FEATURE_FLAGS.md` document to track all feature flags

- Monitor Sentry for errors after each PR merge


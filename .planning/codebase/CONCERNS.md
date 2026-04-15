# CONCERNS.md — Technical Debt, Bugs, Security, Performance

## Tech Debt

### 1. No concurrent ingest lock
**File:** `worker/server.py`, `worker/worker.py`
**Severity:** Medium

The `/trigger` webhook uses `asyncio.create_task(run_once())` with no guard against overlapping runs. If the endpoint is called while an ingest cycle is already running, two pipeline instances will execute simultaneously, potentially causing duplicate article upserts or race conditions on shared resources.

**Fix:** Add a lock flag or `asyncio.Lock()` before creating the task.

---

### 2. React hook dependency suppression
**File:** `components/news/ArticleFeed.tsx` (line ~36)
**Severity:** Low–Medium

`useEffect` dependencies are suppressed with `// eslint-disable-next-line react-hooks/exhaustive-deps`. This can cause stale closures and subtle bugs where the effect doesn't re-run when it should (or vice versa).

**Fix:** Audit and fix the actual dependency array.

---

### 3. Commented-out backfill functions
**File:** `worker/backfill.py` (lines ~244–248)
**Severity:** Low

`backfill_edinet` and `backfill_gdelt` are commented out. Unclear if this is intentional (completed) or deferred. Dead code that could confuse future maintainers.

**Fix:** Delete if complete; document with a TODO comment if deferred.

---

### 4. Unpinned `edinet-tools` dependency
**File:** `worker/requirements.txt`
**Severity:** Medium

`edinet-tools` is listed without a version pin. A breaking upstream release would silently break the EDINET ingest pipeline in production.

**Fix:** Pin to a specific version (e.g. `edinet-tools==x.y.z`).

---

### 5. Duplicated `Article` type
**Files:** `components/news/ArticleCard.tsx`, `app/api/search/route.ts`, `lib/claude.ts`
**Severity:** Low–Medium

The `Article` interface (or equivalent dict shape) is defined in multiple places. These definitions can drift, causing type mismatches between the API response and component expectations.

**Fix:** Extract to a single shared type in `lib/types.ts` or `types/index.ts`.

---

## Security

### 1. No rate limiting on API routes
**Files:** `app/api/chat/route.ts`, `app/api/search/route.ts`, `app/api/ingest/route.ts`
**Severity:** High

Any authenticated user can send unlimited requests to these endpoints. The chat route calls Claude API (paid), the search route hits pgvector, and the ingest route fires a worker cycle. All are susceptible to abuse.

**Fix:** Add rate limiting middleware (e.g. `@upstash/ratelimit` with Vercel KV, or middleware-level IP rate limiting).

---

### 2. No input length limits before embedding/Claude calls
**Files:** `app/api/chat/route.ts`, `app/api/search/route.ts`
**Severity:** Medium

User-supplied `userText` / `query` strings are passed directly to Claude API and OpenAI embedding API with no length cap. Extremely long inputs could cause high API costs or unexpected behavior.

**Fix:** Validate and truncate input at the API route boundary (e.g. `if (query.length > 500) return 400`).

---

### 3. Static shared secret with no rotation
**Files:** `worker/server.py`, `app/api/ingest/route.ts`
**Severity:** Medium

The `INGEST_WORKER_SECRET` is a static env var with no rotation mechanism. If leaked, it allows anyone to trigger unlimited ingest cycles.

**Fix:** Document rotation procedure; consider short-lived HMAC tokens for the trigger endpoint.

---

### 4. Open signup with no allowlist or invite gate
**File:** `app/signup/actions.ts`
**Severity:** Medium (for a private tool)

Any email address can create an account. If this is a private research platform, there is no mechanism to restrict who can register.

**Fix:** Add an email allowlist check in the signup action, or disable signup and use invite-only via Supabase dashboard.

---

## Performance

### 1. Fully sequential ingest pipeline
**File:** `worker/worker.py`
**Severity:** Medium

The news loop processes articles one-by-one: `summarize → embed → upsert` per article, sequentially. For a batch of 50 articles, this means 150 sequential API calls. At ~1–2 seconds per call, a single cycle can take 2–5 minutes.

**Fix:** Use `asyncio.gather()` to process multiple articles concurrently (with concurrency limiting via semaphore).

---

### 2. 200 MB GDELT master file fetch
**File:** `worker/sources/gdelt.py`
**Severity:** High

GDELT's master file listing all GKG files is ~200 MB. Fetching it on every ingest cycle is wasteful and slow. The current filter threshold (60% location match) further suggests imprecise article targeting.

**Fix:** Cache the master file or use GDELT's incremental "last update" feed instead of the full master list.

---

### 3. Unbounded `market_snapshots` table growth
**File:** `worker/pipeline/store.py`, `supabase/migrations/20260329000000_initial_schema.sql`
**Severity:** High (operational)

Market snapshots are ingested every 30 seconds (~8,640 rows/day per asset). There is no TTL, deletion policy, or partitioning. The table will grow without bound.

**Fix:** Add a Supabase scheduled function or cron to delete rows older than N days; or use `INSERT ... ON CONFLICT DO UPDATE` with a rolling window table.

---

### 4. Per-asset DB queries in markets route
**File:** `app/api/markets/route.ts`
**Severity:** Low–Medium

Market data is likely fetched with N individual queries (one per asset) rather than a single batched query. This causes N round-trips to Supabase.

**Fix:** Batch into a single `SELECT ... WHERE asset IN (...)` query.

---

## Fragile Areas

### 1. `next()` iterator on `tool_use` blocks — silent `StopIteration`
**File:** `worker/pipeline/summarize.py` (line ~59)
**Severity:** High

```python
block = next(b for b in response.content if b.type == "tool_use")
```

If Claude returns no `tool_use` block (e.g. on API error, rate limit, or model refusal), this raises `StopIteration` which is caught by the outer `try/except Exception` and silently swallowed. The article is stored without a summary.

**Fix:** Use `next(..., None)` with an explicit check, or handle the missing-block case explicitly.

---

### 2. GDELT 60% location threshold — magic number
**File:** `worker/sources/gdelt.py` (line ~38)
**Severity:** Low–Medium

The filter threshold for Japan-relevant articles is a hardcoded magic number. No documentation explains its derivation. Changes to the number have unpredictable effects on article volume.

**Fix:** Extract to a named constant with a comment explaining the rationale.

---

### 3. Headline splitter splits on first `.`
**File:** `components/news/ArticleCard.tsx` (lines ~28–30)
**Severity:** Low

The component splits article titles on the first period to extract a display headline. Titles with abbreviations (e.g. "U.S. stocks fall") or decimal numbers will be incorrectly truncated.

**Fix:** Use a smarter sentence splitter or store headline separately from body in the pipeline.

---

### 4. DB singleton with no reconnect on failure
**File:** `worker/pipeline/store.py` (lines ~5–15)
**Severity:** Medium

The Supabase client is instantiated once at module load time. If the connection drops during a long-running worker process, there is no reconnect logic — subsequent pipeline calls will fail until the worker restarts.

**Fix:** Add connection health checking or use connection pooling with retry logic.

---

## Missing Critical Features

### 1. No React error boundary
**Files:** `app/layout.tsx`, `app/dashboard/page.tsx`
**Severity:** Medium

No `ErrorBoundary` component wraps the dashboard. A runtime error in any child component (ArticleFeed, ChatPane, MarketsPanel) will crash the entire page with a white screen.

**Fix:** Add an error boundary around each major panel.

---

### 2. No observability / structured logging
**Files:** All `worker/` Python files
**Severity:** Medium

The worker uses `print()` for all logging. There is no structured logging, no log levels, no request IDs, and no error tracking (Sentry, etc.). Debugging production failures requires reading raw stdout.

**Fix:** Replace `print()` with Python `logging` module; add Sentry or similar for error tracking.

---

## Test Coverage Gaps

**Current coverage: 0%** — no tests exist anywhere in the project.

| Area | Priority | Suggested Test |
|------|----------|---------------|
| `pipeline/summarize.py` tool_use extraction | High | Unit test with mock Claude response missing tool_use block |
| `sources/gdelt.py` Japan filter | High | Unit test with sample GKG data — verify threshold behavior |
| `components/news/ArticleCard.tsx` headline split | Medium | Unit test with titles containing abbreviations |
| `app/api/search/route.ts` | Medium | Integration test with mock Supabase client |

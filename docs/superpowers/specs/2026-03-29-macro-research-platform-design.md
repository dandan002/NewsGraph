# Macro Research Platform — Design Spec
2026-03-29

## Overview

A web application for fundamental and macro research targeting Japanese equities and crypto macro signals. Aggregates Japanese-language news (NHK, GDELT, EDINET filings), generates English summaries via Claude, stores them as searchable vector embeddings, and exposes them through a split-pane dashboard with a conversational RAG interface.

**Scope:** Japanese sources only for the hackathon demo. Korean/Chinese sources, historical charting, and OAuth are out of scope.

---

## Architecture

Two deployable units:

**Frontend** — Next.js (App Router, TypeScript), deployed on Vercel
- Tailwind CSS, terminal dark theme with blue accents
- Supabase `@supabase/ssr` for session management (HTTP-only cookies, no localStorage)
- Middleware refreshes session on every request; redirects unauthenticated users to `/login`

**Ingest Worker** — Python 3.11, deployed on Railway
- Long-running process with internal asyncio scheduling: news loop every 30 min, EDINET loop every 60 min, market data loop every 30s
- Also exposes a lightweight HTTP webhook (`POST /trigger`) so `/api/ingest` can kick off a manual cycle during the demo
- Uses Supabase service role key (bypasses RLS); never exposed to client
- Linear pipeline — no queue infrastructure

**Database** — Supabase (Postgres + pgvector), already provisioned
- `articles` table with `embedding vector(1536)` column
- `market_snapshots` table for Hyperliquid data
- RLS: authenticated-read policies on both tables
- Indexes: unique on `url`, ivfflat (lists=100) on `embedding`, btree on `published_at` and `snapshot_at`

---

## Data Sources

| Source | Type | Tier | Cadence |
|---|---|---|---|
| EDINET | Regulatory filings (FSA) | 1 — Regulatory | 60 min |
| NHK JP RSS | National broadcaster | 2 — Major Press | 30 min |
| GDELT | Global news aggregator | 3 — Wire | 30 min |
| NewsAPI | News aggregator | 3 — Wire | 30 min |
| Hyperliquid | Crypto perp/spot data | — | 30s (market_snapshots) |

Credibility tiers are tagged at ingest time from source config, not inferred.

---

## Ingest Pipeline

Single `worker.py` entry point. Steps per article:

1. **Fetch** — feedparser (RSS), httpx (REST APIs), GDELT 15-min CSV dumps filtered for JP
2. **Deduplicate** — skip if `url` already exists in `articles`
3. **Summarize** — single Claude API call (Anthropic SDK): translate + summarize in one prompt → 2–3 sentence English summary
4. **Tag** — assign `credibility_tier`, `country` (`JP`), `source_name` from source config
5. **Embed** — POST to OpenRouter embeddings endpoint (`openai/text-embedding-3-small`, 1536-dim) on the English summary only
6. **Upsert** — insert into Supabase `articles`, skip on URL conflict

**Summarization prompt:**
```
System: "You are a macro research analyst. Given a foreign-language news article, respond with a 2–3 sentence English summary written for a professional investor. Be factual and concise. Do not editorialize."
User: [raw article text]
```

**Market data loop:** Separate lightweight loop every 30s. POSTs `{"type": "metaAndAssetCtxs"}` to Hyperliquid `/info`, extracts BTC/ETH/SOL mark price, funding rate, OI, upserts into `market_snapshots`.

---

## Database Schema

```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE articles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url          text UNIQUE NOT NULL,
  source_name  text NOT NULL,
  credibility_tier int NOT NULL CHECK (credibility_tier IN (1,2,3)),
  country      char(2) NOT NULL,
  published_at timestamptz,
  summary_en   text NOT NULL,
  embedding    vector(1536),
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE market_snapshots (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset        text NOT NULL,
  market_type  text NOT NULL CHECK (market_type IN ('perp','spot')),
  mark_price   numeric,
  open_interest numeric,
  funding_rate numeric,
  snapshot_at  timestamptz DEFAULT now()
);

-- Indexes
CREATE UNIQUE INDEX ON articles (url);
CREATE INDEX ON articles USING ivfflat (embedding vector_cosine_ops) WITH (lists=100);
CREATE INDEX ON articles (published_at DESC);
CREATE INDEX ON market_snapshots (snapshot_at DESC);

-- RLS
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated read" ON articles FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE market_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated read" ON market_snapshots FOR SELECT USING (auth.role() = 'authenticated');
```

---

## API Routes (Next.js)

All routes verify `supabase.auth.getUser()` before executing. Return 401 if no valid session.

| Route | Method | Description |
|---|---|---|
| `/api/search` | POST | Embeds query via OpenRouter → pgvector cosine similarity + optional SQL filters (country, tier, date range) → returns top-10 articles |
| `/api/chat` | POST | Embeds message → fetches top-5 articles → injects as Claude system prompt context → streams response with source citations |
| `/api/markets` | GET | Returns latest `market_snapshots` rows for BTC/ETH/SOL |
| `/api/ingest` | POST | Calls Railway worker's `POST /trigger` webhook to kick off one manual ingest cycle (demo utility) |

`/api/chat` uses `ReadableStream` to stream Claude's response to the frontend.

---

## Frontend

### Layout

3-column split pane (always visible, no tabs):

```
[ News Feed (flex 1.5) ] [ Chat (flex 1) ] [ Markets (110px) ]
```

Top nav: `NEWSGRAPH` wordmark (blue), nav links (Dashboard / Filings / Settings), signed-in user + sign out.
- **Dashboard** — default view, all sources
- **Filings** — dashboard pre-filtered to Tier 1 (Regulatory) articles only
- **Settings** — out of scope for hackathon, link present but unimplemented

### News Feed (left column)

- Semantic search bar + SEARCH button
- Filter pills: country (JP), credibility tier (All / Regulatory / Press / Wire), date range (7d default)
- LIVE indicator pill
- Article cards (standard density):
  - Headline (bold, light text)
  - 1-line summary snippet (muted)
  - Source · timestamp · ↗ link
  - Left border color by tier: blue (Regulatory), indigo (Major Press), muted (Wire)
  - Tier badge: REG / PRESS / WIRE

### Chat (middle column)

- User messages: muted left border, grey label
- Assistant messages: blue left border, blue "research assistant" label
- Inline citations: `[1]` in blue, footnote below message with source + timestamp
- Input bar with submit button at bottom
- Streams Claude response token by token

### Markets (right column)

- Per-asset blocks: BTC-PERP, ETH-PERP, SOL-PERP
- Each block: asset name (blue), mark price (large), funding rate (amber if positive, red if negative), OI
- Refresh indicator at bottom: `↻ 30s`
- Pulls from `/api/markets`, polls every 30s

### Auth Pages (`/login`, `/signup`)

- Same dark blue theme
- Centered card, `NEWSGRAPH` wordmark
- Email + password fields only
- Server Actions: `supabase.auth.signInWithPassword()` / `signUp()`
- `/signup` auto-signs in after registration

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), Tailwind CSS, TypeScript |
| Auth | Supabase Auth + `@supabase/ssr` |
| Database | Supabase (Postgres + pgvector) |
| Embeddings | OpenRouter → `openai/text-embedding-3-small` (1536-dim) |
| Summarization | Anthropic Claude (claude-sonnet-4-20250514) |
| Ingest worker | Python 3.11 on Railway |
| Market data | Hyperliquid public API (no auth) |
| Frontend deploy | Vercel |

---

## Environment Variables

**Frontend (Vercel):**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
OPENROUTER_API_KEY          # /api/search — embed query
ANTHROPIC_API_KEY           # /api/chat — Claude RAG response
INGEST_WORKER_URL           # /api/ingest — Railway worker webhook URL
INGEST_WORKER_SECRET        # shared secret to authenticate /trigger calls
```

**Ingest worker (Railway):**
```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
OPENROUTER_API_KEY
NEWSAPI_KEY
INGEST_WORKER_SECRET        # validates incoming /trigger requests
```

---

## Out of Scope (Hackathon)

- Korean and Chinese sources
- DART (Korea) and HKEX filings
- OAuth providers (Google, GitHub)
- Password reset flow
- Saved searches / per-user preferences
- Historical market data charting
- Queue infrastructure (Redis, Celery)
- Email domain allowlist / invite-only access

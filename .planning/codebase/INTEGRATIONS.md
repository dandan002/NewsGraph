# External Integrations

**Analysis Date:** 2026-04-15

## APIs & External Services

**AI / LLM:**
- Anthropic Claude - Article summarization (worker) and RAG chat streaming (frontend)
  - SDK/Client: `@anthropic-ai/sdk` (Node), `anthropic` (Python)
  - Auth env var: `ANTHROPIC_API_KEY`
  - Models used: `claude-sonnet-4-20250514` (frontend chat in `lib/claude.ts`), `claude-sonnet-4-6` (worker summarization in `worker/pipeline/summarize.py`)
  - Frontend: streaming via `client.messages.stream()` piped to `ReadableStream`
  - Worker: tool-use forced call to `publish_summary` tool for structured output

- OpenRouter - Text embeddings only (both frontend and worker)
  - SDK/Client: raw `fetch` (Node in `lib/openrouter.ts`), `httpx` (Python in `worker/pipeline/embed.py`)
  - Auth env var: `OPENROUTER_API_KEY`
  - Endpoint: `https://openrouter.ai/api/v1/embeddings`
  - Model: `openai/text-embedding-3-small` (1536 dimensions)

**News Data Sources:**
- NewsAPI - Top Japanese headlines
  - Auth env var: `NEWSAPI_KEY`
  - Endpoint: `https://newsapi.org/v2/top-headlines?country=jp`
  - Implementation: `worker/sources/newsapi.py`

- NHK - Japanese public broadcaster RSS
  - No auth required
  - Feed URL: `https://www3.nhk.or.jp/rss/news/cat0.xml`
  - Implementation: `worker/sources/nhk.py`
  - Full article text fetched by following RSS entry links

- Asahi Shimbun - Japanese newspaper RSS
  - No auth required
  - Feed URL: `https://www.asahi.com/rss/asahi/newsheadlines.rdf`
  - Implementation: `worker/sources/asahi.py`
  - Headlines only (no full article fetch)

- The Japan Times - English-language Japanese news RSS
  - No auth required
  - Feed URL: `https://www.japantimes.co.jp/feed/`
  - Implementation: `worker/sources/japantimes.py`
  - Title + description used as raw_text

- GDELT GKG v2 - Global news event database, 15-minute updates
  - No auth required
  - Master URL: `http://data.gdeltproject.org/gdeltv2/lastupdate.txt`
  - Implementation: `worker/sources/gdelt.py`
  - Filters to Japan-dominant articles (>= 60% Japan location mentions or `.jp` domain)
  - Downloads and parses zip-compressed CSV; fetches article pages for raw text

**Financial Data:**
- EDINET (FSA) - Japanese regulatory filings (annual, quarterly, semi-annual, extraordinary)
  - Auth env var: `EDINET_API_KEY`
  - Endpoint: `https://disclosure.edinet-fsa.go.jp/api/v2/documents/{doc_id}`
  - SDK/Client: `edinet-tools` Python package for document index; `httpx` for document download
  - Implementation: `worker/sources/edinet.py`
  - Downloads ZIP-compressed HTML documents; filters form codes `120`, `140`, `160`, `180`

- Hyperliquid - Crypto perpetual futures market data (BTC, ETH, SOL)
  - No auth required
  - Endpoint: `https://api.hyperliquid.xyz/info` (POST with `{"type": "metaAndAssetCtxs"}`)
  - Implementation: `worker/sources/hyperliquid.py`
  - Polled every 30 seconds in `run_market_loop()`

## Data Storage

**Databases:**
- Supabase (PostgreSQL + pgvector)
  - Frontend connection env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Worker connection env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
  - Client (frontend): `@supabase/ssr` — `createBrowserClient` in `lib/supabase/client.ts`, `createServerClient` in `lib/supabase/server.ts`
  - Client (worker): `supabase-py` (`supabase.create_client`) in `worker/pipeline/store.py`
  - Tables: `articles` (uuid, url, source_name, credibility_tier, country, published_at, summary_en, embedding vector(1536)), `market_snapshots` (uuid, asset, market_type, mark_price, open_interest, funding_rate, snapshot_at)
  - Vector search: `pgvector` extension, `ivfflat` index (`lists=100`) on `articles.embedding`, cosine distance
  - RPC function: `search_articles(query_embedding, match_threshold, match_count, filter_tier, filter_since)` defined in `supabase/migrations/20260329000001_search_rpc.sql`
  - Migrations: managed manually via Supabase SQL Editor (`supabase/migrations/`)

**File Storage:**
- Local filesystem only (worker downloads temp files to `worker/downloads/`)

**Caching:**
- None

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (built-in)
  - Implementation: cookie-based session via `@supabase/ssr`; middleware in `middleware.ts` enforces auth on all routes except `/login`, `/signup`, `/auth`
  - Signup: `/signup` page
  - Login: `/login` page
  - Auth routes: `app/auth/`
  - Server components call `supabase.auth.getUser()` for session validation
  - All API routes (`/api/chat`, `/api/search`, `/api/markets`, `/api/ingest`) return 401 if user is not authenticated

**Row-Level Security:**
- `articles` and `market_snapshots` tables have RLS enabled
- Policy: `authenticated` role can SELECT; worker bypasses RLS using `service_role` key for INSERT/UPSERT

## Monitoring & Observability

**Error Tracking:**
- None detected

**Logs:**
- `print()` statements in Python worker for pipeline errors and fetch counts
- No structured logging library

## CI/CD & Deployment

**Hosting:**
- Frontend: Vercel (Next.js, implied by architecture and SETUP.md)
- Worker: Railway (`railway.toml` configures nixpacks builder, `python3 worker.py` start command, always-restart policy)

**CI Pipeline:**
- None detected

## Environment Configuration

**Required env vars (Next.js frontend):**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (public)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key (public)
- `OPENROUTER_API_KEY` - OpenRouter API key for embeddings
- `ANTHROPIC_API_KEY` - Anthropic API key for chat
- `INGEST_WORKER_URL` - Base URL of Railway worker (e.g. `https://<app>.railway.app`)
- `INGEST_WORKER_SECRET` - Shared secret for `/trigger` webhook

**Required env vars (Python worker):**
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (bypasses RLS for writes)
- `ANTHROPIC_API_KEY` - Anthropic API key for summarization
- `OPENROUTER_API_KEY` - OpenRouter API key for embeddings
- `NEWSAPI_KEY` - NewsAPI.org key
- `INGEST_WORKER_SECRET` - Shared secret to authenticate `/trigger` requests
- `EDINET_API_KEY` - EDINET FSA API subscription key

**Secrets location:**
- Frontend: `.env.local` (gitignored); template at `.env.local.example`
- Worker: `worker/.env` (gitignored); template at `worker/.env.example`

## Webhooks & Callbacks

**Incoming (worker):**
- `POST /trigger` on the Python worker HTTP server (`worker/server.py`)
  - Authenticated via `x-ingest-secret` request header matching `INGEST_WORKER_SECRET`
  - Triggers `run_once()` as an async background task
  - Called by the Next.js `POST /api/ingest` route (`app/api/ingest/route.ts`)

**Outgoing:**
- None

---

*Integration audit: 2026-04-15*

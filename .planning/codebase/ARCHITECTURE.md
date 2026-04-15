# ARCHITECTURE.md — System Design and Patterns

## Overall Pattern

**Decoupled dual-service architecture:**
- **Frontend + API:** Next.js 15 app (App Router) — serves UI, exposes API routes, handles auth
- **Worker:** Python asyncio service — ingests data from external sources, runs the AI pipeline, writes to Supabase

The two services share only the Supabase database. There is no direct RPC between them except the `/trigger` webhook on the worker's HTTP server.

```
Browser
  └── Next.js App (Vercel)
        ├── app/  (pages, layouts)
        ├── app/api/  (API routes → Supabase)
        └── middleware.ts  (auth guard)

Worker (Railway)
  ├── server.py  (aiohttp HTTP server, /trigger webhook)
  ├── worker.py  (news loop, EDINET loop, market loop)
  ├── sources/  (per-source fetchers)
  └── pipeline/  (summarize → embed → store)

Shared
  └── Supabase (Postgres + pgvector + auth)
```

---

## Layers

### Frontend (Next.js App Router)

| Layer | Location | Responsibility |
|-------|----------|----------------|
| Pages | `app/**/page.tsx` | Route entry points, compose components |
| Layout | `app/layout.tsx`, `components/layout/` | Shell, navigation, font |
| Components | `components/**/*.tsx` | UI — news, chat, markets, auth |
| API Routes | `app/api/**/route.ts` | Server-side data access |
| Lib | `lib/` | Supabase clients, Claude SDK, OpenRouter |
| Middleware | `middleware.ts` | Auth guard (redirects unauthenticated users) |

### Python Worker

| Layer | Location | Responsibility |
|-------|----------|----------------|
| Entry point | `worker/worker.py` | `main()` — starts server + 3 async loops |
| HTTP server | `worker/server.py` | aiohttp `/trigger` endpoint |
| Sources | `worker/sources/*.py` | Per-source article fetchers |
| Pipeline | `worker/pipeline/*.py` | summarize → embed → upsert |
| Backfill | `worker/backfill.py` | One-shot historical data backfill |

---

## Data Flow

### News Ingestion (every 30 min)
```
worker.py:run_news_loop()
  → sources/{nhk,gdelt,newsapi,asahi,japantimes}.py → raw Article dicts
  → pipeline/summarize.py → Claude API (tool_use) → English summary
  → pipeline/embed.py → OpenAI text-embedding-3-small → float[]
  → pipeline/store.py → Supabase articles table (upsert by URL)
```

### EDINET Filings (every 60 min)
```
worker.py:run_edinet_loop()
  → sources/edinet.py → EDINET API → filing documents
  → pipeline/summarize.py → pipeline/embed.py → pipeline/store.py
```

### Market Data (every 30 sec)
```
worker.py:run_market_loop()
  → sources/hyperliquid.py → Hyperliquid API → price snapshots
  → pipeline/store.py:upsert_snapshot() → Supabase market_snapshots table
```

### Frontend Read Path
```
Browser → Next.js page
  → ArticleFeed component (client) → fetch('/api/search' or '/api/ingest')
  → app/api/search/route.ts → Supabase RPC (match_articles) → pgvector similarity
  → JSON response → rendered ArticleCard components
```

### Chat Path
```
Browser → ChatPane (client) → fetch('/api/chat')
  → app/api/chat/route.ts → lib/claude.ts → Claude API
  → streams response back to client
```

### Manual Trigger Path
```
app/api/ingest/route.ts → POST worker:8080/trigger (x-ingest-secret header)
  → server.py:handle_trigger() → asyncio.create_task(run_once())
```

---

## Key Abstractions

### Supabase Clients (`lib/supabase/`)
- `client.ts` — browser-side client (uses anon key)
- `server.ts` — server-side client (reads cookies, used in API routes and middleware)
- Pattern: `createServerClient` from `@supabase/ssr` on server; `createBrowserClient` on client

### Article Dict (Python)
Informal dict shape passed through the pipeline:
```python
{
  "url": str,
  "title": str,
  "raw_text": str,
  "published_at": str (ISO),
  "source": str,
  "tier": int,           # 1=top, 2=regional
  # added by pipeline:
  "summary_en": str,
  "embedding": list[float]
}
```

### Auth Guard
`middleware.ts` runs on every non-static request. Unauthenticated users are redirected to `/login`. Auth handled entirely by Supabase Auth (email/password via `@supabase/ssr`).

---

## Entry Points

| Entry Point | File | Purpose |
|-------------|------|---------|
| Next.js app root | `app/layout.tsx` | HTML shell, global styles |
| Home page | `app/page.tsx` | Root route (redirects to dashboard) |
| Dashboard | `app/dashboard/page.tsx` | Main UI — feed + chat + markets |
| Filings page | `app/filings/page.tsx` | EDINET filings view |
| Worker process | `worker/worker.py:main()` | Starts HTTP server + 3 async loops |

---

## Auth Architecture

- **Provider:** Supabase Auth (email/password)
- **Session management:** Cookie-based via `@supabase/ssr`
- **Guard:** `middleware.ts` — protects all routes except `/login`, `/signup`, `/auth/*`
- **OAuth callback:** `app/auth/callback/route.ts` — exchanges code for session
- **Signout:** `app/auth/signout/route.ts`
- **Server actions:** `app/login/actions.ts`, `app/signup/actions.ts`

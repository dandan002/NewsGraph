# Technology Stack

**Analysis Date:** 2026-04-15

## Languages

**Primary:**
- TypeScript 5.x - Next.js frontend application (`app/`, `components/`, `lib/`)
- Python 3.11 - Ingest worker (`worker/`)

**Secondary:**
- SQL - Supabase migrations and pgvector RPC functions (`supabase/migrations/`)
- CSS - Global styles via Tailwind (`app/globals.css`)

## Runtime

**Environment:**
- Node.js >=20.9.0 (enforced via `engines` field in `package.json`)
- Python 3.11 (Railway deployment target per `railway.toml`)

**Package Manager:**
- npm (Node.js frontend)
- pip (Python worker)
- Lockfile: `package-lock.json` present; no `poetry.lock` (pip + `requirements.txt`)

## Frameworks

**Core:**
- Next.js 16.2.1 - App Router, React Server Components, API routes (`app/`)
- React 19.2.4 - UI rendering
- aiohttp 3.9.5 - Python async HTTP server for the worker (`worker/server.py`)

**Build/Dev:**
- Tailwind CSS 4.x - Utility-first CSS with `@tailwindcss/postcss` plugin (`postcss.config.mjs`)
- TypeScript compiler via `next` plugin (no separate `tsc` build step)

**Testing:**
- None detected

## Key Dependencies

**Critical (TypeScript/Node):**
- `@anthropic-ai/sdk` ^0.80.0 - Claude AI chat streaming (`lib/claude.ts`)
- `@supabase/ssr` ^0.9.0 - Supabase SSR client with cookie-based session (`lib/supabase/`)
- `@supabase/supabase-js` ^2.100.1 - Supabase base client
- `geist` ^1.7.0 - Vercel Geist font family

**Critical (Python):**
- `anthropic` 0.86.0 - Claude summarization in the pipeline (`worker/pipeline/summarize.py`)
- `supabase` 2.28.3 - Supabase writes from the worker (`worker/pipeline/store.py`)
- `feedparser` 6.0.12 - RSS parsing for NHK, Asahi, Japan Times sources
- `httpx` 0.28.1 - Async HTTP client for all Python source fetches
- `beautifulsoup4` 4.12.3 - HTML text extraction (`worker/sources/utils.py`)
- `edinet-tools` (no pinned version) - EDINET FSA filing index access (`worker/sources/edinet.py`)
- `aiohttp` 3.9.5 - Async HTTP server for `/trigger` webhook
- `python-dotenv` 1.2.2 - `.env` loading in worker

## Configuration

**Environment (Next.js):**
- `.env.local` (gitignored) - local dev secrets
- `.env.local.example` - template with all required keys
- Required keys: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY`, `INGEST_WORKER_URL`, `INGEST_WORKER_SECRET`

**Environment (Python worker):**
- `worker/.env` (gitignored) - local dev secrets
- `worker/.env.example` - template
- Required keys: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `NEWSAPI_KEY`, `INGEST_WORKER_SECRET`, `EDINET_API_KEY`

**Build:**
- `next.config.ts` - minimal, no custom config
- `tsconfig.json` - strict mode, `bundler` module resolution, `@/*` path alias maps to project root
- `postcss.config.mjs` - Tailwind v4 PostCSS plugin only

## Platform Requirements

**Development:**
- Node.js >=20.9.0
- Python 3.11+
- Active Supabase project with migrations applied

**Production:**
- Next.js frontend: Vercel (implied by Supabase SSR cookie pattern + SETUP.md)
- Python worker: Railway (`railway.toml` — `rootDirectory = "worker"`, `startCommand = "python3 worker.py"`, `builder = "nixpacks"`)

---

*Stack analysis: 2026-04-15*

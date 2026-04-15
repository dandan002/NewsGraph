# STRUCTURE.md — Directory Layout and Organization

## Top-Level Layout

```
NewsGraph/
├── app/                    # Next.js App Router (pages + API routes)
├── components/             # React UI components
├── lib/                    # Shared utilities (Supabase, Claude, OpenRouter)
├── worker/                 # Python ingest worker (separate service)
├── supabase/               # Database migrations
├── public/                 # Static assets (SVGs)
├── docs/                   # Design specs and plans
├── middleware.ts            # Next.js auth middleware
├── next.config.ts           # Next.js config
├── tsconfig.json            # TypeScript config
├── package.json             # JS dependencies
├── railway.toml             # Railway deployment config
└── .env.local               # Environment variables (not committed)
```

---

## `app/` — Next.js App Router

```
app/
├── layout.tsx              # Root layout (font, body styles, metadata)
├── page.tsx                # / root route
├── globals.css             # Global CSS (Tailwind base)
├── favicon.ico
│
├── dashboard/
│   └── page.tsx            # /dashboard — main UI (feed + chat + markets)
│
├── filings/
│   └── page.tsx            # /filings — EDINET filings view
│
├── login/
│   ├── page.tsx            # /login — login form
│   └── actions.ts          # Server actions: signInWithPassword
│
├── signup/
│   ├── page.tsx            # /signup — signup form
│   └── actions.ts          # Server actions: signUp
│
├── auth/
│   ├── callback/route.ts   # OAuth callback — exchanges code for session
│   └── signout/route.ts    # POST /auth/signout
│
└── api/
    ├── chat/route.ts       # POST /api/chat — Claude streaming chat
    ├── ingest/route.ts     # POST /api/ingest — triggers worker ingest cycle
    ├── markets/route.ts    # GET /api/markets — Hyperliquid price data
    └── search/route.ts     # GET /api/search — pgvector semantic search
```

---

## `components/` — UI Components

```
components/
├── auth/
│   ├── LoginForm.tsx       # Email/password login form
│   └── SignupForm.tsx      # Signup form
│
├── chat/
│   ├── ChatPane.tsx        # Chat container (manages messages state)
│   ├── ChatInput.tsx       # Text input + send button
│   └── ChatMessage.tsx     # Single message bubble (user/assistant)
│
├── layout/
│   ├── DashboardLayout.tsx # Three-column layout (feed | chat | markets)
│   └── TopNav.tsx          # Top navigation bar
│
├── markets/
│   ├── MarketsPanel.tsx    # Markets sidebar container
│   └── AssetBlock.tsx      # Single asset price display
│
└── news/
    ├── ArticleFeed.tsx     # Article list (fetches + renders cards)
    ├── ArticleCard.tsx     # Single article display
    └── FilterBar.tsx       # Tier/source filter controls
```

---

## `lib/` — Shared Utilities

```
lib/
├── claude.ts               # Claude API client (Anthropic SDK)
├── openrouter.ts           # OpenRouter client (alternative LLM routing)
└── supabase/
    ├── client.ts           # Browser-side Supabase client
    └── server.ts           # Server-side Supabase client (cookie-based)
```

---

## `worker/` — Python Ingest Worker

```
worker/
├── worker.py               # Entry point — main(), 3 async loops
├── server.py               # aiohttp HTTP server (/trigger webhook)
├── backfill.py             # One-shot historical backfill scripts
├── requirements.txt        # Python dependencies
├── .env                    # Worker env vars (not committed)
├── .env.example
│
├── sources/                # Per-source article fetchers
│   ├── __init__.py
│   ├── nhk.py              # NHK News Web RSS
│   ├── gdelt.py            # GDELT GKG data
│   ├── newsapi.py          # NewsAPI.org
│   ├── asahi.py            # Asahi Shimbun RSS
│   ├── japantimes.py       # Japan Times RSS
│   ├── edinet.py           # EDINET (TSE filings API)
│   ├── hyperliquid.py      # Hyperliquid DEX market data
│   └── utils.py            # Shared fetch helpers
│
└── pipeline/               # Ingest processing steps
    ├── __init__.py
    ├── summarize.py        # Claude API → English summary (tool_use)
    ├── embed.py            # OpenAI embedding API → float[]
    └── store.py            # Supabase upsert (articles + snapshots)
```

---

## `supabase/` — Database

```
supabase/
└── migrations/
    ├── 20260329000000_initial_schema.sql   # Core tables (articles, market_snapshots, etc.)
    └── 20260329000001_search_rpc.sql       # match_articles() RPC for pgvector similarity search
```

---

## Key File Locations Quick Reference

| What | Where |
|------|-------|
| Main dashboard UI | `app/dashboard/page.tsx` |
| Three-column layout | `components/layout/DashboardLayout.tsx` |
| Auth guard | `middleware.ts` |
| Supabase server client | `lib/supabase/server.ts` |
| Claude integration | `lib/claude.ts` |
| Chat API | `app/api/chat/route.ts` |
| Semantic search API | `app/api/search/route.ts` |
| Worker entry point | `worker/worker.py` |
| Ingest pipeline | `worker/pipeline/` |
| News sources | `worker/sources/` |
| DB schema | `supabase/migrations/` |
| Deployment config | `railway.toml` |
| Design docs | `docs/superpowers/` |

---

## Naming Conventions

| Kind | Convention | Notes |
|------|-----------|-------|
| Page files | `page.tsx` | Next.js App Router convention |
| Route handlers | `route.ts` | Next.js App Router convention |
| React components | `PascalCase.tsx` | e.g. `ArticleFeed.tsx` |
| Utility files | `camelCase.ts` | e.g. `claude.ts`, `openrouter.ts` |
| Python modules | `snake_case.py` | e.g. `summarize.py`, `gdelt.py` |
| SQL migrations | `YYYYMMDDNNNNNN_description.sql` | Supabase convention |
| API paths | `/api/<resource>` | Lowercase kebab |
| Page paths | `/<feature>` | Lowercase, matches dir name |

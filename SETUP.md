# NewsGraph — Setup & Deployment Guide

## What Was Built

A full-stack macro research platform:
- **Frontend** — Next.js 15 on Vercel: 3-column dashboard (news feed / RAG chat / markets), auth, semantic search
- **Worker** — Python 3.11 on Railway: ingest loop for NHK, GDELT, NewsAPI, EDINET; Hyperliquid market data every 30s
- **Database** — Supabase (Postgres + pgvector): articles with 1536-dim embeddings, market snapshots

---

## Prerequisites (accounts you need)

| Service | What for | Cost |
|---|---|---|
| Supabase | Database + Auth | Free tier OK |
| Anthropic | Claude summarization + RAG chat | Pay-per-use |
| OpenRouter | Embeddings (`text-embedding-3-small`) | Pay-per-use |
| NewsAPI | Japanese headlines | Free tier: 100 req/day |
| Vercel | Frontend hosting | Free tier OK |
| Railway | Python worker hosting | ~$5/mo |

---

## Step 1 — Supabase: Run Migrations

Go to your Supabase project → **SQL Editor** → run both files in order:

**1a.** Copy and run `supabase/migrations/20260329000000_initial_schema.sql`
- Creates `articles` and `market_snapshots` tables, indexes, and RLS policies

**1b.** Copy and run `supabase/migrations/20260329000001_search_rpc.sql`
- Creates the `search_articles(...)` pgvector RPC function

**After running 1a**, you'll see a note in the SQL output: *"Run REINDEX INDEX articles_embedding_idx after inserting initial data."* Do this once you have articles in the table.

**Where to find your Supabase keys:**
- Project URL: Settings → API → Project URL
- Anon key: Settings → API → `anon` `public`
- Service role key: Settings → API → `service_role` (keep this secret — worker only)

---

## Step 2 — Local Development

```bash
# Install frontend deps
npm install

# Create env file
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
OPENROUTER_API_KEY=<your-openrouter-key>
ANTHROPIC_API_KEY=<your-anthropic-key>
INGEST_WORKER_URL=http://localhost:8080        # for local testing
INGEST_WORKER_SECRET=pick-any-secret-string
```

```bash
# Start frontend
npm run dev
# → http://localhost:3000
```

**Sign up** at `/signup` to create your account (auth is required for all pages).

---

## Step 3 — Run the Worker Locally (optional, to seed data)

```bash
cd worker
pip install -r requirements.txt

cp .env.example .env
```

Edit `worker/.env`:
```
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
ANTHROPIC_API_KEY=<your-anthropic-key>
OPENROUTER_API_KEY=<your-openrouter-key>
NEWSAPI_KEY=<your-newsapi-key>          # get free key at newsapi.org
INGEST_WORKER_SECRET=pick-any-secret-string   # same value as .env.local
```

```bash
python worker.py
```

Expected output:
```
Worker HTTP server listening on port 8080
fetch_nhk: 10 articles
fetch_gdelt: 20 articles
...
```

After ~2 minutes, go to Supabase → Table Editor → `articles`. You should see rows with `embedding` populated (not null).

Once you have articles, run the REINDEX in Supabase SQL Editor:
```sql
REINDEX INDEX articles_embedding_idx;
```

---

## Step 4 — Deploy Frontend to Vercel

```bash
npx vercel --prod
```

Or connect the repo in the Vercel dashboard (recommended for auto-deploys).

**Add environment variables** in Vercel → Project → Settings → Environment Variables:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `OPENROUTER_API_KEY` | Your OpenRouter key |
| `ANTHROPIC_API_KEY` | Your Anthropic key |
| `INGEST_WORKER_URL` | Your Railway URL (fill in after Step 5) |
| `INGEST_WORKER_SECRET` | Same secret as the worker |

Redeploy after setting all vars.

---

## Step 5 — Deploy Worker to Railway

1. Push this repo to GitHub (if not already)
2. Go to railway.app → **New Project** → **Deploy from GitHub repo**
3. Select the repo
4. Railway auto-detects `worker/railway.toml` — root directory is `worker/`, start command is `python worker.py`

**Add environment variables** in Railway → Service → Variables:

| Variable | Value |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `ANTHROPIC_API_KEY` | Your Anthropic key |
| `OPENROUTER_API_KEY` | Your OpenRouter key |
| `NEWSAPI_KEY` | Your NewsAPI key |
| `INGEST_WORKER_SECRET` | Same secret as the frontend |

5. Once deployed, copy the Railway public URL (e.g. `https://newsgraph-worker-xxxx.railway.app`)
6. Go back to Vercel → update `INGEST_WORKER_URL` with this URL → redeploy

---

## Step 6 — Smoke Test

1. Navigate to your Vercel URL
2. Sign up (first user)
3. Wait ~2 minutes for the worker's first news cycle to complete
4. Type "Bank of Japan" in the search box → should return articles
5. Ask "What is the BOJ doing with rates?" in the chat pane → should stream a cited response
6. Check the markets panel → BTC/ETH/SOL prices should appear within 30s

---

## Architecture at a Glance

```
Browser
  └─ Vercel (Next.js)
       ├─ /api/search  → OpenRouter embed → Supabase pgvector RPC
       ├─ /api/chat    → OpenRouter embed → pgvector → Claude stream
       ├─ /api/markets → Supabase market_snapshots
       └─ /api/ingest  → Railway worker /trigger (POST)

Railway (Python worker)
  ├─ News loop (30m):   NHK RSS + GDELT GKG v2 + NewsAPI → Claude summarize → OpenRouter embed → Supabase
  ├─ EDINET loop (60m): FSA regulatory filings → same pipeline
  └─ Markets loop (30s): Hyperliquid perp data → Supabase market_snapshots
```

---

## Troubleshooting

**"no articles found" in the feed**
- Worker hasn't run yet, or articles table is empty
- Check worker logs in Railway → Service → Deployments
- Or run the worker locally (Step 3) to seed data

**Search returns no results for a query**
- The pgvector ivfflat index needs data to build clusters — run `REINDEX INDEX articles_embedding_idx;` in Supabase SQL Editor after first data load
- Lower the `match_threshold` in `app/api/search/route.ts` from `0.3` to `0.1` if needed

**Chat says "no context" or gives generic answers**
- Same root cause as above — needs articles in the database
- Chat uses a 30-day window with threshold 0.2

**Markets panel shows "—"**
- Worker market loop runs every 30s — wait up to 30s after worker starts
- Check Supabase → Table Editor → `market_snapshots` for rows

**Railway worker crashes at startup**
- Check that all 6 env vars are set in Railway
- `SUPABASE_SERVICE_ROLE_KEY` is the service role key, not the anon key

**Auth redirect loop**
- Make sure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct in Vercel
- Check Supabase → Authentication → URL Configuration → add your Vercel URL to allowed redirect URLs

**EDINET returns 0 articles**
- EDINET only publishes filings on Japanese business days
- `type=2` filters for documents with attachments; some days may have none matching `formCode 140`

---

## Key Files

```
.env.local.example          Frontend env template
worker/.env.example         Worker env template

supabase/migrations/        Run these in Supabase SQL Editor (in order)

app/api/search/route.ts     Semantic search endpoint
app/api/chat/route.ts       Streaming RAG chat endpoint
app/api/markets/route.ts    Market data endpoint

worker/worker.py            Asyncio entry point + scheduling loops
worker/sources/             One file per data source
worker/pipeline/            summarize.py, embed.py, store.py
```

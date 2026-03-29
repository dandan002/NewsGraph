# Macro Research Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack macro research platform that ingests Japanese news/filings, generates English summaries via Claude, stores them as vector embeddings, and exposes them through a terminal-dark dashboard with semantic search and a RAG chat interface.

**Architecture:** Next.js App Router frontend (Vercel) + Python ingest worker (Railway) sharing a Supabase Postgres+pgvector database. Auth is Supabase Auth with `@supabase/ssr`. Semantic search uses OpenRouter embeddings; RAG chat uses Anthropic Claude with streaming.

**Tech Stack:** Next.js 14, Tailwind CSS, TypeScript, Supabase (`@supabase/ssr`, `@supabase/supabase-js`), Anthropic SDK, OpenRouter API, Python 3.11, feedparser, httpx, asyncio, Railway

---

## File Map

### Next.js frontend (`/` — project root)
```
middleware.ts                          # Session refresh + auth redirect on every request
app/
  layout.tsx                           # Root layout: font, global Tailwind, metadata
  page.tsx                             # Redirects / → /dashboard
  login/
    page.tsx                           # Login page (centered card)
    actions.ts                         # Server Action: signInWithPassword
  signup/
    page.tsx                           # Signup page (centered card)
    actions.ts                         # Server Action: signUp + auto sign-in
  auth/
    callback/route.ts                  # Exchanges auth code for session (email confirm)
    signout/route.ts                   # Signs out + clears cookie + redirects to /login
  dashboard/
    page.tsx                           # 3-column split pane dashboard
  filings/
    page.tsx                           # Dashboard pre-filtered to tier=1
lib/
  supabase/
    client.ts                          # createBrowserClient (client components)
    server.ts                          # createServerClient (server components + API routes)
  openrouter.ts                        # embed(text: string): Promise<number[]>
  claude.ts                            # streamChat(messages, context): ReadableStream
components/
  layout/
    TopNav.tsx                         # NEWSGRAPH wordmark + nav links + user/signout
    DashboardLayout.tsx                # 3-column wrapper (news | chat | markets)
  news/
    ArticleFeed.tsx                    # Search bar + FilterBar + article list
    FilterBar.tsx                      # Country / tier / date filter pills
    ArticleCard.tsx                    # Single article card (headline + snippet + badge)
  chat/
    ChatPane.tsx                       # Full chat column: messages + input
    ChatMessage.tsx                    # User or assistant message with citations
    ChatInput.tsx                      # Controlled input + submit button
  markets/
    MarketsPanel.tsx                   # Right column: polls /api/markets every 30s
    AssetBlock.tsx                     # Single asset block (name, price, funding, OI)
  auth/
    LoginForm.tsx                      # Controlled email+password form
    SignupForm.tsx                     # Registration form
app/api/
  search/route.ts                      # POST: embed query → pgvector cosine + SQL filters
  chat/route.ts                        # POST: embed → top-5 articles → stream Claude
  markets/route.ts                     # GET: latest market_snapshots for BTC/ETH/SOL
  ingest/route.ts                      # POST: call Railway worker /trigger webhook
```

### Python ingest worker (`/worker`)
```
worker/
  worker.py                            # asyncio main loop: schedules all source loops
  server.py                            # aiohttp HTTP server exposing POST /trigger
  pipeline/
    summarize.py                       # summarize_article(text: str) -> str via Claude
    embed.py                           # embed_text(text: str) -> list[float] via OpenRouter
    store.py                           # upsert_article(article: dict) + upsert_snapshot(snap: dict)
  sources/
    nhk.py                             # fetch_nhk() -> list[dict]
    gdelt.py                           # fetch_gdelt() -> list[dict]
    edinet.py                          # fetch_edinet() -> list[dict]
    newsapi.py                         # fetch_newsapi() -> list[dict]
    hyperliquid.py                     # fetch_hyperliquid() -> list[dict]
  requirements.txt
  railway.toml
  .env.example
```

### Database
```
supabase/
  migrations/
    20260329000000_initial_schema.sql  # articles + market_snapshots + indexes + RLS
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json` (via `npx create-next-app`)
- Create: `.gitignore`
- Create: `.env.local.example`
- Create: `worker/requirements.txt`
- Create: `worker/railway.toml`
- Create: `worker/.env.example`

- [ ] **Step 1: Scaffold Next.js app**

```bash
cd /Users/dandan/Desktop/Projects/NewsGraph
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --src-dir=false \
  --import-alias="@/*" \
  --no-eslint
```

Accept all prompts. This creates `app/`, `components/` (can be empty), `lib/`, `public/`, `tailwind.config.ts`, `next.config.ts`, `tsconfig.json`.

- [ ] **Step 2: Install frontend dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr @anthropic-ai/sdk
```

- [ ] **Step 3: Create worker directory + requirements.txt**

```bash
mkdir -p worker/pipeline worker/sources
```

Create `worker/requirements.txt`:
```
aiohttp==3.9.3
anthropic==0.25.1
feedparser==6.0.11
httpx==0.27.0
supabase==2.4.0
python-dotenv==1.0.1
```

- [ ] **Step 4: Create worker/railway.toml**

```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "python worker.py"
restartPolicyType = "always"
```

- [ ] **Step 5: Create worker/.env.example**

```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
OPENROUTER_API_KEY=
NEWSAPI_KEY=
INGEST_WORKER_SECRET=some-random-secret
```

- [ ] **Step 6: Create .env.local.example in project root**

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENROUTER_API_KEY=
ANTHROPIC_API_KEY=
INGEST_WORKER_URL=https://<railway-app>.railway.app
INGEST_WORKER_SECRET=some-random-secret
```

- [ ] **Step 7: Add .superpowers to .gitignore**

Open `.gitignore` (created by create-next-app) and append:
```
# Superpowers brainstorm files
.superpowers/

# Worker env
worker/.env
```

- [ ] **Step 8: Copy .env.local.example to .env.local and fill in real Supabase values**

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your actual `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from the Supabase dashboard (Settings → API).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold next.js app and worker directory"
```

---

## Task 2: Database Schema

**Files:**
- Create: `supabase/migrations/20260329000000_initial_schema.sql`

- [ ] **Step 1: Create migration file**

```bash
mkdir -p supabase/migrations
```

Create `supabase/migrations/20260329000000_initial_schema.sql`:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Articles table
CREATE TABLE articles (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url              text UNIQUE NOT NULL,
  source_name      text NOT NULL,
  credibility_tier int  NOT NULL CHECK (credibility_tier IN (1, 2, 3)),
  country          char(2) NOT NULL,
  published_at     timestamptz,
  summary_en       text NOT NULL,
  embedding        vector(1536),
  created_at       timestamptz DEFAULT now()
);

-- Market snapshots table
CREATE TABLE market_snapshots (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset         text NOT NULL,
  market_type   text NOT NULL CHECK (market_type IN ('perp', 'spot')),
  mark_price    numeric,
  open_interest numeric,
  funding_rate  numeric,
  snapshot_at   timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX ON articles USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX ON articles (published_at DESC);
CREATE INDEX ON market_snapshots (snapshot_at DESC);

-- Row-level security
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated read" ON articles
  FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE market_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated read" ON market_snapshots
  FOR SELECT USING (auth.role() = 'authenticated');
```

- [ ] **Step 2: Run migration in Supabase**

Go to Supabase dashboard → SQL Editor → paste the contents of the migration file → Run.

Verify by going to Table Editor — you should see `articles` and `market_snapshots` tables.

- [ ] **Step 3: Commit**

```bash
git add supabase/
git commit -m "feat: add database schema with pgvector and RLS"
```

---

## Task 3: Supabase Client Helpers

**Files:**
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/client.ts`

- [ ] **Step 1: Create lib/supabase/server.ts**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — cookies can't be set, safe to ignore
          }
        },
      },
    }
  )
}
```

- [ ] **Step 2: Create lib/supabase/client.ts**

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/
git commit -m "feat: add supabase client helpers (server + browser)"
```

---

## Task 4: Middleware (Session Refresh + Auth Guard)

**Files:**
- Create: `middleware.ts`

- [ ] **Step 1: Create middleware.ts**

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthRoute =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup') ||
    request.nextUrl.pathname.startsWith('/auth')

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 2: Verify dev server starts without errors**

```bash
npm run dev
```

Expected: Server starts on http://localhost:3000. Navigating to `/` should redirect to `/login` (which will 404 for now — that's fine).

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: add supabase session middleware with auth guard"
```

---

## Task 5: Auth Pages (Login + Signup)

**Files:**
- Create: `app/login/page.tsx`
- Create: `app/login/actions.ts`
- Create: `app/signup/page.tsx`
- Create: `app/signup/actions.ts`
- Create: `app/auth/callback/route.ts`
- Create: `app/auth/signout/route.ts`
- Create: `components/auth/LoginForm.tsx`
- Create: `components/auth/SignupForm.tsx`

- [ ] **Step 1: Create app/login/actions.ts**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signIn(formData: FormData) {
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) return { error: error.message }
  redirect('/dashboard')
}
```

- [ ] **Step 2: Create components/auth/LoginForm.tsx**

```typescript
'use client'

import { useFormState } from 'react-dom'
import { signIn } from '@/app/login/actions'

const initialState = { error: '' }

export function LoginForm() {
  const [state, formAction] = useFormState(signIn as any, initialState)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.error && (
        <p className="text-red-400 text-sm font-mono">{state.error}</p>
      )}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500 font-mono uppercase tracking-wider">
          Email
        </label>
        <input
          name="email"
          type="email"
          required
          className="bg-[#0d1525] border border-[#1a2740] rounded px-3 py-2 text-slate-200 font-mono text-sm focus:outline-none focus:border-blue-500"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500 font-mono uppercase tracking-wider">
          Password
        </label>
        <input
          name="password"
          type="password"
          required
          className="bg-[#0d1525] border border-[#1a2740] rounded px-3 py-2 text-slate-200 font-mono text-sm focus:outline-none focus:border-blue-500"
        />
      </div>
      <button
        type="submit"
        className="bg-[#1a3a6e] hover:bg-[#1e4a8e] text-blue-300 font-mono text-sm py-2 rounded transition-colors"
      >
        SIGN IN
      </button>
    </form>
  )
}
```

- [ ] **Step 3: Create app/login/page.tsx**

```typescript
import { LoginForm } from '@/components/auth/LoginForm'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-blue-400 font-mono font-bold text-2xl tracking-widest">
            NEWSGRAPH
          </h1>
          <p className="text-slate-600 font-mono text-xs mt-1">
            macro research platform
          </p>
        </div>
        <div className="bg-[#0a0f1a] border border-[#131d2e] rounded-lg p-8">
          <LoginForm />
          <p className="text-center text-slate-600 font-mono text-xs mt-6">
            No account?{' '}
            <Link href="/signup" className="text-blue-400 hover:text-blue-300">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create app/signup/actions.ts**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signUp(formData: FormData) {
  const supabase = createClient()
  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) return { error: error.message }
  redirect('/dashboard')
}
```

- [ ] **Step 5: Create components/auth/SignupForm.tsx**

```typescript
'use client'

import { useFormState } from 'react-dom'
import { signUp } from '@/app/signup/actions'

const initialState = { error: '' }

export function SignupForm() {
  const [state, formAction] = useFormState(signUp as any, initialState)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.error && (
        <p className="text-red-400 text-sm font-mono">{state.error}</p>
      )}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500 font-mono uppercase tracking-wider">
          Email
        </label>
        <input
          name="email"
          type="email"
          required
          className="bg-[#0d1525] border border-[#1a2740] rounded px-3 py-2 text-slate-200 font-mono text-sm focus:outline-none focus:border-blue-500"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500 font-mono uppercase tracking-wider">
          Password
        </label>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          className="bg-[#0d1525] border border-[#1a2740] rounded px-3 py-2 text-slate-200 font-mono text-sm focus:outline-none focus:border-blue-500"
        />
      </div>
      <button
        type="submit"
        className="bg-[#1a3a6e] hover:bg-[#1e4a8e] text-blue-300 font-mono text-sm py-2 rounded transition-colors"
      >
        CREATE ACCOUNT
      </button>
    </form>
  )
}
```

- [ ] **Step 6: Create app/signup/page.tsx**

```typescript
import { SignupForm } from '@/components/auth/SignupForm'
import Link from 'next/link'

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-blue-400 font-mono font-bold text-2xl tracking-widest">
            NEWSGRAPH
          </h1>
          <p className="text-slate-600 font-mono text-xs mt-1">
            macro research platform
          </p>
        </div>
        <div className="bg-[#0a0f1a] border border-[#131d2e] rounded-lg p-8">
          <SignupForm />
          <p className="text-center text-slate-600 font-mono text-xs mt-6">
            Have an account?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Create app/auth/callback/route.ts**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
```

- [ ] **Step 8: Create app/auth/signout/route.ts**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/login', request.url))
}
```

- [ ] **Step 9: Smoke test auth flow**

```bash
npm run dev
```

Navigate to http://localhost:3000 → should redirect to `/login`. Sign up with a test email/password → should redirect to `/dashboard` (404 for now is fine). Check Supabase dashboard → Authentication → Users — the test user should appear.

- [ ] **Step 10: Commit**

```bash
git add app/ components/auth/
git commit -m "feat: add auth pages (login, signup, signout, callback)"
```

---

## Task 6: App Shell — Layout, Nav, Root Route

**Files:**
- Modify: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `components/layout/TopNav.tsx`

- [ ] **Step 1: Update app/layout.tsx**

```typescript
import type { Metadata } from 'next'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = {
  title: 'NewsGraph',
  description: 'Macro research platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={GeistMono.className}>
      <body className="bg-[#080c14] text-slate-200 antialiased">{children}</body>
    </html>
  )
}
```

Install the Geist font package:
```bash
npm install geist
```

- [ ] **Step 2: Create app/page.tsx (root redirect)**

```typescript
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/dashboard')
}
```

- [ ] **Step 3: Create components/layout/TopNav.tsx**

```typescript
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export async function TopNav() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <nav className="bg-[#0a0f1a] border-b border-[#131d2e] px-4 py-2 flex items-center justify-between flex-shrink-0">
      <span className="text-blue-400 font-mono font-bold tracking-widest text-sm">
        NEWSGRAPH
      </span>
      <div className="flex gap-6 font-mono text-xs text-[#2a3a52]">
        <Link
          href="/dashboard"
          className="hover:text-blue-400 transition-colors [&.active]:text-blue-400 [&.active]:border-b [&.active]:border-blue-400"
        >
          DASHBOARD
        </Link>
        <Link href="/filings" className="hover:text-blue-400 transition-colors">
          FILINGS
        </Link>
        <span className="cursor-not-allowed opacity-40">SETTINGS</span>
      </div>
      <div className="font-mono text-xs text-[#2a3a52]">
        {user?.email}&nbsp;·&nbsp;
        <form action="/auth/signout" method="POST" className="inline">
          <button
            type="submit"
            className="text-red-500 hover:text-red-400 transition-colors"
          >
            sign out
          </button>
        </form>
      </div>
    </nav>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx app/page.tsx components/layout/TopNav.tsx
git commit -m "feat: add app shell, root redirect, top nav"
```

---

## Task 7: Dashboard Layout (3-Column Split Pane)

**Files:**
- Create: `components/layout/DashboardLayout.tsx`
- Create: `app/dashboard/page.tsx`
- Create: `app/filings/page.tsx`

- [ ] **Step 1: Create components/layout/DashboardLayout.tsx**

```typescript
import { TopNav } from './TopNav'

interface DashboardLayoutProps {
  newsFeed: React.ReactNode
  chat: React.ReactNode
  markets: React.ReactNode
}

export function DashboardLayout({ newsFeed, chat, markets }: DashboardLayoutProps) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        {/* Left: News Feed */}
        <div className="flex-[1.5] border-r border-[#131d2e] overflow-hidden flex flex-col min-w-0">
          {newsFeed}
        </div>
        {/* Middle: Chat */}
        <div className="flex-1 border-r border-[#131d2e] overflow-hidden flex flex-col min-w-0">
          {chat}
        </div>
        {/* Right: Markets */}
        <div className="w-[120px] flex-shrink-0 overflow-hidden flex flex-col">
          {markets}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create app/dashboard/page.tsx (placeholder columns)**

```typescript
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ArticleFeed } from '@/components/news/ArticleFeed'
import { ChatPane } from '@/components/chat/ChatPane'
import { MarketsPanel } from '@/components/markets/MarketsPanel'

export default function DashboardPage() {
  return (
    <DashboardLayout
      newsFeed={<ArticleFeed initialTier={null} />}
      chat={<ChatPane />}
      markets={<MarketsPanel />}
    />
  )
}
```

- [ ] **Step 3: Create app/filings/page.tsx**

```typescript
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ArticleFeed } from '@/components/news/ArticleFeed'
import { ChatPane } from '@/components/chat/ChatPane'
import { MarketsPanel } from '@/components/markets/MarketsPanel'

export default function FilingsPage() {
  return (
    <DashboardLayout
      newsFeed={<ArticleFeed initialTier={1} />}
      chat={<ChatPane />}
      markets={<MarketsPanel />}
    />
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add components/layout/DashboardLayout.tsx app/dashboard/ app/filings/
git commit -m "feat: add 3-column dashboard layout and filings page"
```

---

## Task 8: Markets Panel + /api/markets

**Files:**
- Create: `app/api/markets/route.ts`
- Create: `components/markets/AssetBlock.tsx`
- Create: `components/markets/MarketsPanel.tsx`

- [ ] **Step 1: Create app/api/markets/route.ts**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const ASSETS = ['BTC', 'ETH', 'SOL']

export async function GET() {
  const supabase = createClient()

  const { data: user } = await supabase.auth.getUser()
  if (!user.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get latest snapshot per asset
  const results = await Promise.all(
    ASSETS.map((asset) =>
      supabase
        .from('market_snapshots')
        .select('*')
        .eq('asset', asset)
        .eq('market_type', 'perp')
        .order('snapshot_at', { ascending: false })
        .limit(1)
        .single()
    )
  )

  const snapshots = results
    .filter((r) => r.data)
    .map((r) => r.data)

  return NextResponse.json({ snapshots })
}
```

- [ ] **Step 2: Create components/markets/AssetBlock.tsx**

```typescript
interface AssetBlockProps {
  asset: string
  markPrice: number | null
  fundingRate: number | null
  openInterest: number | null
}

function formatOI(oi: number | null): string {
  if (oi === null) return '—'
  if (oi >= 1e9) return `${(oi / 1e9).toFixed(1)}B`
  if (oi >= 1e6) return `${(oi / 1e6).toFixed(0)}M`
  return oi.toFixed(0)
}

function formatFunding(rate: number | null): { text: string; color: string } {
  if (rate === null) return { text: '—', color: 'text-slate-600' }
  const pct = (rate * 100).toFixed(3)
  if (rate > 0) return { text: `+${pct}%`, color: 'text-amber-400' }
  if (rate < 0) return { text: `${pct}%`, color: 'text-red-400' }
  return { text: `${pct}%`, color: 'text-slate-500' }
}

export function AssetBlock({ asset, markPrice, fundingRate, openInterest }: AssetBlockProps) {
  const funding = formatFunding(fundingRate)

  return (
    <div className="border-t border-[#131d2e] pt-3 pb-1">
      <div className="text-blue-400 font-mono text-[10px] mb-1">{asset}-PERP</div>
      <div className="text-slate-200 font-mono text-sm font-bold">
        {markPrice !== null ? markPrice.toLocaleString() : '—'}
      </div>
      <div className="font-mono text-[10px] mt-1 text-slate-500">
        Fund <span className={funding.color}>{funding.text}</span>
      </div>
      <div className="font-mono text-[10px] text-slate-500">
        OI <span className="text-slate-300">{formatOI(openInterest)}</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create components/markets/MarketsPanel.tsx**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { AssetBlock } from './AssetBlock'

interface Snapshot {
  asset: string
  mark_price: number | null
  funding_rate: number | null
  open_interest: number | null
}

export function MarketsPanel() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])

  async function fetchMarkets() {
    const res = await fetch('/api/markets')
    if (!res.ok) return
    const data = await res.json()
    setSnapshots(data.snapshots ?? [])
  }

  useEffect(() => {
    fetchMarkets()
    const interval = setInterval(fetchMarkets, 30_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="h-full bg-[#0a0f1a] px-2 py-3 flex flex-col">
      <div className="font-mono text-[9px] tracking-widest text-[#2a3a52] mb-1">
        MARKETS
      </div>
      <div className="flex flex-col gap-1 flex-1">
        {['BTC', 'ETH', 'SOL'].map((asset) => {
          const snap = snapshots.find((s) => s.asset === asset)
          return (
            <AssetBlock
              key={asset}
              asset={asset}
              markPrice={snap?.mark_price ?? null}
              fundingRate={snap?.funding_rate ?? null}
              openInterest={snap?.open_interest ?? null}
            />
          )
        })}
      </div>
      <div className="font-mono text-[8px] text-[#1e3a5a] mt-auto pt-2">
        ↻ 30s
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify it compiles**

```bash
npm run build 2>&1 | tail -20
```

Expected: Build succeeds (may warn about missing components used in dashboard/page.tsx — those are stubs added next).

- [ ] **Step 5: Commit**

```bash
git add app/api/markets/ components/markets/
git commit -m "feat: add markets panel with 30s polling and /api/markets route"
```

---

## Task 9: Article Card + Feed Components

**Files:**
- Create: `components/news/ArticleCard.tsx`
- Create: `components/news/FilterBar.tsx`
- Create: `components/news/ArticleFeed.tsx`

- [ ] **Step 1: Create components/news/ArticleCard.tsx**

```typescript
interface Article {
  id: string
  url: string
  source_name: string
  credibility_tier: 1 | 2 | 3
  published_at: string | null
  summary_en: string
  // headline extracted from summary_en first sentence
}

const TIER_CONFIG = {
  1: { border: 'border-l-blue-500', badge: 'bg-[#0f2a4a] text-blue-300', label: 'REG' },
  2: { border: 'border-l-indigo-500', badge: 'bg-[#1a1a3a] text-indigo-300', label: 'PRESS' },
  3: { border: 'border-l-[#1e3a5a]', badge: 'bg-[#131d2e] text-slate-500', label: 'WIRE' },
}

function extractHeadline(summary: string): string {
  return summary.split('.')[0] + '.'
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return `${Math.floor(diff / 60_000)}m ago`
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function ArticleCard({ article }: { article: Article }) {
  const tier = TIER_CONFIG[article.credibility_tier]
  const headline = extractHeadline(article.summary_en)
  const snippet = article.summary_en.slice(headline.length).trim().split('.')[0]

  return (
    <div
      className={`bg-[#0d1525] rounded p-3 border-l-2 ${tier.border} hover:bg-[#111c30] transition-colors`}
    >
      <div className="flex justify-between items-start gap-2 mb-1">
        <span className="text-slate-200 font-mono text-[11px] font-semibold leading-snug">
          {headline}
        </span>
        <span
          className={`${tier.badge} font-mono text-[9px] px-1.5 py-0.5 rounded-sm whitespace-nowrap flex-shrink-0`}
        >
          {tier.label}
        </span>
      </div>
      {snippet && (
        <p className="text-slate-500 font-mono text-[10px] leading-snug mb-2 line-clamp-2">
          {snippet}.
        </p>
      )}
      <div className="flex items-center gap-1.5 font-mono text-[9px] text-[#2a3a52]">
        <span>{article.source_name}</span>
        <span>·</span>
        <span>{timeAgo(article.published_at)}</span>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-blue-500 hover:text-blue-400"
        >
          ↗
        </a>
      </div>
    </div>
  )
}

export type { Article }
```

- [ ] **Step 2: Create components/news/FilterBar.tsx**

```typescript
'use client'

interface FilterBarProps {
  tier: number | null
  dateRange: number
  onTierChange: (tier: number | null) => void
  onDateRangeChange: (days: number) => void
}

const TIERS = [
  { label: 'All', value: null },
  { label: 'Regulatory', value: 1 },
  { label: 'Press', value: 2 },
  { label: 'Wire', value: 3 },
]

const DATE_RANGES = [
  { label: '24h', value: 1 },
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
]

export function FilterBar({ tier, dateRange, onTierChange, onDateRangeChange }: FilterBarProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      <div className="flex gap-1">
        {TIERS.map((t) => (
          <button
            key={String(t.value)}
            onClick={() => onTierChange(t.value)}
            className={`font-mono text-[9px] px-2 py-1 rounded border transition-colors ${
              tier === t.value
                ? 'border-blue-500 text-blue-300 bg-[#0d1a2e]'
                : 'border-[#1a2740] text-[#4a6080] bg-[#0d1525] hover:border-blue-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex gap-1 ml-auto">
        {DATE_RANGES.map((d) => (
          <button
            key={d.value}
            onClick={() => onDateRangeChange(d.value)}
            className={`font-mono text-[9px] px-2 py-1 rounded border transition-colors ${
              dateRange === d.value
                ? 'border-blue-500 text-blue-300 bg-[#0d1a2e]'
                : 'border-[#1a2740] text-[#4a6080] bg-[#0d1525] hover:border-blue-600'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create components/news/ArticleFeed.tsx**

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArticleCard, type Article } from './ArticleCard'
import { FilterBar } from './FilterBar'

interface ArticleFeedProps {
  initialTier: number | null
}

export function ArticleFeed({ initialTier }: ArticleFeedProps) {
  const [query, setQuery] = useState('')
  const [tier, setTier] = useState<number | null>(initialTier)
  const [dateRange, setDateRange] = useState(7)
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(false)

  const fetchArticles = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, tier, dateRange }),
      })
      if (!res.ok) return
      const data = await res.json()
      setArticles(data.articles ?? [])
    } finally {
      setLoading(false)
    }
  }, [tier, dateRange])

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchArticles(query)
  }, [tier, dateRange]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    fetchArticles(query)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search + filters header */}
      <div className="px-3 py-3 border-b border-[#131d2e] bg-[#0a0f1a] flex-shrink-0">
        <form onSubmit={handleSearch} className="flex gap-2 mb-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search articles... (semantic)"
            className="flex-1 bg-[#0d1525] border border-[#1a2740] rounded px-3 py-1.5 text-slate-300 font-mono text-[11px] placeholder:text-[#2a3a52] focus:outline-none focus:border-blue-600"
          />
          <button
            type="submit"
            className="bg-[#1a3a6e] hover:bg-[#1e4a8e] text-blue-300 font-mono text-[10px] px-3 py-1.5 rounded transition-colors"
          >
            SEARCH
          </button>
        </form>
        <div className="flex items-center gap-2">
          <FilterBar
            tier={tier}
            dateRange={dateRange}
            onTierChange={setTier}
            onDateRangeChange={setDateRange}
          />
          <span className="font-mono text-[9px] text-blue-500 border border-[#1a3a5e] rounded px-1.5 py-0.5 ml-1">
            ● LIVE
          </span>
        </div>
      </div>

      {/* Article list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-2">
        {loading && (
          <div className="text-center text-slate-600 font-mono text-xs py-8">
            loading...
          </div>
        )}
        {!loading && articles.length === 0 && (
          <div className="text-center text-slate-600 font-mono text-xs py-8">
            no articles found
          </div>
        )}
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add components/news/
git commit -m "feat: add article card, filter bar, and article feed components"
```

---

## Task 10: /api/search Route + OpenRouter Embeddings

**Files:**
- Create: `lib/openrouter.ts`
- Create: `app/api/search/route.ts`

- [ ] **Step 1: Create lib/openrouter.ts**

```typescript
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/embeddings'

export async function embed(text: string): Promise<number[]> {
  const res = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/text-embedding-3-small',
      input: text,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenRouter embeddings failed: ${err}`)
  }

  const data = await res.json()
  return data.data[0].embedding as number[]
}
```

- [ ] **Step 2: Create app/api/search/route.ts**

```typescript
import { createClient } from '@/lib/supabase/server'
import { embed } from '@/lib/openrouter'
import { NextResponse } from 'next/server'

interface SearchRequest {
  query: string
  tier?: number | null
  dateRange?: number // days
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: SearchRequest = await request.json()
  const { query, tier, dateRange = 7 } = body

  // Embed the query (or use recent articles if query is empty)
  let embedding: number[] | null = null
  if (query.trim()) {
    embedding = await embed(query)
  }

  const since = new Date(Date.now() - dateRange * 24 * 3_600_000).toISOString()

  let dbQuery = supabase
    .from('articles')
    .select('id, url, source_name, credibility_tier, published_at, summary_en')
    .gte('published_at', since)
    .order('published_at', { ascending: false })
    .limit(10)

  if (tier !== null && tier !== undefined) {
    dbQuery = dbQuery.eq('credibility_tier', tier)
  }

  // If we have an embedding, use pgvector cosine similarity via RPC
  if (embedding) {
    const { data, error } = await supabase.rpc('search_articles', {
      query_embedding: embedding,
      match_threshold: 0.3,
      match_count: 10,
      filter_tier: tier ?? null,
      filter_since: since,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ articles: data })
  }

  // Fallback: recent articles sorted by date
  const { data, error } = await dbQuery
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ articles: data })
}
```

- [ ] **Step 3: Create the pgvector search RPC function in Supabase**

Go to Supabase SQL Editor and run:

```sql
CREATE OR REPLACE FUNCTION search_articles(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_tier int DEFAULT NULL,
  filter_since timestamptz DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  url text,
  source_name text,
  credibility_tier int,
  published_at timestamptz,
  summary_en text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    a.id,
    a.url,
    a.source_name,
    a.credibility_tier,
    a.published_at,
    a.summary_en,
    1 - (a.embedding <=> query_embedding) AS similarity
  FROM articles a
  WHERE
    (filter_tier IS NULL OR a.credibility_tier = filter_tier)
    AND (filter_since IS NULL OR a.published_at >= filter_since)
    AND 1 - (a.embedding <=> query_embedding) > match_threshold
  ORDER BY a.embedding <=> query_embedding
  LIMIT match_count;
$$;
```

- [ ] **Step 4: Commit**

```bash
git add lib/openrouter.ts app/api/search/
git commit -m "feat: add semantic search with pgvector RPC and openrouter embeddings"
```

---

## Task 11: Chat Components + /api/chat Route (Streaming RAG)

**Files:**
- Create: `lib/claude.ts`
- Create: `app/api/chat/route.ts`
- Create: `components/chat/ChatMessage.tsx`
- Create: `components/chat/ChatInput.tsx`
- Create: `components/chat/ChatPane.tsx`

- [ ] **Step 1: Create lib/claude.ts**

```typescript
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface ArticleContext {
  id: string
  source_name: string
  published_at: string | null
  summary_en: string
  url: string
}

export function buildSystemPrompt(articles: ArticleContext[]): string {
  const context = articles
    .map(
      (a, i) =>
        `[${i + 1}] ${a.source_name} (${a.published_at ? new Date(a.published_at).toLocaleDateString() : 'unknown date'})\n${a.summary_en}\nSource: ${a.url}`
    )
    .join('\n\n')

  return `You are a macro research assistant for professional investors focused on Japanese equities and crypto markets. Answer questions using only the provided article context. Cite sources using [N] notation matching the numbered articles below. Be concise and factual.

CONTEXT:
${context}`
}

export async function streamChatResponse(
  messages: Anthropic.MessageParam[],
  systemPrompt: string
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder()

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  })

  return new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }
      controller.close()
    },
    cancel() {
      stream.abort()
    },
  })
}
```

- [ ] **Step 2: Create app/api/chat/route.ts**

```typescript
import { createClient } from '@/lib/supabase/server'
import { embed } from '@/lib/openrouter'
import { buildSystemPrompt, streamChatResponse, type ArticleContext } from '@/lib/claude'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

interface ChatRequest {
  messages: Anthropic.MessageParam[]
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { messages }: ChatRequest = await request.json()
  const lastUserMessage = messages.at(-1)
  if (!lastUserMessage || lastUserMessage.role !== 'user') {
    return NextResponse.json({ error: 'No user message' }, { status: 400 })
  }

  const userText =
    typeof lastUserMessage.content === 'string'
      ? lastUserMessage.content
      : (lastUserMessage.content as any[])[0]?.text ?? ''

  // Embed user message and fetch top-5 relevant articles
  const embedding = await embed(userText)
  const since = new Date(Date.now() - 30 * 24 * 3_600_000).toISOString()

  const { data: articles } = await supabase.rpc('search_articles', {
    query_embedding: embedding,
    match_threshold: 0.2,
    match_count: 5,
    filter_tier: null,
    filter_since: since,
  })

  const context: ArticleContext[] = (articles ?? []).map((a: any) => ({
    id: a.id,
    source_name: a.source_name,
    published_at: a.published_at,
    summary_en: a.summary_en,
    url: a.url,
  }))

  const systemPrompt = buildSystemPrompt(context)
  const responseStream = await streamChatResponse(messages, systemPrompt)

  return new Response(responseStream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  })
}
```

- [ ] **Step 3: Create components/chat/ChatMessage.tsx**

```typescript
interface Citation {
  index: number
  source: string
  date: string
  url: string
}

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
}

export function ChatMessage({ role, content, citations = [] }: ChatMessageProps) {
  const isUser = role === 'user'

  // Parse [N] citation markers in content
  const parts = content.split(/(\[\d+\])/g)

  return (
    <div
      className={`rounded p-2.5 border-l-2 ${
        isUser ? 'border-l-[#1e3a5a] bg-[#0d1525]' : 'border-l-blue-500 bg-[#0a1628]'
      }`}
    >
      <div
        className={`font-mono text-[9px] mb-1.5 ${
          isUser ? 'text-slate-500' : 'text-blue-400'
        }`}
      >
        {isUser ? 'analyst' : 'research assistant'}
      </div>
      <div className="font-mono text-[11px] text-slate-300 leading-relaxed">
        {parts.map((part, i) => {
          const match = part.match(/^\[(\d+)\]$/)
          if (match) {
            return (
              <span key={i} className="text-blue-400 font-semibold">
                {part}
              </span>
            )
          }
          return <span key={i}>{part}</span>
        })}
      </div>
      {citations.length > 0 && (
        <div className="mt-2 pt-2 border-t border-[#131d2e] flex flex-col gap-0.5">
          {citations.map((c) => (
            <a
              key={c.index}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[9px] text-[#2a3a52] hover:text-blue-400 transition-colors"
            >
              [{c.index}] {c.source} · {c.date}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Create components/chat/ChatInput.tsx**

```typescript
'use client'

import { useState } from 'react'

interface ChatInputProps {
  onSubmit: (message: string) => void
  disabled: boolean
}

export function ChatInput({ onSubmit, disabled }: ChatInputProps) {
  const [value, setValue] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim() || disabled) return
    onSubmit(value.trim())
    setValue('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-2 p-2 border-t border-[#131d2e] bg-[#0a0f1a]"
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="ask a research question..."
        disabled={disabled}
        className="flex-1 bg-[#0d1525] border border-[#1a2740] rounded px-3 py-2 text-slate-300 font-mono text-[11px] placeholder:text-[#2a3a52] focus:outline-none focus:border-blue-600 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="bg-[#1a3a6e] hover:bg-[#1e4a8e] text-blue-300 font-mono text-[11px] px-3 py-2 rounded transition-colors disabled:opacity-40"
      >
        ↵
      </button>
    </form>
  )
}
```

- [ ] **Step 5: Create components/chat/ChatPane.tsx**

```typescript
'use client'

import { useState, useRef, useEffect } from 'react'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function ChatPane() {
  const [messages, setMessages] = useState<Message[]>([])
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSubmit(userText: string) {
    const userMessage: Message = { role: 'user', content: userText }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setStreaming(true)

    // Add empty assistant message that we'll stream into
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      })

      if (!res.ok || !res.body) {
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1].content = 'Error: failed to get response.'
          return updated
        })
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: updated[updated.length - 1].content + chunk,
          }
          return updated
        })
      }
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-[#131d2e] bg-[#0a0f1a] flex-shrink-0">
        <span className="font-mono text-[9px] tracking-widest text-[#2a3a52]">
          RESEARCH CHAT
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-2">
        {messages.length === 0 && (
          <div className="text-center text-[#2a3a52] font-mono text-xs py-8">
            ask a question about Japan macro or crypto
          </div>
        )}
        {messages.map((msg, i) => (
          <ChatMessage key={i} role={msg.role} content={msg.content} />
        ))}
        <div ref={bottomRef} />
      </div>
      <ChatInput onSubmit={handleSubmit} disabled={streaming} />
    </div>
  )
}
```

- [ ] **Step 6: Test the full frontend flow**

```bash
npm run dev
```

Navigate to http://localhost:3000/dashboard. The 3-column layout should render. The markets panel will show "—" until the worker runs. The article feed will show "no articles found" until articles are ingested. The chat input should be functional.

- [ ] **Step 7: Commit**

```bash
git add lib/claude.ts app/api/chat/ components/chat/
git commit -m "feat: add RAG chat with streaming Claude responses and pgvector retrieval"
```

---

## Task 12: /api/ingest Route (Demo Trigger)

**Files:**
- Create: `app/api/ingest/route.ts`

- [ ] **Step 1: Create app/api/ingest/route.ts**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workerUrl = process.env.INGEST_WORKER_URL
  const secret = process.env.INGEST_WORKER_SECRET

  if (!workerUrl || !secret) {
    return NextResponse.json(
      { error: 'INGEST_WORKER_URL or INGEST_WORKER_SECRET not configured' },
      { status: 500 }
    )
  }

  const res = await fetch(`${workerUrl}/trigger`, {
    method: 'POST',
    headers: { 'x-ingest-secret': secret },
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Worker trigger failed' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/ingest/
git commit -m "feat: add /api/ingest route to trigger Railway worker webhook"
```

---

## Task 13: Python Worker — Base + HTTP Server

**Files:**
- Create: `worker/server.py`
- Create: `worker/worker.py` (skeleton)

- [ ] **Step 1: Create worker/server.py**

```python
import asyncio
import os
from aiohttp import web

async def handle_trigger(request: web.Request) -> web.Response:
    secret = os.environ.get("INGEST_WORKER_SECRET", "")
    if request.headers.get("x-ingest-secret") != secret:
        return web.Response(status=401, text="Unauthorized")

    # Import here to avoid circular imports
    from worker import run_once
    asyncio.create_task(run_once())
    return web.json_response({"ok": True})

def create_app() -> web.Application:
    app = web.Application()
    app.router.add_post("/trigger", handle_trigger)
    return app

async def start_server() -> None:
    app = create_app()
    runner = web.AppRunner(app)
    await runner.setup()
    port = int(os.environ.get("PORT", "8080"))
    site = web.TCPSite(runner, "0.0.0.0", port)
    await site.start()
    print(f"Worker HTTP server listening on port {port}")
```

- [ ] **Step 2: Create worker/worker.py (skeleton)**

```python
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def run_once() -> None:
    """Run one ingest cycle across news sources (NHK, GDELT, NewsAPI, EDINET). Used by /trigger webhook."""
    print("Running manual ingest cycle...")
    from sources.nhk import fetch_nhk
    from sources.gdelt import fetch_gdelt
    from sources.edinet import fetch_edinet
    from sources.newsapi import fetch_newsapi
    from pipeline.summarize import summarize_article
    from pipeline.embed import embed_text
    from pipeline.store import upsert_article

    sources = [fetch_nhk, fetch_gdelt, fetch_newsapi, fetch_edinet]

    for fetch_fn in sources:
        try:
            articles = await fetch_fn()
            print(f"{fetch_fn.__name__}: {len(articles)} articles")
            for article in articles:
                try:
                    summary = await summarize_article(article["raw_text"])
                    embedding = await embed_text(summary)
                    await upsert_article({**article, "summary_en": summary, "embedding": embedding})
                except Exception as e:
                    print(f"Pipeline error for {article.get('url', '?')}: {e}")
        except Exception as e:
            print(f"{fetch_fn.__name__} fetch error: {e}")

async def run_market_loop() -> None:
    """Fetch Hyperliquid data every 30 seconds."""
    from sources.hyperliquid import fetch_hyperliquid
    from pipeline.store import upsert_snapshot

    while True:
        try:
            snapshots = await fetch_hyperliquid()
            for snap in snapshots:
                await upsert_snapshot(snap)
        except Exception as e:
            print(f"Market fetch error: {e}")
        await asyncio.sleep(30)

async def run_news_loop() -> None:
    """Run news sources (NHK, GDELT, NewsAPI) every 30 minutes."""
    from sources.nhk import fetch_nhk
    from sources.gdelt import fetch_gdelt
    from sources.newsapi import fetch_newsapi
    from pipeline.summarize import summarize_article
    from pipeline.embed import embed_text
    from pipeline.store import upsert_article

    news_sources = [fetch_nhk, fetch_gdelt, fetch_newsapi]
    while True:
        for fetch_fn in news_sources:
            try:
                articles = await fetch_fn()
                for article in articles:
                    try:
                        summary = await summarize_article(article["raw_text"])
                        embedding = await embed_text(summary)
                        await upsert_article({**article, "summary_en": summary, "embedding": embedding})
                    except Exception as e:
                        print(f"Pipeline error for {article.get('url', '?')}: {e}")
            except Exception as e:
                print(f"{fetch_fn.__name__} fetch error: {e}")
        await asyncio.sleep(30 * 60)

async def run_edinet_loop() -> None:
    """Run EDINET filings ingest every 60 minutes."""
    from sources.edinet import fetch_edinet
    from pipeline.summarize import summarize_article
    from pipeline.embed import embed_text
    from pipeline.store import upsert_article

    while True:
        try:
            articles = await fetch_edinet()
            for article in articles:
                try:
                    summary = await summarize_article(article["raw_text"])
                    embedding = await embed_text(summary)
                    await upsert_article({**article, "summary_en": summary, "embedding": embedding})
                except Exception as e:
                    print(f"EDINET pipeline error for {article.get('url', '?')}: {e}")
        except Exception as e:
            print(f"EDINET fetch error: {e}")
        await asyncio.sleep(60 * 60)

async def main() -> None:
    from server import start_server
    await start_server()
    await asyncio.gather(
        run_news_loop(),
        run_edinet_loop(),
        run_market_loop(),
    )

if __name__ == "__main__":
    asyncio.run(main())
```

- [ ] **Step 3: Create worker/pipeline/__init__.py and worker/sources/__init__.py**

```bash
touch worker/pipeline/__init__.py worker/sources/__init__.py
```

- [ ] **Step 4: Commit**

```bash
git add worker/
git commit -m "feat: add python worker skeleton with asyncio loops and http server"
```

---

## Task 14: Python Worker — Pipeline (Summarize + Embed + Store)

**Files:**
- Create: `worker/pipeline/summarize.py`
- Create: `worker/pipeline/embed.py`
- Create: `worker/pipeline/store.py`

- [ ] **Step 1: Create worker/pipeline/summarize.py**

```python
import os
import anthropic

_client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

SYSTEM_PROMPT = (
    "You are a macro research analyst. Given a foreign-language news article, "
    "respond with a 2-3 sentence English summary written for a professional investor. "
    "Be factual and concise. Do not editorialize."
)

async def summarize_article(raw_text: str) -> str:
    """Translate and summarize a foreign-language article in one Claude call."""
    # Truncate to avoid token limits
    text = raw_text[:8000]
    message = _client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=256,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": text}],
    )
    return message.content[0].text.strip()
```

- [ ] **Step 2: Create worker/pipeline/embed.py**

```python
import os
import httpx

OPENROUTER_URL = "https://openrouter.ai/api/v1/embeddings"

async def embed_text(text: str) -> list[float]:
    """Generate a 1536-dim embedding via OpenRouter (text-embedding-3-small)."""
    async with httpx.AsyncClient() as client:
        res = await client.post(
            OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {os.environ['OPENROUTER_API_KEY']}",
                "Content-Type": "application/json",
            },
            json={"model": "openai/text-embedding-3-small", "input": text},
            timeout=30.0,
        )
        res.raise_for_status()
        return res.json()["data"][0]["embedding"]
```

- [ ] **Step 3: Create worker/pipeline/store.py**

```python
import os
from supabase import create_client, Client

_db: Client | None = None

def get_db() -> Client:
    global _db
    if _db is None:
        _db = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_SERVICE_ROLE_KEY"],
        )
    return _db

async def url_exists(url: str) -> bool:
    db = get_db()
    result = db.table("articles").select("id").eq("url", url).limit(1).execute()
    return len(result.data) > 0

async def upsert_article(article: dict) -> None:
    """
    article dict must have keys:
      url, source_name, credibility_tier, country,
      published_at (ISO string or None), summary_en, embedding (list[float])
    """
    if await url_exists(article["url"]):
        return  # deduplicate

    db = get_db()
    db.table("articles").insert({
        "url": article["url"],
        "source_name": article["source_name"],
        "credibility_tier": article["credibility_tier"],
        "country": article["country"],
        "published_at": article.get("published_at"),
        "summary_en": article["summary_en"],
        "embedding": article["embedding"],
    }).execute()

async def upsert_snapshot(snapshot: dict) -> None:
    """
    snapshot dict must have keys:
      asset, market_type, mark_price, open_interest, funding_rate
    """
    db = get_db()
    db.table("market_snapshots").insert({
        "asset": snapshot["asset"],
        "market_type": snapshot["market_type"],
        "mark_price": snapshot.get("mark_price"),
        "open_interest": snapshot.get("open_interest"),
        "funding_rate": snapshot.get("funding_rate"),
    }).execute()
```

- [ ] **Step 4: Commit**

```bash
git add worker/pipeline/
git commit -m "feat: add ingest pipeline (summarize, embed, store)"
```

---

## Task 15: Python Worker — News Sources

**Files:**
- Create: `worker/sources/nhk.py`
- Create: `worker/sources/gdelt.py`
- Create: `worker/sources/newsapi.py`

- [ ] **Step 1: Create worker/sources/nhk.py**

```python
import feedparser
import httpx
from datetime import datetime, timezone

NHK_RSS_URL = "https://www3.nhk.or.jp/rss/news/cat0.xml"

async def fetch_nhk() -> list[dict]:
    """Fetch NHK JP RSS feed. Returns raw article dicts ready for pipeline."""
    async with httpx.AsyncClient() as client:
        res = await client.get(NHK_RSS_URL, timeout=15.0)
        res.raise_for_status()

    feed = feedparser.parse(res.text)
    articles = []

    for entry in feed.entries:
        # Fetch full article text from entry link
        raw_text = entry.get("summary", "") or entry.get("title", "")
        try:
            async with httpx.AsyncClient() as client:
                page = await client.get(entry.link, timeout=10.0)
            # Use page text as raw content; Claude will handle Japanese
            raw_text = page.text[:6000]
        except Exception:
            pass  # Fall back to summary

        pub = entry.get("published_parsed")
        published_at = (
            datetime(*pub[:6], tzinfo=timezone.utc).isoformat() if pub else None
        )

        articles.append({
            "url": entry.link,
            "source_name": "NHK",
            "credibility_tier": 2,
            "country": "JP",
            "published_at": published_at,
            "raw_text": raw_text,
        })

    return articles
```

- [ ] **Step 2: Create worker/sources/gdelt.py**

```python
import httpx
import csv
import io
from datetime import datetime, timezone, timedelta

# GDELT GKG v2 15-minute CSV master list
GDELT_MASTER_URL = "http://data.gdeltproject.org/gdeltv2/lastupdate.txt"

async def fetch_gdelt() -> list[dict]:
    """Fetch latest GDELT 15-min update, filter for Japan-sourced articles."""
    async with httpx.AsyncClient() as client:
        res = await client.get(GDELT_MASTER_URL, timeout=20.0)
        res.raise_for_status()

    # lastupdate.txt has 3 lines; the second is the GKG CSV
    lines = res.text.strip().split("\n")
    gkg_line = next((l for l in lines if "gkg.csv" in l), None)
    if not gkg_line:
        return []

    gkg_url = gkg_line.split()[-1]

    async with httpx.AsyncClient() as client:
        res = await client.get(gkg_url, timeout=60.0)
        res.raise_for_status()

    articles = []
    reader = csv.reader(io.StringIO(res.text), delimiter="\t")

    for row in reader:
        if len(row) < 5:
            continue
        # GKG cols: DATE, NUMARTS, COUNTS, THEMES, LOCATIONS, PERSONS, ORGS, TONE, CAMEOEVENTIDS, SOURCES, SOURCEURLS
        try:
            locations = row[4] if len(row) > 4 else ""
            if "Japan" not in locations and "JP" not in locations:
                continue

            source_urls = row[10].split("<UDIV>") if len(row) > 10 else []
            source_names = row[9].split(",") if len(row) > 9 else []

            date_str = row[0]  # YYYYMMDDHHMMSS
            pub_dt = datetime.strptime(date_str[:14], "%Y%m%d%H%M%S").replace(tzinfo=timezone.utc)

            for url, src in zip(source_urls[:3], source_names[:3]):
                url = url.strip()
                if not url.startswith("http"):
                    continue
                # Attempt to fetch article body for better summarization.
                # On failure, fall back to a stub; Claude will produce a minimal summary.
                raw_text = f"Source: {src.strip()}. Article URL: {url}."
                try:
                    async with httpx.AsyncClient() as client:
                        page = await client.get(url, timeout=8.0, follow_redirects=True)
                    raw_text = page.text[:5000]
                except Exception:
                    pass

                articles.append({
                    "url": url,
                    "source_name": src.strip() or "GDELT",
                    "credibility_tier": 3,
                    "country": "JP",
                    "published_at": pub_dt.isoformat(),
                    "raw_text": raw_text,
                })
        except Exception:
            continue

    return articles[:20]  # Cap at 20 per cycle
```

- [ ] **Step 3: Create worker/sources/newsapi.py**

```python
import os
import httpx
from datetime import datetime, timezone

NEWSAPI_URL = "https://newsapi.org/v2/top-headlines"

async def fetch_newsapi() -> list[dict]:
    """Fetch top Japanese headlines from NewsAPI."""
    api_key = os.environ.get("NEWSAPI_KEY")
    if not api_key:
        return []

    async with httpx.AsyncClient() as client:
        res = await client.get(
            NEWSAPI_URL,
            params={"country": "jp", "pageSize": 20, "apiKey": api_key},
            timeout=15.0,
        )
        res.raise_for_status()

    data = res.json()
    articles = []

    for item in data.get("articles", []):
        url = item.get("url", "")
        if not url:
            continue

        raw_text = " ".join(filter(None, [
            item.get("title", ""),
            item.get("description", ""),
            item.get("content", ""),
        ]))

        pub_str = item.get("publishedAt")
        published_at = pub_str if pub_str else None

        articles.append({
            "url": url,
            "source_name": item.get("source", {}).get("name", "NewsAPI"),
            "credibility_tier": 3,
            "country": "JP",
            "published_at": published_at,
            "raw_text": raw_text,
        })

    return articles
```

- [ ] **Step 4: Commit**

```bash
git add worker/sources/nhk.py worker/sources/gdelt.py worker/sources/newsapi.py
git commit -m "feat: add nhk, gdelt, and newsapi ingest sources"
```

---

## Task 16: Python Worker — EDINET + Hyperliquid

**Files:**
- Create: `worker/sources/edinet.py`
- Create: `worker/sources/hyperliquid.py`

- [ ] **Step 1: Create worker/sources/edinet.py**

```python
import httpx
from datetime import datetime, timezone, date

EDINET_INDEX_URL = "https://disclosure.edinet-fsa.go.jp/api/v2/documents.json"

async def fetch_edinet() -> list[dict]:
    """Fetch today's EDINET filing index and return timely disclosure docs."""
    today = date.today().strftime("%Y-%m-%d")

    async with httpx.AsyncClient() as client:
        res = await client.get(
            EDINET_INDEX_URL,
            params={"date": today, "type": 2},  # type=2: documents with attachments
            timeout=20.0,
        )
        res.raise_for_status()

    data = res.json()
    results = data.get("results", [])

    articles = []
    for doc in results[:30]:  # Cap at 30 per cycle
        doc_id = doc.get("docID")
        doc_type = doc.get("formCode", "")
        company = doc.get("filerName", "")
        submitted_at = doc.get("submitDateTime", "")

        # Filter for timely disclosures (formCode starts with "140")
        if not doc_type.startswith("140"):
            continue

        url = f"https://disclosure.edinet-fsa.go.jp/E01EW/BLMainController.jsp?uji.verb=W1E63011CXP001&uji.bean=ee.bean.W1E63011.EEW1E63011Bean&TID=W1E63011&PID=W1E63011&SESSIONKEY=&headFlg=false&docID={doc_id}"

        raw_text = f"EDINET Filing: {doc_type} by {company}. Filed: {submitted_at}. Document ID: {doc_id}."

        articles.append({
            "url": url,
            "source_name": "EDINET",
            "credibility_tier": 1,
            "country": "JP",
            "published_at": submitted_at or datetime.now(timezone.utc).isoformat(),
            "raw_text": raw_text,
        })

    return articles
```

- [ ] **Step 2: Create worker/sources/hyperliquid.py**

```python
import httpx

HYPERLIQUID_URL = "https://api.hyperliquid.xyz/info"
ASSETS_OF_INTEREST = {"BTC", "ETH", "SOL"}

async def fetch_hyperliquid() -> list[dict]:
    """Fetch perp market data from Hyperliquid for BTC, ETH, SOL."""
    async with httpx.AsyncClient() as client:
        res = await client.post(
            HYPERLIQUID_URL,
            json={"type": "metaAndAssetCtxs"},
            timeout=15.0,
        )
        res.raise_for_status()

    data = res.json()
    # data is [meta, asset_ctxs]
    # meta["universe"] is list of {name, szDecimals, ...}
    # asset_ctxs is list of {markPx, openInterest, funding, ...} in same order

    meta, asset_ctxs = data[0], data[1]
    universe = meta.get("universe", [])

    snapshots = []
    for i, asset_meta in enumerate(universe):
        name = asset_meta.get("name", "")
        if name not in ASSETS_OF_INTEREST:
            continue
        if i >= len(asset_ctxs):
            continue

        ctx = asset_ctxs[i]
        try:
            mark_price = float(ctx.get("markPx", 0))
            open_interest = float(ctx.get("openInterest", 0))
            funding_rate = float(ctx.get("funding", 0))
        except (TypeError, ValueError):
            continue

        snapshots.append({
            "asset": name,
            "market_type": "perp",
            "mark_price": mark_price,
            "open_interest": open_interest,
            "funding_rate": funding_rate,
        })

    return snapshots
```

- [ ] **Step 3: Test the worker locally**

```bash
cd worker
cp .env.example .env
# Fill in your actual keys in worker/.env
pip install -r requirements.txt
python worker.py
```

Expected: Server starts on port 8080. After ~5s you should see log lines like `fetch_nhk: N articles`, `fetch_gdelt: N articles`. Check Supabase → Table Editor → articles — rows should appear.

- [ ] **Step 4: Commit**

```bash
git add worker/sources/edinet.py worker/sources/hyperliquid.py worker/worker.py
git commit -m "feat: add edinet and hyperliquid sources, wire all sources into worker loop"
```

---

## Task 17: End-to-End Integration Test

No new files. Verify the full stack works together.

- [ ] **Step 1: Seed at least 5 articles via the worker**

```bash
cd worker && python worker.py
```

Wait for one full cycle to complete. Verify in Supabase → articles table has rows with `embedding` populated (non-null).

- [ ] **Step 2: Test semantic search**

```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -H "Cookie: $(cat /tmp/test-cookie)" \
  -d '{"query": "Bank of Japan interest rates", "dateRange": 30}'
```

Expected: JSON with `articles` array, each with `summary_en` and `url`.

(For a simpler test, just use the browser: start `npm run dev`, log in, type "Bank of Japan" in the search box.)

- [ ] **Step 3: Test RAG chat**

In the browser dashboard, type "What is the BOJ doing with rates?" in the chat pane.

Expected: Streamed response citing `[1]`, `[2]` etc., with footnotes linking to source articles.

- [ ] **Step 4: Verify markets panel**

Check the markets column — BTC/ETH/SOL should show real prices from Hyperliquid within 30s of the worker starting the market loop.

- [ ] **Step 5: Test auth guard**

Open a private browser window, navigate to http://localhost:3000/dashboard. Expected: redirected to `/login`.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "chore: end-to-end integration verified"
```

---

## Task 18: Deploy

- [ ] **Step 1: Deploy frontend to Vercel**

```bash
npx vercel --prod
```

Add all environment variables from `.env.local.example` in the Vercel dashboard (Settings → Environment Variables). Set `INGEST_WORKER_URL` once the Railway URL is known.

- [ ] **Step 2: Deploy worker to Railway**

Push repo to GitHub. In Railway dashboard:
1. New Project → Deploy from GitHub repo
2. Select the repo, set root directory to `/worker`
3. Add all environment variables from `worker/.env.example`
4. Railway auto-detects `railway.toml` and runs `python worker.py`

- [ ] **Step 3: Update INGEST_WORKER_URL in Vercel**

Copy the Railway public URL (e.g. `https://newsgraph-worker.railway.app`), set it as `INGEST_WORKER_URL` in Vercel env vars, redeploy.

- [ ] **Step 4: Smoke test production**

Navigate to the Vercel URL, sign up, search for "Bank of Japan", use the chat. Verify markets panel populates.

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "chore: production deployment configured"
```

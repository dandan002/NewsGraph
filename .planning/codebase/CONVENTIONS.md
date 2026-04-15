# CONVENTIONS.md — Code Style and Patterns

## Languages and Style

### TypeScript / Next.js (Frontend + API)
- **Indent:** 2 spaces
- **Semicolons:** None
- **Quotes:** Single quotes
- **TypeScript:** Strict mode enabled (`"strict": true` in tsconfig)
- **Trailing commas:** ES5 style

### Python (Worker)
- **Indent:** 4 spaces
- **Naming:** `snake_case` for functions, variables, modules
- **Constants:** `SCREAMING_SNAKE_CASE`
- No linter config detected (no `.flake8`, `pyproject.toml`, or `ruff.toml`)

---

## Naming Conventions

### TypeScript / Next.js
| Kind | Convention | Example |
|------|-----------|---------|
| React components | PascalCase | `NewsGraph`, `ArticleCard` |
| Files (components) | PascalCase | `NewsGraph.tsx`, `ArticleCard.tsx` |
| Files (utilities/API) | kebab-case | `route.ts`, `ingest.ts` |
| Functions | camelCase | `fetchArticles`, `buildGraph` |
| Variables | camelCase | `articleList`, `graphData` |
| Types / Interfaces | PascalCase | `Article`, `GraphNode` |
| Constants | SCREAMING_SNAKE_CASE or camelCase | `MAX_NODES`, `defaultConfig` |
| Next.js route dirs | lowercase kebab | `app/api/articles/`, `app/graph/` |

### Python
| Kind | Convention | Example |
|------|-----------|---------|
| Functions | snake_case | `fetch_articles`, `parse_rss` |
| Classes | PascalCase | `ArticleIngestor` |
| Modules | snake_case | `gdelt_client.py`, `rss_worker.py` |
| Constants | SCREAMING_SNAKE_CASE | `GDELT_URL`, `MAX_RETRIES` |

---

## Import Organization

### TypeScript
1. `'use client'` or `'use server'` directive (if needed) — always first line
2. React / framework imports (`import React from 'react'`)
3. Third-party libraries (`import { Graph } from 'react-vis-graph'`)
4. Internal imports via `@/` alias (`import { Article } from '@/types'`)
5. Relative imports last

### Python
1. Standard library
2. Third-party packages
3. Local modules

---

## Component Design Patterns

- **Named exports** preferred over default exports for components
- **Inline props interfaces** — `interface Props { ... }` defined above the component in the same file
- **Server vs Client Component split:** `'use client'` only when interactivity or browser APIs required; default to Server Components
- **Co-location:** Component-specific styles and helpers live alongside the component file

---

## Error Handling

### API Routes (`app/api/**/route.ts`)
- Auth check first; return `401` immediately if unauthenticated
- Validation errors return `400` with `{ error: string }`
- Upstream failures return `502` or `500` with `{ error: string }`
- Pattern:
  ```ts
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  ```

### Client Components
- Silent `!res.ok` returns — errors often swallowed without user feedback
- Console logging used for debugging (not structured)

### Python Worker
- Per-article `try/except` blocks with `print()` logging
- Failures on individual articles don't halt the pipeline
- No structured logging framework (no `logging` module usage detected)

---

## API Route Conventions

- Files located at `app/api/<resource>/route.ts`
- Use `NextResponse.json()` for all responses
- Session validated via `auth()` helper at top of handler
- HTTP methods exported as named functions: `export async function GET(...)`, `POST(...)`, etc.

---

## Type Definitions

- Shared types in `src/types/` or co-located with feature
- `Article` type appears duplicated across frontend and worker — known tech debt
- Prefer `interface` over `type` for object shapes
- Use `type` for unions and aliases

---

## Configuration Patterns

- Environment variables via `.env.local` (not committed)
- Accessed via `process.env.VAR_NAME` in Next.js
- Python worker uses `os.environ.get('VAR', default)`
- No runtime validation of env vars (no `zod` env schema)

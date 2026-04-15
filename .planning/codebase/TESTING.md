# TESTING.md — Test Structure and Practices

## Current State

**No tests exist in this codebase.**

No test framework has been configured or used:
- No Jest, Vitest, or any JS/TS test runner
- No pytest or Python test files
- No `*.test.*` or `*.spec.*` files anywhere in the project
- No test scripts in `package.json`
- No test dependencies in `worker/requirements.txt`

---

## Test Coverage

| Area | Coverage |
|------|----------|
| API routes | 0% |
| React components | 0% |
| Python worker / ingestors | 0% |
| Data parsing / RSS | 0% |
| Graph logic | 0% |

---

## Recommended Testing Setup (when introduced)

### Frontend / API (TypeScript)
- **Framework:** Vitest (compatible with Next.js + Vite ecosystem) or Jest
- **Component testing:** React Testing Library
- **API route testing:** `next-test-api-route-handler` or MSW for mocking
- **Location:** `__tests__/` directories alongside source, or `*.test.ts` co-located

### Python Worker
- **Framework:** pytest
- **Location:** `worker/tests/` directory
- **Mocking:** `unittest.mock` or `pytest-mock` for external API calls (GDELT, RSS feeds)

### E2E
- **Framework:** Playwright (already a project dependency via MCP)
- **Location:** `e2e/` or `tests/e2e/`

---

## CI Integration

No CI/CD pipeline detected (no `.github/workflows/`, no `Makefile` test targets).

When tests are added, recommend:
1. GitHub Actions workflow running on push/PR
2. Separate jobs for frontend tests and Python worker tests
3. Coverage reporting via Codecov or similar

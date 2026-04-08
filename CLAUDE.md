# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

A production-grade AI Quality Intelligence Platform serving as a portfolio site. It combines:
- A **React + TypeScript SPA** frontend (portfolio showcase + embedded AI chatbot)
- A **Cloudflare Workers backend** implementing RAG (Retrieval-Augmented Generation) with safety guardrails
- A **multi-stage CI/CD system** with AI-specific quality metrics (retrieval confidence, latency, flakiness, anomaly detection)

The project's main purpose is to demonstrate engineering quality through the depth of its own CI/CD pipeline — the weekly regression suite detects AI behavioral regressions in production using statistical baselines.

---

## Commands

### Frontend (root)
```bash
npm run dev          # Vite dev server
npm run build        # TypeScript + Vite production build
npm run preview      # Preview production build locally
npm run lint         # ESLint (.ts/.tsx/.js)
npm run typecheck    # tsc --noEmit
npm run csslint      # Stylelint on **/*.css
npm run htmllint     # HTMLHint on **/*.html
npm run test:e2e     # Playwright E2E tests (all browsers)
npm run test:e2e:ui  # Playwright with interactive UI
```

### Backend (portfolio-chatbot/)
```bash
npm run dev     # Cloudflare Worker on 127.0.0.1:8787
npm run test    # Vitest unit + contract tests
npm run test:ci # Vitest with JUnit XML output
npm run deploy  # Deploy Worker to Cloudflare
npm run ingest  # Populate Supabase vector database from docs
```

### Run a single Playwright test
```bash
npx playwright test e2e/specs/smoke.spec.ts --project=chromium
```

### Run a single Vitest test
```bash
cd portfolio-chatbot && npx vitest run src/__tests__/someTest.test.ts
```

---

## Architecture

```
Frontend (React/Vite)
  └── POST /chat
        └── Cloudflare Worker (portfolio-chatbot/src/index.ts)
              ├── CORS + origin validation
              ├── Rate limiting (Durable Object, 10 req/min per IP)
              ├── Prompt injection guard (regex-based)
              ├── Conversation logging → Supabase (abuse_logs)
              ├── Query embedding → OpenAI text-embedding-3-small
              ├── Vector search → Supabase pgvector RPC
              ├── Retrieval guard (similarity threshold ≥ 0.40)
              └── LLM streaming → OpenAI gpt-4o-mini → client
```

**Ingestion pipeline** (offline, run once): `scripts/ingest.ts` chunks markdown/PDF docs, generates embeddings, and upserts vectors into Supabase.

**Frontend data flow**: `src/services/streamAssistant.ts` handles streaming SSE from the Worker; `src/services/chatApi.ts` is the HTTP layer. Portfolio content lives in `src/data/portfolio.ts`.

**Durable Objects** (`src/rateLimiter.ts`) implement per-IP sliding window rate limiting — each IP gets its own Durable Object instance.

---

## CI/CD Pipeline

Four GitHub Actions workflows implement tiered quality gates:

| Workflow | Trigger | Purpose |
|---|---|---|
| `lint-quality-gate.yml` | Every PR | ESLint, TypeScript, Stylelint, HTMLHint |
| `pr-quality-gates.yml` | Every PR | Backend unit tests → E2E (chromium only) → Lighthouse → composite quality score posted as PR comment |
| `deploy.yml` | Push to `main` | Backend tests → E2E (chromium + firefox + webkit) → Lighthouse → deploy to GitHub Pages |
| `weekly-regression-gates.yml` | Wednesdays 01:00 UTC | Production API health: retrieval confidence, latency trends, anomaly detection, multilingual quality — results posted as a GitHub issue |

CI scripts in `scripts/` compute metrics and generate summaries:
- `pr-quality-score.mjs` — composite PR score from E2E, Lighthouse, bundle size, duration
- `playwright-summary.mjs` — E2E pass/fail + flakiness
- `lighthouse-summary.mjs` — perf/a11y/SEO scores
- `flaky-summary.mjs` — flaky budget enforcement (max 3 flaky tests)

**Lighthouse thresholds** (lighthouserc.json): performance ≥ 70, accessibility ≥ 90, best-practices ≥ 85, SEO ≥ 85.

---

## Testing

**E2E tests** (`e2e/`): Playwright page-object model. `e2e/pages/HomePage.ts` is the primary page object. `e2e/fixtures/test.ts` wires up console error tracking. Tests run with 2 retries in CI, 4 workers.

**Backend tests** (`portfolio-chatbot/src/__tests__/`): Vitest. Tests cover unit logic, contract tests against the local Worker, and retrieval validation (ensures no hallucinated facts pass the retrieval guard).

**Accessibility**: axe-core checks run as part of E2E in `e2e/specs/a11y.spec.ts`.

---

## Key Config Files

- `vite.config.ts` — frontend build
- `playwright.config.ts` — E2E config (3 browser projects, reporters, retries)
- `lighthouserc.json` — Lighthouse CI thresholds
- `eslint.config.js` — flat config (React hooks, React refresh, TypeScript rules)
- `portfolio-chatbot/wrangler.jsonc` — Cloudflare Worker config (Durable Objects, SQLite migrations, observability)
- `portfolio-chatbot/vitest.config.ts` — backend test runner

## Environment Variables

Frontend reads from `.env.development` / `.env.production`.  
Backend secrets (OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ALLOWED_ORIGIN) live in `portfolio-chatbot/.env` and Cloudflare Worker secrets.

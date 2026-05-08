# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.
It also serves as a technical brief for engineers and recruiters evaluating the codebase.

## What This Project Is

A **production-grade AI Quality Intelligence Platform** demonstrating SDET-level engineering through the depth of its own observability and CI/CD pipeline. Specifically, it proves a non-trivial capability: **automated SLA enforcement against a non-deterministic, live AI system** — not just testing it once, but measuring regression, drift, and behavioral change across weekly production runs.

The platform combines:
- A **React + TypeScript SPA** — portfolio site with embedded AI chatbot and live observability dashboard
- A **Cloudflare Workers backend** — RAG pipeline with security guardrails, Durable Object rate limiting, streaming LLM responses
- A **multi-layer CI/CD system** — 4 tiered gates (lint → PR → deploy → weekly regression) with AI-specific quality metrics
- A **Supabase analytics layer** — 9 SQL views composing test results, retrieval signals, and behavioral deltas into structured intelligence

The chatbot operates in two modes:
- **Mode 1 — General (Home Page):** No run data. Answers architecture and design questions from retrieved documentation.
- **Mode 2 — Analysis (Dashboard Page):** A structured run snapshot (current + previous + deltas) is injected into the chatbot context. The chatbot reasons about live production metrics, identifies which signal changed, and guides debugging — making it self-aware of its own observability data.

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

**Dashboard data flow**: `src/pages/Dashboard.tsx` queries Supabase directly via REST and renders production metrics derived from the weekly regression suite. On run selection, `buildRunSnapshotContext()` builds a structured snapshot (current + previous run + deltas for all key metrics) and passes it to `ChatWidget` as `runContext`, switching the chatbot into analysis mode.

**Durable Objects** (`src/rateLimiter.ts`) implement per-IP sliding window rate limiting — each IP gets its own Durable Object instance.

---

## Dashboard Panels

`src/pages/Dashboard.tsx` (accessible at `/#/dashboard`) renders 9 sections powered by Supabase views:

| Section | Source View(s) | What It Shows |
|---------|---------------|---------------|
| Run Selector | `regression_run_summary` | All regression runs; anomaly flags (z-score), consecutive breach streaks |
| System Health Overview | `regression_run_comparison` | 4 KPI cards: P95 latency, retrieval confidence, reliability score, rate-limit enforcement |
| Regression Impact | `regression_run_comparison` | Δ vs previous run: latency %, confidence pts, reliability pts, min-confidence pts |
| Production SLA Compliance | `regression_run_summary` | 5-gate audit: P95 latency / rate enforcement / avg confidence / min confidence (worst language) / concurrent degradation — IN SLA / WATCH / BREACH per gate |
| Multilingual Retrieval Quality | `retrieval_language_summary`, `retrieval_language_trend` | Per-language avg+min confidence + Δ vs previous run + risk classification (7 languages) |
| AI System Intelligence | `regression_story` | Trend direction, severity, primary signal, user impact narrative |
| Last 5 Runs Trend | `regression_run_summary` | Clickable run history table with conditional formatting |
| Test Suites Reliability | `flakiness_run_summary`, `flakiness_trend`, `e2e_workflow_stability` | Flakiness current state, workflow breakdown (pr_e2e / deploy_e2e), historical chart |
| System Risk Assessment | `regression_story`, `retrieval_language_summary` | Aggregated risk: severity, user impact, primary signal, worst-case confidence by language |

Each section has a 💬 AI debug button that pre-fills the chatbot with the real metric snapshot for that section.

The `releaseGate` IIFE (not useMemo — computed values appear after early returns, which violates Rules of Hooks) computes the 5-gate SLA verdict from `selectedRun`. The z-score anomaly detection and consecutive breach streak are also IIFEs for the same reason.

---

## CI/CD Pipeline

Four GitHub Actions workflows implement tiered quality gates:

| Workflow | Trigger | Purpose |
|---|---|---|
| `lint-quality-gate.yml` | Every PR | ESLint, TypeScript, Stylelint, HTMLHint — zero-error threshold |
| `pr-quality-gates.yml` | Every PR | Backend unit tests → E2E (chromium only) → Lighthouse → composite quality score posted as PR comment |
| `deploy.yml` | Push to `main` | Backend tests → E2E (chromium + firefox + webkit) → flakiness budget gate → Lighthouse → deploy to GitHub Pages |
| `weekly-regression-gates.yml` | Wednesdays 01:00 UTC | Production API regression: retrieval confidence, latency, rate-limit enforcement — metrics ingested into Supabase |

**Composite quality score** (`scripts/pr-quality-score.mjs`): E2E pass (+25) + zero accessibility violations (+15) + Lighthouse (×0.4) + bundle penalty (−5 if >250 KB, −10 if >300 KB) + duration bonus. Verdict: Excellent ≥85 / Good 70–84 / Needs improvement 50–69 / Poor <50.

**Flakiness budget gate**: deploy workflow blocks release if >3 flaky tests across the browser matrix.

**Weekly regression gate**: pipeline fails if `regression_severity` is `critical` or `moderate` (from `regression_story` Supabase view). Infrastructure errors do not fail the pipeline.

**CI scripts** (`scripts/`):

| Script | When It Runs | Purpose |
|--------|-------------|---------|
| `ingest-e2e-metrics.mjs` | PR + Deploy E2E | Reads Playwright artifacts, computes reliability score, pushes to Supabase |
| `pr-quality-score.mjs` | PR quality-score job | Computes composite quality score from collected CI artifacts |
| `playwright-summary.mjs` | PR + Deploy | Generates markdown summaries from Playwright JSON/XML reports |
| `lighthouse-summary.mjs` | PR + Deploy | Processes Lighthouse CI reports into summary artifacts |
| `flaky-summary.mjs` | PR + Deploy | Extracts flaky/failed/passed counts from Playwright report |
| `lint-summary.mjs` | Lint gate | Parses ESLint output, produces `metrics/lint.json` with error count and threshold flag |

**Lighthouse thresholds** (lighthouserc.json): performance ≥ 70, accessibility ≥ 90, best-practices ≥ 85, SEO ≥ 85.

---

## Testing

### Backend tests (`portfolio-chatbot/src/__tests__/`)

**PR + Deploy** — run on every PR and deployment against the local Worker:

| File | What It Tests |
|------|--------------|
| `api.contract.test.ts` | API response schema stability (Zod validation) |
| `contextBuilder.test.ts` | RAG context building and document concatenation logic |
| `promptGuard.test.ts` | Prompt injection detection, PII blocking, encoded payload patterns |
| `prompt.test.ts` | LLM retrieval quality: multilingual retrieval, doc ranking, answer grounding, confidence calibration |

**Weekly Regression** — run against the live production endpoint (`NIGHTLY=true`):

| File | What It Tests |
|------|--------------|
| `retrieval.regression.test.ts` | RAG metrics and drift detection across 7 languages |
| `performance.test.ts` | P95 latency stability under normal and concurrent load |
| `rateLimit.test.ts` | Per-IP request throttling correctness and HTTP 429 enforcement |

### Frontend E2E tests (`e2e/specs/`)

| File | Browsers | What It Tests |
|------|---------|--------------|
| `smoke.spec.ts` | PR: chromium / Deploy: all 3 | Landing page hero content, theme toggle, performance metrics |
| `navigation.spec.ts` | PR: chromium / Deploy: all 3 | Email copy buttons, text verification |
| `a11y.spec.ts` | PR: chromium / Deploy: all 3 | WCAG 2.x compliance via axe-core |

**E2E config**: Playwright POM (`e2e/pages/HomePage.ts`), 3 browser projects (chromium/firefox/webkit), 2 retries in CI, 4 workers. `e2e/fixtures/test.ts` wires up console error tracking.

---

## Key Config Files

- `vite.config.ts` — frontend build
- `playwright.config.ts` — E2E config (3 browser projects, reporters, retries)
- `lighthouserc.json` — Lighthouse CI thresholds
- `eslint.config.js` — flat config (React hooks, React refresh, TypeScript rules)
- `portfolio-chatbot/wrangler.jsonc` — Cloudflare Worker config (Durable Objects, SQLite migrations, observability)
- `portfolio-chatbot/vitest.config.ts` — backend test runner

---

## Engineering Conventions and Architecture Decisions

Authoritative documentation lives in `docs/`:

| File | Contents |
|------|----------|
| `docs/architecture.md` | System components, data flow, Mermaid sequence and flowchart diagrams |
| `docs/ci-cd-strategy.md` | Full pipeline spec: all 4 workflows, job sequences, artifact model, metrics ingestion flow |
| `docs/qa-strategy-architecture.md` | Multi-layer quality gates strategy; AI assurance rationale; shift-left security |
| `docs/test-plan.md` | Comprehensive test plan |
| `docs/frontend-testing.md` | Frontend testing standards and practices |
| `docs/security-architecture.md` | Security threat model, guardrails |
| `docs/safeguards.md` | Safety guardrails and constraints |

---

## Environment Variables

Frontend reads from `.env.development` / `.env.production`.  
Backend secrets (OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ALLOWED_ORIGIN) live in `portfolio-chatbot/.env` and Cloudflare Worker secrets.

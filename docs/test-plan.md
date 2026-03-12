# RAG Chatbot – Test Plan (Current Implementation)

## 1) Document Information

| Field | Value |
|---|---|
| Project | Portfolio RAG Chatbot |
| Runtime | Cloudflare Worker + Durable Object |
| Data/AI | Supabase RPC + OpenAI embeddings/chat |
| Test Frameworks | Vitest, Playwright, Lighthouse CI |
| Version | 1.1 (current-state refresh) |

## 2) Purpose

Define what is actually tested today across backend, frontend, CI gates, and weekly production regression.

Primary objectives:
- Validate API contract and request handling
- Validate prompt guard and abuse controls
- Validate retrieval and context behavior
- Validate frontend critical paths and accessibility
- Detect regressions in deployed production endpoint

## 3) System Under Test

### 3.1 Core Components
- Worker handler (`portfolio-chatbot/src/index.ts`)
- Durable Object rate limiter (`portfolio-chatbot/src/rateLimiter.ts`)
- Prompt guard (`portfolio-chatbot/src/security/promptGuard/promptGuard.ts`)
- Retrieval guard (`portfolio-chatbot/src/security/retrievalGuard.ts`)
- Context builder (`portfolio-chatbot/src/rag/contextBuilder.ts`)
- Frontend + chat widget (`src`, `e2e/specs`)

### 3.2 Runtime Flow Covered by Tests
1. Request entry + validation
2. Per-IP rate limiting
3. Prompt guard checks
4. Retrieval quality path / fallback behavior
5. LLM/stream behavior (direct or mocked path depending on suite)

## 4) Test Strategy

### 4.1 Test Levels in Use
| Level | Scope | Tooling |
|---|---|---|
| Backend unit/integration-style | Worker behavior + helper modules | Vitest + live local worker |
| Security | Prompt guard categories + blocking behavior | Vitest |
| Regression (weekly scheduled, NIGHTLY mode) | Production endpoint validation | Vitest (`NIGHTLY=true`) |
| Frontend E2E | Navigation, smoke, chat UI, a11y | Playwright + axe |
| Quality budget | Performance/accessibility scoring | Lighthouse CI |

### 4.2 Execution Modes
- **PR / main pipelines:** run fast checks and deployment gates.
- **Weekly regression:** runs backend regression suite against deployed API URL.

## 5) Current Test Inventory

### 5.1 Backend (`portfolio-chatbot/src/__tests__`)
- `api.contract.test.ts`
  - Verifies contract response shape in `x-test-mode`
  - Ensures status `200` + JSON schema (`answer: string`)
- `promptGuard.test.ts`
  - Validates safe input and blocked categories (PII, SQLi, XSS, injection, encoded payload, size, symbol density)
- `prompt.test.ts`
  - Uses `x-mock-rag=true` to verify safe non-hallucination fallback text path
- `contextBuilder.test.ts`
  - Validates joining, truncation, malformed inputs, empty-doc behavior
- `retrieval.regression.test.ts` (weekly scheduled)
  - Validates grounded response concept coverage against production endpoint
- `rateLimit.test.ts` (weekly scheduled)
  - Validates repeated requests produce `429`
- `performance.test.ts` (weekly scheduled)
  - Validates latency profile and light concurrency behavior

### 5.2 Frontend (`e2e/specs`)
- `smoke.spec.ts` (hero render, theme toggle, chat bubble, chat open/respond with mocked backend)
- `navigation.spec.ts` (section navigation, external links, email actions, chatbot mock response)
- `a11y.spec.ts` (axe scan, no critical violations)

## 6) Functional Cases (Current Behavior)

### 6.1 Request / Protocol Validation
| ID | Scenario | Expected |
|---|---|---|
| FUNC-01 | Valid POST JSON payload | `200` (or streamed text path) |
| FUNC-02 | `HEAD` request | `200` |
| FUNC-03 | Method other than POST/HEAD/OPTIONS | `405` |
| FUNC-04 | Missing/invalid JSON | `400` |
| FUNC-05 | Unsupported content type | `415` |
| FUNC-06 | Empty question after trim | `400` |

### 6.2 Abuse / Guardrails
| ID | Scenario | Expected |
|---|---|---|
| RL-01 | <= 10 req/min per IP | allowed |
| RL-02 | > 10 req/min per IP | `429` |
| SEC-01 | prompt injection pattern | `400` blocked |
| SEC-02 | PII pattern | `400` blocked |
| SEC-03 | high symbol density | `400` blocked |
| SEC-04 | question length > 1000 | `400` blocked |

### 6.3 Retrieval / Grounding
| ID | Scenario | Expected |
|---|---|---|
| RAG-01 | Retrieval response malformed | guarded fallback behavior |
| RAG-02 | Low/empty relevant retrieval | fallback or constrained response path |
| RAG-03 | Context exceeds max size | deterministic truncation at 6000 chars |
| RAG-04 | Weekly scheduled architecture question | response includes grounded concepts (score gate) |

## 7) Performance and Stability Checks

### 7.1 In-Test Thresholds Currently Enforced
- Weekly scheduled latency guard in `performance.test.ts`:
  - `median < 8000ms`
  - `max < 10000ms` (`1.25 * 8000`)
- Light concurrency check currently runs with 3 parallel requests.

### 7.2 Runtime Telemetry (Non-test assertions)
Worker logs:
- retrieval latency
- LLM latency
- total latency
- warning event if LLM latency exceeds `3500ms`

## 8) CI/CD Validation Mapping

| Stage | What Runs |
|---|---|
| PR Quality Gates | Backend tests, Playwright Chromium, Lighthouse, PR comment summary |
| Main Deploy Gates | Backend tests, Playwright matrix (chromium/firefox/webkit), Lighthouse, deploy to GitHub Pages |
| Weekly Regression | Backend regression suite against `API_BASE_URL` production endpoint + JUnit report |

## 9) Out of Scope (Current)

- LLM internal model correctness beyond black-box assertions
- Semantic output moderation/post-generation policy enforcement
- Internet-scale DDoS resilience
- Deterministic retrieval scoring benchmark harness beyond current weekly scheduled concept checks

## 10) Current Gaps / Next Improvements

1. Add explicit assertions for dynamic retrieval thresholds (`0.35` default, `0.23` short-question path).
2. Add dedicated tests for `415` content-type rejection and CORS `403` behavior.
3. Add stronger output-safety checks (leakage/moderation assertions).
4. Add request-correlation ID assertions once implemented.
5. Add trend reporting for weekly scheduled latency and fallback-rate drift.
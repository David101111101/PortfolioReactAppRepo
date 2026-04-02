# AI Quality Intelligence Platform For R.A.G. Systems

[![Weekly Regression Suite](https://github.com/David101111101/PortfolioReactAppRepo/actions/workflows/weekly-regression-gates.yml/badge.svg)](https://github.com/David101111101/PortfolioReactAppRepo/actions/workflows/weekly-regression-gates.yml)
[![PR Quality Gates](https://github.com/David101111101/PortfolioReactAppRepo/actions/workflows/pr-quality-gates.yml/badge.svg?branch=FIX-CI-Regression-Suite-environment-variable-fix)](https://github.com/David101111101/PortfolioReactAppRepo/actions/workflows/pr-quality-gates.yml) 
[![Deployment Quality Gates](https://github.com/David101111101/PortfolioReactAppRepo/actions/workflows/deploy.yml/badge.svg)](https://github.com/David101111101/PortfolioReactAppRepo/actions/workflows/deploy.yml)
[![Lint Quality Gate](https://github.com/David101111101/PortfolioReactAppRepo/actions/workflows/lint-quality-gate.yml/badge.svg)](https://github.com/David101111101/PortfolioReactAppRepo/actions/workflows/lint-quality-gate.yml)





https://www.daveautomation.dev/


This project is not only a QA Automation suite. It is a production-grade quality intelligence system for non-deterministic AI RAG applications, where traditional pass/fail testing is not enough.

AI systems often fail in ways that are:
- probabilistic: confidence drops instead of hard failures
- silent: bad answers instead of crashes
- gradual: performance and quality drift over time

## How to Navigate This Project

If you're a recruiter:
→ Start with "Real-World Impact"

If you're an engineer:
→ Jump to "Architecture" and "CI/CD Testing Strategy"

If you're interested in AI testing:
→ Focus on "Signal-Based Quality Assessment" and "Weekly Regression"

### Problem

AI systems require custom validation and verification which evolves with each deploy

- Did response quality degrade?
- Did latency impact answer correctness?
- What languages are affected and by how much?
- Is this a one-off issue or an actual trend?

### Solution

This project implements a multi-signal regression intelligence system that:
- tracks retrieval quality across 7 languages
- monitors latency and performance degradation
- detects statistical anomalies using z-score analysis
- enforces flakiness budgets for test reliability
- computes a reliability score per run
- stores signals historically for trend analysis

All of those signals are aggregated into a single decision layer:

> Is the system healthy, why not, and who is impacted?

### What Makes This Different

This system transforms QA Automation from verification and validation into a decision making analysis layer and enables teams to make release decisions based on measurable AI reliability instead of intuition.

#### 1. Signal-Based Quality Assessment
- confidence scores instead of binary-only assertions
- worst-case detection (`min_confidence`) to represent real user risk

#### 2. Trend Detection Instead Of Single-Run Judgement
- regression deltas versus previous runs
- historical baselines
- anomaly detection using standard deviation

#### 3. User-Impact Visibility
- multilingual retrieval monitoring
- identification of which language degraded
- worst-case experience surfaced directly in reports

#### 4. Test Reliability As A First-Class Signal
- flakiness tracked per test and per run
- flaky-budget enforcement in release gates
- reduced false confidence from unstable tests

### High-Level Architecture

```text
CI Tests
   -> Metrics Extraction
   -> Supabase Database
   -> Regression Views / SQL Intelligence Layer
   -> CI Dashboard + Weekly Reports
   -> Automated Regression Gate
```

This layered approach gives:
- separation of concerns
- reusable analytics
- scalable observability

### Example Weekly Dashboard Output

Each weekly run can produce a system-level health report such as:
- latency increased by `+32%` vs baseline of `43.71ms`
- retrieval confidence dropped by `-18%`
- Spanish identified as the worst-performing language
- flakiness at `3.4%`, above threshold
- anomaly detected at `2.3σ` from baseline

This transforms QA from validation into decision-making.

### Real-World Impact

This system helps teams:
- detect and log silent AI regressions before users do
- understand why a regression happened
- identify who is affected by the regression
- track system health over time
- make release decisions based on data instead of intuition

### Key Engineering Decisions

- views over raw queries: stable analytics layer
- worst-case metrics over averages: stronger real-user risk signal
- DB-driven intelligence: CI stays lightweight while analytics remain reusable
- statistical anomaly detection: more robust than static thresholds alone
- flakiness as a first-class signal: trust in test results becomes measurable

## Quality assurance built-in

- **Automated E2E tests** — Backend validation, Chromium PR checks, and multi-browser release verification
- **Cross-browser validation** — Chromium on PRs, full matrix before deployment (Chromium, Firefox, WebKit)
- **Accessibility audits** — axe-core integration ensures WCAG compliance
- **Performance budgets** — Lighthouse CI prevents regressions
- **Quality telemetry** — Bundle size, flaky-test budget, Lighthouse score, and latency trends tracked in CI
- **Instant debugging** — Traces, screenshots, videos, and workflow summaries generated on failure

---

## AI Testing Architecture Diagrams

These are the most important Mermaid diagrams from the docs folder, included here to show how I am adapting classic QA automation to modern AI testing techniques.

Reference docs:
- [docs/architecture.md](docs/architecture.md)
- [docs/security-architecture.md](docs/security-architecture.md)
- [docs/qa-strategy-architecture.md](docs/qa-strategy-architecture.md)

### 1) RAG Chatbot Architecture (Client → Security → Retrieval → Generation)

```mermaid
flowchart LR
   subgraph Client
      U[User]
      CW[ChatWidget]
      APIClient[chatApi]
      StreamClient[streamAssistant]
   end

   subgraph Security
      Handler[Cloudflare Worker handler]
      Validate[Request validation and CORS]
      RL[Rate limit check]
      PG[Prompt guard]
   end

   subgraph Retrieval
      QEmb[Query embedding]
      VS[Vector search RPC]
      RG[Retrieval guard]
      CB[Context builder]
      VDB[(Supabase pgvector)]
   end

   subgraph Generation
      LLMCall[LLM streaming call]
      LLM[OpenAI gpt-4o-mini]
      EMB[OpenAI text-embedding-3-small]
   end

   U --> CW --> APIClient --> Handler --> Validate --> RL --> PG --> QEmb --> VS --> RG --> CB --> LLMCall --> StreamClient --> CW
   QEmb --> EMB
   VS --> VDB
   LLMCall --> LLM
```

### 2) Security Layers + QA Validation Mapping

```mermaid
flowchart TD
   subgraph SecurityLayers[Security Controls]
      CORS[CORS and origin checks]
      RateLimit[Durable Object 10 req/min]
      PromptGuard[Injection and PII guard]
      RetrievalGuard[Similarity threshold guard]
      Fallback[Safe fallback responses]
      Logging[abuse_logs + latency signals]
   end

   subgraph QATesting[QA Automation Coverage]
      GuardTests[promptGuard.test.ts]
      ContractTests[api.contract.test.ts]
      RetrievalTests[retrieval.regression.test.ts]
      RateTests[rateLimit.test.ts]
      PerfTests[performance.test.ts]
   end

   CORS --> ContractTests
   RateLimit --> RateTests
   PromptGuard --> GuardTests
   RetrievalGuard --> RetrievalTests
   Fallback --> ContractTests
   Logging --> PerfTests
```

### 3) Multi-Layer Quality Gates CI/CD Testing Strategy

This repo demonstrates a **production-grade testing pipeline** where quality checks happen at every stage, both before and after merging to main .

```mermaid
flowchart TD
   PR[Pull Request opened] --> LintGate[Lint Quality Gate]
   PR --> PRBackend[Backend Unit Tests]

   LintGate --> PRE2E[Chromium E2E]
   PRBackend --> PRE2E
   PRE2E --> PRLH[SEO, Performance & Accessibility Quality Gate]
   PRLH --> PRComment[PR comment and summaries]

   PRLH -->|pass| Merge[PR review and merge]
   PRLH -->|fail| StopPR[Block merge]

   Merge --> Main[Push to main]
   Main --> DepBackend[Deploy Backend Unit Verification]
   DepBackend --> DepE2E[Playwright matrix: Chromium, Firefox, Webkit]
   DepE2E --> FlakyBudget[Flakyness Threshold Enforcement]
   FlakyBudget --> DepLH[SEO, Performance & Accessibility Quality Gate]
   DepLH -->|pass| Pages[Deploy to GitHub Pages]
   DepLH -->|fail| StopDeploy[Block release]

   Pages --> LHTrend[Lighthouse Trend vs Previous Baseline]
   LHTrend --> ReleaseSummary[Release quality summary]

   WeeklyTrigger[Weekly Production Regression Suite]
   WeeklyTrigger --> PerformanceTests[Performance Tests]
   PerformanceTests --> RetrievalRegressionTests[Retrieval Regression Tests]
   RetrievalRegressionTests --> RateLimitTests[API Rate Limit Tests]
   RateLimitTests --> MetricsUpload[Upload metrics to database]
   MetricsUpload --> DBAnalysis[Regression and anomaly DB  analysis]
   DBAnalysis --> WeeklyReport[AI weekly health dashboard and issue report]
```

---

## 🚀 PR Quality Gates: Playwright E2E + GitHub Actions

This portfolio itself demonstrates production-grade automation practices. Every pull request is validated through an integrated Playwright E2E framework before merging to `main`.

### What's automated

| Feature | Benefit |
|---------|---------|
| **Fixtures + Page Object Model (POM)** | Maintainable, scalable test architecture that reduces friction as tests grow |
| **Tiered browser execution** | Fast Chromium feedback on PRs, then full browser matrix before release |
| **Accessibility checks** | axe-core integration validates WCAG compliance in every PR |
| **Performance budgets** | Lighthouse CI enforces performance thresholds—no regressions slip through |
| **Flaky budget enforcement** | Release pipeline fails when flaky behavior crosses an explicit threshold |
| **CI telemetry artifacts** | Bundle size, E2E pass/fail, duration, Lighthouse, and latency metrics are retained for trend analysis |
| **Debug artifacts** | Traces, screenshots, and videos auto-retained on failure for instant root-cause analysis |
| **JUnit in Checks UI** | Test results appear in GitHub's native Checks panel—no downloads needed |
| **Automated PR comments** | github-actions[bot] posts a summary per run so reviewers get instant signal |

### Why it matters

✅ **PR gates reduce regressions** — main stays deployable  
✅ **Debug artifacts make failures actionable** — not constrained to "red/green"  
✅ **Fast, readable CI feedback** — developers iterate with confidence  


Tests validate:
- ✅ Smoke (page loads, critical paths work)
- ✅ Navigation (header, routing, external links)
- ✅ Accessibility (axe-core: WCAG compliance)
- ✅ Resume download functionality

## CI Behavior: PR Quality Gates

**Trigger:** Every pull request to `main`

**What runs:**
- ✅ **Backend validation** — Root + chatbot dependencies install, Worker boots locally, and backend unit/contract tests run first
- ✅ **Chromium-only E2E** — Frontend builds and Playwright runs the Chromium project for fast PR feedback:
  - Page loads and critical paths work
  - Navigation between sections
  - Resume download functionality
- ✅ **Metrics capture** — Bundle size, E2E result, accessibility metric, and duration are uploaded as artifacts
- ✅ **Lighthouse gate** — Runs after Chromium E2E passes, enforcing performance, accessibility, best-practices, and SEO thresholds
- ✅ **Visual reports** — JUnit results appear in GitHub Checks UI
- ✅ **Automated PR summary** — The workflow downloads summaries/metrics and refreshes a single bot comment with the gate results and debugging path

**Outcome:**
- 🚫 **Fails?** PR blocks merge. Reviewer sees instant feedback.
- ✅ **Passes?** Green checkmark appears. PR is safe to merge.

Workflow: [.github/workflows/pr-quality-gates.yml](.github/workflows/pr-quality-gates.yml)

### CD Behavior: Deploy with Verification

**Trigger:** Push to `main` (after PR merge) or manual workflow dispatch

**Quality gates before deployment:**
1. **Backend verification** — Worker starts and backend `test:ci` suite runs
2. **E2E browser matrix** — Playwright runs on Chromium, Firefox, and WebKit with per-browser summaries
3. **Flaky budget enforcement** — The release fails if flaky counts exceed the configured threshold
4. **Lighthouse audit** — Runs after the E2E matrix completes and stores a reusable score artifact
5. **Deploy** — GitHub Pages deployment only happens after all verification gates pass
6. **Release summary** — Deployment writes environment details and keeps Lighthouse score data for future trend comparison

**Deployment only happens if:**
- ✅ Backend tests pass
- ✅ Multi-browser E2E and flaky budget checks pass
- ✅ Lighthouse budgets pass

**Workflow:** [.github/workflows/deploy.yml](.github/workflows/deploy.yml)

### Weekly Production Regression

**Trigger:** Every Wednesday at `01:00 UTC` or manual workflow dispatch

**What runs:**
- ✅ **Production endpoint validation** — `API_BASE_URL` must be present and `/health` must respond before tests start
- ✅ **Nightly regression mode** — Backend `test:ci` runs against the deployed API with `NIGHTLY=true`
- ✅ **JUnit publishing** — Regression results are surfaced in GitHub Checks
- ✅ **Latency trend tracking** — The current latency metric is compared against the previous weekly run and added to the dashboard summary

**Outcome:**
- 🚫 **Fails?** Production drift or regression is visible in the weekly dashboard and artifacts.
- ✅ **Passes?** The workflow records a fresh confidence signal for retrieval, contracts, rate limiting, and latency.

### Why Two Test Stages?

| Stage | Scope | Speed | Cost |
|-------|-------|-------|------|
| **PR Quality Gates (CI)** | Fast feedback: backend + Chromium E2E + metrics + Lighthouse + PR comment | Faster | Protects merge quality |
| **Deploy Verification (CD)** | Comprehensive: backend + 3-browser matrix + flaky budget + Lighthouse + Pages deploy | Slower | Final release confidence |
| **Weekly Regression** | Production endpoint health, NIGHTLY backend regression, JUnit, and latency trending | Slowest | Detects post-release drift |

This balances **thoroughness** (catch issues in PR) with **speed** (fast deployment feedback).

---

## Debugging Observability

### What Each Artifact Contains

| Artifact | Contains | Use Case |
|----------|----------|----------|
| `playwright-report/` | HTML test report with stats | Overview of pass/fail |
| `test-results/` | Per-test folders with screenshots/videos | Visual debugging |
| `trace.zip` | Playwright trace file | Replay test execution step-by-step |

---

## Deployment

This repo is designed to be CI/CD friendly with automated PR quality gates and release pipelines.

Workflows:
- 🔒 **[PR Quality Gates](.github/workflows/pr-quality-gates.yml)** — Backend-first PR validation with Chromium E2E, metrics capture, Lighthouse, and auto-updated PR summaries
- 🚀 **[Deploy with Verification](.github/workflows/deploy.yml)** — Backend verification, 3-browser E2E, flaky-budget enforcement, Lighthouse, and gated GitHub Pages release
- 🧪 **[Weekly Regression Suite](.github/workflows/weekly-regression-gates.yml)** — Scheduled production health checks, NIGHTLY regression tests, and latency-trend reporting


## Contact

- Email davidstevenabril@gmail.com
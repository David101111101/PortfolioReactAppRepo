# CI/CD Strategy – Portfolio + RAG Chatbot (Current State)

## 1) Purpose

This document reflects the CI/CD behavior currently implemented in:
- `.github/workflows/pr-quality-gates.yml`
- `.github/workflows/deploy.yml`
- `.github/workflows/weekly-regression-gates.yml`

Objectives of the current pipeline:
- Block merges/releases on failing quality gates
- Validate backend and frontend behavior before deployment
- Enforce accessibility/performance budgets with min thresholds via Lighthouse
- Run scheduled regression checks against the production API endpoint

## 2) Workflow Inventory

| Workflow | Trigger | Main Goal |
|---|---|---|
| PR Quality Gates | `pull_request` to `main`, manual dispatch | Fast feedback for PR safety |
| Deployment Quality Gates | `push` to `main`, manual dispatch | Full verification before GitHub Pages deploy |
| Weekly Regression Suite | Cron (`Wed 01:00 UTC`) & manual dispatch | Production endpoint drift detection |

## 3) PR Quality Gates (Fast Tier)

Defined in `.github/workflows/pr-quality-gates.yml`.

### 3.1 Jobs
1. **backend**
   - Installs root + backend dependencies
   - Starts Worker locally (`npm run dev` in `portfolio-chatbot`)
   - Runs backend Vitest suite (`npm test`)

2. **e2e (chromium)** (needs backend tests topass to start)
   - Builds frontend (`npm run build`)
   - Runs Playwright on Chromium only
   - Publishes JUnit results and artifacts
   - Generates summary markdown snippet

3. **lighthouse**
   - Builds frontend
   - Runs Lighthouse CI with `lighthouserc.json`

4. **pr-comment** (always, PR only)
   - Downloads summary artifacts
   - Creates/updates a PR comment with gate results

### 3.2 PR Gate Characteristics
- Parallelized checks with explicit dependencies
- Artifacts retained for debugging (`playwright-report`, `test-results`, summaries)
- Failing checks block PR merge when branch protection requires them

## 4) Main Branch Deployment Gates

Defined in `.github/workflows/deploy.yml`.

### 4.1 Pre-deploy Verification Jobs
1. **backend**
   - Starts worker and runs backend tests (`npm run test:ci`)
   - Emits backend summary in job summary

2. **e2e matrix** (needs backend tests to pass)
   - Runs Playwright across:
     - Chromium
     - Firefox
     - WebKit
   - Publishes JUnit per browser
   - Uploads browser-specific artifacts + summaries

3. **lighthouse** (needs backend tests to pass)
   - Runs Lighthouse budget/assertion checks

### 4.2 Deploy Job
- Runs only if `backend`, `e2e`, and `lighthouse` succeed
- Builds frontend and deploys `dist` to GitHub Pages
- Publishes final deployment summary with environment URL

## 5) Weekly Production Regression

Defined in `.github/workflows/weekly-regression-gates.yml`.

### 5.1 Execution Model
- Runs weekly and on manual dispatch
- Uses environment variable `API_BASE_URL`
- Validates production endpoint health (`/health`) before tests
- Runs backend suite in NIGHTLY mode against deployed API (weekly schedule):
  - `NIGHTLY=true`
  - `API_BASE_URL=<production endpoint>`

### 5.2 Output and Reporting
- Publishes JUnit via `dorny/test-reporter`
- Uploads JUnit artifact
- Generates regression summary dashboard in `GITHUB_STEP_SUMMARY`
- Scans logs for `llm_latency_warning`

## 6) Quality Gates Currently Enforced

### 6.1 Backend
- API contract stability checks
- Prompt-guard logic checks
- Context builder checks
- Weekly scheduled retrieval/performance/rate-limit regression checks

### 6.2 Frontend
- Smoke/navigation/chat interaction checks
- Accessibility critical-issue gate (`axe` in Playwright)

### 6.3 Performance and Accessibility
Lighthouse assertions from `lighthouserc.json`:
- Performance: min `0.70` (error)
- Accessibility: min `0.90` (error)
- Best Practices: min `0.85` (error)
- SEO: min `0.85` (warn)

## 7) Artifact and Feedback Model

Current pipeline feedback channels:
- GitHub Checks (JUnit reports)
- Uploaded artifacts (Playwright report, traces, test results)
- Workflow/job summaries
- Auto-updated PR result comment

This provides fast triage context without reproducing failures locally first.

## 8) What Is Not Currently Enforced in CI

The following are not enforced as hard gates in current workflow YAML:
- Dedicated `lint` job
- Dedicated TypeScript `type-check` job
- Coverage threshold gate
- Dependency vulnerability audit gate
- Post-deploy smoke test job in deployment workflow

These may still be run manually, but they are not mandatory CI blockers today.

## 9) Security and Reliability Posture in CI

Current pipelines validate several AI-specific reliability controls:
- Prompt safety checks
- Rate-limit regression behavior
- Retrieval grounding regression checks (weekly scheduled)
- LLM latency warning surfacing

This gives a pragmatic AI QA baseline while keeping PR feedback cycles fast.

## 10) Recommended Next Iteration (Roadmap)

1. Add explicit `lint` and `type-check` jobs as required checks.
2. Add coverage collection + minimum threshold enforcement.
3. Add dedicated CORS/415 contract tests.
4. Add trend publication for weekly scheduled latency and fallback metrics.
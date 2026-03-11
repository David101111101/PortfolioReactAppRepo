# David Abril — QA Automation Engineer / SDET Interactive RAG AI Portfolio

[![Weekly Regression Suite](https://github.com/David101111101/PortfolioReactAppRepo/actions/workflows/weekly-regression-gates.yml/badge.svg)](https://github.com/David101111101/PortfolioReactAppRepo/actions/workflows/weekly-regression-gates.yml)
[![PR Quality Gates](https://github.com/David101111101/PortfolioReactAppRepo/actions/workflows/pr-quality-gates.yml/badge.svg?branch=FIX-CI-Regression-Suite-environment-variable-fix)](https://github.com/David101111101/PortfolioReactAppRepo/actions/workflows/pr-quality-gates.yml) 
[![Deployment Quality Gates](https://github.com/David101111101/PortfolioReactAppRepo/actions/workflows/deploy.yml/badge.svg)](https://github.com/David101111101/PortfolioReactAppRepo/actions/workflows/deploy.yml)


This project focuses on designing a production-ready QA automation strategy for AI systems including multi-layer quality gates, prompt-safety validation and regression monitoring.

https://www.daveautomation.dev/

## About me

**David Abril** — **QA Automation Engineer** (English C2 Certified)  
Automation-focused QA engineer with backend development and team leadership experience. Driven by challenges and continuous learning, I pursue automation-first roles while deepening engineering skills.



### Quality assurance built-in

- **Automated E2E tests** — Smoke, navigation, accessibility checks on every PR
- **Cross-browser validation** — Tests run on Chromium, Firefox, WebKit in parallel
- **Accessibility audits** — axe-core integration ensures WCAG compliance
- **Performance budgets** — Lighthouse CI prevents regressions
- **Instant debugging** — Traces, screenshots, videos retained on failure

---

## 🚀 PR Quality Gates: Playwright E2E + GitHub Actions

This portfolio itself demonstrates production-grade automation practices. Every pull request is validated through an integrated Playwright E2E framework before merging to `main`.

### What's automated

| Feature | Benefit |
|---------|---------|
| **Fixtures + Page Object Model (POM)** | Maintainable, scalable test architecture that reduces friction as tests grow |
| **Cross-browser execution** | Parallel runs across Chromium, Firefox, and WebKit—catch rendering bugs across engines |
| **Accessibility checks** | axe-core integration validates WCAG compliance in every PR |
| **Performance budgets** | Lighthouse CI enforces performance thresholds—no regressions slip through |
| **Debug artifacts** | Traces, screenshots, and videos auto-retained on failure for instant root-cause analysis |
| **JUnit in Checks UI** | Test results appear in GitHub's native Checks panel—no downloads needed |
| **Automated PR comments** | github-actions[bot] posts a summary per run so reviewers get instant signal |

### Why it matters

✅ **PR gates reduce regressions** — main stays deployable  
✅ **Debug artifacts make failures actionable** — not just "red/green"  
✅ **Fast, readable CI feedback** — developers iterate with confidence  


Tests validate:
- ✅ Smoke (page loads, critical paths work)
- ✅ Navigation (header, routing, external links)
- ✅ Accessibility (axe-core: WCAG compliance)
- ✅ Resume download functionality




## Repo structure

```
src/
├── components/         # UI: Header, ProjectCard, DiplomaGrid, Section, etc.
├── data/               # Portfolio meta: projects, skills, experiences, diplomas
├── styles/             # Global theme & CSS
├── App.tsx             # Root component
└── main.tsx            # Entry point

e2e/
├── fixtures/           # Playwright test fixtures & configuration
├── pages/              # Page Object Models (HomePage, etc.)
└── specs/              # E2E test suites (smoke, navigation, accessibility, resume)

.github/workflows/
├── pr-quality-gates.yml   # PR validation: E2E + Lighthouse
└── deploy.yml             # Release: build & deploy to Azure

public/
├── diplomas/           # Certification images
└── other assets
```

## CI/CD Testing Strategy

This repo demonstrates a **production-grade testing pipeline** where quality checks happen at every stage—both before and after merging to main.

### The Complete Flow

```
PR opened
    ↓
┌───────────────────────────────────────┐
│  CI: PR Quality Gates (pr-quality-gates.yml)
│  ├─ E2E Tests (multi-browser)
│  ├─ Accessibility Checks (axe-core)
│  ├─ Performance Budgets (Lighthouse)
│  ├─ JUnit Report (in Checks UI)
│  └─ Auto-comment with summary
└───────────────────────────────────────┘
           ↓ (only if pass)
    PR Review + Merge
           ↓
Pushed to main
    ↓
┌───────────────────────────────────────┐
│  CD: Deploy with Verification (deploy.yml)
│  ├─ Smoke Test (Chromium only)
│  ├─ Lighthouse Budget Check
│  └─ Final quality gate before deploy
└───────────────────────────────────────┘
           ↓ (only if pass)
    Deploy to GitHub Pages
           ↓
    Live Update ✅
```

### CI Behavior: PR Quality Gates

**Trigger:** Every pull request to `main`

**What runs:**
- ✅ **E2E Smoke Tests** — Cross-browser (Chromium, Firefox, WebKit) validation of:
  - Page loads and critical paths work
  - Navigation between sections
  - Resume download functionality
  
- ✅ **Accessibility Audits** — axe-core checks for WCAG compliance
  
- ✅ **Performance Budgets** — Lighthouse CI enforces performance thresholds
  
- ✅ **Visual Reports** — JUnit test results appear in GitHub Checks UI

- ✅ **Automated Summary** — PR comment posted by github-actions[bot] with:
  - Test counts (passed, failed, flaky)
  - Top failures (if any)
  - Links to artifacts and debugging info

**Outcome:**
- 🚫 **Fails?** PR blocks merge. Reviewer sees instant feedback.
- ✅ **Passes?** Green checkmark appears. PR is safe to merge.

Workflow: [.github/workflows/pr-quality-gates.yml](.github/workflows/pr-quality-gates.yml)

### CD Behavior: Deploy with Verification

**Trigger:** Push to `main` (after PR merge) or manual workflow dispatch

**Quality gates before deployment:**
1. **Build** — Compile React + Vite → `dist/`
2. **Smoke Test** — Run Playwright on Chromium only (faster, already cross-browser tested in CI)
3. **Lighthouse Audit** — Final performance check before live
4. **Upload Artifacts** — Playwright reports retained for debugging if needed

**Deployment only happens if:**
- ✅ Build completes successfully
- ✅ Smoke tests pass
- ✅ Lighthouse budgets pass

**Workflow:** [.github/workflows/deploy.yml](.github/workflows/deploy.yml)

### Why Two Test Stages?

| Stage | Scope | Speed | Cost |
|-------|-------|-------|------|
| **PR Quality Gates (CI)** | Comprehensive: 3 browsers × N tests | Slower (~5 min) | Catches bugs early |
| **Deploy Verification (CD)** | Minimal: 1 browser smoke test | Faster (~2 min) | Final sanity check before 🚀 |

This balances **thoroughness** (catch issues in PR) with **speed** (fast deployment feedback).

---

## Debugging Test Failures

### In a PR (CI Failure)

1. **Check the PR comments** — github-actions[bot] posts a summary showing:
   - Which tests failed
   - Flaky test counts
   - Link to artifacts

2. **View Checks tab:**
   ```
   PR → Checks tab → failing job → "Details"
   ```

3. **Download artifacts:**
   ```
   PR → Checks → failing job → "Artifacts" section
   ↓
   playwright-{browser}.zip
   ```

4. **Debug traces locally:**
   ```bash
   unzip playwright-chromium.zip
   npx playwright show-trace playwright-report/trace.zip
   ```

### In Deploy (CD Failure)

1. **Check workflow run:**
   ```
   Repo → Actions → "Deploy static content to Pages" → latest run
   ```

2. **Scroll to "Run Playwright smoke" job**

3. **Download artifacts:**
   ```
   Artifacts section → verify-playwright.zip
   ```

4. **Extract and inspect:**
   ```bash
   unzip verify-playwright.zip
   # View HTML report
   open playwright-report/index.html
   
   # Deep dive: replay trace
   npx playwright show-trace trace.zip
   ```

### What Each Artifact Contains

| Artifact | Contains | Use Case |
|----------|----------|----------|
| `playwright-report/` | HTML test report with stats | Overview of pass/fail |
| `test-results/` | Per-test folders with screenshots/videos | Visual debugging |
| `trace.zip` | Playwright trace file | Replay test execution step-by-step |

---

### Local validation before pushing

Catch issues **before** you open a PR:

```bash
npm run build          # Catch build errors early
npm run test:e2e       # Run full test suite locally
npm run lint           # Check code quality
```

This mirrors what the CI pipeline will check—shift-left testing saves time and CI minutes.

---

## Deployment

This repo is designed to be CI/CD friendly with automated PR quality gates and release pipelines.

Workflows:
- 🔒 **[PR Quality Gates](.github/workflows/pr-quality-gates.yml)** — Validates every PR before merge
- 🚀 **[Deploy with Verification](.github/workflows/deploy.yml)** — Smoke tests before going live


## Contact

- Email davidstevenabril@gmail.com